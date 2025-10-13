const projectMilestoneService = require('../services/projectMilestoneService');
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const ProjectMilestoneEvents = require('../events/projectMilestoneEvents');

class ProjectMilestoneController {
  // ========== PROJECT MILESTONE MANAGEMENT ==========
  static getProjectMilestones = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectMilestoneService.getProjectMilestones(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getMilestonesByUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await projectMilestoneService.getMilestonesByUser(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getMilestoneById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectMilestoneService.getMilestoneById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createMilestone = ErrorMiddleware.asyncHandler(async (req, res) => {
    const milestoneData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.createMilestone(milestoneData, userId);
    
    // Emit WebSocket event for milestone created
    if (result.success && result.data) {
      websocketService.emitToAll('milestone_created', {
        milestone: result.data,
        creator: req.user,
        timestamp: new Date()
      });
    }
    
    // Emit Kafka event for milestone created
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await ProjectMilestoneEvents.emitProjectMilestoneCreated(result.data, metadata);
      } catch (error) {
        console.error('❌ Error emitting project milestone created event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateMilestone = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.updateMilestone(id, updateData, userId);
    
    // Emit WebSocket event for milestone updated
    if (result.success && result.data) {
      websocketService.emitToAll('milestone_updated', {
        milestone: result.data,
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

  static deleteMilestone = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.deleteMilestone(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateMilestoneStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.updateMilestoneStatus(id, status, userId);
    
    // Emit WebSocket event for milestone status updated
    if (result.success && result.data) {
      websocketService.emitToAll('milestone_status_updated', {
        milestone: result.data,
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

  static getMilestoneStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectMilestoneService.getMilestoneStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static reorderMilestones = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { milestoneIds } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.reorderMilestones(projectId, milestoneIds, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static duplicateMilestone = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newMilestoneName } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.duplicateMilestone(id, newMilestoneName, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getMilestoneTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectMilestoneService.getMilestoneTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getUpcomingMilestones = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { days = 30 } = req.query;
    
    const result = await projectMilestoneService.getUpcomingMilestones(projectId, parseInt(days));
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getOverdueMilestones = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectMilestoneService.getOverdueMilestones(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static markMilestoneComplete = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { completion_notes } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.markMilestoneComplete(id, completion_notes, userId);
    
    // Emit WebSocket event for milestone completed
    if (result.success && result.data) {
      websocketService.emitToAll('milestone_completed', {
        milestone: result.data,
        completer: req.user,
        timestamp: new Date()
      });
    }
    
    // Emit Kafka event for milestone completed
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        const completionData = {
          completer_name: req.user?.full_name,
          completer_email: req.user?.email,
          completer_role: req.user?.role,
          completion_notes: completion_notes
        };
        await ProjectMilestoneEvents.emitProjectMilestoneCompleted(result.data, completionData, metadata);
      } catch (error) {
        console.error('❌ Error emitting project milestone completed event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getMilestoneDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectMilestoneService.getMilestoneDependencies(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateMilestoneDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dependencies } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.updateMilestoneDependencies(id, dependencies, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== MILESTONE COMPLETION ==========
  static completeMilestone = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { completion_note } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.completeMilestone(id, completion_note, userId);
    
    // Emit WebSocket event for milestone completed
    if (result.success && result.data) {
      websocketService.emitToAll('milestone_completed', {
        milestone: result.data,
        completer: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== MILESTONE DELIVERABLES ==========
  static getMilestoneDeliverables = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectMilestoneService.getMilestoneDeliverables(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addMilestoneDeliverable = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deliverableData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.addMilestoneDeliverable(id, deliverableData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateMilestoneDeliverable = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.updateMilestoneDeliverable(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static submitDeliverable = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { submission_note } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.submitDeliverable(id, submission_note, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static reviewDeliverable = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { review_status, review_note } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectMilestoneService.reviewDeliverable(id, review_status, review_note, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectMilestoneController;