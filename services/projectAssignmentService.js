const projectAssignmentRepository = require('../repository/projectAssignmentRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectAssignmentService {
  // ========== ASSIGNMENT MANAGEMENT ==========
  async getAllAssignments(filters = {}) {
    try {
      const assignments = await projectAssignmentRepository.getAllAssignments(filters);
      return createResponse(200, 'Lấy danh sách phân công thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công', null, error.message);
    }
  }

  async getAssignmentById(id) {
    try {
      const assignment = await projectAssignmentRepository.getAssignmentById(id);

      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công');
      }

      return createResponse(200, 'Lấy thông tin phân công thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting assignment:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin phân công', null, error.message);
    }
  }

  async createAssignment(assignmentData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['project_id', 'user_id', 'role'];
      for (const field of requiredFields) {
        if (!assignmentData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate assignment
      const validation = await projectAssignmentRepository.validateAssignment(
        assignmentData.project_id,
        assignmentData.user_id,
        assignmentData.role
      );

      if (!validation.valid) {
        return createResponse(400, validation.message);
      }

      const assignment = await projectAssignmentRepository.createAssignment({
        ...assignmentData,
        assigned_by: userId
      });

      return createResponse(201, 'Tạo phân công thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error creating assignment:', error);
      return createResponse(500, 'Lỗi khi tạo phân công', null, error.message);
    }
  }

  async updateAssignment(id, updateData, userId) {
    try {
      const assignment = await projectAssignmentRepository.updateAssignment(id, updateData);

      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công');
      }

      return createResponse(200, 'Cập nhật phân công thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error updating assignment:', error);
      return createResponse(500, 'Lỗi khi cập nhật phân công', null, error.message);
    }
  }

  async deleteAssignment(id, userId) {
    try {
      const assignment = await projectAssignmentRepository.deleteAssignment(id);

      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công');
      }

      return createResponse(200, 'Xóa phân công thành công');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return createResponse(500, 'Lỗi khi xóa phân công', null, error.message);
    }
  }

  // ========== PROJECT ASSIGNMENT MANAGEMENT ==========
  async getProjectAssignments(projectId) {
    try {
      const assignments = await projectAssignmentRepository.getProjectAssignments(projectId);
      return createResponse(200, 'Lấy danh sách phân công dự án thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting project assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công dự án', null, error.message);
    }
  }

  async getUserAssignments(userId) {
    try {
      const assignments = await projectAssignmentRepository.getUserAssignments(userId);
      return createResponse(200, 'Lấy danh sách phân công người dùng thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting user assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công người dùng', null, error.message);
    }
  }

  async getActiveUserAssignments(userId) {
    try {
      const assignments = await projectAssignmentRepository.getActiveUserAssignments(userId);
      return createResponse(200, 'Lấy danh sách phân công đang hoạt động thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting active user assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công đang hoạt động', null, error.message);
    }
  }

  // ========== ASSIGNMENT VALIDATION ==========
  async checkExistingAssignment(projectId, userId) {
    try {
      const assignment = await projectAssignmentRepository.checkExistingAssignment(projectId, userId);
      return createResponse(200, 'Kiểm tra phân công hiện có thành công', {
        exists: !!assignment,
        assignment: assignment ? transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT) : null
      });
    } catch (error) {
      console.error('Error checking existing assignment:', error);
      return createResponse(500, 'Lỗi khi kiểm tra phân công hiện có', null, error.message);
    }
  }

  async validateAssignment(projectId, userId, role) {
    try {
      const validation = await projectAssignmentRepository.validateAssignment(projectId, userId, role);
      return createResponse(200, 'Kiểm tra phân công thành công', validation);
    } catch (error) {
      console.error('Error validating assignment:', error);
      return createResponse(500, 'Lỗi khi kiểm tra phân công', null, error.message);
    }
  }

  // ========== ASSIGNMENT ANALYTICS ==========
  async getAssignmentAnalytics(projectId) {
    try {
      const analytics = await projectAssignmentRepository.getAssignmentAnalytics(projectId);
      return createResponse(200, 'Lấy phân tích phân công thành công', analytics);
    } catch (error) {
      console.error('Error getting assignment analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích phân công', null, error.message);
    }
  }

  async getUserAssignmentAnalytics(userId) {
    try {
      const analytics = await projectAssignmentRepository.getUserAssignmentAnalytics(userId);
      return createResponse(200, 'Lấy phân tích phân công người dùng thành công', analytics);
    } catch (error) {
      console.error('Error getting user assignment analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích phân công người dùng', null, error.message);
    }
  }

  // ========== ASSIGNMENT STATISTICS ==========
  async getAssignmentStats(filters = {}) {
    try {
      const stats = await projectAssignmentRepository.getAssignmentStats(filters);
      return createResponse(200, 'Lấy thống kê phân công thành công', stats);
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê phân công', null, error.message);
    }
  }

  // ========== AVAILABLE USERS ==========
  async getAvailableUsers(projectId, filters = {}) {
    try {
      const users = await projectAssignmentRepository.getAvailableUsers(projectId, filters);
      return createResponse(200, 'Lấy danh sách người dùng khả dụng thành công', users);
    } catch (error) {
      console.error('Error getting available users:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách người dùng khả dụng', null, error.message);
    }
  }

  async getUsersByWorkload(filters = {}) {
    try {
      const users = await projectAssignmentRepository.getUsersByWorkload(filters);
      return createResponse(200, 'Lấy danh sách người dùng theo khối lượng công việc thành công', users);
    } catch (error) {
      console.error('Error getting users by workload:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách người dùng theo khối lượng công việc', null, error.message);
    }
  }

  // ========== ASSIGNMENT QUERIES ==========
  async getAssignmentsByRole(role) {
    try {
      const assignments = await projectAssignmentRepository.getAssignmentsByRole(role);
      return createResponse(200, 'Lấy phân công theo vai trò thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting assignments by role:', error);
      return createResponse(500, 'Lỗi khi lấy phân công theo vai trò', null, error.message);
    }
  }

  async getAssignmentsByStatus(status) {
    try {
      const assignments = await projectAssignmentRepository.getAssignmentsByStatus(status);
      return createResponse(200, 'Lấy phân công theo trạng thái thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting assignments by status:', error);
      return createResponse(500, 'Lỗi khi lấy phân công theo trạng thái', null, error.message);
    }
  }

  async getRecentAssignments(limit = 10) {
    try {
      const assignments = await projectAssignmentRepository.getRecentAssignments(limit);
      return createResponse(200, 'Lấy phân công gần đây thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting recent assignments:', error);
      return createResponse(500, 'Lỗi khi lấy phân công gần đây', null, error.message);
    }
  }

  async getAssignmentHistory(projectId, userId) {
    try {
      const assignments = await projectAssignmentRepository.getAssignmentHistory(projectId, userId);
      return createResponse(200, 'Lấy lịch sử phân công thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting assignment history:', error);
      return createResponse(500, 'Lỗi khi lấy lịch sử phân công', null, error.message);
    }
  }

  // ========== ASSIGNMENT MANAGEMENT ==========
  async assignUserToProject(projectId, userId, role, assignedBy) {
    try {
      const assignmentData = {
        project_id: projectId,
        user_id: userId,
        role: role,
        status: 'ACTIVE',
        assigned_by: assignedBy
      };

      return await this.createAssignment(assignmentData, assignedBy);
    } catch (error) {
      console.error('Error assigning user to project:', error);
      return createResponse(500, 'Lỗi khi phân công người dùng vào dự án', null, error.message);
    }
  }

  async removeUserFromProject(projectId, userId, removedBy) {
    try {
      // Find the assignment
      const assignments = await projectAssignmentRepository.getProjectAssignments(projectId);
      const assignment = assignments.find(a => a.user_id.toString() === userId.toString());

      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công');
      }

      return await this.deleteAssignment(assignment._id, removedBy);
    } catch (error) {
      console.error('Error removing user from project:', error);
      return createResponse(500, 'Lỗi khi xóa người dùng khỏi dự án', null, error.message);
    }
  }

  async updateUserRole(projectId, userId, newRole, updatedBy) {
    try {
      // Find the assignment
      const assignments = await projectAssignmentRepository.getProjectAssignments(projectId);
      const assignment = assignments.find(a => a.user_id.toString() === userId.toString());

      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công');
      }

      return await this.updateAssignment(assignment._id, { role: newRole }, updatedBy);
    } catch (error) {
      console.error('Error updating user role:', error);
      return createResponse(500, 'Lỗi khi cập nhật vai trò người dùng', null, error.message);
    }
  }

  // ========== ASSIGNMENT REPORTS ==========
  async generateAssignmentReport(projectId) {
    try {
      const analytics = await projectAssignmentRepository.getAssignmentAnalytics(projectId);
      const assignments = await projectAssignmentRepository.getProjectAssignments(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        analytics: analytics,
        assignments: transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT),
        summary: {
          total_assignments: analytics.total_assignments,
          active_assignments: analytics.active_assignments,
          completed_assignments: analytics.completed_assignments,
          role_distribution: analytics.role_distribution
        }
      };

      return createResponse(200, 'Tạo báo cáo phân công thành công', report);
    } catch (error) {
      console.error('Error generating assignment report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo phân công', null, error.message);
    }
  }

  async getProjectTeam(projectId) {
    try {
      const assignments = await projectAssignmentRepository.getProjectAssignments(projectId);
      const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');
      
      const team = {
        project_id: projectId,
        total_members: activeAssignments.length,
        members: transformDocumentsId(activeAssignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT),
        roles: activeAssignments.reduce((acc, assignment) => {
          acc[assignment.role] = (acc[assignment.role] || 0) + 1;
          return acc;
        }, {})
      };

      return createResponse(200, 'Lấy thông tin nhóm dự án thành công', team);
    } catch (error) {
      console.error('Error getting project team:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin nhóm dự án', null, error.message);
    }
  }
}

module.exports = new ProjectAssignmentService();