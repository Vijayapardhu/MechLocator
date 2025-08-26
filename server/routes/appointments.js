const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Mechanic = require('../models/Mechanic');
const { auth, mechanicAuth } = require('../middleware/auth');

const router = express.Router();

// Get user's appointments
router.get('/user', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { user: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('mechanic', 'name address phone')
      .sort({ appointmentDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total
      }
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get mechanic's appointments
router.get('/mechanic', mechanicAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { mechanic: req.user.mechanicId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'firstName lastName phone')
      .sort({ appointmentDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total
      }
    });
  } catch (error) {
    console.error('Get mechanic appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment
router.post('/', auth, [
  body('mechanicId').isMongoId().withMessage('Valid mechanic ID is required'),
  body('serviceType').isIn(['Oil Change', 'Brake Repair', 'Engine Diagnostics', 'Tire Service', 'AC Repair', 'General Maintenance', 'Emergency Service', 'Other']).withMessage('Valid service type is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mechanicId, serviceType, appointmentDate, timeSlot, description, vehicleInfo, estimatedCost } = req.body;

    // Check if mechanic exists
    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      mechanic: mechanicId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      user: req.user._id,
      mechanic: mechanicId,
      serviceType,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      description,
      vehicleInfo,
      estimatedCost
    });

    await appointment.save();

    await appointment.populate('mechanic', 'name address phone');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status (mechanic only)
router.patch('/:appointmentId/status', mechanicAuth, [
  body('status').isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appointmentId } = req.params;
    const { status, notes, actualCost } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if mechanic owns this appointment
    if (appointment.mechanic.toString() !== req.user.mechanicId) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    appointment.status = status;
    if (notes) appointment.notes.mechanic = notes;
    if (actualCost !== undefined) appointment.actualCost = actualCost;

    await appointment.save();

    await appointment.populate('user', 'firstName lastName phone');

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel appointment (user only)
router.patch('/:appointmentId/cancel', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment cannot be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await appointment.populate('mechanic', 'name address phone');

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available time slots for a mechanic
router.get('/mechanic/:mechanicId/slots', async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Get mechanic's hours for this day
    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    const dayHours = mechanic.hours[dayOfWeek];
    if (!dayHours || dayHours.open === 'Closed') {
      return res.json({ slots: [] });
    }

    // Generate time slots (assuming 1-hour slots)
    const slots = [];
    const startTime = new Date(`2000-01-01 ${dayHours.open}`);
    const endTime = new Date(`2000-01-01 ${dayHours.close}`);

    while (startTime < endTime) {
      const timeString = startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      slots.push(timeString);
      startTime.setHours(startTime.getHours() + 1);
    }

    // Get booked slots
    const bookedSlots = await Appointment.find({
      mechanic: mechanicId,
      appointmentDate: {
        $gte: appointmentDate,
        $lt: new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedTimeSlots = bookedSlots.map(apt => apt.timeSlot);
    const availableSlots = slots.filter(slot => !bookedTimeSlots.includes(slot));

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get appointment statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Appointment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments({ user: userId });
    const upcomingAppointments = await Appointment.countDocuments({
      user: userId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    res.json({
      stats,
      totalAppointments,
      upcomingAppointments
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;