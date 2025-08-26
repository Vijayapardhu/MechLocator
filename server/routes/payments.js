const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Mechanic = require('../models/Mechanic');

// Get user payments
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { user: req.user._id };
        if (status) {
            query.status = status;
        }
        
        const payments = await Payment.find(query)
            .populate('mechanic', 'name address phone')
            .populate('appointment', 'serviceType appointmentDate timeSlot')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Payment.countDocuments(query);
        
        res.json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get payment by ID
router.get('/:paymentId', auth, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            user: req.user._id
        })
        .populate('mechanic', 'name address phone email')
        .populate('appointment', 'serviceType appointmentDate timeSlot description')
        .populate('refundedBy', 'firstName lastName');
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        res.json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
});

// Create payment
router.post('/', auth, async (req, res) => {
    try {
        const { 
            mechanicId, 
            appointmentId, 
            amount, 
            paymentMethod, 
            description,
            items,
            billingAddress 
        } = req.body;
        
        // Validate required fields
        if (!mechanicId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Verify mechanic exists
        const mechanic = await Mechanic.findById(mechanicId);
        if (!mechanic) {
            return res.status(404).json({ error: 'Mechanic not found' });
        }
        
        // Calculate totals
        const subtotal = items ? items.reduce((sum, item) => sum + item.totalPrice, 0) : amount;
        const taxAmount = subtotal * 0.08; // 8% tax
        const totalAmount = subtotal + taxAmount;
        
        const payment = new Payment({
            user: req.user._id,
            mechanic: mechanicId,
            appointment: appointmentId,
            amount: subtotal,
            currency: 'USD',
            status: 'pending',
            paymentMethod,
            description,
            items: items || [{
                name: description || 'Service Payment',
                description: 'Payment for mechanic service',
                quantity: 1,
                unitPrice: subtotal,
                totalPrice: subtotal
            }],
            taxAmount,
            totalAmount,
            billingAddress
        });
        
        await payment.save();
        
        // Process payment based on method
        const processedPayment = await processPayment(payment);
        
        res.status(201).json(processedPayment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Process payment
async function processPayment(payment) {
    try {
        // Simulate payment processing
        // In a real application, you would integrate with Stripe, PayPal, etc.
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success (90% success rate)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            payment.status = 'completed';
            payment.sentAt = Date.now();
            
            // Update appointment if exists
            if (payment.appointment) {
                await Appointment.findByIdAndUpdate(payment.appointment, {
                    paymentStatus: 'paid',
                    actualCost: payment.totalAmount
                });
            }
        } else {
            payment.status = 'failed';
        }
        
        await payment.save();
        return payment;
    } catch (error) {
        console.error('Error processing payment:', error);
        payment.status = 'failed';
        await payment.save();
        throw error;
    }
}

// Request refund
router.post('/:paymentId/refund', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            user: req.user._id,
            status: 'completed'
        });
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found or not eligible for refund' });
        }
        
        // Check if payment is within refund window (30 days)
        const daysSincePayment = (Date.now() - payment.sentAt) / (1000 * 60 * 60 * 24);
        if (daysSincePayment > 30) {
            return res.status(400).json({ error: 'Payment is outside refund window' });
        }
        
        // Process refund
        payment.status = 'refunded';
        payment.refundReason = reason;
        payment.refundedAt = Date.now();
        payment.refundedBy = req.user._id;
        
        await payment.save();
        
        res.json(payment);
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
});

// Get payment statistics
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const stats = await Payment.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    averagePayment: { $avg: '$totalAmount' },
                    completedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    pendingPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    failedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    refundedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
                    }
                }
            }
        ]);
        
        const monthlyStats = await Payment.aggregate([
            { 
                $match: { 
                    user: req.user._id,
                    createdAt: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        const paymentMethodStats = await Payment.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        
        res.json({
            overview: stats[0] || {
                totalPayments: 0,
                totalSpent: 0,
                averagePayment: 0,
                completedPayments: 0,
                pendingPayments: 0,
                failedPayments: 0,
                refundedPayments: 0
            },
            monthlyStats,
            paymentMethodStats
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ error: 'Failed to fetch payment statistics' });
    }
});

// Get payment methods
router.get('/methods', auth, async (req, res) => {
    try {
        // In a real application, this would fetch saved payment methods from Stripe/PayPal
        const savedMethods = await Payment.aggregate([
            { $match: { user: req.user._id, status: 'completed' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    lastUsed: { $max: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { lastUsed: -1 } }
        ]);
        
        res.json(savedMethods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

// Generate receipt
router.get('/:paymentId/receipt', auth, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            user: req.user._id
        })
        .populate('mechanic', 'name address phone')
        .populate('appointment', 'serviceType appointmentDate timeSlot');
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        const receipt = {
            receiptNumber: payment.transactionId,
            date: payment.createdAt,
            mechanic: payment.mechanic,
            appointment: payment.appointment,
            items: payment.items,
            subtotal: payment.amount,
            tax: payment.taxAmount,
            total: payment.totalAmount,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            billingAddress: payment.billingAddress
        };
        
        res.json(receipt);
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
});

// Webhook for payment processing (for external payment providers)
router.post('/webhook', async (req, res) => {
    try {
        const { paymentId, status, transactionId } = req.body;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        payment.status = status;
        if (transactionId) {
            payment.stripePaymentIntentId = transactionId;
        }
        
        if (status === 'completed') {
            payment.sentAt = Date.now();
            
            // Update appointment if exists
            if (payment.appointment) {
                await Appointment.findByIdAndUpdate(payment.appointment, {
                    paymentStatus: 'paid',
                    actualCost: payment.totalAmount
                });
            }
        }
        
        await payment.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Get payment history for mechanic (admin/mechanic access)
router.get('/mechanic/:mechanicId', auth, async (req, res) => {
    try {
        // Check if user is admin or the mechanic
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.mechanicId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { page = 1, limit = 20, status } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { mechanic: req.params.mechanicId };
        if (status) {
            query.status = status;
        }
        
        const payments = await Payment.find(query)
            .populate('user', 'firstName lastName email')
            .populate('appointment', 'serviceType appointmentDate timeSlot')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Payment.countDocuments(query);
        
        res.json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching mechanic payments:', error);
        res.status(500).json({ error: 'Failed to fetch mechanic payments' });
    }
});

module.exports = router;