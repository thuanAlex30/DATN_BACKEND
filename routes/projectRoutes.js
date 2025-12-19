const express = require('express');
const router = express.Router();
const Joi = require('joi');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const projectValidation = require('../validations/projectValidation');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Apply authorization to all project management routes - allow both admin and manager
// Using new authorizeScope with permission matrix (modules + action)
router.use(authMiddleware.authorizeScope({ 
  modules: 'project',
  action: ['read', 'list'],
  tenantScope: 'tenant',
  departmentScope: 'hierarchy'
}));

// ========== PROJECT MANAGEMENT ROUTES ==========
// GET /api/v1/projects - Get all projects with filters
router.get('/', projectController.getAllProjects);

// GET /api/v1/projects/stats - Get project statistics
router.get('/stats', projectController.getProjectStats);

// GET /api/v1/projects/search - Search projects
router.get('/search', projectController.searchProjects);

// GET /api/v1/projects/user - Get user's projects
router.get('/user', projectController.getUserProjects);

// ========== SITE MANAGEMENT ROUTES ==========
// GET /api/v1/projects/sites - Get all sites
router.get('/sites', projectController.getAllSites);

// GET /api/v1/projects/sites/:id - Get site by ID
router.get('/sites/:id', projectController.getSiteById);

// POST /api/v1/projects/sites - Create new site
router.post('/sites', ValidationMiddleware.validateBody(projectValidation.createSite), projectController.createSite);

// PUT /api/v1/projects/sites/:id - Update site
router.put('/sites/:id', ValidationMiddleware.validate({
  params: Joi.object({
    id: Joi.string().custom((value, helpers) => {
      if (!require('mongoose').Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
  }),
  body: projectValidation.updateSite
}), projectController.updateSite);

// DELETE /api/v1/projects/sites/:id - Delete site
router.delete('/sites/:id', projectController.deleteSite);

// GET /api/v1/projects/available-employees - Get available employees for project assignment
router.get('/available-employees', projectController.getAvailableEmployees);

// GET /api/v1/projects/:id - Get project by ID (must be after specific routes)
router.get('/:id', projectController.getProjectById);

// POST /api/v1/projects - Create new project
router.post('/', ValidationMiddleware.validateBody(projectValidation.createProject), projectController.createProject);

// PUT /api/v1/projects/:id - Update project
router.put('/:id', ValidationMiddleware.validate({
  params: projectValidation.projectId,
  body: projectValidation.updateProject
}), projectController.updateProject);

// DELETE /api/v1/projects/:id - Delete project
router.delete('/:id', ValidationMiddleware.validateParams(projectValidation.projectId), projectController.deleteProject);

// PUT /api/v1/projects/:id/progress - Update project progress
router.put('/:id/progress', ValidationMiddleware.validate({
  params: projectValidation.projectId,
  body: projectValidation.updateProgress
}), projectController.updateProjectProgress);

// ========== PROJECT ASSIGNMENT ROUTES ==========
// GET /api/v1/projects/:projectId/assignments - Get project assignments
router.get('/:projectId/assignments', projectController.getProjectAssignments);

// POST /api/v1/projects/:projectId/assignments - Add project assignment
router.post('/:projectId/assignments', projectController.addProjectAssignment);

// PUT /api/v1/projects/assignments/:id - Update project assignment
router.put('/assignments/:id', projectController.updateProjectAssignment);

// DELETE /api/v1/projects/assignments/:id - Remove project assignment
router.delete('/assignments/:id', projectController.removeProjectAssignment);

// ========== PROJECT TIMELINE ROUTES ==========
// GET /api/v1/projects/:projectId/timeline - Get project timeline
router.get('/:projectId/timeline', projectController.getProjectTimeline);

module.exports = router;
