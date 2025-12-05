const express = require('express');
const router = express.Router();
const projectRiskController = require('../controllers/projectRiskController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const projectValidation = require('../validations/projectValidation');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT RISK ROUTES ==========

// Get all risks for a project
router.get('/project/:projectId/risks', projectRiskController.getProjectRisks);

// Get risk by ID
router.get('/risks/:id', projectRiskController.getRiskById);

// Create new risk
router.post('/risks', projectRiskController.createRisk);

// Update risk
router.put('/risks/:id', projectRiskController.updateRisk);

// Delete risk
router.delete('/risks/:id', projectRiskController.deleteRisk);

// Update risk status
router.put('/risks/:id/status', projectRiskController.updateRiskStatus);

// Update risk progress
router.put('/risks/:id/progress', projectRiskController.updateRiskProgress);

// Get risk progress logs
router.get('/risks/:id/progress-logs', projectRiskController.getRiskProgressLogs);

// Add risk progress log
router.post('/risks/:id/progress-logs', projectRiskController.addRiskProgressLog);

// Get risk statistics
router.get('/project/:projectId/stats', projectRiskController.getRiskStats);

// Get all risks with filters
router.get('/risks', projectRiskController.getAllRisks);

// Get risks assigned to a specific user in a project
router.get('/project/:projectId/risks/assigned/:userId', 
  ValidationMiddleware.validateParams(projectValidation.projectUserParams),
  projectRiskController.getAssignedRisks);

// Search risks
router.get('/risks/search', projectRiskController.searchRisks);

// Get risk options
router.get('/project/:projectId/options', projectRiskController.getRiskOptions);

// Bulk operations
router.post('/risks/bulk', projectRiskController.bulkCreateRisks);
router.put('/risks/bulk', projectRiskController.bulkUpdateRisks);
router.delete('/risks/bulk', projectRiskController.bulkDeleteRisks);


module.exports = router;
