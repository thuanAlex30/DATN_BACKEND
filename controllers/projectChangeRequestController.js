const projectChangeRequestService = require('../services/projectChangeRequestService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const ProjectChangeRequestEvents = require('../events/projectChangeRequestEvents');

class ProjectChangeRequestController {
  static getProjectChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectChangeRequestService.getProjectChangeRequests(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getChangeRequestById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectChangeRequestService.getChangeRequestById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createChangeRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const changeData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.createChangeRequest(changeData, userId);
    
    // Emit project change request created event
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await ProjectChangeRequestEvents.emitProjectChangeRequestCreated(result.data, metadata);
      } catch (error) {
        console.error('❌ Error emitting project change request created event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateChangeRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.updateChangeRequest(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteChangeRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.deleteChangeRequest(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      project_id: req.query.project_id,
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await projectChangeRequestService.getAllChangeRequests(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getChangeRequestStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectChangeRequestService.getChangeRequestStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      project_id: req.query.project_id,
      status: req.query.status,
      priority: req.query.priority,
      is_active: req.query.is_active
    };
    
    const result = await projectChangeRequestService.searchChangeRequests(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getChangeRequestOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectChangeRequestService.getChangeRequestOptions(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { requests } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.bulkCreateChangeRequests(requests, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.bulkUpdateChangeRequests(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteChangeRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.bulkDeleteChangeRequests(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateChangeRequestStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.updateChangeRequestStatus(id, status, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static approveChangeRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approval_notes } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.approveChangeRequest(id, approval_notes, userId);
    
    // Emit project change request approved event
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        const approvalData = {
          approver_name: req.user?.full_name,
          approver_email: req.user?.email,
          approver_role: req.user?.role,
          approval_notes: approval_notes
        };
        await ProjectChangeRequestEvents.emitProjectChangeRequestApproved(result.data, approvalData, metadata);
      } catch (error) {
        console.error('❌ Error emitting project change request approved event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static rejectChangeRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectChangeRequestService.rejectChangeRequest(id, rejection_reason, userId);
    
    // Emit project change request rejected event
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        const rejectionData = {
          rejector_name: req.user?.full_name,
          rejector_email: req.user?.email,
          rejector_role: req.user?.role,
          rejection_reason: rejection_reason
        };
        await ProjectChangeRequestEvents.emitProjectChangeRequestRejected(result.data, rejectionData, metadata);
      } catch (error) {
        console.error('❌ Error emitting project change request rejected event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getChangeRequestTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectChangeRequestService.getChangeRequestTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getChangeRequestDashboard = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectChangeRequestService.getChangeRequestDashboard(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectChangeRequestController;