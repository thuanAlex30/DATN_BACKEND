const projectResourceService = require('../services/projectResourceService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const ProjectResourceEvents = require('../events/projectResourceEvents');

class ProjectResourceController {
  static getProjectResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectResourceService.getProjectResources(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getResourceById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectResourceService.getResourceById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createResource = ErrorMiddleware.asyncHandler(async (req, res) => {
    const resourceData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.createResource(resourceData, userId);
    
    // Emit project resource created event (non-blocking with timeout)
    if (result.success && result.data) {
      // Don't await - fire and forget to avoid blocking the request
      setImmediate(async () => {
        try {
          const metadata = {
            userId: req.user?._id || req.user?.id,
            userRole: req.user?.role,
            userFullName: req.user?.full_name,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          };
          // Add timeout to prevent hanging
          await Promise.race([
            ProjectResourceEvents.emitProjectResourceCreated(result.data, metadata),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 3000)
            )
          ]).catch(error => {
            console.warn('⚠️ Event emission failed (non-critical):', error.message);
          });
        } catch (error) {
          console.error('❌ Error emitting project resource created event:', error);
          // Don't fail the request if event emission fails
        }
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateResource = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.updateResource(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteResource = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.deleteResource(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      project_id: req.query.project_id,
      resource_type: req.query.resource_type,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await projectResourceService.getAllResources(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getResourceStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectResourceService.getResourceStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      project_id: req.query.project_id,
      resource_type: req.query.resource_type,
      is_active: req.query.is_active
    };
    
    const result = await projectResourceService.searchResources(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getResourceOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectResourceService.getResourceOptions(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { resources } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.bulkCreateResources(resources, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.bulkUpdateResources(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteResources = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.bulkDeleteResources(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getResourceAllocation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectResourceService.getResourceAllocation(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateResourceAllocation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { allocation } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectResourceService.updateResourceAllocation(id, allocation, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectResourceController;