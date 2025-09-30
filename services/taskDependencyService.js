const taskDependencyRepository = require('../repository/taskDependencyRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class TaskDependencyService {
  // ========== TASK DEPENDENCY MANAGEMENT ==========
  async getTaskDependencies(taskId) {
    try {
      const dependencies = await taskDependencyRepository.getTaskDependencies(taskId);
      return createResponse(200, 'Lấy danh sách phụ thuộc công việc thành công',
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting task dependencies:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc công việc', null, error.message);
    }
  }

  async getDependencyById(id) {
    try {
      const dependency = await taskDependencyRepository.getDependencyById(id);

      if (!dependency) {
        return createResponse(404, 'Không tìm thấy phụ thuộc công việc');
      }

      return createResponse(200, 'Lấy thông tin phụ thuộc công việc thành công',
        transformDocumentId(dependency, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting dependency:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin phụ thuộc công việc', null, error.message);
    }
  }

  async createTaskDependency(dependencyData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['predecessor_task_id', 'successor_task_id', 'dependency_type'];
      for (const field of requiredFields) {
        if (!dependencyData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate dependency
      const validation = await taskDependencyRepository.validateDependency(dependencyData);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      const dependency = await taskDependencyRepository.createDependency({
        ...dependencyData,
        created_by: userId
      });

      return createResponse(201, 'Tạo phụ thuộc công việc thành công',
        transformDocumentId(dependency, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error creating task dependency:', error);
      return createResponse(500, 'Lỗi khi tạo phụ thuộc công việc', null, error.message);
    }
  }

  async updateDependency(id, updateData, userId) {
    try {
      const dependency = await taskDependencyRepository.updateDependency(id, {
        ...updateData,
        updated_by: userId
      });

      if (!dependency) {
        return createResponse(404, 'Không tìm thấy phụ thuộc công việc');
      }

      return createResponse(200, 'Cập nhật phụ thuộc công việc thành công',
        transformDocumentId(dependency, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error updating dependency:', error);
      return createResponse(500, 'Lỗi khi cập nhật phụ thuộc công việc', null, error.message);
    }
  }

  async deleteDependency(id, userId) {
    try {
      const dependency = await taskDependencyRepository.deleteDependency(id);

      if (!dependency) {
        return createResponse(404, 'Không tìm thấy phụ thuộc công việc');
      }

      return createResponse(200, 'Xóa phụ thuộc công việc thành công');
    } catch (error) {
      console.error('Error deleting dependency:', error);
      return createResponse(500, 'Lỗi khi xóa phụ thuộc công việc', null, error.message);
    }
  }

  // ========== DEPENDENCY QUERIES ==========
  async getAllDependencies(filters = {}) {
    try {
      const dependencies = await taskDependencyRepository.getAllDependencies(filters);
      return createResponse(200, 'Lấy danh sách phụ thuộc thành công',
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting dependencies:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc', null, error.message);
    }
  }

  async getProjectDependencies(projectId) {
    try {
      const dependencies = await taskDependencyRepository.getProjectDependencies(projectId);
      return createResponse(200, 'Lấy danh sách phụ thuộc dự án thành công',
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting project dependencies:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc dự án', null, error.message);
    }
  }

  async getPhaseDependencies(phaseId) {
    try {
      const dependencies = await taskDependencyRepository.getPhaseDependencies(phaseId);
      return createResponse(200, 'Lấy danh sách phụ thuộc giai đoạn thành công',
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting phase dependencies:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc giai đoạn', null, error.message);
    }
  }

  async getDependenciesByType(dependencyType, projectId = null) {
    try {
      const dependencies = await taskDependencyRepository.getDependenciesByType(dependencyType, projectId);
      return createResponse(200, `Lấy danh sách phụ thuộc ${dependencyType.toLowerCase()} thành công`,
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting dependencies by type:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc theo loại', null, error.message);
    }
  }

  async getDependenciesByStatus(status, projectId = null) {
    try {
      const dependencies = await taskDependencyRepository.getDependenciesByStatus(status, projectId);
      return createResponse(200, `Lấy danh sách phụ thuộc ${status.toLowerCase()} thành công`,
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error getting dependencies by status:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc theo trạng thái', null, error.message);
    }
  }

  // ========== DEPENDENCY VALIDATION ==========
  async validateDependency(dependencyData) {
    try {
      const validation = await taskDependencyRepository.validateDependency(dependencyData);
      return createResponse(200, 'Kiểm tra phụ thuộc công việc thành công', validation);
    } catch (error) {
      console.error('Error validating dependency:', error);
      return createResponse(500, 'Lỗi khi kiểm tra phụ thuộc công việc', null, error.message);
    }
  }

  // ========== DEPENDENCY ANALYTICS ==========
  async getDependencyAnalytics(projectId) {
    try {
      const analytics = await taskDependencyRepository.getDependencyAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích phụ thuộc thành công', analytics);
    } catch (error) {
      console.error('Error getting dependency analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích phụ thuộc', null, error.message);
    }
  }

  async getDependencyStats(filters = {}) {
    try {
      const stats = await taskDependencyRepository.getDependencyStats(filters);
      return createResponse(200, 'Lấy thống kê phụ thuộc thành công', stats);
    } catch (error) {
      console.error('Error getting dependency stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê phụ thuộc', null, error.message);
    }
  }

  // ========== DEPENDENCY SEARCH ==========
  async searchDependencies(searchTerm, filters = {}) {
    try {
      const dependencies = await taskDependencyRepository.searchDependencies(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm phụ thuộc thành công',
        transformDocumentsId(dependencies, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error searching dependencies:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm phụ thuộc', null, error.message);
    }
  }

  // ========== DEPENDENCY MANAGEMENT ==========
  async activateDependency(id, userId) {
    try {
      const dependency = await taskDependencyRepository.activateDependency(id);
      return createResponse(200, 'Kích hoạt phụ thuộc thành công',
        transformDocumentId(dependency, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error activating dependency:', error);
      return createResponse(500, 'Lỗi khi kích hoạt phụ thuộc', null, error.message);
    }
  }

  async deactivateDependency(id, userId) {
    try {
      const dependency = await taskDependencyRepository.deactivateDependency(id);
      return createResponse(200, 'Vô hiệu hóa phụ thuộc thành công',
        transformDocumentId(dependency, POPULATED_FIELDS.TASK_DEPENDENCY));
    } catch (error) {
      console.error('Error deactivating dependency:', error);
      return createResponse(500, 'Lỗi khi vô hiệu hóa phụ thuộc', null, error.message);
    }
  }

  // ========== DEPENDENCY REPORTS ==========
  async generateDependencyReport(projectId) {
    try {
      const report = await taskDependencyRepository.generateDependencyReport(projectId);
      return createResponse(200, 'Tạo báo cáo phụ thuộc thành công', report);
    } catch (error) {
      console.error('Error generating dependency report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo phụ thuộc', null, error.message);
    }
  }
}

module.exports = new TaskDependencyService();