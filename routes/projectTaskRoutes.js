const express = require('express');
const router = express.Router();
const projectTaskController = require('../controllers/projectTaskController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT TASK ROUTES ==========

// Get all tasks for a phase
router.get('/phase/:phaseId/tasks', projectTaskController.getPhaseTasks);

// Get task by ID
router.get('/tasks/:id', projectTaskController.getTaskById);

// Create new task
router.post('/tasks', projectTaskController.createTask);

// Update task
router.put('/tasks/:id', projectTaskController.updateTask);

// Delete task
router.delete('/tasks/:id', projectTaskController.deleteTask);

// Update task progress
router.put('/tasks/:id/progress', projectTaskController.updateTaskProgress);

// Get task assignments
router.get('/tasks/:id/assignments', projectTaskController.getTaskAssignments);

// Add task assignment
router.post('/tasks/:id/assignments', projectTaskController.addTaskAssignment);

// Update task assignment
router.put('/assignments/:id', projectTaskController.updateTaskAssignment);

// Remove task assignment
router.delete('/assignments/:id', projectTaskController.removeTaskAssignment);

// Get task dependencies
router.get('/tasks/:id/dependencies', projectTaskController.getTaskDependencies);

// Add task dependency
router.post('/tasks/dependencies', projectTaskController.addTaskDependency);

// Remove task dependency
router.delete('/dependencies/:id', projectTaskController.removeTaskDependency);

// Get task progress logs
router.get('/tasks/:id/progress-logs', projectTaskController.getTaskProgressLogs);

// Add progress log
router.post('/tasks/:id/progress-logs', projectTaskController.addProgressLog);

// Get task statistics
router.get('/tasks/:id/stats', projectTaskController.getTaskStats);

module.exports = router;
