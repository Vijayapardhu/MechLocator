const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    messageType: { 
        type: String, 
        enum: ['text', 'image', 'file', 'location', 'appointment'], 
        default: 'text' 
    },
    attachments: [{
        type: { type: String, enum: ['image', 'file', 'document'] },
        url: String,
        filename: String,
        size: Number,
        mimeType: String
    }],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [messageSchema],
    lastMessage: { type: Date },
    isActive: { type: Boolean, default: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

chatSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Update lastMessage when new message is added
    if (this.messages.length > 0) {
        this.lastMessage = this.messages[this.messages.length - 1].createdAt;
    }
    
    next();
});

chatSchema.index({ participants: 1 });
chatSchema.index({ mechanic: 1, user: 1 });
chatSchema.index({ lastMessage: -1 });
chatSchema.index({ isActive: 1, lastMessage: -1 });

module.exports = mongoose.model('Chat', chatSchema);