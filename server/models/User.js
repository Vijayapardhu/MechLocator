const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^\+?[\d\s\-\(\)]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  search_history: [{
    mechanic_id: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  last_location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add search to history
userSchema.methods.addSearchHistory = function(mechanicId) {
  // Remove existing entry if it exists
  this.search_history = this.search_history.filter(
    search => search.mechanic_id !== mechanicId
  );
  
  // Add new entry at the beginning
  this.search_history.unshift({
    mechanic_id: mechanicId,
    timestamp: new Date()
  });
  
  // Keep only last 20 searches
  if (this.search_history.length > 20) {
    this.search_history = this.search_history.slice(0, 20);
  }
  
  return this.save();
};

// Method to update last location
userSchema.methods.updateLocation = function(longitude, latitude) {
  this.last_location.coordinates = [longitude, latitude];
  return this.save();
};

// Virtual for recent searches (last 5)
userSchema.virtual('recentSearches').get(function() {
  return this.search_history.slice(0, 5);
});

module.exports = mongoose.model('User', userSchema);