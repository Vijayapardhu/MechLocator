const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');

// Get nearby mechanics within specified radius
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 15, minRating = 0 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const maxDistance = radius * 1000; // Convert km to meters

    const mechanics = await Mechanic.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      },
      rating: { $gte: parseFloat(minRating) }
    })
    .sort({ rating: -1, totalRatings: -1 })
    .limit(50);

    res.json(mechanics);
  } catch (error) {
    console.error('Error fetching nearby mechanics:', error);
    res.status(500).json({ error: 'Failed to fetch nearby mechanics' });
  }
});

// Get all mechanics with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, isOpen } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }

    const mechanics = await Mechanic.find(query)
      .sort({ rating: -1, totalRatings: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Mechanic.countDocuments(query);

    res.json({
      mechanics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMechanics: total,
        hasNext: skip + mechanics.length < total,
        hasPrev: page > 1
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

// Update mechanic rating
router.patch('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    // Calculate new average rating
    const newTotalRatings = mechanic.totalRatings + 1;
    const newRating = ((mechanic.rating * mechanic.totalRatings) + rating) / newTotalRatings;

    mechanic.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal place
    mechanic.totalRatings = newTotalRatings;
    
    await mechanic.save();
    
    res.json(mechanic);
  } catch (error) {
    console.error('Error updating mechanic rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

module.exports = router;