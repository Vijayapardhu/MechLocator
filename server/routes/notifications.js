const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { user: req.user._id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }
        
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'firstName lastName email');
        
        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ 
            user: req.user._id, 
            isRead: false 
        });
        
        res.json({
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notificationId, user: req.user._id },
            { isRead: true, readAt: Date.now() },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true, readAt: Date.now() }
        );
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.notificationId,
            user: req.user._id
        });
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });
        
        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Create notification (internal use)
const createNotification = async (userId, notificationData) => {
    try {
        const notification = new Notification({
            user: userId,
            ...notificationData
        });
        
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create appointment reminder notification
const createAppointmentReminder = async (userId, appointmentData) => {
    const notificationData = {
        title: 'Appointment Reminder',
        message: `Your appointment for ${appointmentData.serviceType} is scheduled for ${new Date(appointmentData.appointmentDate).toLocaleDateString()} at ${appointmentData.timeSlot}`,
        type: 'reminder',
        priority: 'medium',
        actionUrl: `/appointments/${appointmentData._id}`,
        actionText: 'View Appointment',
        metadata: {
            appointmentId: appointmentData._id,
            appointmentDate: appointmentData.appointmentDate
        }
    };
    
    return await createNotification(userId, notificationData);
};

// Create review notification
const createReviewNotification = async (mechanicId, reviewData) => {
    const notificationData = {
        title: 'New Review',
        message: `You received a ${reviewData.rating}-star review for your service`,
        type: 'review',
        priority: 'low',
        actionUrl: `/reviews/${reviewData._id}`,
        actionText: 'View Review',
        metadata: {
            reviewId: reviewData._id,
            rating: reviewData.rating
        }
    };
    
    return await createNotification(mechanicId, notificationData);
};

// Create payment notification
const createPaymentNotification = async (userId, paymentData) => {
    const notificationData = {
        title: 'Payment Confirmation',
        message: `Payment of $${paymentData.totalAmount} has been processed successfully`,
        type: 'payment',
        priority: 'high',
        actionUrl: `/payments/${paymentData._id}`,
        actionText: 'View Receipt',
        metadata: {
            paymentId: paymentData._id,
            amount: paymentData.totalAmount
        }
    };
    
    return await createNotification(userId, notificationData);
};

// Create system notification
const createSystemNotification = async (userId, systemData) => {
    const notificationData = {
        title: systemData.title,
        message: systemData.message,
        type: 'system',
        priority: systemData.priority || 'medium',
        actionUrl: systemData.actionUrl,
        actionText: systemData.actionText,
        metadata: systemData.metadata
    };
    
    return await createNotification(userId, notificationData);
};

// Create promotion notification
const createPromotionNotification = async (userId, promotionData) => {
    const notificationData = {
        title: promotionData.title,
        message: promotionData.message,
        type: 'promotion',
        priority: 'low',
        actionUrl: promotionData.actionUrl,
        actionText: promotionData.actionText,
        metadata: promotionData.metadata
    };
    
    return await createNotification(userId, notificationData);
};

// Bulk create notifications (for system-wide announcements)
router.post('/bulk', auth, async (req, res) => {
    try {
        // Only admins can create bulk notifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { title, message, type, priority, actionUrl, actionText, metadata, targetUsers } = req.body;
        
        let users;
        if (targetUsers === 'all') {
            users = await User.find({}, '_id');
        } else if (targetUsers === 'verified') {
            users = await User.find({ isVerified: true }, '_id');
        } else if (Array.isArray(targetUsers)) {
            users = await User.find({ _id: { $in: targetUsers } }, '_id');
        } else {
            return res.status(400).json({ error: 'Invalid target users' });
        }
        
        const notifications = users.map(user => ({
            user: user._id,
            title,
            message,
            type: type || 'system',
            priority: priority || 'medium',
            actionUrl,
            actionText,
            metadata
        }));
        
        await Notification.insertMany(notifications);
        
        res.json({ 
            message: `Notification sent to ${users.length} users`,
            count: users.length
        });
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        res.status(500).json({ error: 'Failed to create bulk notifications' });
    }
});

// Schedule notification
router.post('/schedule', auth, async (req, res) => {
    try {
        // Only admins can schedule notifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { userId, title, message, type, priority, actionUrl, actionText, metadata, scheduledFor } = req.body;
        
        const notification = new Notification({
            user: userId,
            title,
            message,
            type: type || 'system',
            priority: priority || 'medium',
            actionUrl,
            actionText,
            metadata,
            scheduledFor: new Date(scheduledFor),
            isSent: false
        });
        
        await notification.save();
        
        res.json(notification);
    } catch (error) {
        console.error('Error scheduling notification:', error);
        res.status(500).json({ error: 'Failed to schedule notification' });
    }
});

// Get notification preferences
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notificationPreferences');
        res.json(user.notificationPreferences || {});
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
});

// Update notification preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { emailNotifications, smsNotifications, pushNotifications, marketingEmails } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                notificationPreferences: {
                    emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
                    smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
                    pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
                    marketingEmails: marketingEmails !== undefined ? marketingEmails : false
                }
            },
            { new: true }
        ).select('notificationPreferences');
        
        res.json(user.notificationPreferences);
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});

module.exports = {
    router,
    createNotification,
    createAppointmentReminder,
    createReviewNotification,
    createPaymentNotification,
    createSystemNotification,
    createPromotionNotification
};