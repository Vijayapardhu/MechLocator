const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'], 
        default: 'pending' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash', 'bank_transfer'], 
        required: true 
    },
    transactionId: { type: String, unique: true },
    stripePaymentIntentId: { type: String },
    description: { type: String, maxlength: 500 },
    items: [{
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    receiptUrl: { type: String },
    refundReason: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Generate transaction ID if not provided
    if (!this.transactionId) {
        this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    next();
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ mechanic: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);