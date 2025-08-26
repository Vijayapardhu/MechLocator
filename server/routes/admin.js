const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');

// Create a new mechanic
router.post('/', async (req, res) => {
  try {
    const mechanicData = req.body;
    
    // Validate required fields
    if (!mechanicData.name || !mechanicData.address || !mechanicData.phone) {
      return res.status(400).json({ error: 'Name, address, and phone are required' });
    }

    // Validate location coordinates
    if (!mechanicData.location || !mechanicData.location.coordinates) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const mechanic = new Mechanic(mechanicData);
    await mechanic.save();
    
    res.status(201).json(mechanic);
  } catch (error) {
    console.error('Error creating mechanic:', error);
    res.status(500).json({ error: 'Failed to create mechanic' });
  }
});

// Get all mechanics (admin view)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const mechanics = await Mechanic.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Mechanic.countDocuments(query);

    res.json({
      mechanics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMechanics: total
      }
    });
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    res.status(500).json({ error: 'Failed to fetch mechanics' });
  }
});

// Get mechanic by ID
router.get('/:id', async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.json(mechanic);
  } catch (error) {
    console.error('Error fetching mechanic:', error);
    res.status(500).json({ error: 'Failed to fetch mechanic' });
  }
});

// Update mechanic
router.put('/:id', async (req, res) => {
  try {
    const mechanicData = req.body;
    
    // Validate required fields
    if (!mechanicData.name || !mechanicData.address || !mechanicData.phone) {
      return res.status(400).json({ error: 'Name, address, and phone are required' });
    }

    const mechanic = await Mechanic.findByIdAndUpdate(
      req.params.id,
      mechanicData,
      { new: true, runValidators: true }
    );

    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    res.json(mechanic);
  } catch (error) {
    console.error('Error updating mechanic:', error);
    res.status(500).json({ error: 'Failed to update mechanic' });
  }
});

// Delete mechanic
router.delete('/:id', async (req, res) => {
  try {
    const mechanic = await Mechanic.findByIdAndDelete(req.params.id);
    
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    res.json({ message: 'Mechanic deleted successfully' });
  } catch (error) {
    console.error('Error deleting mechanic:', error);
    res.status(500).json({ error: 'Failed to delete mechanic' });
  }
});

// Bulk create mechanics (for seeding data)
router.post('/bulk', async (req, res) => {
  try {
    const { mechanics } = req.body;
    
    if (!Array.isArray(mechanics)) {
      return res.status(400).json({ error: 'Mechanics must be an array' });
    }

    const createdMechanics = await Mechanic.insertMany(mechanics);
    res.status(201).json({ 
      message: `${createdMechanics.length} mechanics created successfully`,
      mechanics: createdMechanics 
    });
  } catch (error) {
    console.error('Error bulk creating mechanics:', error);
    res.status(500).json({ error: 'Failed to create mechanics' });
  }
});

module.exports = router;