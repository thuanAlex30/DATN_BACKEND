const express = require('express');
const router = express.Router();
const projectResourceController = require('../controllers/projectResourceController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT RESOURCE ROUTES ==========

// Get all resources for a project
router.get('/project/:projectId/resources', projectResourceController.getProjectResources);

// Get resource by ID
router.get('/resources/:id', projectResourceController.getResourceById);

// Create new resource
router.post('/resources', projectResourceController.createResource);

// Update resource
router.put('/resources/:id', projectResourceController.updateResource);

// Delete resource
router.delete('/resources/:id', projectResourceController.deleteResource);

// Get all resources with filters
router.get('/resources', projectResourceController.getAllResources);

// Get resource allocation for project
router.get('/project/:projectId/allocation', projectResourceController.getResourceAllocation);

// Update resource allocation
router.put('/allocation/:id', projectResourceController.updateResourceAllocation);

// Get resource statistics
router.get('/project/:projectId/stats', projectResourceController.getResourceStats);

// Search resources
router.get('/resources/search', projectResourceController.searchResources);

// Get resource options
router.get('/project/:projectId/options', projectResourceController.getResourceOptions);

// Bulk operations
router.post('/resources/bulk', projectResourceController.bulkCreateResources);
router.put('/resources/bulk', projectResourceController.bulkUpdateResources);
router.delete('/resources/bulk', projectResourceController.bulkDeleteResources);

module.exports = router;
