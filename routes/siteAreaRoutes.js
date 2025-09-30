const express = require('express');
const router = express.Router();
const siteAreaController = require('../controllers/siteAreaController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== SITE AREA ROUTES ==========

// Get all areas for a site
router.get('/site/:siteId/areas', siteAreaController.getSiteAreas);

// Get all areas with filters
router.get('/areas', siteAreaController.getAllAreas);

// Search areas
router.get('/areas/search', siteAreaController.searchAreas);

// Get area by ID
router.get('/areas/:id', siteAreaController.getAreaById);

// Create new area
router.post('/areas', siteAreaController.createArea);

// Update area
router.put('/areas/:id', siteAreaController.updateArea);

// Delete area
router.delete('/areas/:id', siteAreaController.deleteArea);

// Bulk operations
router.post('/areas/bulk', siteAreaController.bulkCreateAreas);
router.put('/areas/bulk', siteAreaController.bulkUpdateAreas);
router.delete('/areas/bulk', siteAreaController.bulkDeleteAreas);

// Get area hierarchy
router.get('/site/:siteId/hierarchy', siteAreaController.getAreaHierarchy);

// Get area map
router.get('/site/:siteId/map', siteAreaController.getAreaMap);

// Get area options for dropdowns
router.get('/site/:siteId/options', siteAreaController.getAreaOptions);

// Get area statistics
router.get('/areas/:id/stats', siteAreaController.getAreaStats);

// ========== AREA ACCESS CONTROLS ==========

// Get area access controls
router.get('/areas/:id/access-controls', siteAreaController.getAreaAccessControls);

// Add area access control
router.post('/areas/:id/access-controls', siteAreaController.addAreaAccessControl);

// Update area access control
router.put('/access-controls/:id', siteAreaController.updateAreaAccessControl);

// Remove area access control
router.delete('/access-controls/:id', siteAreaController.removeAreaAccessControl);

// ========== AREA SAFETY CHECKLISTS ==========

// Get area safety checklists
router.get('/areas/:id/safety-checklists', siteAreaController.getAreaSafetyChecklists);

// Create area safety checklist
router.post('/areas/:id/safety-checklists', siteAreaController.createAreaSafetyChecklist);

// ========== AREA INSPECTIONS ==========

// Get area inspections
router.get('/areas/:id/inspections', siteAreaController.getAreaInspections);

// Create area inspection
router.post('/areas/:id/inspections', siteAreaController.createAreaInspection);

// Update area inspection
router.put('/inspections/:id', siteAreaController.updateAreaInspection);

module.exports = router;
