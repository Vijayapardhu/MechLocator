const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  contact: {
    type: String,
    required: true,
    trim: true,
    match: /^\+?[\d\s\-\(\)]+$/
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  working_hours: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  images: [{
    type: String,
    trim: true
  }],
  services: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
mechanicSchema.index({ location: '2dsphere' });

// Create text index for search functionality
mechanicSchema.index({ name: 'text', address: 'text' });

// Virtual for formatted coordinates
mechanicSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

mechanicSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});

// Method to calculate distance from a point
mechanicSchema.methods.calculateDistance = function(longitude, latitude) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (latitude - this.location.coordinates[1]) * Math.PI / 180;
  const dLon = (longitude - this.location.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.location.coordinates[1] * Math.PI / 180) * 
            Math.cos(latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Static method to find nearby mechanics
mechanicSchema.statics.findNearby = function(longitude, latitude, maxDistance = 15) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    isActive: true
  }).limit(10);
};

module.exports = mongoose.model('Mechanic', mechanicSchema);