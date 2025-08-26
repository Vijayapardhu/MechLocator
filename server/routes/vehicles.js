const express = require('express');
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's vehicles
router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id })
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get vehicle by ID
router.get('/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new vehicle
router.post('/', auth, [
  body('make').notEmpty().withMessage('Make is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('licensePlate').optional().isLength({ min: 1, max: 20 }).withMessage('License plate must be between 1 and 20 characters'),
  body('vin').optional().isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters'),
  body('color').optional().notEmpty().withMessage('Color cannot be empty'),
  body('mileage').optional().isFloat({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('fuelType').optional().isIn(['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']).withMessage('Valid fuel type is required'),
  body('transmission').optional().isIn(['Automatic', 'Manual', 'CVT', 'Other']).withMessage('Valid transmission type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      make, model, year, licensePlate, vin, color, mileage,
      fuelType, transmission, isPrimary
    } = req.body;

    // Check if VIN is unique (if provided)
    if (vin) {
      const existingVehicle = await Vehicle.findOne({ vin, user: { $ne: req.user._id } });
      if (existingVehicle) {
        return res.status(400).json({ error: 'VIN already exists in our system' });
      }
    }

    const vehicle = new Vehicle({
      user: req.user._id,
      make,
      model,
      year,
      licensePlate,
      vin,
      color,
      mileage,
      fuelType,
      transmission,
      isPrimary: isPrimary || false
    });

    await vehicle.save();

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vehicle
router.put('/:vehicleId', auth, [
  body('make').optional().notEmpty().withMessage('Make cannot be empty'),
  body('model').optional().notEmpty().withMessage('Model cannot be empty'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('licensePlate').optional().isLength({ min: 1, max: 20 }).withMessage('License plate must be between 1 and 20 characters'),
  body('vin').optional().isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters'),
  body('color').optional().notEmpty().withMessage('Color cannot be empty'),
  body('mileage').optional().isFloat({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('fuelType').optional().isIn(['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']).withMessage('Valid fuel type is required'),
  body('transmission').optional().isIn(['Automatic', 'Manual', 'CVT', 'Other']).withMessage('Valid transmission type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicleId } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if VIN is unique (if being updated)
    if (updateData.vin && updateData.vin !== vehicle.vin) {
      const existingVehicle = await Vehicle.findOne({ vin: updateData.vin, user: { $ne: req.user._id } });
      if (existingVehicle) {
        return res.status(400).json({ error: 'VIN already exists in our system' });
      }
    }

    Object.assign(vehicle, updateData);
    await vehicle.save();

    res.json({
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vehicle
router.delete('/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await vehicle.deleteOne();

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set primary vehicle
router.patch('/:vehicleId/primary', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    vehicle.isPrimary = true;
    await vehicle.save();

    res.json({
      message: 'Primary vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Set primary vehicle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add service history
router.post('/:vehicleId/service', auth, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('mileage').optional().isFloat({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicleId } = req.params;
    const { date, serviceType, cost, mileage, notes, mechanicId } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const serviceRecord = {
      date: new Date(date),
      serviceType,
      cost,
      mileage,
      notes,
      mechanic: mechanicId
    };

    vehicle.serviceHistory.push(serviceRecord);
    
    // Update last service date
    vehicle.lastServiceDate = new Date(date);
    
    // Update mileage if provided
    if (mileage) {
      vehicle.mileage = mileage;
    }

    await vehicle.save();

    res.json({
      message: 'Service history added successfully',
      vehicle
    });
  } catch (error) {
    console.error('Add service history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get service history
router.get('/:vehicleId/service', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const serviceHistory = vehicle.serviceHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + parseInt(limit));

    res.json({
      serviceHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(vehicle.serviceHistory.length / limit),
        totalServices: vehicle.serviceHistory.length
      }
    });
  } catch (error) {
    console.error('Get service history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get vehicle statistics
router.get('/:vehicleId/stats', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const totalServices = vehicle.serviceHistory.length;
    const totalCost = vehicle.serviceHistory.reduce((sum, service) => sum + (service.cost || 0), 0);
    const lastService = vehicle.serviceHistory.length > 0 
      ? vehicle.serviceHistory.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

    // Calculate average cost per service
    const avgCostPerService = totalServices > 0 ? totalCost / totalServices : 0;

    // Get service type breakdown
    const serviceTypeBreakdown = vehicle.serviceHistory.reduce((acc, service) => {
      acc[service.serviceType] = (acc[service.serviceType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalServices,
      totalCost,
      avgCostPerService,
      lastService,
      serviceTypeBreakdown,
      currentMileage: vehicle.mileage
    });
  } catch (error) {
    console.error('Get vehicle stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;