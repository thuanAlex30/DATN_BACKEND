const express = require('express');
const router = express.Router();
const projectChangeRequestController = require('../controllers/projectChangeRequestController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT CHANGE REQUEST ROUTES ==========

// Get all change requests for a project
router.get('/project/:projectId/change-requests', projectChangeRequestController.getProjectChangeRequests);

// Get change request by ID
router.get('/change-requests/:id', projectChangeRequestController.getChangeRequestById);

// Create new change request
router.post('/change-requests', projectChangeRequestController.createChangeRequest);

// Update change request
router.put('/change-requests/:id', projectChangeRequestController.updateChangeRequest);

// Delete change request
router.delete('/change-requests/:id', projectChangeRequestController.deleteChangeRequest);

// Update change request status
router.put('/change-requests/:id/status', projectChangeRequestController.updateChangeRequestStatus);

// Approve change request
router.put('/change-requests/:id/approve', projectChangeRequestController.approveChangeRequest);

// Reject change request
router.put('/change-requests/:id/reject', projectChangeRequestController.rejectChangeRequest);

// Get change request statistics
router.get('/project/:projectId/stats', projectChangeRequestController.getChangeRequestStats);

// Get all change requests with filters
router.get('/change-requests', projectChangeRequestController.getAllChangeRequests);

// Search change requests
router.get('/change-requests/search', projectChangeRequestController.searchChangeRequests);

// Get change request options
router.get('/project/:projectId/options', projectChangeRequestController.getChangeRequestOptions);

// Bulk operations
router.post('/change-requests/bulk', projectChangeRequestController.bulkCreateChangeRequests);
router.put('/change-requests/bulk', projectChangeRequestController.bulkUpdateChangeRequests);
router.delete('/change-requests/bulk', projectChangeRequestController.bulkDeleteChangeRequests);

// Get change request timeline
router.get('/project/:projectId/timeline', projectChangeRequestController.getChangeRequestTimeline);

// Get change request dashboard
router.get('/project/:projectId/dashboard', projectChangeRequestController.getChangeRequestDashboard);

module.exports = router;
