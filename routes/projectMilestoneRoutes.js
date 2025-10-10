const express = require('express');
const router = express.Router();
const projectMilestoneController = require('../controllers/projectMilestoneController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT MILESTONE ROUTES ==========

// Get all milestones for a project
router.get('/project/:projectId/milestones', projectMilestoneController.getProjectMilestones);

// Get milestones assigned to a specific user
router.get('/milestones/assigned/:userId', projectMilestoneController.getMilestonesByUser);

// Get milestone by ID
router.get('/milestones/:id', projectMilestoneController.getMilestoneById);

// Create new milestone
router.post('/milestones', projectMilestoneController.createMilestone);

// Update milestone
router.put('/milestones/:id', projectMilestoneController.updateMilestone);

// Delete milestone
router.delete('/milestones/:id', projectMilestoneController.deleteMilestone);

// Mark milestone as completed
router.put('/milestones/:id/complete', projectMilestoneController.completeMilestone);

// Get milestone deliverables
router.get('/milestones/:id/deliverables', projectMilestoneController.getMilestoneDeliverables);

// Add milestone deliverable
router.post('/milestones/:id/deliverables', projectMilestoneController.addMilestoneDeliverable);

// Update milestone deliverable
router.put('/deliverables/:id', projectMilestoneController.updateMilestoneDeliverable);

// Submit deliverable for review
router.put('/deliverables/:id/submit', projectMilestoneController.submitDeliverable);

// Approve/reject deliverable
router.put('/deliverables/:id/review', projectMilestoneController.reviewDeliverable);

// Get milestone statistics
router.get('/milestones/:id/stats', projectMilestoneController.getMilestoneStats);

module.exports = router;
