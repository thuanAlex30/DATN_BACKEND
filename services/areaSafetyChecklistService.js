const areaSafetyChecklistRepository = require('../repository/areaSafetyChecklistRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class AreaSafetyChecklistService {
  // ========== CHECKLIST MANAGEMENT ==========
  async getAreaSafetyChecklists(areaId) {
    try {
      const checklists = await areaSafetyChecklistRepository.getAreaChecklists(areaId);
      return createResponse(200, 'Lấy danh sách checklist an toàn thành công',
        transformDocumentsId(checklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error getting area safety checklists:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách checklist an toàn', null, error.message);
    }
  }

  async getChecklistById(id) {
    try {
      const checklist = await areaSafetyChecklistRepository.getChecklistById(id);

      if (!checklist) {
        return createResponse(404, 'Không tìm thấy checklist an toàn');
      }

      return createResponse(200, 'Lấy thông tin checklist an toàn thành công',
        transformDocumentId(checklist, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error getting checklist:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin checklist an toàn', null, error.message);
    }
  }

  async createChecklist(checklistData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'checklist_name', 'safety_items', 'frequency'];
      for (const field of requiredFields) {
        if (!checklistData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate checklist
      const validation = await areaSafetyChecklistRepository.validateChecklist(checklistData);

      if (!validation.valid) {
        return createResponse(400, validation.message);
      }

      const checklist = await areaSafetyChecklistRepository.createChecklist(checklistData);
      return createResponse(201, 'Tạo checklist an toàn thành công',
        transformDocumentId(checklist, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error creating checklist:', error);
      return createResponse(500, 'Lỗi khi tạo checklist an toàn', null, error.message);
    }
  }

  async updateChecklist(id, updateData, userId) {
    try {
      const checklist = await areaSafetyChecklistRepository.updateChecklist(id, updateData);

      if (!checklist) {
        return createResponse(404, 'Không tìm thấy checklist an toàn');
      }

      return createResponse(200, 'Cập nhật checklist an toàn thành công',
        transformDocumentId(checklist, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error updating checklist:', error);
      return createResponse(500, 'Lỗi khi cập nhật checklist an toàn', null, error.message);
    }
  }

  async deleteChecklist(id, userId) {
    try {
      const checklist = await areaSafetyChecklistRepository.deleteChecklist(id);

      if (!checklist) {
        return createResponse(404, 'Không tìm thấy checklist an toàn');
      }

      return createResponse(200, 'Xóa checklist an toàn thành công');
    } catch (error) {
      console.error('Error deleting checklist:', error);
      return createResponse(500, 'Lỗi khi xóa checklist an toàn', null, error.message);
    }
  }

  // ========== CHECKLIST TEMPLATES ==========
  async getChecklistTemplates() {
    try {
      const templates = await areaSafetyChecklistRepository.getChecklistTemplates();
      return createResponse(200, 'Lấy danh sách mẫu checklist thành công', templates);
    } catch (error) {
      console.error('Error getting checklist templates:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách mẫu checklist', null, error.message);
    }
  }

  async createFromTemplate(areaId, templateType, customizations = {}) {
    try {
      const checklist = await areaSafetyChecklistRepository.createFromTemplate(areaId, templateType, customizations);
      return createResponse(201, 'Tạo checklist từ mẫu thành công',
        transformDocumentId(checklist, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error creating from template:', error);
      return createResponse(500, 'Lỗi khi tạo checklist từ mẫu', null, error.message);
    }
  }

  // ========== CHECKLIST QUERIES ==========
  async getChecklistsByFrequency(frequency) {
    try {
      const checklists = await areaSafetyChecklistRepository.getChecklistsByFrequency(frequency);
      return createResponse(200, `Lấy danh sách checklist ${frequency.toLowerCase()} thành công`,
        transformDocumentsId(checklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error getting checklists by frequency:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách checklist theo tần suất', null, error.message);
    }
  }

  async getActiveChecklists(areaId = null) {
    try {
      const checklists = await areaSafetyChecklistRepository.getActiveChecklists(areaId);
      return createResponse(200, 'Lấy danh sách checklist đang hoạt động thành công',
        transformDocumentsId(checklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error getting active checklists:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách checklist đang hoạt động', null, error.message);
    }
  }

  async searchChecklists(searchTerm, filters = {}) {
    try {
      const checklists = await areaSafetyChecklistRepository.searchChecklists(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm checklist thành công',
        transformDocumentsId(checklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST));
    } catch (error) {
      console.error('Error searching checklists:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm checklist', null, error.message);
    }
  }

  // ========== CHECKLIST ANALYTICS ==========
  async getChecklistAnalytics(areaId) {
    try {
      const analytics = await areaSafetyChecklistRepository.getChecklistAnalytics(areaId);
      return createResponse(200, 'Lấy phân tích checklist thành công', analytics);
    } catch (error) {
      console.error('Error getting checklist analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích checklist', null, error.message);
    }
  }

  async getChecklistStats(filters = {}) {
    try {
      const stats = await areaSafetyChecklistRepository.getChecklistStats(filters);
      return createResponse(200, 'Lấy thống kê checklist thành công', stats);
    } catch (error) {
      console.error('Error getting checklist stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê checklist', null, error.message);
    }
  }

  // ========== SAFETY ITEMS ANALYSIS ==========
  async getSafetyItemsAnalysis(areaId) {
    try {
      const analysis = await areaSafetyChecklistRepository.getSafetyItemsAnalysis(areaId);
      return createResponse(200, 'Lấy phân tích mục an toàn thành công', analysis);
    } catch (error) {
      console.error('Error getting safety items analysis:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích mục an toàn', null, error.message);
    }
  }

  // ========== CHECKLIST COMPARISON ==========
  async compareChecklists(checklistIds) {
    try {
      if (!Array.isArray(checklistIds) || checklistIds.length < 2) {
        return createResponse(400, 'Cần ít nhất 2 checklist để so sánh');
      }

      const comparison = await areaSafetyChecklistRepository.compareChecklists(checklistIds);
      return createResponse(200, 'So sánh checklist thành công', comparison);
    } catch (error) {
      console.error('Error comparing checklists:', error);
      return createResponse(500, 'Lỗi khi so sánh checklist', null, error.message);
    }
  }

  // ========== CHECKLIST EXPORT ==========
  async exportChecklists(areaId, format = 'json') {
    try {
      const data = await areaSafetyChecklistRepository.exportChecklists(areaId, format);
      return createResponse(200, 'Xuất checklist thành công', data);
    } catch (error) {
      console.error('Error exporting checklists:', error);
      return createResponse(500, 'Lỗi khi xuất checklist', null, error.message);
    }
  }

  // ========== CHECKLIST MANAGEMENT ==========
  async createChecklistFromTemplate(areaId, templateType, customizations = {}, userId) {
    try {
      const checklistData = {
        area_id: areaId,
        ...customizations,
        created_by: userId
      };

      return await this.createFromTemplate(areaId, templateType, customizations);
    } catch (error) {
      console.error('Error creating checklist from template:', error);
      return createResponse(500, 'Lỗi khi tạo checklist từ mẫu', null, error.message);
    }
  }

  async duplicateChecklist(checklistId, newAreaId, userId) {
    try {
      const originalChecklist = await areaSafetyChecklistRepository.getChecklistById(checklistId);

      if (!originalChecklist) {
        return createResponse(404, 'Không tìm thấy checklist gốc');
      }

      const duplicateData = {
        area_id: newAreaId,
        checklist_name: `${originalChecklist.checklist_name} (Copy)`,
        safety_items: originalChecklist.safety_items,
        frequency: originalChecklist.frequency,
        description: originalChecklist.description,
        is_active: true,
        created_by: userId
      };

      return await this.createChecklist(duplicateData, userId);
    } catch (error) {
      console.error('Error duplicating checklist:', error);
      return createResponse(500, 'Lỗi khi sao chép checklist', null, error.message);
    }
  }

  async toggleChecklistStatus(id, userId) {
    try {
      const checklist = await areaSafetyChecklistRepository.getChecklistById(id);

      if (!checklist) {
        return createResponse(404, 'Không tìm thấy checklist');
      }

      const updateData = {
        is_active: !checklist.is_active,
        updated_by: userId
      };

      return await this.updateChecklist(id, updateData, userId);
    } catch (error) {
      console.error('Error toggling checklist status:', error);
      return createResponse(500, 'Lỗi khi thay đổi trạng thái checklist', null, error.message);
    }
  }

  // ========== CHECKLIST REPORTS ==========
  async generateChecklistReport(areaId) {
    try {
      const analytics = await areaSafetyChecklistRepository.getChecklistAnalytics(areaId);
      const checklists = await areaSafetyChecklistRepository.getAreaChecklists(areaId);
      const safetyItemsAnalysis = await areaSafetyChecklistRepository.getSafetyItemsAnalysis(areaId);
      
      const report = {
        area_id: areaId,
        generated_at: new Date(),
        analytics: analytics,
        checklists: transformDocumentsId(checklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST),
        safety_items_analysis: safetyItemsAnalysis,
        summary: {
          total_checklists: analytics.total_checklists,
          active_checklists: analytics.active_checklists,
          total_safety_items: analytics.total_safety_items,
          critical_items_count: analytics.critical_items_count
        }
      };

      return createResponse(200, 'Tạo báo cáo checklist thành công', report);
    } catch (error) {
      console.error('Error generating checklist report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo checklist', null, error.message);
    }
  }

  async getChecklistDashboard(areaId = null) {
    try {
      const activeChecklists = await areaSafetyChecklistRepository.getActiveChecklists(areaId);
      const stats = await areaSafetyChecklistRepository.getChecklistStats({ area_id: areaId });
      
      const dashboard = {
        active_checklists: transformDocumentsId(activeChecklists, POPULATED_FIELDS.AREA_SAFETY_CHECKLIST),
        statistics: stats,
        summary: {
          total_checklists: stats.total_checklists,
          checklists_by_frequency: stats.checklists_by_frequency,
          checklists_by_area: stats.checklists_by_area
        }
      };

      return createResponse(200, 'Lấy bảng điều khiển checklist thành công', dashboard);
    } catch (error) {
      console.error('Error getting checklist dashboard:', error);
      return createResponse(500, 'Lỗi khi lấy bảng điều khiển checklist', null, error.message);
    }
  }

  // ========== CHECKLIST VALIDATION ==========
  async validateChecklistData(checklistData) {
    try {
      const validation = await areaSafetyChecklistRepository.validateChecklist(checklistData);
      return createResponse(200, 'Kiểm tra dữ liệu checklist thành công', validation);
    } catch (error) {
      console.error('Error validating checklist data:', error);
      return createResponse(500, 'Lỗi khi kiểm tra dữ liệu checklist', null, error.message);
    }
  }

  async validateSafetyItems(safetyItems) {
    try {
      if (!Array.isArray(safetyItems) || safetyItems.length === 0) {
        return createResponse(400, 'Danh sách mục an toàn phải là mảng không rỗng');
      }

      const errors = [];
      safetyItems.forEach((item, index) => {
        if (!item.item_name || !item.description) {
          errors.push(`Mục ${index + 1}: Tên và mô tả là bắt buộc`);
        }
      });

      if (errors.length > 0) {
        return createResponse(400, 'Dữ liệu mục an toàn không hợp lệ', { errors });
      }

      return createResponse(200, 'Dữ liệu mục an toàn hợp lệ');
    } catch (error) {
      console.error('Error validating safety items:', error);
      return createResponse(500, 'Lỗi khi kiểm tra mục an toàn', null, error.message);
    }
  }
}

module.exports = new AreaSafetyChecklistService();