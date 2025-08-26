const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Log = require('../models/Log');

const router = express.Router();

// GET /api/users/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id, isActive: true });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          recentSearches: user.recentSearches,
          lastLocation: user.last_location
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile'
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findOne({ id: req.user.id, isActive: true });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { name, phone } = req.body;

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    // Log profile update
    await Log.logAction(user.id, 'UPDATE_PROFILE', {
      updatedFields: Object.keys(req.body)
    }, req);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// POST /api/users/location - Update user location
router.post('/location', [
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { longitude, latitude } = req.body;

    await req.user.updateLocation(parseFloat(longitude), parseFloat(latitude));

    // Log location update
    await Log.logAction(req.user.id, 'UPDATE_LOCATION', {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    }, req);

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      error: 'Failed to update location'
    });
  }
});

// GET /api/users/search-history - Get user search history
router.get('/search-history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const user = await User.findOne({ id: req.user.id, isActive: true });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get search history with mechanic details
    const searchHistory = await Promise.all(
      user.search_history.slice(0, parseInt(limit)).map(async (search) => {
        const mechanic = await Mechanic.findOne({ id: search.mechanic_id, isActive: true });
        return {
          mechanic_id: search.mechanic_id,
          timestamp: search.timestamp,
          mechanic: mechanic ? {
            id: mechanic.id,
            name: mechanic.name,
            address: mechanic.address,
            rating: mechanic.rating,
            contact: mechanic.contact
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        searchHistory: searchHistory.filter(item => item.mechanic !== null)
      }
    });

  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({
      error: 'Failed to get search history'
    });
  }
});

// POST /api/users/search-history/:mechanicId - Add mechanic to search history
router.post('/search-history/:mechanicId', async (req, res) => {
  try {
    const { mechanicId } = req.params;

    // Verify mechanic exists
    const mechanic = await Mechanic.findOne({ id: mechanicId, isActive: true });

    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic not found'
      });
    }

    // Add to search history
    await req.user.addSearchHistory(mechanicId);

    // Log search history addition
    await Log.logAction(req.user.id, 'ADD_SEARCH_HISTORY', {
      mechanicId,
      mechanicName: mechanic.name
    }, req);

    res.json({
      success: true,
      message: 'Added to search history'
    });

  } catch (error) {
    console.error('Add search history error:', error);
    res.status(500).json({
      error: 'Failed to add to search history'
    });
  }
});

// DELETE /api/users/search-history/:mechanicId - Remove mechanic from search history
router.delete('/search-history/:mechanicId', async (req, res) => {
  try {
    const { mechanicId } = req.params;

    const user = await User.findOne({ id: req.user.id, isActive: true });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Remove from search history
    user.search_history = user.search_history.filter(
      search => search.mechanic_id !== mechanicId
    );

    await user.save();

    // Log search history removal
    await Log.logAction(req.user.id, 'REMOVE_SEARCH_HISTORY', {
      mechanicId
    }, req);

    res.json({
      success: true,
      message: 'Removed from search history'
    });

  } catch (error) {
    console.error('Remove search history error:', error);
    res.status(500).json({
      error: 'Failed to remove from search history'
    });
  }
});

// DELETE /api/users/search-history - Clear all search history
router.delete('/search-history', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id, isActive: true });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const historyCount = user.search_history.length;
    user.search_history = [];
    await user.save();

    // Log search history clear
    await Log.logAction(req.user.id, 'CLEAR_SEARCH_HISTORY', {
      clearedCount: historyCount
    }, req);

    res.json({
      success: true,
      message: 'Search history cleared successfully'
    });

  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({
      error: 'Failed to clear search history'
    });
  }
});

module.exports = router;