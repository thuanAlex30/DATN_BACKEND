const workLocationService = require('../services/workLocationService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class WorkLocationController {
  static getAreaLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    const result = await workLocationService.getAreaLocations(areaId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getLocationById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await workLocationService.getLocationById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createLocation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const locationData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.createLocation(locationData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateLocation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.updateLocation(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteLocation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.deleteLocation(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      area_id: req.query.area_id,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await workLocationService.getAllLocations(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getLocationStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    const result = await workLocationService.getLocationStats(areaId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      area_id: req.query.area_id,
      is_active: req.query.is_active
    };
    
    const result = await workLocationService.searchLocations(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getLocationOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    const result = await workLocationService.getLocationOptions(areaId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { locations } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.bulkCreateLocations(locations, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.bulkUpdateLocations(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteLocations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.bulkDeleteLocations(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getLocationHierarchy = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    const result = await workLocationService.getLocationHierarchy(areaId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getLocationMap = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    const result = await workLocationService.getLocationMap(areaId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== LOCATION ASSIGNMENTS ==========
  static getLocationAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await workLocationService.getLocationAssignments(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addLocationAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const assignmentData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.addLocationAssignment(id, assignmentData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateLocationAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.updateLocationAssignment(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeLocationAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await workLocationService.removeLocationAssignment(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== LOCATION AVAILABILITY ==========
  static getLocationAvailability = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const result = await workLocationService.getLocationAvailability(id, startDate, endDate);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = WorkLocationController;