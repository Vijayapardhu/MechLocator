const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// Get dashboard analytics for admin
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        // User growth analytics
        const totalUsers = await User.countDocuments();
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Mechanic analytics
        const totalMechanics = await Mechanic.countDocuments();
        const activeMechanics = await Mechanic.countDocuments({ isActive: true });

        // Appointment analytics
        const totalAppointments = await Appointment.countDocuments();
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const appointmentsThisMonth = await Appointment.countDocuments({ 
            appointmentDate: { $gte: thirtyDaysAgo } 
        });

        // Revenue analytics
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const monthlyRevenue = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { $gte: thirtyDaysAgo }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // Review analytics
        const totalReviews = await Review.countDocuments();
        const averageRating = await Review.aggregate([
            { $group: { _id: null, average: { $avg: '$rating' } } }
        ]);

        // User growth over time
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 30 }
        ]);

        // Appointment status distribution
        const appointmentStatus = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Top performing mechanics
        const topMechanics = await Mechanic.aggregate([
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'mechanic',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' },
                    reviewCount: { $size: '$reviews' }
                }
            },
            { $sort: { averageRating: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            users: {
                total: totalUsers,
                newThisMonth: newUsersThisMonth,
                newThisWeek: newUsersThisWeek,
                growth: userGrowth
            },
            mechanics: {
                total: totalMechanics,
                active: activeMechanics
            },
            appointments: {
                total: totalAppointments,
                completed: completedAppointments,
                pending: pendingAppointments,
                thisMonth: appointmentsThisMonth,
                statusDistribution: appointmentStatus
            },
            revenue: {
                total: totalRevenue[0]?.total || 0,
                thisMonth: monthlyRevenue[0]?.total || 0
            },
            reviews: {
                total: totalReviews,
                averageRating: averageRating[0]?.average || 0
            },
            topMechanics
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to load analytics data' });
    }
});

// Get user growth chart data
router.get('/user-growth', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const labels = userGrowth.map(item => 
            `${item._id.month}/${item._id.day}/${item._id.year}`
        );
        const values = userGrowth.map(item => item.count);

        res.json({ labels, values });

    } catch (error) {
        console.error('User growth analytics error:', error);
        res.status(500).json({ error: 'Failed to load user growth data' });
    }
});

// Get appointment status chart data
router.get('/appointment-status', adminAuth, async (req, res) => {
    try {
        const appointmentStatus = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const labels = appointmentStatus.map(item => item._id);
        const values = appointmentStatus.map(item => item.count);

        res.json({ labels, values });

    } catch (error) {
        console.error('Appointment status analytics error:', error);
        res.status(500).json({ error: 'Failed to load appointment status data' });
    }
});

// Get revenue analytics
router.get('/revenue', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const revenueData = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { $gte: startDate }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const labels = revenueData.map(item => 
            `${item._id.month}/${item._id.day}/${item._id.year}`
        );
        const revenue = revenueData.map(item => item.revenue);
        const transactions = revenueData.map(item => item.count);

        res.json({ labels, revenue, transactions });

    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to load revenue data' });
    }
});

// Get mechanic performance analytics
router.get('/mechanic-performance', adminAuth, async (req, res) => {
    try {
        const mechanicPerformance = await Mechanic.aggregate([
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'mechanic',
                    as: 'reviews'
                }
            },
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'mechanic',
                    as: 'appointments'
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' },
                    reviewCount: { $size: '$reviews' },
                    appointmentCount: { $size: '$appointments' },
                    completedAppointments: {
                        $size: {
                            $filter: {
                                input: '$appointments',
                                cond: { $eq: ['$$this.status', 'completed'] }
                            }
                        }
                    }
                }
            },
            { $sort: { averageRating: -1 } }
        ]);

        res.json(mechanicPerformance);

    } catch (error) {
        console.error('Mechanic performance analytics error:', error);
        res.status(500).json({ error: 'Failed to load mechanic performance data' });
    }
});

// Get user activity analytics
router.get('/user-activity', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const userActivity = await User.aggregate([
            { $match: { lastLogin: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'appointments'
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    appointmentCount: { $size: '$appointments' },
                    reviewCount: { $size: '$reviews' },
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: '$appointments',
                                as: 'appointment',
                                in: '$$appointment.actualCost'
                            }
                        }
                    }
                }
            },
            { $sort: { lastLogin: -1 } },
            { $limit: 100 }
        ]);

        res.json(userActivity);

    } catch (error) {
        console.error('User activity analytics error:', error);
        res.status(500).json({ error: 'Failed to load user activity data' });
    }
});

module.exports = router;