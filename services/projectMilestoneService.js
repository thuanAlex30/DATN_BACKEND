const projectMilestoneRepository = require('../repository/projectMilestoneRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectMilestoneService {
  // ========== PROJECT MILESTONE MANAGEMENT ==========
  async getProjectMilestones(projectId) {
    try {
      const milestones = await projectMilestoneRepository.getProjectMilestones(projectId);
      return createResponse(200, 'Lấy danh sách cột mốc dự án thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting project milestones:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc dự án', null, error.message);
    }
  }

  async getMilestonesByUser(userId) {
    try {
      const milestones = await projectMilestoneRepository.getMilestonesByUser(userId);
      return createResponse(200, 'Lấy danh sách cột mốc của người dùng thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting milestones by user:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc của người dùng', null, error.message);
    }
  }

  async getMilestoneById(id) {
    try {
      const milestone = await projectMilestoneRepository.getMilestoneById(id);

      if (!milestone) {
        return createResponse(404, 'Không tìm thấy cột mốc dự án');
      }

      return createResponse(200, 'Lấy thông tin cột mốc dự án thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting milestone:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin cột mốc dự án', null, error.message);
    }
  }

  async createMilestone(milestoneData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['project_id', 'milestone_name', 'planned_date', 'completion_criteria', 'responsible_user_id'];
      for (const field of requiredFields) {
        if (!milestoneData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate milestone
      const validation = await projectMilestoneRepository.validateMilestone(milestoneData);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      const milestone = await projectMilestoneRepository.createMilestone({
        ...milestoneData,
        created_by: userId
      });

      return createResponse(201, 'Tạo cột mốc dự án thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error creating milestone:', error);
      return createResponse(500, 'Lỗi khi tạo cột mốc dự án', null, error.message);
    }
  }

  async updateMilestone(id, updateData, userId) {
    try {
      const milestone = await projectMilestoneRepository.updateMilestone(id, {
        ...updateData,
        updated_by: userId
      });

      if (!milestone) {
        return createResponse(404, 'Không tìm thấy cột mốc dự án');
      }

      return createResponse(200, 'Cập nhật cột mốc dự án thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error updating milestone:', error);
      return createResponse(500, 'Lỗi khi cập nhật cột mốc dự án', null, error.message);
    }
  }

  async deleteMilestone(id, userId) {
    try {
      const milestone = await projectMilestoneRepository.deleteMilestone(id);

      if (!milestone) {
        return createResponse(404, 'Không tìm thấy cột mốc dự án');
      }

      return createResponse(200, 'Xóa cột mốc dự án thành công');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      return createResponse(500, 'Lỗi khi xóa cột mốc dự án', null, error.message);
    }
  }

  // ========== MILESTONE QUERIES ==========
  async getAllMilestones(filters = {}) {
    try {
      const milestones = await projectMilestoneRepository.getAllMilestones(filters);
      return createResponse(200, 'Lấy danh sách cột mốc thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting milestones:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc', null, error.message);
    }
  }


  async getUpcomingMilestones(days = 30) {
    try {
      const milestones = await projectMilestoneRepository.getUpcomingMilestones(days);
      return createResponse(200, 'Lấy danh sách cột mốc sắp tới thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc sắp tới', null, error.message);
    }
  }

  async getOverdueMilestones() {
    try {
      const milestones = await projectMilestoneRepository.getOverdueMilestones();
      return createResponse(200, 'Lấy danh sách cột mốc quá hạn thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting overdue milestones:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc quá hạn', null, error.message);
    }
  }

  async getMilestonesByStatus(status, projectId = null) {
    try {
      const milestones = await projectMilestoneRepository.getMilestonesByStatus(status, projectId);
      return createResponse(200, `Lấy danh sách cột mốc ${status.toLowerCase()} thành công`,
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting milestones by status:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc theo trạng thái', null, error.message);
    }
  }

  async getUserMilestones(userId, filters = {}) {
    try {
      const milestones = await projectMilestoneRepository.getUserMilestones(userId, filters);
      return createResponse(200, 'Lấy danh sách cột mốc người dùng thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error getting user milestones:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách cột mốc người dùng', null, error.message);
    }
  }

  // ========== MILESTONE VALIDATION ==========
  async validateMilestone(milestoneData) {
    try {
      const validation = await projectMilestoneRepository.validateMilestone(milestoneData);
      return createResponse(200, 'Kiểm tra cột mốc thành công', validation);
    } catch (error) {
      console.error('Error validating milestone:', error);
      return createResponse(500, 'Lỗi khi kiểm tra cột mốc', null, error.message);
    }
  }

  // ========== MILESTONE ANALYTICS ==========
  async getMilestoneAnalytics(projectId) {
    try {
      const analytics = await projectMilestoneRepository.getMilestoneAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích cột mốc thành công', analytics);
    } catch (error) {
      console.error('Error getting milestone analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích cột mốc', null, error.message);
    }
  }

  async getMilestoneStats(filters = {}) {
    try {
      const stats = await projectMilestoneRepository.getMilestoneStats(filters);
      return createResponse(200, 'Lấy thống kê cột mốc thành công', stats);
    } catch (error) {
      console.error('Error getting milestone stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê cột mốc', null, error.message);
    }
  }

  // ========== DELIVERABLES ==========
  async getMilestoneDeliverables(milestoneId) {
    try {
      const deliverables = await projectMilestoneRepository.getMilestoneDeliverables(milestoneId);
      return createResponse(200, 'Lấy danh sách sản phẩm cột mốc thành công', deliverables);
    } catch (error) {
      console.error('Error getting milestone deliverables:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách sản phẩm cột mốc', null, error.message);
    }
  }

  async createDeliverable(deliverableData, userId) {
    try {
      const deliverable = await projectMilestoneRepository.createDeliverable({
        ...deliverableData,
        created_by: userId
      });
      return createResponse(201, 'Tạo sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error creating deliverable:', error);
      return createResponse(500, 'Lỗi khi tạo sản phẩm cột mốc', null, error.message);
    }
  }

  async updateDeliverable(id, updateData, userId) {
    try {
      const deliverable = await projectMilestoneRepository.updateDeliverable(id, {
        ...updateData,
        updated_by: userId
      });
      return createResponse(200, 'Cập nhật sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error updating deliverable:', error);
      return createResponse(500, 'Lỗi khi cập nhật sản phẩm cột mốc', null, error.message);
    }
  }

  async deleteDeliverable(id, userId) {
    try {
      const deliverable = await projectMilestoneRepository.deleteDeliverable(id);
      return createResponse(200, 'Xóa sản phẩm cột mốc thành công');
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      return createResponse(500, 'Lỗi khi xóa sản phẩm cột mốc', null, error.message);
    }
  }

  // ========== MILESTONE MANAGEMENT ==========
  async completeMilestone(id, actualDate, completedBy) {
    try {
      const milestone = await projectMilestoneRepository.completeMilestone(id, actualDate);
      return createResponse(200, 'Hoàn thành cột mốc thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error completing milestone:', error);
      return createResponse(500, 'Lỗi khi hoàn thành cột mốc', null, error.message);
    }
  }

  async startMilestone(id, startedBy) {
    try {
      const milestone = await projectMilestoneRepository.startMilestone(id);
      return createResponse(200, 'Bắt đầu cột mốc thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error starting milestone:', error);
      return createResponse(500, 'Lỗi khi bắt đầu cột mốc', null, error.message);
    }
  }

  async cancelMilestone(id, reason, cancelledBy) {
    try {
      const milestone = await projectMilestoneRepository.cancelMilestone(id, reason);
      return createResponse(200, 'Hủy cột mốc thành công',
        transformDocumentId(milestone, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error cancelling milestone:', error);
      return createResponse(500, 'Lỗi khi hủy cột mốc', null, error.message);
    }
  }

  // ========== MILESTONE SEARCH ==========
  async searchMilestones(searchTerm, filters = {}) {
    try {
      const milestones = await projectMilestoneRepository.searchMilestones(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm cột mốc thành công',
        transformDocumentsId(milestones, POPULATED_FIELDS.PROJECT_MILESTONE));
    } catch (error) {
      console.error('Error searching milestones:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm cột mốc', null, error.message);
    }
  }

  // ========== ADDITIONAL MILESTONE DELIVERABLE METHODS ==========
  async addMilestoneDeliverable(milestoneId, deliverableData, createdBy) {
    try {
      const deliverable = await projectMilestoneRepository.addMilestoneDeliverable(milestoneId, deliverableData, createdBy);
      return createResponse(201, 'Thêm sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error adding milestone deliverable:', error);
      return createResponse(500, 'Lỗi khi thêm sản phẩm cột mốc', null, error.message);
    }
  }

  async updateMilestoneDeliverable(deliverableId, updateData, updatedBy) {
    try {
      const deliverable = await projectMilestoneRepository.updateMilestoneDeliverable(deliverableId, updateData, updatedBy);
      return createResponse(200, 'Cập nhật sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error updating milestone deliverable:', error);
      return createResponse(500, 'Lỗi khi cập nhật sản phẩm cột mốc', null, error.message);
    }
  }

  async submitDeliverable(deliverableId, submissionNote, submittedBy) {
    try {
      const deliverable = await projectMilestoneRepository.submitDeliverable(deliverableId, submissionNote, submittedBy);
      return createResponse(200, 'Nộp sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      return createResponse(500, 'Lỗi khi nộp sản phẩm cột mốc', null, error.message);
    }
  }

  async reviewDeliverable(deliverableId, reviewStatus, reviewNote, reviewedBy) {
    try {
      const deliverable = await projectMilestoneRepository.reviewDeliverable(deliverableId, reviewStatus, reviewNote, reviewedBy);
      return createResponse(200, 'Đánh giá sản phẩm cột mốc thành công', deliverable);
    } catch (error) {
      console.error('Error reviewing deliverable:', error);
      return createResponse(500, 'Lỗi khi đánh giá sản phẩm cột mốc', null, error.message);
    }
  }

  // ========== MILESTONE REPORTS ==========
  async generateMilestoneReport(projectId) {
    try {
      const report = await projectMilestoneRepository.generateMilestoneReport(projectId);
      return createResponse(200, 'Tạo báo cáo cột mốc thành công', report);
    } catch (error) {
      console.error('Error generating milestone report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo cột mốc', null, error.message);
    }
  }
}

module.exports = new ProjectMilestoneService();