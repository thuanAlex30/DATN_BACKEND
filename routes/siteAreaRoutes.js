const express = require('express');
const router = express.Router();
const SiteAreaController = require('../controllers/siteAreaController');
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

// ========== SITE AREA ROUTES ==========

// Get all areas for a site
router.get('/site/:siteId/areas', SiteAreaController.getSiteAreas);

// Get all areas with filters (requires project_id query parameter)
router.get('/areas', validateProjectId, SiteAreaController.getAllAreas);

// Search areas
router.get('/areas/search', SiteAreaController.searchAreas);

// Get area by ID
router.get('/areas/:id', SiteAreaController.getAreaById);

// Create new area
router.post('/areas', SiteAreaController.createArea);

// Update area
router.put('/areas/:id', SiteAreaController.updateArea);

// Delete area
router.delete('/areas/:id', SiteAreaController.deleteArea);

// Bulk operations
router.post('/areas/bulk', SiteAreaController.bulkCreateAreas);
router.put('/areas/bulk', SiteAreaController.bulkUpdateAreas);
router.delete('/areas/bulk', SiteAreaController.bulkDeleteAreas);

// Get area hierarchy
router.get('/site/:siteId/hierarchy', SiteAreaController.getAreaHierarchy);

// Get area map
router.get('/site/:siteId/map', SiteAreaController.getAreaMap);

// Get area options for dropdowns
router.get('/site/:siteId/options', SiteAreaController.getAreaOptions);

// Get area statistics
router.get('/areas/:id/stats', SiteAreaController.getAreaStats);

// ========== AREA ACCESS CONTROLS ==========

// Get area access controls
router.get('/areas/:id/access-controls', SiteAreaController.getAreaAccessControls);

// Add area access control
router.post('/areas/:id/access-controls', SiteAreaController.addAreaAccessControl);

// Update area access control
router.put('/access-controls/:id', SiteAreaController.updateAreaAccessControl);

// Remove area access control
router.delete('/access-controls/:id', SiteAreaController.removeAreaAccessControl);

// ========== AREA SAFETY CHECKLISTS ==========

// Get area safety checklists
router.get('/areas/:id/safety-checklists', SiteAreaController.getAreaSafetyChecklists);

// Create area safety checklist
router.post('/areas/:id/safety-checklists', SiteAreaController.createAreaSafetyChecklist);

// ========== AREA INSPECTIONS ==========

// Get area inspections
router.get('/areas/:id/inspections', SiteAreaController.getAreaInspections);

// Create area inspection
router.post('/areas/:id/inspections', SiteAreaController.createAreaInspection);

// Update area inspection
router.put('/inspections/:id', SiteAreaController.updateAreaInspection);

module.exports = router;
