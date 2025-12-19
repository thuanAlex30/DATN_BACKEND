const projectTaskRepository = require('../repository/projectTaskRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectTaskService {
  // ========== PROJECT TASK MANAGEMENT ==========

  async getTaskById(id) {
    try {
      const task = await projectTaskRepository.getTaskById(id);

      if (!task) {
        return createResponse(404, 'Không tìm thấy công việc');
      }

      return createResponse(200, 'Lấy thông tin công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting task:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin công việc', null, error.message);
    }
  }

  async createTask(taskData, userId) {
    try {
      // Validate required fields (task_code is optional, will be auto-generated if not provided)
      const requiredFields = ['project_id', 'task_name'];
      for (const field of requiredFields) {
        if (!taskData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Clone taskData to avoid modifying the original object
      const taskDataToValidate = { ...taskData };

      // Validate task (this will auto-generate task_code if not provided)
      const validation = await projectTaskRepository.validateTask(taskDataToValidate);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      // Use validated taskData which has auto-generated task_code if needed
      const finalTaskData = validation.taskData || taskDataToValidate;
      
      const task = await projectTaskRepository.createTask({
        ...finalTaskData,
        created_by: userId
      });

      return createResponse(201, 'Tạo công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error creating task:', error);
      return createResponse(500, 'Lỗi khi tạo công việc', null, error.message);
    }
  }

  async updateTask(id, updateData, userId) {
    try {
      const task = await projectTaskRepository.updateTask(id, {
        ...updateData,
        updated_by: userId
      });

      if (!task) {
        return createResponse(404, 'Không tìm thấy công việc');
      }

      return createResponse(200, 'Cập nhật công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error updating task:', error);
      return createResponse(500, 'Lỗi khi cập nhật công việc', null, error.message);
    }
  }

  async deleteTask(id, userId) {
    try {
      const task = await projectTaskRepository.deleteTask(id);

      if (!task) {
        return createResponse(404, 'Không tìm thấy công việc');
      }

      return createResponse(200, 'Xóa công việc thành công');
    } catch (error) {
      console.error('Error deleting task:', error);
      return createResponse(500, 'Lỗi khi xóa công việc', null, error.message);
    }
  }

  // ========== TASK QUERIES ==========
  async getAllTasks(filters = {}) {
    try {
      const tasks = await projectTaskRepository.getAllTasks(filters);
      return createResponse(200, 'Lấy danh sách công việc thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc', null, error.message);
    }
  }

  async getProjectTasks(projectId) {
    try {
      const tasks = await projectTaskRepository.getProjectTasks(projectId);
      return createResponse(200, 'Lấy danh sách công việc dự án thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting project tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc dự án', null, error.message);
    }
  }

  async getTasksByUser(userId, filters = {}) {
    try {
      const tasks = await projectTaskRepository.getTasksByUser(userId, filters);
      return createResponse(200, 'Lấy danh sách công việc của người dùng thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting tasks by user:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc của người dùng', null, error.message);
    }
  }

  async getTasksByStatus(status, projectId = null) {
    try {
      const tasks = await projectTaskRepository.getTasksByStatus(status, projectId);
      return createResponse(200, `Lấy danh sách công việc ${status.toLowerCase()} thành công`,
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc theo trạng thái', null, error.message);
    }
  }

  async getTasksByPriority(priority, projectId = null) {
    try {
      const tasks = await projectTaskRepository.getTasksByPriority(priority, projectId);
      return createResponse(200, `Lấy danh sách công việc ${priority.toLowerCase()} thành công`,
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting tasks by priority:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc theo mức độ ưu tiên', null, error.message);
    }
  }

  async getUserTasks(userId, filters = {}) {
    try {
      const tasks = await projectTaskRepository.getUserTasks(userId, filters);
      return createResponse(200, 'Lấy danh sách công việc người dùng thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc người dùng', null, error.message);
    }
  }

  async getOverdueTasks(projectId = null) {
    try {
      const tasks = await projectTaskRepository.getOverdueTasks(projectId);
      return createResponse(200, 'Lấy danh sách công việc quá hạn thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc quá hạn', null, error.message);
    }
  }

  async getUpcomingTasks(days = 7, projectId = null) {
    try {
      const tasks = await projectTaskRepository.getUpcomingTasks(days, projectId);
      return createResponse(200, 'Lấy danh sách công việc sắp tới thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công việc sắp tới', null, error.message);
    }
  }

  // ========== TASK VALIDATION ==========
  async validateTask(taskData) {
    try {
      const validation = await projectTaskRepository.validateTask(taskData);
      return createResponse(200, 'Kiểm tra công việc thành công', validation);
    } catch (error) {
      console.error('Error validating task:', error);
      return createResponse(500, 'Lỗi khi kiểm tra công việc', null, error.message);
    }
  }

  // ========== TASK ANALYTICS ==========
  async getTaskAnalytics(projectId) {
    try {
      const analytics = await projectTaskRepository.getTaskAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích công việc thành công', analytics);
    } catch (error) {
      console.error('Error getting task analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích công việc', null, error.message);
    }
  }

  async getTaskStats(filters = {}) {
    try {
      const stats = await projectTaskRepository.getTaskStats(filters);
      return createResponse(200, 'Lấy thống kê công việc thành công', stats);
    } catch (error) {
      console.error('Error getting task stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê công việc', null, error.message);
    }
  }

  // ========== TASK ASSIGNMENTS ==========
  async getTaskAssignments(taskId) {
    try {
      const assignments = await projectTaskRepository.getTaskAssignments(taskId);
      return createResponse(200, 'Lấy danh sách phân công công việc thành công', assignments);
    } catch (error) {
      console.error('Error getting task assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công công việc', null, error.message);
    }
  }

  async assignUserToTask(taskId, userId, assignedBy, role = 'ASSIGNEE') {
    try {
      const assignment = await projectTaskRepository.assignUserToTask(taskId, userId, assignedBy, role);
      return createResponse(201, 'Phân công người dùng vào công việc thành công', assignment);
    } catch (error) {
      console.error('Error assigning user to task:', error);
      return createResponse(500, 'Lỗi khi phân công người dùng vào công việc', null, error.message);
    }
  }

  async unassignUserFromTask(assignmentId, unassignedBy) {
    try {
      const assignment = await projectTaskRepository.unassignUserFromTask(assignmentId, unassignedBy);
      return createResponse(200, 'Hủy phân công người dùng khỏi công việc thành công', assignment);
    } catch (error) {
      console.error('Error unassigning user from task:', error);
      return createResponse(500, 'Lỗi khi hủy phân công người dùng khỏi công việc', null, error.message);
    }
  }

  // ========== TASK DEPENDENCIES ==========
  async getTaskDependencies(taskId) {
    try {
      const dependencies = await projectTaskRepository.getTaskDependencies(taskId);
      return createResponse(200, 'Lấy danh sách phụ thuộc công việc thành công', dependencies);
    } catch (error) {
      console.error('Error getting task dependencies:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phụ thuộc công việc', null, error.message);
    }
  }

  async createTaskDependency(predecessorTaskId, successorTaskId, dependencyType, createdBy) {
    try {
      const dependency = await projectTaskRepository.createTaskDependency(
        predecessorTaskId, successorTaskId, dependencyType, createdBy
      );
      return createResponse(201, 'Tạo phụ thuộc công việc thành công', dependency);
    } catch (error) {
      console.error('Error creating task dependency:', error);
      return createResponse(500, 'Lỗi khi tạo phụ thuộc công việc', null, error.message);
    }
  }

  // ========== TASK PROGRESS ==========
  async getTaskProgressLogs(taskId) {
    try {
      const progressLogs = await projectTaskRepository.getTaskProgressLogs(taskId);
      return createResponse(200, 'Lấy nhật ký tiến độ công việc thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.TASK_PROGRESS_LOG));
    } catch (error) {
      console.error('Error getting task progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy nhật ký tiến độ công việc', null, error.message);
    }
  }

  async updateTaskProgress(taskId, progress, userId) {
    try {
      const progressValue = Number(progress);
      // Chỉ cập nhật tiến độ, KHÔNG tự động đổi trạng thái sang COMPLETED.
      // Trạng thái hoàn thành phải được Header Department xác nhận thủ công.
      const task = await projectTaskRepository.updateTask(taskId, {
        progress_percentage: progressValue,
        updated_by: userId
      });

      if (!task) {
        return createResponse(404, 'Không tìm thấy công việc');
      }

      return createResponse(200, 'Cập nhật tiến độ công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error updating task progress:', error);
      return createResponse(500, 'Lỗi khi cập nhật tiến độ công việc', null, error.message);
    }
  }

  async createProgressLog(taskId, progressData, userId) {
    try {
      const progressLog = await projectTaskRepository.createProgressLog(taskId, progressData, userId);
      return createResponse(201, 'Tạo nhật ký tiến độ thành công', progressLog);
    } catch (error) {
      console.error('Error creating progress log:', error);
      return createResponse(500, 'Lỗi khi tạo nhật ký tiến độ', null, error.message);
    }
  }

  // ========== ADDITIONAL TASK ASSIGNMENT METHODS ==========
  async addTaskAssignment(taskId, assigneeId, role, assignedBy) {
    try {
      const assignment = await projectTaskRepository.assignUserToTask(taskId, assigneeId, assignedBy, role);
      return createResponse(201, 'Thêm phân công công việc thành công', assignment);
    } catch (error) {
      console.error('Error adding task assignment:', error);
      return createResponse(500, 'Lỗi khi thêm phân công công việc', null, error.message);
    }
  }

  async updateTaskAssignment(assignmentId, updateData, updatedBy) {
    try {
      const assignment = await projectTaskRepository.updateTaskAssignment(assignmentId, updateData, updatedBy);
      return createResponse(200, 'Cập nhật phân công công việc thành công', assignment);
    } catch (error) {
      console.error('Error updating task assignment:', error);
      return createResponse(500, 'Lỗi khi cập nhật phân công công việc', null, error.message);
    }
  }

  async removeTaskAssignment(assignmentId, removedBy) {
    try {
      const assignment = await projectTaskRepository.unassignUserFromTask(assignmentId, removedBy);
      return createResponse(200, 'Xóa phân công công việc thành công', assignment);
    } catch (error) {
      console.error('Error removing task assignment:', error);
      return createResponse(500, 'Lỗi khi xóa phân công công việc', null, error.message);
    }
  }

  // ========== ADDITIONAL TASK DEPENDENCY METHODS ==========
  async addTaskDependency(taskId, dependsOnTaskId, dependencyType, createdBy) {
    try {
      const dependency = await projectTaskRepository.createTaskDependency(
        dependsOnTaskId, taskId, dependencyType, createdBy
      );
      return createResponse(201, 'Thêm phụ thuộc công việc thành công', dependency);
    } catch (error) {
      console.error('Error adding task dependency:', error);
      return createResponse(500, 'Lỗi khi thêm phụ thuộc công việc', null, error.message);
    }
  }

  async removeTaskDependency(dependencyId, removedBy) {
    try {
      const dependency = await projectTaskRepository.removeTaskDependency(dependencyId, removedBy);
      return createResponse(200, 'Xóa phụ thuộc công việc thành công', dependency);
    } catch (error) {
      console.error('Error removing task dependency:', error);
      return createResponse(500, 'Lỗi khi xóa phụ thuộc công việc', null, error.message);
    }
  }

  // ========== ADDITIONAL PROGRESS LOG METHODS ==========
  async addProgressLog(taskId, progressData, userId) {
    try {
      // Đảm bảo progressData có đầy đủ các trường cần thiết
      const progressValue = Number(progressData.progress_percentage || progressData.progress || 0);
      const logData = {
        progress_percentage: progressValue,
        work_description: progressData.work_description || progressData.note || '',
        hours_worked: progressData.hours_worked || 0,
        log_date: progressData.log_date ? new Date(progressData.log_date) : new Date(),
        images: progressData.images || [] // Array of Cloudinary image URLs
      };
      
      const progressLog = await projectTaskRepository.createProgressLog(taskId, logData, userId);

      // KHÔNG tự động cập nhật trạng thái task sang COMPLETED khi đạt 100%.
      // Chỉ cập nhật tiến độ; Header Department sẽ xác nhận hoàn thành riêng.
      await projectTaskRepository.updateTask(taskId, {
        progress_percentage: progressValue
      });

      return createResponse(201, 'Thêm nhật ký tiến độ thành công', progressLog);
    } catch (error) {
      console.error('Error adding progress log:', error);
      return createResponse(500, 'Lỗi khi thêm nhật ký tiến độ', null, error.message);
    }
  }

  // ========== TASK MANAGEMENT ==========
  async startTask(id, startedBy) {
    try {
      const task = await projectTaskRepository.startTask(id, startedBy);
      return createResponse(200, 'Bắt đầu công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error starting task:', error);
      return createResponse(500, 'Lỗi khi bắt đầu công việc', null, error.message);
    }
  }

  async completeTask(id, completedBy, actualEndDate = null) {
    try {
      const task = await projectTaskRepository.completeTask(id, completedBy, actualEndDate);
      return createResponse(200, 'Hoàn thành công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error completing task:', error);
      return createResponse(500, 'Lỗi khi hoàn thành công việc', null, error.message);
    }
  }

  async cancelTask(id, cancelledBy, reason) {
    try {
      const task = await projectTaskRepository.cancelTask(id, cancelledBy, reason);
      return createResponse(200, 'Hủy công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error cancelling task:', error);
      return createResponse(500, 'Lỗi khi hủy công việc', null, error.message);
    }
  }

  async holdTask(id, heldBy, reason) {
    try {
      const task = await projectTaskRepository.holdTask(id, heldBy, reason);
      return createResponse(200, 'Tạm dừng công việc thành công',
        transformDocumentId(task, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error holding task:', error);
      return createResponse(500, 'Lỗi khi tạm dừng công việc', null, error.message);
    }
  }

  // ========== TASK SEARCH ==========
  async searchTasks(searchTerm, filters = {}) {
    try {
      const tasks = await projectTaskRepository.searchTasks(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm công việc thành công',
        transformDocumentsId(tasks, POPULATED_FIELDS.PROJECT_TASK));
    } catch (error) {
      console.error('Error searching tasks:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm công việc', null, error.message);
    }
  }

  // ========== TASK REPORTS ==========
  async generateTaskReport(projectId) {
    try {
      const report = await projectTaskRepository.generateTaskReport(projectId);
      return createResponse(200, 'Tạo báo cáo công việc thành công', report);
    } catch (error) {
      console.error('Error generating task report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo công việc', null, error.message);
    }
  }
}

module.exports = new ProjectTaskService();