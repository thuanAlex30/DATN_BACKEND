const express = require('express');
const router = express.Router();
const projectRiskController = require('../controllers/projectRiskController');
const authMiddleware = require('../middlewares/AuthMiddleware');

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

// Get risk statistics
router.get('/project/:projectId/stats', projectRiskController.getRiskStats);

// Get all risks with filters
router.get('/risks', projectRiskController.getAllRisks);

// Search risks
router.get('/risks/search', projectRiskController.searchRisks);

// Get risk options
router.get('/project/:projectId/options', projectRiskController.getRiskOptions);

// Bulk operations
router.post('/risks/bulk', projectRiskController.bulkCreateRisks);
router.put('/risks/bulk', projectRiskController.bulkUpdateRisks);
router.delete('/risks/bulk', projectRiskController.bulkDeleteRisks);


module.exports = router;
