const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    trim: true,
    uppercase: true
  },
  vin: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: 17,
    maxlength: 17
  },
  color: {
    type: String,
    trim: true
  },
  mileage: {
    type: Number,
    min: 0
  },
  fuelType: {
    type: String,
    enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual', 'CVT', 'Other']
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  lastServiceDate: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  serviceHistory: [{
    date: {
      type: Date,
      required: true
    },
    serviceType: {
      type: String,
      required: true
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mechanic'
    },
    cost: {
      type: Number,
      min: 0
    },
    mileage: {
      type: Number,
      min: 0
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
vehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one primary vehicle per user
vehicleSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);