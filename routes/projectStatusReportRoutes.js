const express = require('express');
const router = express.Router();
const projectStatusReportController = require('../controllers/projectStatusReportController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT STATUS REPORT ROUTES ==========

// Get all status reports for a project
router.get('/project/:projectId/status-reports', projectStatusReportController.getProjectStatusReports);

// Get status report by ID
router.get('/status-reports/:id', projectStatusReportController.getStatusReportById);

// Create new status report
router.post('/status-reports', projectStatusReportController.createStatusReport);

// Update status report
router.put('/status-reports/:id', projectStatusReportController.updateStatusReport);

// Delete status report
router.delete('/status-reports/:id', projectStatusReportController.deleteStatusReport);

// Get all status reports with filters
router.get('/status-reports', projectStatusReportController.getAllStatusReports);

// Get status report statistics
router.get('/project/:projectId/stats', projectStatusReportController.getStatusReportStats);

// Search status reports
router.get('/status-reports/search', projectStatusReportController.searchStatusReports);

// Get status report options
router.get('/project/:projectId/options', projectStatusReportController.getStatusReportOptions);

// Bulk operations
router.post('/status-reports/bulk', projectStatusReportController.bulkCreateStatusReports);
router.put('/status-reports/bulk', projectStatusReportController.bulkUpdateStatusReports);
router.delete('/status-reports/bulk', projectStatusReportController.bulkDeleteStatusReports);

// Get status report timeline
router.get('/project/:projectId/timeline', projectStatusReportController.getStatusReportTimeline);

// Get status report dashboard
router.get('/project/:projectId/dashboard', projectStatusReportController.getStatusReportDashboard);

module.exports = router;
