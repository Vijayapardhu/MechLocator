const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Mechanic = require('../models/Mechanic');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a mechanic
router.get('/mechanic/:mechanicId', async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    const skip = (page - 1) * limit;
    let sortOption = {};
    
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'helpful':
        sortOption = { 'helpful.length': -1 };
        break;
    }

    const reviews = await Review.find({ mechanic: mechanicId })
      .populate('user', 'firstName lastName avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ mechanic: mechanicId });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a review
router.post('/', auth, [
  body('mechanicId').isMongoId().withMessage('Valid mechanic ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('comment').isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  body('serviceType').isIn(['Oil Change', 'Brake Repair', 'Engine Diagnostics', 'Tire Service', 'AC Repair', 'General Maintenance', 'Emergency Service', 'Other']).withMessage('Valid service type is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mechanicId, rating, title, comment, serviceType, visitDate, cost } = req.body;

    // Check if user already reviewed this mechanic
    const existingReview = await Review.findOne({ user: req.user._id, mechanic: mechanicId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this mechanic' });
    }

    // Create review
    const review = new Review({
      user: req.user._id,
      mechanic: mechanicId,
      rating,
      title,
      comment,
      serviceType,
      visitDate,
      cost
    });

    await review.save();

    // Update mechanic's average rating
    const mechanic = await Mechanic.findById(mechanicId);
    const allReviews = await Review.find({ mechanic: mechanicId });
    
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    mechanic.rating = totalRating / allReviews.length;
    mechanic.totalRatings = allReviews.length;
    
    await mechanic.save();

    // Populate user info for response
    await review.populate('user', 'firstName lastName avatar');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a review
router.put('/:reviewId', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('comment').optional().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewId } = req.params;
    const { rating, title, comment, cost } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Update review
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (cost !== undefined) review.cost = cost;

    await review.save();

    // Update mechanic's average rating
    const mechanic = await Mechanic.findById(review.mechanic);
    const allReviews = await Review.find({ mechanic: review.mechanic });
    
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    mechanic.rating = totalRating / allReviews.length;
    
    await mechanic.save();

    await review.populate('user', 'firstName lastName avatar');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await review.deleteOne();

    // Update mechanic's average rating
    const mechanic = await Mechanic.findById(review.mechanic);
    const allReviews = await Review.find({ mechanic: review.mechanic });
    
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
      mechanic.rating = totalRating / allReviews.length;
      mechanic.totalRatings = allReviews.length;
    } else {
      mechanic.rating = 0;
      mechanic.totalRatings = 0;
    }
    
    await mechanic.save();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already marked as helpful
    const alreadyHelpful = review.helpful.some(h => h.user.toString() === req.user._id.toString());
    
    if (alreadyHelpful) {
      // Remove helpful mark
      review.helpful = review.helpful.filter(h => h.user.toString() !== req.user._id.toString());
    } else {
      // Add helpful mark
      review.helpful.push({ user: req.user._id });
    }

    await review.save();

    res.json({
      message: alreadyHelpful ? 'Removed helpful mark' : 'Marked as helpful',
      helpfulCount: review.helpful.length
    });
  } catch (error) {
    console.error('Helpful review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's reviews
router.get('/user/reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user._id })
      .populate('mechanic', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;