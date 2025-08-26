const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['SEARCH', 'CALL', 'VIEW', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    trim: true
  },
  user_agent: {
    type: String,
    trim: true
  },
  success: {
    type: Boolean,
    default: true
  },
  error_message: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
logSchema.index({ user_id: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });

// Static method to log user action
logSchema.statics.logAction = function(userId, action, details = {}, req = null) {
  const logData = {
    user_id: userId,
    action,
    details,
    timestamp: new Date()
  };

  if (req) {
    logData.ip_address = req.ip || req.connection.remoteAddress;
    logData.user_agent = req.get('User-Agent');
  }

  return this.create(logData);
};

// Static method to get user activity
logSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get system statistics
logSchema.statics.getStats = function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user_id' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Log', logSchema);