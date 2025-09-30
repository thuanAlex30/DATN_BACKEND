const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== SITE ROUTES ==========

// Get all sites
router.get('/', siteController.getAllSites);

// Get site by ID
router.get('/:id', siteController.getSiteById);

// Create new site
router.post('/', siteController.createSite);

// Update site
router.put('/:id', siteController.updateSite);

// Delete site
router.delete('/:id', siteController.deleteSite);

// Toggle site status
router.patch('/:id/status', siteController.toggleSiteStatus);

// Get site statistics
router.get('/:id/stats', siteController.getSiteStats);

module.exports = router;
