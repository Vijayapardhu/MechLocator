const express = require('express');
const { query, validationResult } = require('express-validator');
const Log = require('../models/Log');
const User = require('../models/User');

const router = express.Router();

// GET /api/logs/user-activity - Get current user's activity
router.get('/user-activity', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().isIn(['SEARCH', 'CALL', 'VIEW', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE']).withMessage('Invalid action type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { limit = 50, action } = req.query;

    let query = { user_id: req.user.id };

    if (action) {
      query.action = action;
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          timestamp: log.timestamp,
          details: log.details,
          success: log.success,
          error_message: log.error_message
        })),
        count: logs.length
      }
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      error: 'Failed to get user activity'
    });
  }
});

// GET /api/logs/system-stats - Get system statistics (admin only)
router.get('/system-stats', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    const { startDate, endDate } = req.query;

    // Get action statistics
    const actionStats = await Log.getStats(startDate, endDate);

    // Get total logs count
    const totalLogs = await Log.countDocuments();

    // Get recent activity
    const recentActivity = await Log.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user_id', 'name email');

    // Get user activity summary
    const userActivitySummary = await Log.aggregate([
      {
        $group: {
          _id: '$user_id',
          actionCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          actionCount: 1,
          lastActivity: 1
        }
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        actionStatistics: actionStats,
        recentActivity: recentActivity.map(log => ({
          id: log.id,
          action: log.action,
          timestamp: log.timestamp,
          user: log.user_id ? {
            id: log.user_id.id,
            name: log.user_id.name,
            email: log.user_id.email
          } : null,
          details: log.details
        })),
        userActivitySummary
      }
    });

  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      error: 'Failed to get system statistics'
    });
  }
});

// GET /api/logs/search - Search logs (admin only)
router.get('/search', [
  query('action').optional().isIn(['SEARCH', 'CALL', 'VIEW', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE']).withMessage('Invalid action type'),
  query('userId').optional().isString().withMessage('User ID must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = {};

    // Add filters
    if (action) query.action = action;
    if (userId) query.user_id = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user_id', 'name email');

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          timestamp: log.timestamp,
          user: log.user_id ? {
            id: log.user_id.id,
            name: log.user_id.name,
            email: log.user_id.email
          } : null,
          details: log.details,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          success: log.success,
          error_message: log.error_message
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
    console.error('Search logs error:', error);
    res.status(500).json({
      error: 'Failed to search logs'
    });
  }
});

// GET /api/logs/export - Export logs (admin only)
router.get('/export', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { format = 'json', startDate, endDate } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .populate('user_id', 'name email');

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'ID,Action,Timestamp,User ID,User Name,User Email,Details,IP Address,User Agent,Success,Error Message\n';
      const csvRows = logs.map(log => {
        const user = log.user_id || {};
        return [
          log.id,
          log.action,
          log.timestamp.toISOString(),
          user.id || '',
          user.name || '',
          user.email || '',
          JSON.stringify(log.details).replace(/"/g, '""'),
          log.ip_address || '',
          log.user_agent || '',
          log.success,
          log.error_message || ''
        ].map(field => `"${field}"`).join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          logs: logs.map(log => ({
            id: log.id,
            action: log.action,
            timestamp: log.timestamp,
            user: log.user_id ? {
              id: log.user_id.id,
              name: log.user_id.name,
              email: log.user_id.email
            } : null,
            details: log.details,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            success: log.success,
            error_message: log.error_message
          })),
          exportInfo: {
            format,
            totalRecords: logs.length,
            exportDate: new Date().toISOString(),
            exportedBy: req.user.id
          }
        }
      });
    }

  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({
      error: 'Failed to export logs'
    });
  }
});

module.exports = router;