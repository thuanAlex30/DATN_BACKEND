const express = require('express');
const router = express.Router();
const projectMilestoneController = require('../controllers/projectMilestoneController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const projectValidation = require('../validations/projectValidation');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT MILESTONE ROUTES ==========

// Get all milestones (for admin/manager overview)
router.get('/milestones', projectMilestoneController.getAllMilestones);

// Get all milestones for a project
router.get('/project/:projectId/milestones', projectMilestoneController.getProjectMilestones);

// Get milestones assigned to a specific user in a project
router.get('/project/:projectId/milestones/assigned/:userId', 
  ValidationMiddleware.validateParams(projectValidation.projectUserParams),
  projectMilestoneController.getMilestonesByUser);

// Get milestone by ID
router.get('/milestones/:id', projectMilestoneController.getMilestoneById);

// Create new milestone
router.post('/milestones', projectMilestoneController.createMilestone);

// Update milestone status (must be before /milestones/:id to avoid route conflict)
router.put('/milestones/:id/status', projectMilestoneController.updateMilestoneStatus);

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

// Update milestone progress
router.put('/milestones/:id/progress', projectMilestoneController.updateMilestoneProgress);

// Get milestone progress logs
router.get('/milestones/:id/progress-logs', projectMilestoneController.getMilestoneProgressLogs);

// Add milestone progress log
router.post('/milestones/:id/progress-logs', projectMilestoneController.addMilestoneProgressLog);

module.exports = router;
