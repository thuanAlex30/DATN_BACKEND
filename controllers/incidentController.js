const IncidentService = require('../services/incidentService');
const { ApiResponse } = require('../utils/response');

class IncidentController {
  // 1. Ghi nhận sự cố
  async reportIncident(req, res) {
    try {
      const result = await IncidentService.createIncident(req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message, 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 2. Phân loại & thông báo
  async classifyIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.classifyIncident(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 3. Phân công người phụ trách
  async assignIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.assignIncident(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 4. Điều tra & xử lý
  async investigateIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.investigateIncident(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 5. Cập nhật tiến độ
  async updateIncidentProgress(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.updateProgress(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 6. Đóng sự cố & xuất báo cáo
  async closeIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.closeIncident(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 7. Lấy danh sách sự cố
  async getIncidents(req, res) {
    try {
      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        assignedTo: req.query.assignedTo,
        createdBy: req.query.createdBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await IncidentService.getIncidents(filters, options);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 8. Lấy chi tiết sự cố
  async getIncidentById(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.getIncidentById(id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 9. Tìm kiếm sự cố
  async searchIncidents(req, res) {
    try {
      const { q } = req.query;
      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        assignedTo: req.query.assignedTo,
        createdBy: req.query.createdBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await IncidentService.searchIncidents(q, filters, options);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 10. Lấy thống kê sự cố
  async getIncidentStatistics(req, res) {
    try {
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await IncidentService.getIncidentStatistics(filters);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 11. Xuất báo cáo sự cố
  async exportIncidents(req, res) {
    try {
      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        assignedTo: req.query.assignedTo,
        createdBy: req.query.createdBy,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const format = req.query.format || 'excel';
      const result = await IncidentService.exportIncidents(filters, format);
      
      const filename = `incidents_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      return ApiResponse.success(res, result, `Xuất báo cáo thành công: ${filename}`);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 12. Cập nhật sự cố
  async updateIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.updateIncident(id, req.body, req.user._id);
      return ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // 13. Xóa sự cố
  async deleteIncident(req, res) {
    try {
      const { id } = req.params;
      const result = await IncidentService.deleteIncident(id, req.user._id);
      return ApiResponse.success(res, result.data, 'Xóa sự cố thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new IncidentController();