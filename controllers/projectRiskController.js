const projectRiskService = require('../services/projectRiskService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const ProjectRiskEvents = require('../events/projectRiskEvents');

class ProjectRiskController {
  static getProjectRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectRiskService.getProjectRisks(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getRiskById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectRiskService.getRiskById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createRisk = ErrorMiddleware.asyncHandler(async (req, res) => {
    const riskData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.createRisk(riskData, userId);
    
    // Emit project risk created event
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await ProjectRiskEvents.emitProjectRiskCreated(result.data, metadata);
      } catch (error) {
        console.error('❌ Error emitting project risk created event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateRisk = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    // Get old risk data for comparison
    const oldRiskResult = await projectRiskService.getRiskById(id);
    const result = await projectRiskService.updateRisk(id, updateData, userId);
    
    // Emit project risk updated event
    if (result.success && result.data) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        if (oldRiskResult.success) {
          await ProjectRiskEvents.emitProjectRiskUpdated(result.data, oldRiskResult.data, metadata);
        }
      } catch (error) {
        console.error('❌ Error emitting project risk updated event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteRisk = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    // Get risk data before deletion
    const oldRiskResult = await projectRiskService.getRiskById(id);
    const result = await projectRiskService.deleteRisk(id, userId);
    
    // Emit project risk deleted event
    if (result.success && oldRiskResult.success) {
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await ProjectRiskEvents.emitProjectRiskDeleted(oldRiskResult.data, metadata);
      } catch (error) {
        console.error('❌ Error emitting project risk deleted event:', error);
        // Don't fail the request if event emission fails
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      project_id: req.query.project_id,
      risk_level: req.query.risk_level,
      status: req.query.status,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await projectRiskService.getAllRisks(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getRiskStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectRiskService.getRiskStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      project_id: req.query.project_id,
      risk_level: req.query.risk_level,
      status: req.query.status,
      is_active: req.query.is_active
    };
    
    const result = await projectRiskService.searchRisks(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getRiskOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectRiskService.getRiskOptions(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { risks } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.bulkCreateRisks(risks, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.bulkUpdateRisks(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.bulkDeleteRisks(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateRiskStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.updateRiskStatus(id, status, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getRiskMitigation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectRiskService.getRiskMitigation(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateRiskMitigation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { mitigation } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectRiskService.updateRiskMitigation(id, mitigation, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAssignedRisks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await projectRiskService.getAssignedRisks(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectRiskController;