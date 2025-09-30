const projectPhaseRepository = require('../repository/projectPhaseRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectPhaseService {
  // ========== PROJECT PHASE MANAGEMENT ==========
  async getProjectPhases(projectId) {
    try {
      const phases = await projectPhaseRepository.getProjectPhases(projectId);
      return createResponse(200, 'Lấy danh sách giai đoạn dự án thành công',
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error getting project phases:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách giai đoạn dự án', null, error.message);
    }
  }

  async getPhaseById(id) {
    try {
      const phase = await projectPhaseRepository.getPhaseById(id);

      if (!phase) {
        return createResponse(404, 'Không tìm thấy giai đoạn dự án');
      }

      return createResponse(200, 'Lấy thông tin giai đoạn dự án thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error getting phase:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin giai đoạn dự án', null, error.message);
    }
  }

  async createPhase(phaseData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['project_id', 'phase_name', 'phase_order'];
      for (const field of requiredFields) {
        if (!phaseData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate phase
      const validation = await projectPhaseRepository.validatePhase(phaseData);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      const phase = await projectPhaseRepository.createPhase({
        ...phaseData,
        created_by: userId
      });

      return createResponse(201, 'Tạo giai đoạn dự án thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error creating phase:', error);
      return createResponse(500, 'Lỗi khi tạo giai đoạn dự án', null, error.message);
    }
  }

  async updatePhase(id, updateData, userId) {
    try {
      const phase = await projectPhaseRepository.updatePhase(id, {
        ...updateData,
        updated_by: userId
      });

      if (!phase) {
        return createResponse(404, 'Không tìm thấy giai đoạn dự án');
      }

      return createResponse(200, 'Cập nhật giai đoạn dự án thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error updating phase:', error);
      return createResponse(500, 'Lỗi khi cập nhật giai đoạn dự án', null, error.message);
    }
  }

  async deletePhase(id, userId) {
    try {
      const phase = await projectPhaseRepository.deletePhase(id);

      if (!phase) {
        return createResponse(404, 'Không tìm thấy giai đoạn dự án');
      }

      return createResponse(200, 'Xóa giai đoạn dự án thành công');
    } catch (error) {
      console.error('Error deleting phase:', error);
      return createResponse(500, 'Lỗi khi xóa giai đoạn dự án', null, error.message);
    }
  }

  // ========== PHASE QUERIES ==========
  async getAllPhases(filters = {}) {
    try {
      const phases = await projectPhaseRepository.getAllPhases(filters);
      return createResponse(200, 'Lấy danh sách giai đoạn thành công',
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error getting phases:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách giai đoạn', null, error.message);
    }
  }

  async getActivePhases(projectId = null) {
    try {
      const phases = await projectPhaseRepository.getActivePhases(projectId);
      return createResponse(200, 'Lấy danh sách giai đoạn đang hoạt động thành công',
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error getting active phases:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách giai đoạn đang hoạt động', null, error.message);
    }
  }

  async getPhasesByStatus(status, projectId = null) {
    try {
      const phases = await projectPhaseRepository.getPhasesByStatus(status, projectId);
      return createResponse(200, `Lấy danh sách giai đoạn ${status.toLowerCase()} thành công`,
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error getting phases by status:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách giai đoạn theo trạng thái', null, error.message);
    }
  }

  // ========== PHASE VALIDATION ==========
  async validatePhase(phaseData) {
    try {
      const validation = await projectPhaseRepository.validatePhase(phaseData);
      return createResponse(200, 'Kiểm tra giai đoạn thành công', validation);
    } catch (error) {
      console.error('Error validating phase:', error);
      return createResponse(500, 'Lỗi khi kiểm tra giai đoạn', null, error.message);
    }
  }

  // ========== PHASE ANALYTICS ==========
  async getPhaseAnalytics(projectId) {
    try {
      const analytics = await projectPhaseRepository.getPhaseAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích giai đoạn thành công', analytics);
    } catch (error) {
      console.error('Error getting phase analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích giai đoạn', null, error.message);
    }
  }

  async getPhaseStats(filters = {}) {
    try {
      const stats = await projectPhaseRepository.getPhaseStats(filters);
      return createResponse(200, 'Lấy thống kê giai đoạn thành công', stats);
    } catch (error) {
      console.error('Error getting phase stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê giai đoạn', null, error.message);
    }
  }

  // ========== PHASE TASKS ==========
  async getPhaseTasks(phaseId) {
    try {
      const tasks = await projectPhaseRepository.getPhaseTasks(phaseId);
      return createResponse(200, 'Lấy danh sách công việc giai đoạn thành công', tasks);
    } catch (error) {
      console.error('Error getting phase tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc giai đoạn', null, error.message);
    }
  }

  async getPhaseTaskStats(phaseId) {
    try {
      const stats = await projectPhaseRepository.getPhaseTaskStats(phaseId);
      return createResponse(200, 'Lấy thống kê công việc giai đoạn thành công', stats);
    } catch (error) {
      console.error('Error getting phase task stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê công việc giai đoạn', null, error.message);
    }
  }

  // ========== PHASE SEARCH ==========
  async searchPhases(searchTerm, filters = {}) {
    try {
      const phases = await projectPhaseRepository.searchPhases(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm giai đoạn thành công',
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error searching phases:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm giai đoạn', null, error.message);
    }
  }

  // ========== PHASE MANAGEMENT ==========
  async updatePhaseOrder(projectId, phaseOrders, userId) {
    try {
      const phases = await projectPhaseRepository.updatePhaseOrder(projectId, phaseOrders);
      return createResponse(200, 'Cập nhật thứ tự giai đoạn thành công',
        transformDocumentsId(phases, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error updating phase order:', error);
      return createResponse(500, 'Lỗi khi cập nhật thứ tự giai đoạn', null, error.message);
    }
  }

  async activatePhase(id, userId) {
    try {
      const phase = await projectPhaseRepository.activatePhase(id);
      return createResponse(200, 'Kích hoạt giai đoạn thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error activating phase:', error);
      return createResponse(500, 'Lỗi khi kích hoạt giai đoạn', null, error.message);
    }
  }

  async deactivatePhase(id, userId) {
    try {
      const phase = await projectPhaseRepository.deactivatePhase(id);
      return createResponse(200, 'Vô hiệu hóa giai đoạn thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error deactivating phase:', error);
      return createResponse(500, 'Lỗi khi vô hiệu hóa giai đoạn', null, error.message);
    }
  }

  async completePhase(id, userId) {
    try {
      const phase = await projectPhaseRepository.completePhase(id);
      return createResponse(200, 'Hoàn thành giai đoạn thành công',
        transformDocumentId(phase, POPULATED_FIELDS.PROJECT_PHASE));
    } catch (error) {
      console.error('Error completing phase:', error);
      return createResponse(500, 'Lỗi khi hoàn thành giai đoạn', null, error.message);
    }
  }

  // ========== PHASE REPORTS ==========
  async generatePhaseReport(projectId) {
    try {
      const report = await projectPhaseRepository.generatePhaseReport(projectId);
      return createResponse(200, 'Tạo báo cáo giai đoạn thành công', report);
    } catch (error) {
      console.error('Error generating phase report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo giai đoạn', null, error.message);
    }
  }
}

module.exports = new ProjectPhaseService();