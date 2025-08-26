const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    type: { 
        type: String, 
        enum: ['appointment', 'reminder', 'review', 'payment', 'system', 'promotion'], 
        required: true 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
    },
    isRead: { type: Boolean, default: false },
    isSent: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    readAt: { type: Date },
    actionUrl: { type: String },
    actionText: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

notificationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, isSent: false });

module.exports = mongoose.model('Notification', notificationSchema);