const express = require('express');
const router = express.Router();
const projectTaskController = require('../controllers/projectTaskController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const projectValidation = require('../validations/projectValidation');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== PROJECT TASK ROUTES ==========

// Get all tasks (with optional filters)
router.get('/tasks', projectTaskController.getAllTasks);

// Get tasks by project ID
router.get('/tasks/project', projectTaskController.getProjectTasks);

// Get tasks assigned to a specific user in a project
router.get('/project/:projectId/tasks/assigned/:userId', 
  ValidationMiddleware.validateParams(projectValidation.projectUserParams),
  projectTaskController.getTasksByUser);

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


module.exports = router;
