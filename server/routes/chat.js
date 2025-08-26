const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');

// Get user chats
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        const chats = await Chat.find({
            participants: req.user._id,
            isActive: true
        })
        .populate('mechanic', 'name image address')
        .populate('user', 'firstName lastName')
        .populate('appointment', 'serviceType appointmentDate timeSlot')
        .sort({ lastMessage: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
        const total = await Chat.countDocuments({
            participants: req.user._id,
            isActive: true
        });
        
        res.json({
            chats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get chat by ID with messages
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.chatId,
            participants: req.user._id,
            isActive: true
        })
        .populate('mechanic', 'name image address phone')
        .populate('user', 'firstName lastName email')
        .populate('appointment', 'serviceType appointmentDate timeSlot status')
        .populate('messages.sender', 'firstName lastName');
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        // Mark messages as read
        await Chat.updateMany(
            {
                _id: req.params.chatId,
                'messages.sender': { $ne: req.user._id },
                'messages.isRead': false
            },
            {
                $set: {
                    'messages.$[].isRead': true,
                    'messages.$[].readAt': Date.now()
                }
            }
        );
        
        res.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// Create new chat
router.post('/', auth, async (req, res) => {
    try {
        const { mechanicId, appointmentId, initialMessage } = req.body;
        
        if (!mechanicId) {
            return res.status(400).json({ error: 'Mechanic ID is required' });
        }
        
        // Check if mechanic exists
        const mechanic = await Mechanic.findById(mechanicId);
        if (!mechanic) {
            return res.status(404).json({ error: 'Mechanic not found' });
        }
        
        // Check if chat already exists
        const existingChat = await Chat.findOne({
            user: req.user._id,
            mechanic: mechanicId,
            isActive: true
        });
        
        if (existingChat) {
            return res.json(existingChat);
        }
        
        const chat = new Chat({
            participants: [req.user._id, mechanicId],
            user: req.user._id,
            mechanic: mechanicId,
            appointment: appointmentId,
            messages: initialMessage ? [{
                sender: req.user._id,
                content: initialMessage,
                messageType: 'text'
            }] : [],
            lastMessage: initialMessage ? Date.now() : null
        });
        
        await chat.save();
        
        const populatedChat = await Chat.findById(chat._id)
            .populate('mechanic', 'name image address')
            .populate('user', 'firstName lastName')
            .populate('appointment', 'serviceType appointmentDate timeSlot');
        
        res.status(201).json(populatedChat);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Send message
router.post('/:chatId/messages', auth, async (req, res) => {
    try {
        const { content, messageType = 'text', attachments } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        const chat = await Chat.findOne({
            _id: req.params.chatId,
            participants: req.user._id,
            isActive: true
        });
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        const message = {
            sender: req.user._id,
            content,
            messageType,
            attachments: attachments || [],
            createdAt: Date.now()
        };
        
        chat.messages.push(message);
        chat.lastMessage = Date.now();
        await chat.save();
        
        const populatedMessage = await Chat.findById(chat._id)
            .populate('messages.sender', 'firstName lastName')
            .populate('mechanic', 'name image address')
            .populate('user', 'firstName lastName');
        
        const newMessage = populatedMessage.messages[populatedMessage.messages.length - 1];
        
        res.json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark messages as read
router.patch('/:chatId/read', auth, async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.chatId,
            participants: req.user._id
        });
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        // Mark all unread messages as read
        await Chat.updateMany(
            {
                _id: req.params.chatId,
                'messages.sender': { $ne: req.user._id },
                'messages.isRead': false
            },
            {
                $set: {
                    'messages.$[].isRead': true,
                    'messages.$[].readAt': Date.now()
                }
            }
        );
        
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user._id,
            isActive: true
        });
        
        let totalUnread = 0;
        for (const chat of chats) {
            const unreadMessages = chat.messages.filter(
                msg => !msg.isRead && msg.sender.toString() !== req.user._id.toString()
            );
            totalUnread += unreadMessages.length;
        }
        
        res.json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Archive chat
router.patch('/:chatId/archive', auth, async (req, res) => {
    try {
        const chat = await Chat.findOneAndUpdate(
            {
                _id: req.params.chatId,
                participants: req.user._id
            },
            { isActive: false },
            { new: true }
        );
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        res.json({ message: 'Chat archived successfully' });
    } catch (error) {
        console.error('Error archiving chat:', error);
        res.status(500).json({ error: 'Failed to archive chat' });
    }
});

// Delete chat
router.delete('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({
            _id: req.params.chatId,
            participants: req.user._id
        });
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Get chat history for mechanic
router.get('/mechanic/:mechanicId', auth, async (req, res) => {
    try {
        // Check if user is admin or the mechanic
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.mechanicId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        const chats = await Chat.find({
            mechanic: req.params.mechanicId,
            isActive: true
        })
        .populate('user', 'firstName lastName email')
        .populate('appointment', 'serviceType appointmentDate timeSlot status')
        .sort({ lastMessage: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
        const total = await Chat.countDocuments({
            mechanic: req.params.mechanicId,
            isActive: true
        });
        
        res.json({
            chats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching mechanic chats:', error);
        res.status(500).json({ error: 'Failed to fetch mechanic chats' });
    }
});

// Search messages
router.get('/:chatId/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const chat = await Chat.findOne({
            _id: req.params.chatId,
            participants: req.user._id
        }).populate('messages.sender', 'firstName lastName');
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        const searchResults = chat.messages.filter(message =>
            message.content.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json(searchResults);
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
});

// Get chat statistics
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const stats = await Chat.aggregate([
            { $match: { participants: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalChats: { $sum: 1 },
                    activeChats: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    totalMessages: { $sum: { $size: '$messages' } },
                    recentChats: {
                        $sum: {
                            $cond: [
                                { $gte: ['$lastMessage', thirtyDaysAgo] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const monthlyStats = await Chat.aggregate([
            { 
                $match: { 
                    participants: req.user._id,
                    lastMessage: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$lastMessage' },
                        month: { $month: '$lastMessage' }
                    },
                    chatCount: { $sum: 1 },
                    messageCount: { $sum: { $size: '$messages' } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        res.json({
            overview: stats[0] || {
                totalChats: 0,
                activeChats: 0,
                totalMessages: 0,
                recentChats: 0
            },
            monthlyStats
        });
    } catch (error) {
        console.error('Error fetching chat stats:', error);
        res.status(500).json({ error: 'Failed to fetch chat statistics' });
    }
});

// Send system message (admin only)
router.post('/:chatId/system-message', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        const message = {
            sender: req.user._id,
            content,
            messageType: 'system',
            createdAt: Date.now()
        };
        
        chat.messages.push(message);
        chat.lastMessage = Date.now();
        await chat.save();
        
        res.json(message);
    } catch (error) {
        console.error('Error sending system message:', error);
        res.status(500).json({ error: 'Failed to send system message' });
    }
});

module.exports = router;