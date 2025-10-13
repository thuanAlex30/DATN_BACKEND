const qualityCheckpointService = require('../services/qualityCheckpointService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const QualityEvents = require('../events/qualityEvents');

class QualityCheckpointController {
  static getTaskCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const result = await qualityCheckpointService.getTaskCheckpoints(taskId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getCheckpointById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await qualityCheckpointService.getCheckpointById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createCheckpoint = ErrorMiddleware.asyncHandler(async (req, res) => {
    const checkpointData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await qualityCheckpointService.createCheckpoint(checkpointData, userId);
    
    if (result.success) {
      // Emit quality checkpoint created event
      try {
        const metadata = {
          userId: req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await QualityEvents.emitQualityCheckpointCreated(result.data, metadata);
      } catch (error) {
        console.error('❌ Error emitting quality checkpoint created event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateCheckpoint = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    // Get old checkpoint data for comparison
    const oldCheckpointResult = await qualityCheckpointService.getCheckpointById(id);
    const result = await qualityCheckpointService.updateCheckpoint(id, updateData, userId);
    
    if (result.success) {
      // Emit quality checkpoint updated event
      try {
        const metadata = {
          userId: req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        if (oldCheckpointResult.success) {
          await QualityEvents.emitQualityCheckpointUpdated(result.data, oldCheckpointResult.data, metadata);
        }
      } catch (error) {
        console.error('❌ Error emitting quality checkpoint updated event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteCheckpoint = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    // Get checkpoint data before deletion
    const oldCheckpointResult = await qualityCheckpointService.getCheckpointById(id);
    const result = await qualityCheckpointService.deleteCheckpoint(id, userId);
    
    if (result.success) {
      // Emit quality checkpoint deleted event
      try {
        const metadata = {
          userId: req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        if (oldCheckpointResult.success) {
          await QualityEvents.emitQualityCheckpointDeleted(oldCheckpointResult.data, metadata);
        }
      } catch (error) {
        console.error('❌ Error emitting quality checkpoint deleted event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      task_id: req.query.task_id,
      status: req.query.status,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await qualityCheckpointService.getAllCheckpoints(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getCheckpointStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const result = await qualityCheckpointService.getCheckpointStats(taskId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      task_id: req.query.task_id,
      status: req.query.status,
      is_active: req.query.is_active
    };
    
    const result = await qualityCheckpointService.searchCheckpoints(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getCheckpointOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const result = await qualityCheckpointService.getCheckpointOptions(taskId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { checkpoints } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await qualityCheckpointService.bulkCreateCheckpoints(checkpoints, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await qualityCheckpointService.bulkUpdateCheckpoints(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteCheckpoints = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await qualityCheckpointService.bulkDeleteCheckpoints(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateCheckpointStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await qualityCheckpointService.updateCheckpointStatus(id, status, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static completeCheckpoint = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { completion_notes } = req.body;
    const userId = req.user._id || req.user.id;
    
    // Get checkpoint data before completion
    const oldCheckpointResult = await qualityCheckpointService.getCheckpointById(id);
    const result = await qualityCheckpointService.completeCheckpoint(id, completion_notes, userId);
    
    if (result.success) {
      // Emit quality checkpoint completed event
      try {
        const metadata = {
          userId: req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        if (oldCheckpointResult.success) {
          await QualityEvents.emitQualityCheckpointCompleted(oldCheckpointResult.data, { completion_notes }, metadata);
        }
      } catch (error) {
        console.error('❌ Error emitting quality checkpoint completed event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getCheckpointTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const result = await qualityCheckpointService.getCheckpointTimeline(taskId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getCheckpointDashboard = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const result = await qualityCheckpointService.getCheckpointDashboard(taskId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = QualityCheckpointController;