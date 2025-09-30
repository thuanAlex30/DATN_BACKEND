const projectService = require('../services/projectService');
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class ProjectController {
  // ========== PROJECT MANAGEMENT ==========
  static getAllProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      site_id: req.query.site_id,
      leader_id: req.query.leader_id,
      search: req.query.search
    };

    const result = await projectService.getAllProjects(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getProjectById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectService.getProjectById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const projectData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.createProject(projectData, userId);
    
    // Emit WebSocket event for project created
    if (result.success && result.data) {
      websocketService.emitProjectCreated(result.data, req.user);
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateProject(id, updateData, userId);
    
    // Emit WebSocket event for project updated
    if (result.success && result.data) {
      websocketService.emitToAll('project_updated', {
        project: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.deleteProject(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT STATISTICS ==========
  static getProjectStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await projectService.getProjectStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT ASSIGNMENTS ==========
  static getProjectAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectService.getProjectAssignments(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const assignmentData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.addProjectAssignment(assignmentData, userId);
    
    // Emit WebSocket event for project assignment
    if (result.success && result.data) {
      // Get assignee info for WebSocket notification
      const User = require('../models/user');
      const assignee = await User.findById(assignmentData.user_id);
      
      if (assignee) {
        websocketService.emitProjectAssigned(result.data, assignee, req.user);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateProjectAssignment(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.removeProjectAssignment(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== USER PROJECTS ==========
  static getUserProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await projectService.getUserProjects(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== SITE MANAGEMENT ==========
  static getAllSites = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      is_active: req.query.is_active,
      search: req.query.search
    };

    const result = await projectService.getAllSites(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getSiteById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectService.getSiteById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const siteData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.createSite(siteData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateSite(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.deleteSite(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT PROGRESS ==========
  static updateProjectProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (progress < 0 || progress > 100) {
      return ApiResponse.error(res, 'Tiến độ phải từ 0 đến 100', 400);
    }
    
    const result = await projectService.updateProjectProgress(id, progress, userId);
    
    // Emit WebSocket event for project progress updated
    if (result.success && result.data) {
      websocketService.emitProjectProgressUpdated(result.data, req.user);
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT SEARCH ==========
  static searchProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      status: req.query.status,
      site_id: req.query.site_id
    };

    const result = await projectService.searchProjects(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT TIMELINE ==========
  static getProjectTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectService.getProjectTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static getAvailableEmployees = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await projectService.getAvailableEmployees();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectController;