const taskProgressLogRepository = require('../repository/taskProgressLogRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class TaskProgressLogService {
  // ========== TASK PROGRESS LOG MANAGEMENT ==========
  async getTaskProgressLogs(taskId) {
    try {
      const progressLogs = await taskProgressLogRepository.getTaskProgressLogs(taskId);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting task progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ', null, error.message);
    }
  }

  async getProgressLogById(id) {
    try {
      const progressLog = await taskProgressLogRepository.getProgressLogById(id);

      if (!progressLog) {
        return createResponse(404, 'Không tìm thấy nhật ký tiến độ');
      }

      return createResponse(200, 'Lấy thông tin nhật ký tiến độ thành công',
        transformDocumentId(progressLog, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting progress log:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin nhật ký tiến độ', null, error.message);
    }
  }

  async createProgressLog(progressLogData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['task_id', 'progress_percentage', 'log_date'];
      for (const field of requiredFields) {
        if (!progressLogData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate progress log
      const validation = await taskProgressLogRepository.validateProgressLog(progressLogData);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      const progressLog = await taskProgressLogRepository.createProgressLog({
        ...progressLogData,
        created_by: userId
      });

      return createResponse(201, 'Tạo nhật ký tiến độ thành công',
        transformDocumentId(progressLog, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error creating progress log:', error);
      return createResponse(500, 'Lỗi khi tạo nhật ký tiến độ', null, error.message);
    }
  }

  async updateProgressLog(id, updateData, userId) {
    try {
      const progressLog = await taskProgressLogRepository.updateProgressLog(id, {
        ...updateData,
        updated_by: userId
      });

      if (!progressLog) {
        return createResponse(404, 'Không tìm thấy nhật ký tiến độ');
      }

      return createResponse(200, 'Cập nhật nhật ký tiến độ thành công',
        transformDocumentId(progressLog, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error updating progress log:', error);
      return createResponse(500, 'Lỗi khi cập nhật nhật ký tiến độ', null, error.message);
    }
  }

  async deleteProgressLog(id, userId) {
    try {
      const progressLog = await taskProgressLogRepository.deleteProgressLog(id);

      if (!progressLog) {
        return createResponse(404, 'Không tìm thấy nhật ký tiến độ');
      }

      return createResponse(200, 'Xóa nhật ký tiến độ thành công');
    } catch (error) {
      console.error('Error deleting progress log:', error);
      return createResponse(500, 'Lỗi khi xóa nhật ký tiến độ', null, error.message);
    }
  }

  // ========== PROGRESS LOG QUERIES ==========
  async getAllProgressLogs(filters = {}) {
    try {
      const progressLogs = await taskProgressLogRepository.getAllProgressLogs(filters);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ', null, error.message);
    }
  }

  async getProjectProgressLogs(projectId) {
    try {
      const progressLogs = await taskProgressLogRepository.getProjectProgressLogs(projectId);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ dự án thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting project progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ dự án', null, error.message);
    }
  }

  async getPhaseProgressLogs(phaseId) {
    try {
      const progressLogs = await taskProgressLogRepository.getPhaseProgressLogs(phaseId);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ giai đoạn thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting phase progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ giai đoạn', null, error.message);
    }
  }

  async getUserProgressLogs(userId, filters = {}) {
    try {
      const progressLogs = await taskProgressLogRepository.getUserProgressLogs(userId, filters);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ người dùng thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting user progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ người dùng', null, error.message);
    }
  }

  async getProgressLogsByDateRange(startDate, endDate, projectId = null) {
    try {
      const progressLogs = await taskProgressLogRepository.getProgressLogsByDateRange(startDate, endDate, projectId);
      return createResponse(200, 'Lấy danh sách nhật ký tiến độ theo khoảng thời gian thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting progress logs by date range:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhật ký tiến độ theo khoảng thời gian', null, error.message);
    }
  }

  // ========== PROGRESS LOG VALIDATION ==========
  async validateProgressLog(progressLogData) {
    try {
      const validation = await taskProgressLogRepository.validateProgressLog(progressLogData);
      return createResponse(200, 'Kiểm tra nhật ký tiến độ thành công', validation);
    } catch (error) {
      console.error('Error validating progress log:', error);
      return createResponse(500, 'Lỗi khi kiểm tra nhật ký tiến độ', null, error.message);
    }
  }

  // ========== PROGRESS LOG ANALYTICS ==========
  async getProgressAnalytics(projectId) {
    try {
      const analytics = await taskProgressLogRepository.getProgressAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích tiến độ thành công', analytics);
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích tiến độ', null, error.message);
    }
  }

  async getProgressStats(filters = {}) {
    try {
      const stats = await taskProgressLogRepository.getProgressStats(filters);
      return createResponse(200, 'Lấy thống kê tiến độ thành công', stats);
    } catch (error) {
      console.error('Error getting progress stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê tiến độ', null, error.message);
    }
  }

  // ========== PROGRESS LOG SEARCH ==========
  async searchProgressLogs(searchTerm, filters = {}) {
    try {
      const progressLogs = await taskProgressLogRepository.searchProgressLogs(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm nhật ký tiến độ thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error searching progress logs:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm nhật ký tiến độ', null, error.message);
    }
  }

  // ========== PROGRESS LOG REPORTS ==========
  async generateProgressReport(projectId) {
    try {
      const report = await taskProgressLogRepository.generateProgressReport(projectId);
      return createResponse(200, 'Tạo báo cáo tiến độ thành công', report);
    } catch (error) {
      console.error('Error generating progress report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo tiến độ', null, error.message);
    }
  }
}

module.exports = new TaskProgressLogService();