const express = require('express');
const router = express.Router();
const SiteController = require('../controllers/SiteController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const { body, query, param } = require('express-validator');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Validation middleware for project_id
const validateProjectId = [
  query('project_id').notEmpty().withMessage('Project ID is required'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// ========== SITE ROUTES ==========

// Get all sites (requires project_id query parameter)
router.get('/', validateProjectId, SiteController.getAllSites);

// Get site by ID
router.get('/:id', SiteController.getSiteById);

// Create new site
router.post('/', SiteController.createSite);

// Update site
router.put('/:id', SiteController.updateSite);

// Delete site
router.delete('/:id', SiteController.deleteSite);

// Toggle site status
router.patch('/:id/status', SiteController.toggleSiteStatus);

// Get site statistics
router.get('/:id/stats', SiteController.getSiteStats);

module.exports = router;
