const projectStatusReportService = require('../services/projectStatusReportService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class ProjectStatusReportController {
  static getProjectStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectStatusReportService.getProjectStatusReports(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getStatusReportById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectStatusReportService.getStatusReportById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createStatusReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const reportData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.createStatusReport(reportData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateStatusReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.updateStatusReport(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteStatusReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.deleteStatusReport(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getAllStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      project_id: req.query.project_id,
      status: req.query.status,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const result = await projectStatusReportService.getAllStatusReports(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getStatusReportStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectStatusReportService.getStatusReportStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      project_id: req.query.project_id,
      status: req.query.status,
      is_active: req.query.is_active
    };
    
    const result = await projectStatusReportService.searchStatusReports(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getStatusReportOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectStatusReportService.getStatusReportOptions(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkCreateStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { reports } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.bulkCreateStatusReports(reports, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkUpdateStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.bulkUpdateStatusReports(updates, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static bulkDeleteStatusReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectStatusReportService.bulkDeleteStatusReports(ids, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getStatusReportTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectStatusReportService.getStatusReportTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getStatusReportDashboard = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectStatusReportService.getStatusReportDashboard(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectStatusReportController;