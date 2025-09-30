const siteAreaService = require('../services/siteAreaService');
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class SiteAreaController {
  // ========== SITE AREA MANAGEMENT ==========
  static getSiteAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { siteId } = req.params;
      const result = await siteAreaService.getSiteAreas(siteId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAreaById = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const result = await siteAreaService.getAreaById(id);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createArea = ErrorMiddleware.asyncHandler(async (req, res) => {
      const areaData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.createArea(areaData, userId);
      
      // Emit WebSocket event for area created
      if (result.success && result.data) {
        websocketService.emitToAll('area_created', {
          area: result.data,
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

  static updateArea = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.updateArea(id, updateData, userId);
      
      // Emit WebSocket event for area updated
      if (result.success && result.data) {
        websocketService.emitToAll('area_updated', {
          area: result.data,
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

  static deleteArea = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.deleteArea(id, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      site_id: req.query.site_id,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await siteAreaService.getAllAreas(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAreaStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await siteAreaService.getAreaStats(siteId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      site_id: req.query.site_id,
      is_active: req.query.is_active
    };
    
    const result = await siteAreaService.searchAreas(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAreaOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await siteAreaService.getAreaOptions(siteId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areas } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await siteAreaService.bulkCreateAreas(areas, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await siteAreaService.bulkUpdateAreas(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteAreas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await siteAreaService.bulkDeleteAreas(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAreaHierarchy = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await siteAreaService.getAreaHierarchy(siteId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAreaMap = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await siteAreaService.getAreaMap(siteId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== AREA ACCESS CONTROLS ==========
  static getAreaAccessControls = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const result = await siteAreaService.getAreaAccessControls(id);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addAreaAccessControl = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
    const accessControlData = req.body;
      const userId = req.user._id || req.user.id;
      
    const result = await siteAreaService.addAreaAccessControl(id, accessControlData, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateAreaAccessControl = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.updateAreaAccessControl(id, updateData, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeAreaAccessControl = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.removeAreaAccessControl(id, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== AREA SAFETY CHECKLISTS ==========
  static getAreaSafetyChecklists = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const result = await siteAreaService.getAreaSafetyChecklists(id);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static createAreaSafetyChecklist = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
    const checklistData = req.body;
      const userId = req.user._id || req.user.id;
      
    const result = await siteAreaService.createAreaSafetyChecklist(id, checklistData, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== AREA INSPECTIONS ==========
  static getAreaInspections = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const result = await siteAreaService.getAreaInspections(id);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static createAreaInspection = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
    const inspectionData = req.body;
      const userId = req.user._id || req.user.id;
      
    const result = await siteAreaService.createAreaInspection(id, inspectionData, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateAreaInspection = ErrorMiddleware.asyncHandler(async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await siteAreaService.updateAreaInspection(id, updateData, userId);
      
      if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = SiteAreaController;