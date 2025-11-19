const express = require('express');
const router = express.Router();
const qualityCheckpointController = require('../controllers/qualityCheckpointController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== QUALITY CHECKPOINT ROUTES ==========

// Get all checkpoints for a task
router.get('/task/:taskId/checkpoints', qualityCheckpointController.getTaskCheckpoints);

// Get checkpoint by ID
router.get('/checkpoints/:id', qualityCheckpointController.getCheckpointById);

// Create new checkpoint
router.post('/checkpoints', qualityCheckpointController.createCheckpoint);

// Update checkpoint
router.put('/checkpoints/:id', qualityCheckpointController.updateCheckpoint);

// Delete checkpoint
router.delete('/checkpoints/:id', qualityCheckpointController.deleteCheckpoint);

// Update checkpoint status
router.put('/checkpoints/:id/status', qualityCheckpointController.updateCheckpointStatus);

// Complete checkpoint inspection
router.put('/checkpoints/:id/complete', qualityCheckpointController.completeCheckpoint);

// Get all checkpoints with filters
router.get('/checkpoints', qualityCheckpointController.getAllCheckpoints);

// Get checkpoint statistics
router.get('/task/:taskId/stats', qualityCheckpointController.getCheckpointStats);

// Search checkpoints
router.get('/checkpoints/search', qualityCheckpointController.searchCheckpoints);

// Get checkpoint options
router.get('/task/:taskId/options', qualityCheckpointController.getCheckpointOptions);

// Bulk operations
router.post('/checkpoints/bulk', qualityCheckpointController.bulkCreateCheckpoints);
router.put('/checkpoints/bulk', qualityCheckpointController.bulkUpdateCheckpoints);
router.delete('/checkpoints/bulk', qualityCheckpointController.bulkDeleteCheckpoints);

// Get checkpoint timeline
router.get('/task/:taskId/timeline', qualityCheckpointController.getCheckpointTimeline);

// Get checkpoint dashboard
router.get('/task/:taskId/dashboard', qualityCheckpointController.getCheckpointDashboard);

module.exports = router;
