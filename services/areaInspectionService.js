const areaInspectionRepository = require('../repository/areaInspectionRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class AreaInspectionService {
  // ========== INSPECTION MANAGEMENT ==========
  async getAllInspections(filters = {}) {
    try {
      const inspections = await areaInspectionRepository.getAllInspections(filters);
      return createResponse(200, 'Lấy danh sách kiểm tra thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting inspections:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách kiểm tra', null, error.message);
    }
  }

  async getInspectionById(id) {
    try {
      const inspection = await areaInspectionRepository.getInspectionById(id);

      if (!inspection) {
        return createResponse(404, 'Không tìm thấy kiểm tra');
      }

      return createResponse(200, 'Lấy thông tin kiểm tra thành công',
        transformDocumentId(inspection, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting inspection:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin kiểm tra', null, error.message);
    }
  }

  async createInspection(inspectionData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'checklist_id', 'inspector_id', 'inspection_type', 'inspection_date'];
      for (const field of requiredFields) {
        if (!inspectionData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate inspection
      const validation = await areaInspectionRepository.validateInspection(inspectionData);

      if (!validation.valid) {
        return createResponse(400, validation.message);
      }

      const inspection = await areaInspectionRepository.createInspection(inspectionData);
      return createResponse(201, 'Tạo kiểm tra thành công',
        transformDocumentId(inspection, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error creating inspection:', error);
      return createResponse(500, 'Lỗi khi tạo kiểm tra', null, error.message);
    }
  }

  async updateInspection(id, updateData, userId) {
    try {
      const inspection = await areaInspectionRepository.updateInspection(id, updateData);

      if (!inspection) {
        return createResponse(404, 'Không tìm thấy kiểm tra');
      }

      return createResponse(200, 'Cập nhật kiểm tra thành công',
        transformDocumentId(inspection, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error updating inspection:', error);
      return createResponse(500, 'Lỗi khi cập nhật kiểm tra', null, error.message);
    }
  }

  async deleteInspection(id, userId) {
    try {
      const inspection = await areaInspectionRepository.deleteInspection(id);

      if (!inspection) {
        return createResponse(404, 'Không tìm thấy kiểm tra');
      }

      return createResponse(200, 'Xóa kiểm tra thành công');
    } catch (error) {
      console.error('Error deleting inspection:', error);
      return createResponse(500, 'Lỗi khi xóa kiểm tra', null, error.message);
    }
  }

  // ========== INSPECTION SCHEDULING ==========
  async getScheduledInspections(areaId, startDate, endDate) {
    try {
      const inspections = await areaInspectionRepository.getScheduledInspections(areaId, startDate, endDate);
      return createResponse(200, 'Lấy lịch kiểm tra thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting scheduled inspections:', error);
      return createResponse(500, 'Lỗi khi lấy lịch kiểm tra', null, error.message);
    }
  }

  async getInspectionsByInspector(inspectorId, filters = {}) {
    try {
      const inspections = await areaInspectionRepository.getInspectionsByInspector(inspectorId, filters);
      return createResponse(200, 'Lấy kiểm tra theo thanh tra viên thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting inspections by inspector:', error);
      return createResponse(500, 'Lỗi khi lấy kiểm tra theo thanh tra viên', null, error.message);
    }
  }

  async getInspectionsByArea(areaId, filters = {}) {
    try {
      const inspections = await areaInspectionRepository.getInspectionsByArea(areaId, filters);
      return createResponse(200, 'Lấy kiểm tra theo khu vực thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting inspections by area:', error);
      return createResponse(500, 'Lỗi khi lấy kiểm tra theo khu vực', null, error.message);
    }
  }

  // ========== INSPECTION VALIDATION ==========
  async validateInspection(inspectionData) {
    try {
      const validation = await areaInspectionRepository.validateInspection(inspectionData);
      return createResponse(200, 'Kiểm tra hợp lệ thành công', validation);
    } catch (error) {
      console.error('Error validating inspection:', error);
      return createResponse(500, 'Lỗi khi kiểm tra hợp lệ', null, error.message);
    }
  }

  // ========== INSPECTION ANALYTICS ==========
  async getInspectionAnalytics(areaId) {
    try {
      const analytics = await areaInspectionRepository.getInspectionAnalytics(areaId);
      return createResponse(200, 'Lấy phân tích kiểm tra thành công', analytics);
    } catch (error) {
      console.error('Error getting inspection analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích kiểm tra', null, error.message);
    }
  }

  async getInspectorAnalytics(inspectorId) {
    try {
      const analytics = await areaInspectionRepository.getInspectorAnalytics(inspectorId);
      return createResponse(200, 'Lấy phân tích thanh tra viên thành công', analytics);
    } catch (error) {
      console.error('Error getting inspector analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích thanh tra viên', null, error.message);
    }
  }

  // ========== INSPECTION STATISTICS ==========
  async getInspectionStats(filters = {}) {
    try {
      const stats = await areaInspectionRepository.getInspectionStats(filters);
      return createResponse(200, 'Lấy thống kê kiểm tra thành công', stats);
    } catch (error) {
      console.error('Error getting inspection stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê kiểm tra', null, error.message);
    }
  }

  // ========== SAFETY SCORE ANALYSIS ==========
  async getSafetyScoreTrend(areaId, days = 30) {
    try {
      const trend = await areaInspectionRepository.getSafetyScoreTrend(areaId, days);
      return createResponse(200, 'Lấy xu hướng điểm an toàn thành công', trend);
    } catch (error) {
      console.error('Error getting safety score trend:', error);
      return createResponse(500, 'Lỗi khi lấy xu hướng điểm an toàn', null, error.message);
    }
  }

  async getSafetyScoreDistribution(filters = {}) {
    try {
      const distribution = await areaInspectionRepository.getSafetyScoreDistribution(filters);
      return createResponse(200, 'Lấy phân bố điểm an toàn thành công', distribution);
    } catch (error) {
      console.error('Error getting safety score distribution:', error);
      return createResponse(500, 'Lỗi khi lấy phân bố điểm an toàn', null, error.message);
    }
  }

  // ========== INSPECTION QUERIES ==========
  async getUpcomingInspections(days = 7) {
    try {
      const inspections = await areaInspectionRepository.getUpcomingInspections(days);
      return createResponse(200, 'Lấy kiểm tra sắp tới thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting upcoming inspections:', error);
      return createResponse(500, 'Lỗi khi lấy kiểm tra sắp tới', null, error.message);
    }
  }

  async getOverdueInspections() {
    try {
      const inspections = await areaInspectionRepository.getOverdueInspections();
      return createResponse(200, 'Lấy kiểm tra quá hạn thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting overdue inspections:', error);
      return createResponse(500, 'Lỗi khi lấy kiểm tra quá hạn', null, error.message);
    }
  }

  async getInspectionsByScoreRange(minScore, maxScore) {
    try {
      const inspections = await areaInspectionRepository.getInspectionsByScoreRange(minScore, maxScore);
      return createResponse(200, 'Lấy kiểm tra theo khoảng điểm thành công',
        transformDocumentsId(inspections, POPULATED_FIELDS.AREA_INSPECTION));
    } catch (error) {
      console.error('Error getting inspections by score range:', error);
      return createResponse(500, 'Lỗi khi lấy kiểm tra theo khoảng điểm', null, error.message);
    }
  }

  // ========== INSPECTION MANAGEMENT ==========
  async scheduleInspection(areaId, checklistId, inspectorId, inspectionDate, inspectionType, userId) {
    try {
      const inspectionData = {
        area_id: areaId,
        checklist_id: checklistId,
        inspector_id: inspectorId,
        inspection_date: inspectionDate,
        inspection_type: inspectionType,
        status: 'SCHEDULED',
        created_by: userId
      };

      return await this.createInspection(inspectionData, userId);
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      return createResponse(500, 'Lỗi khi lên lịch kiểm tra', null, error.message);
    }
  }

  async startInspection(id, userId) {
    try {
      const updateData = {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        started_by: userId
      };

      return await this.updateInspection(id, updateData, userId);
    } catch (error) {
      console.error('Error starting inspection:', error);
      return createResponse(500, 'Lỗi khi bắt đầu kiểm tra', null, error.message);
    }
  }

  async completeInspection(id, results, safetyScore, userId) {
    try {
      const updateData = {
        status: 'COMPLETED',
        completed_at: new Date(),
        completed_by: userId,
        inspection_results: results,
        safety_score: safetyScore
      };

      return await this.updateInspection(id, updateData, userId);
    } catch (error) {
      console.error('Error completing inspection:', error);
      return createResponse(500, 'Lỗi khi hoàn thành kiểm tra', null, error.message);
    }
  }

  async cancelInspection(id, reason, userId) {
    try {
      const updateData = {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: userId,
        cancellation_reason: reason
      };

      return await this.updateInspection(id, updateData, userId);
    } catch (error) {
      console.error('Error cancelling inspection:', error);
      return createResponse(500, 'Lỗi khi hủy kiểm tra', null, error.message);
    }
  }

  // ========== INSPECTION REPORTS ==========
  async generateInspectionReport(areaId, filters = {}) {
    try {
      const analytics = await areaInspectionRepository.getInspectionAnalytics(areaId);
      const inspections = await areaInspectionRepository.getInspectionsByArea(areaId, filters);
      
      const report = {
        area_id: areaId,
        generated_at: new Date(),
        analytics: analytics,
        recent_inspections: transformDocumentsId(inspections.slice(0, 10), POPULATED_FIELDS.AREA_INSPECTION),
        summary: {
          total_inspections: analytics.total_inspections,
          completed_inspections: analytics.completed_inspections,
          average_safety_score: analytics.average_safety_score,
          safety_score_distribution: analytics.safety_score_distribution
        }
      };

      return createResponse(200, 'Tạo báo cáo kiểm tra thành công', report);
    } catch (error) {
      console.error('Error generating inspection report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo kiểm tra', null, error.message);
    }
  }

  async getInspectionDashboard(filters = {}) {
    try {
      const upcomingInspections = await areaInspectionRepository.getUpcomingInspections(7);
      const overdueInspections = await areaInspectionRepository.getOverdueInspections();
      const stats = await areaInspectionRepository.getInspectionStats(filters);
      
      const dashboard = {
        upcoming_inspections: transformDocumentsId(upcomingInspections, POPULATED_FIELDS.AREA_INSPECTION),
        overdue_inspections: transformDocumentsId(overdueInspections, POPULATED_FIELDS.AREA_INSPECTION),
        statistics: stats,
        alerts: {
          overdue_count: overdueInspections.length,
          upcoming_count: upcomingInspections.length
        }
      };

      return createResponse(200, 'Lấy bảng điều khiển kiểm tra thành công', dashboard);
    } catch (error) {
      console.error('Error getting inspection dashboard:', error);
      return createResponse(500, 'Lỗi khi lấy bảng điều khiển kiểm tra', null, error.message);
    }
  }
}

module.exports = new AreaInspectionService();