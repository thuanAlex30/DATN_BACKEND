const incidentService = require('../services/incidentService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class IncidentController {
  // 1. Ghi nhận sự cố
  static reportIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const incidentData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.createIncident(incidentData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 2. Lấy tất cả incidents
  static getIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await incidentService.getAllIncidents();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 3. Lấy incident theo ID
  static getIncidentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await incidentService.getIncidentById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  // 4. Phân loại & thông báo
  static classifyIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { severity } = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.classifyIncident(id, severity, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 5. Phân công xử lý
  static assignIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.assignIncident(id, assignedTo, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 6. Điều tra sự cố
  static investigateIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const investigationData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.investigateIncident(id, investigationData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 7. Cập nhật tiến độ
  static updateIncidentProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const progressData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.updateIncidentProgress(id, progressData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 8. Đóng sự cố
  static closeIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const closeData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.closeIncident(id, closeData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 9. Lấy thống kê incidents
  static getIncidentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await incidentService.getIncidentStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 10. Tìm kiếm incidents
  static searchIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const result = await incidentService.searchIncidents(q);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 11. Lấy incidents theo user
  static getIncidentsByUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await incidentService.getIncidentsByUser(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 12. Lấy incidents theo project
  static getIncidentsByProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await incidentService.getIncidentsByProject(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 13. Lấy incidents theo status
  static getIncidentsByStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.params;
    const result = await incidentService.getIncidentsByStatus(status);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 14. Lấy incidents theo severity
  static getIncidentsBySeverity = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { severity } = req.params;
    const result = await incidentService.getIncidentsBySeverity(severity);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 15. Xóa incident
  static deleteIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const result = await incidentService.deleteIncident(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 16. Cập nhật incident
  static updateIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.updateIncident(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });
}

module.exports = IncidentController;