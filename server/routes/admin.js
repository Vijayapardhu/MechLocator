const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Mechanic = require('../models/Mechanic');
const Log = require('../models/Log');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/admin/mechanics - Create new mechanic shop (FR5.1)
router.post('/mechanics', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('contact')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('working_hours')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Working hours must be between 3 and 50 characters'),
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      address,
      contact,
      longitude,
      latitude,
      rating = 0,
      working_hours,
      services = []
    } = req.body;

    // Check if mechanic with same name and address already exists
    const existingMechanic = await Mechanic.findOne({
      name,
      address,
      isActive: true
    });

    if (existingMechanic) {
      return res.status(400).json({
        error: 'A mechanic shop with this name and address already exists'
      });
    }

    // Create new mechanic
    const mechanic = new Mechanic({
      name,
      address,
      contact,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      rating: parseFloat(rating),
      working_hours,
      services
    });

    await mechanic.save();

    // Log creation
    await Log.logAction(req.user.id, 'CREATE_MECHANIC', {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name
    }, req);

    res.status(201).json({
      success: true,
      message: 'Mechanic shop created successfully',
      data: {
        mechanic: {
          id: mechanic.id,
          name: mechanic.name,
          address: mechanic.address,
          contact: mechanic.contact,
          rating: mechanic.rating,
          working_hours: mechanic.working_hours,
          services: mechanic.services,
          location: mechanic.location
        }
      }
    });

  } catch (error) {
    console.error('Create mechanic error:', error);
    res.status(500).json({
      error: 'Failed to create mechanic shop'
    });
  }
});

// PUT /api/admin/mechanics/:id - Update mechanic shop (FR5.1)
router.put('/mechanics/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('contact')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('working_hours')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Working hours must be between 3 and 50 characters'),
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const mechanic = await Mechanic.findOne({ id: req.params.id, isActive: true });

    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic shop not found'
      });
    }

    const updateData = { ...req.body };

    // Handle location update
    if (updateData.longitude && updateData.latitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
      };
      delete updateData.longitude;
      delete updateData.latitude;
    }

    // Update mechanic
    Object.assign(mechanic, updateData);
    await mechanic.save();

    // Log update
    await Log.logAction(req.user.id, 'UPDATE_MECHANIC', {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      updatedFields: Object.keys(updateData)
    }, req);

    res.json({
      success: true,
      message: 'Mechanic shop updated successfully',
      data: {
        mechanic: {
          id: mechanic.id,
          name: mechanic.name,
          address: mechanic.address,
          contact: mechanic.contact,
          rating: mechanic.rating,
          working_hours: mechanic.working_hours,
          services: mechanic.services,
          location: mechanic.location
        }
      }
    });

  } catch (error) {
    console.error('Update mechanic error:', error);
    res.status(500).json({
      error: 'Failed to update mechanic shop'
    });
  }
});

// DELETE /api/admin/mechanics/:id - Delete mechanic shop (FR5.1)
router.delete('/mechanics/:id', async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ id: req.params.id, isActive: true });

    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic shop not found'
      });
    }

    // Soft delete
    mechanic.isActive = false;
    await mechanic.save();

    // Log deletion
    await Log.logAction(req.user.id, 'DELETE_MECHANIC', {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name
    }, req);

    res.json({
      success: true,
      message: 'Mechanic shop deleted successfully'
    });

  } catch (error) {
    console.error('Delete mechanic error:', error);
    res.status(500).json({
      error: 'Failed to delete mechanic shop'
    });
  }
});

// POST /api/admin/mechanics/:id/images - Upload mechanic shop images (FR5.2)
router.post('/mechanics/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ id: req.params.id, isActive: true });

    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic shop not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images uploaded'
      });
    }

    // Add image paths to mechanic
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    mechanic.images = [...(mechanic.images || []), ...imagePaths];
    await mechanic.save();

    // Log image upload
    await Log.logAction(req.user.id, 'UPLOAD_IMAGES', {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      imageCount: req.files.length
    }, req);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: imagePaths,
        totalImages: mechanic.images.length
      }
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      error: 'Failed to upload images'
    });
  }
});

// DELETE /api/admin/mechanics/:id/images/:imageIndex - Delete specific image
router.delete('/mechanics/:id/images/:imageIndex', async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ id: req.params.id, isActive: true });

    if (!mechanic) {
      return res.status(404).json({
        error: 'Mechanic shop not found'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    
    if (imageIndex < 0 || imageIndex >= mechanic.images.length) {
      return res.status(400).json({
        error: 'Invalid image index'
      });
    }

    // Remove image from array
    const removedImage = mechanic.images.splice(imageIndex, 1)[0];
    await mechanic.save();

    // Delete file from filesystem
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(removedImage));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Log image deletion
    await Log.logAction(req.user.id, 'DELETE_IMAGE', {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      imageIndex
    }, req);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        remainingImages: mechanic.images.length
      }
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      error: 'Failed to delete image'
    });
  }
});

// GET /api/admin/mechanics - Get all mechanic shops (admin view)
router.get('/mechanics', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = { isActive: true };

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const mechanics = await Mechanic.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Mechanic.countDocuments(query);

    res.json({
      success: true,
      data: {
        mechanics: mechanics.map(mechanic => ({
          id: mechanic.id,
          name: mechanic.name,
          address: mechanic.address,
          contact: mechanic.contact,
          rating: mechanic.rating,
          working_hours: mechanic.working_hours,
          services: mechanic.services,
          images: mechanic.images,
          location: mechanic.location,
          createdAt: mechanic.createdAt,
          updatedAt: mechanic.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get mechanics error:', error);
    res.status(500).json({
      error: 'Failed to get mechanic shops'
    });
  }
});

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalMechanics = await Mechanic.countDocuments({ isActive: true });
    const totalUsers = await require('../models/User').countDocuments({ isActive: true });
    
    // Get recent activity
    const recentLogs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user_id', 'name email');

    // Get action statistics
    const actionStats = await Log.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalMechanics,
        totalUsers,
        recentActivity: recentLogs,
        actionStatistics: actionStats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics'
    });
  }
});

module.exports = router;