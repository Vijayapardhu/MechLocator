const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Mechanic = require('../models/Mechanic');
const Log = require('../models/Log');
const { optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply optional auth middleware to all routes
router.use(optionalAuthMiddleware);

// GET /api/mechanics/nearby - Find nearby mechanics (FR2)
router.get('/nearby', [
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('distance').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Distance must be between 0.1 and 50 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Minimum rating must be between 0 and 5'),
  query('sortBy').optional().isIn(['distance', 'rating']).withMessage('Sort by must be either distance or rating')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { longitude, latitude, distance = 15, minRating, sortBy = 'distance' } = req.query;

    // Build query
    let query = {
      isActive: true
    };

    // Add rating filter if specified
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Find nearby mechanics using geospatial query
    let mechanics = await Mechanic.find({
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(distance) * 1000 // Convert km to meters
        }
      }
    }).limit(10);

    // Calculate distances and format response
    const mechanicsWithDistance = mechanics.map(mechanic => {
      const distance = mechanic.calculateDistance(parseFloat(longitude), parseFloat(latitude));
      return {
        id: mechanic.id,
        name: mechanic.name,
        address: mechanic.address,
        rating: mechanic.rating,
        contact: mechanic.contact,
        working_hours: mechanic.working_hours,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        images: mechanic.images,
        services: mechanic.services
      };
    });

    // Sort results
    if (sortBy === 'rating') {
      mechanicsWithDistance.sort((a, b) => b.rating - a.rating);
    } else {
      // Default sort by distance (already sorted by MongoDB $near)
    }

    // Log search if user is authenticated
    if (req.user) {
      await Log.logAction(req.user.id, 'SEARCH', {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        distance: parseFloat(distance),
        minRating: minRating ? parseFloat(minRating) : null,
        resultsCount: mechanicsWithDistance.length
      }, req);
    }

    res.json({
      success: true,
      data: mechanicsWithDistance,
      count: mechanicsWithDistance.length,
      searchParams: {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        distance: parseFloat(distance),
        minRating: minRating ? parseFloat(minRating) : null,
        sortBy
      }
    });

  } catch (error) {
    console.error('Nearby mechanics error:', error);
    res.status(500).json({
      error: 'Failed to find nearby mechanics'
    });
  }
});

// GET /api/mechanics/search - Text search for mechanics
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('longitude').optional().isFloat({ min: -180, max: 180 }),
  query('latitude').optional().isFloat({ min: -90, max: 90 }),
  query('distance').optional().isFloat({ min: 0.1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { q, longitude, latitude, distance = 15 } = req.query;

    let query = {
      isActive: true,
      $text: { $search: q }
    };

    let mechanics;
    
    if (longitude && latitude) {
      // Text search with location filter
      mechanics = await Mechanic.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(distance) * 1000
          }
        }
      }).limit(10);
    } else {
      // Text search only
      mechanics = await Mechanic.find(query)
        .sort({ score: { $meta: 'textScore' } })
        .limit(10);
    }

    const formattedMechanics = mechanics.map(mechanic => {
      const result = {
        id: mechanic.id,
        name: mechanic.name,
        address: mechanic.address,
        rating: mechanic.rating,
        contact: mechanic.contact,
        working_hours: mechanic.working_hours,
        images: mechanic.images,
        services: mechanic.services
      };

      if (longitude && latitude) {
        result.distance = Math.round(mechanic.calculateDistance(parseFloat(longitude), parseFloat(latitude)) * 10) / 10;
      }

      return result;
    });

    // Log search if user is authenticated
    if (req.user) {
      await Log.logAction(req.user.id, 'SEARCH', {
        query: q,
        longitude: longitude ? parseFloat(longitude) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        distance: parseFloat(distance),
        resultsCount: formattedMechanics.length
      }, req);
    }

    res.json({
      success: true,
      data: formattedMechanics,
      count: formattedMechanics.length,
      searchQuery: q
    });

  } catch (error) {
    console.error('Search mechanics error:', error);
    res.status(500).json({
      error: 'Failed to search mechanics'
    });
  }
});

// GET /api/mechanics/:id - Get specific mechanic details
router.get('/:id', async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ id: req.params.id, isActive: true });
    
    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic not found'
      });
    }

    // Log view if user is authenticated
    if (req.user) {
      await Log.logAction(req.user.id, 'VIEW', {
        mechanicId: mechanic.id,
        mechanicName: mechanic.name
      }, req);
    }

    res.json({
      success: true,
      data: {
        id: mechanic.id,
        name: mechanic.name,
        address: mechanic.address,
        rating: mechanic.rating,
        contact: mechanic.contact,
        working_hours: mechanic.working_hours,
        images: mechanic.images,
        services: mechanic.services,
        location: mechanic.location
      }
    });

  } catch (error) {
    console.error('Get mechanic error:', error);
    res.status(500).json({
      error: 'Failed to get mechanic details'
    });
  }
});

// GET /api/mechanics/filters/options - Get available filter options
router.get('/filters/options', async (req, res) => {
  try {
    const distanceOptions = [
      { value: 1, label: '1 km' },
      { value: 5, label: '5 km' },
      { value: 10, label: '10 km' },
      { value: 15, label: '15 km' }
    ];

    const ratingOptions = [
      { value: 4.5, label: '4.5+ stars' },
      { value: 4.0, label: '4.0+ stars' },
      { value: 3.5, label: '3.5+ stars' },
      { value: 3.0, label: '3.0+ stars' }
    ];

    const sortOptions = [
      { value: 'distance', label: 'Distance' },
      { value: 'rating', label: 'Rating' }
    ];

    res.json({
      success: true,
      data: {
        distanceOptions,
        ratingOptions,
        sortOptions
      }
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      error: 'Failed to get filter options'
    });
  }
});

module.exports = router;