const express = require('express');
const router = express.Router();
const projectPhaseController = require('../controllers/projectPhaseController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT PHASE ROUTES ==========

// Get all phases for a project
router.get('/project/:projectId/phases', projectPhaseController.getProjectPhases);

// Get phase by ID
router.get('/phases/:id', projectPhaseController.getPhaseById);

// Create new phase
router.post('/phases', projectPhaseController.createPhase);

// Update phase
router.put('/phases/:id', projectPhaseController.updatePhase);

// Delete phase
router.delete('/phases/:id', projectPhaseController.deletePhase);

// Update phase progress
router.put('/phases/:id/progress', projectPhaseController.updatePhaseProgress);

// Get phase statistics
router.get('/phases/:id/stats', projectPhaseController.getPhaseStats);

// Get phase timeline
router.get('/phases/:id/timeline', projectPhaseController.getPhaseTimeline);

module.exports = router;
