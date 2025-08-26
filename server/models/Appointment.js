const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Oil Change', 'Brake Repair', 'Engine Diagnostics', 'Tire Service', 'AC Repair', 'General Maintenance', 'Emergency Service', 'Other'],
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    vin: String
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  notes: {
    customer: String,
    mechanic: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
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
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);