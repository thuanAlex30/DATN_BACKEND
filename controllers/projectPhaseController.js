const projectPhaseService = require('../services/projectPhaseService');
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class ProjectPhaseController {
  // ========== PROJECT PHASE MANAGEMENT ==========
  static getProjectPhases = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectPhaseService.getProjectPhases(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getPhaseById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectPhaseService.getPhaseById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createPhase = ErrorMiddleware.asyncHandler(async (req, res) => {
    const phaseData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.createPhase(phaseData, userId);
    
    // Emit WebSocket event for phase created
    if (result.success && result.data) {
      websocketService.emitToAll('phase_created', {
        phase: result.data,
        creator: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updatePhase = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.updatePhase(id, updateData, userId);
    
    // Emit WebSocket event for phase updated
    if (result.success && result.data) {
      websocketService.emitToAll('phase_updated', {
        phase: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deletePhase = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.deletePhase(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updatePhaseStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.updatePhaseStatus(id, status, userId);
    
    // Emit WebSocket event for phase status updated
    if (result.success && result.data) {
      websocketService.emitToAll('phase_status_updated', {
        phase: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updatePhaseProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (progress < 0 || progress > 100) {
      return ApiResponse.error(res, 'Tiến độ phải từ 0 đến 100', 400);
    }
    
    const result = await projectPhaseService.updatePhaseProgress(id, progress, userId);
    
    // Emit WebSocket event for phase progress updated
    if (result.success && result.data) {
      websocketService.emitToAll('phase_progress_updated', {
        phase: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getPhaseStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectPhaseService.getPhaseStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static reorderPhases = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { phaseIds } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.reorderPhases(projectId, phaseIds, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static duplicatePhase = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPhaseName } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.duplicatePhase(id, newPhaseName, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getPhaseTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectPhaseService.getPhaseTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getPhaseDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectPhaseService.getPhaseDependencies(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updatePhaseDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dependencies } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectPhaseService.updatePhaseDependencies(id, dependencies, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectPhaseController;