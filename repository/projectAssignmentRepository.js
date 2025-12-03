const ProjectAssignment = require('../models/projectAssignment');
const Project = require('../models/project');
const User = require('../models/user');

class ProjectAssignmentRepository {
  // ========== ASSIGNMENT CRUD ==========
  async getAllAssignments(filters = {}) {
    const query = {};
    
    if (filters.project_id) {
      query.project_id = filters.project_id;
    }
    
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    return await ProjectAssignment.find(query)
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email')
      .sort({ assigned_at: -1 });
  }

  async getAssignmentById(id) {
    return await ProjectAssignment.findById(id)
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email');
  }

  async createAssignment(assignmentData) {
    const assignment = new ProjectAssignment(assignmentData);
    return await assignment.save();
  }

  async updateAssignment(id, updateData) {
    return await ProjectAssignment.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteAssignment(id) {
    return await ProjectAssignment.findByIdAndDelete(id);
  }

  // ========== PROJECT ASSIGNMENT MANAGEMENT ==========
  async getProjectAssignments(projectId) {
    return await ProjectAssignment.find({ project_id: projectId })
      .populate('user_id', 'full_name email position_id')
      .populate('user_id.position_id', 'position_name')
      .sort({ assigned_at: -1 });
  }

  async getUserAssignments(userId) {
    return await ProjectAssignment.find({ user_id: userId })
      .populate('project_id', 'project_name project_code status')
      .sort({ assigned_at: -1 });
  }

  async getActiveUserAssignments(userId) {
    return await ProjectAssignment.find({ 
      user_id: userId,
      status: 'ACTIVE'
    })
      .populate('project_id', 'project_name project_code status')
      .sort({ assigned_at: -1 });
  }

  // ========== ASSIGNMENT VALIDATION ==========
  async checkExistingAssignment(projectId, userId) {
    return await ProjectAssignment.findOne({
      project_id: projectId,
      user_id: userId
    });
  }

  async validateAssignment(projectId, userId, role) {
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return { valid: false, message: 'Dự án không tồn tại' };
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return { valid: false, message: 'Người dùng không tồn tại' };
    }

    // Check if user is already assigned to this project
    const existingAssignment = await this.checkExistingAssignment(projectId, userId);
    if (existingAssignment) {
      return { valid: false, message: 'Người dùng đã được phân công vào dự án này' };
    }

    // Validate role
    const validRoles = ['PROJECT_MANAGER', 'MEMBER', 'OBSERVER'];
    if (!validRoles.includes(role)) {
      return { valid: false, message: 'Vai trò không hợp lệ' };
    }

    return { valid: true };
  }

  // ========== ASSIGNMENT ANALYTICS ==========
  async getAssignmentAnalytics(projectId) {
    const assignments = await ProjectAssignment.find({ project_id: projectId });
    
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'ACTIVE').length;
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED').length;
    
    const roleDistribution = assignments.reduce((acc, assignment) => {
      acc[assignment.role] = (acc[assignment.role] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = assignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {});

    const averageAssignmentDuration = assignments
      .filter(a => a.completed_at && a.assigned_at)
      .reduce((sum, a) => {
        const duration = (a.completed_at - a.assigned_at) / (1000 * 60 * 60 * 24);
        return sum + duration;
      }, 0) / completedAssignments || 0;

    return {
      project_id: projectId,
      total_assignments: totalAssignments,
      active_assignments: activeAssignments,
      completed_assignments: completedAssignments,
      role_distribution: roleDistribution,
      status_distribution: statusDistribution,
      average_assignment_duration: Math.round(averageAssignmentDuration * 100) / 100
    };
  }

  async getUserAssignmentAnalytics(userId) {
    const assignments = await ProjectAssignment.find({ user_id: userId });
    
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'ACTIVE').length;
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED').length;
    
    const roleDistribution = assignments.reduce((acc, assignment) => {
      acc[assignment.role] = (acc[assignment.role] || 0) + 1;
      return acc;
    }, {});

    const projectTypes = await Project.aggregate([
      { $match: { _id: { $in: assignments.map(a => a.project_id) } } },
      { $group: { _id: '$project_type', count: { $sum: 1 } } }
    ]);

    return {
      user_id: userId,
      total_assignments: totalAssignments,
      active_assignments: activeAssignments,
      completed_assignments: completedAssignments,
      role_distribution: roleDistribution,
      project_types: projectTypes
    };
  }

  // ========== ASSIGNMENT STATISTICS ==========
  async getAssignmentStats(filters = {}) {
    const query = {};
    
    if (filters.project_id) {
      query.project_id = filters.project_id;
    }
    
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    const totalAssignments = await ProjectAssignment.countDocuments(query);
    
    const assignmentsByRole = await ProjectAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const assignmentsByStatus = await ProjectAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const assignmentsByProject = await ProjectAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$project_id', count: { $sum: 1 } } },
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      { $project: { project_id: '$_id', project_name: '$project.project_name', count: 1 } }
    ]);

    const assignmentsByUser = await ProjectAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { user_id: '$_id', user_name: '$user.full_name', count: 1 } }
    ]);

    return {
      total_assignments: totalAssignments,
      assignments_by_role: assignmentsByRole,
      assignments_by_status: assignmentsByStatus,
      assignments_by_project: assignmentsByProject,
      assignments_by_user: assignmentsByUser
    };
  }

  // ========== AVAILABLE USERS ==========
  async getAvailableUsers(projectId, filters = {}) {
    // Get users already assigned to this project
    const assignedUsers = await ProjectAssignment.find({ 
      project_id: projectId,
      status: 'ACTIVE'
    }).select('user_id');
    
    const assignedUserIds = assignedUsers.map(a => a.user_id);

    // Build query for available users
    const query = {
      _id: { $nin: assignedUserIds },
      is_active: true
    };

    if (filters.position_id) {
      query.position_id = filters.position_id;
    }

    if (filters.department_id) {
      query.department_id = filters.department_id;
    }

    if (filters.search) {
      query.$or = [
        { full_name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await User.find(query)
      .populate('position_id', 'position_name')
      .populate('department_id', 'department_name')
      .sort({ full_name: 1 });
  }

  async getUsersByWorkload(filters = {}) {
    const users = await User.find({ is_active: true })
      .populate('position_id', 'position_name')
      .populate('department_id', 'department_name');

    const userWorkloads = [];

    for (const user of users) {
      const activeAssignments = await ProjectAssignment.countDocuments({
        user_id: user._id,
        status: 'ACTIVE'
      });

      const completedAssignments = await ProjectAssignment.countDocuments({
        user_id: user._id,
        status: 'COMPLETED'
      });

      userWorkloads.push({
        user_id: user._id,
        full_name: user.full_name,
        email: user.email,
        position_name: user.position_id?.position_name,
        department_name: user.department_id?.department_name,
        active_assignments: activeAssignments,
        completed_assignments: completedAssignments,
        total_assignments: activeAssignments + completedAssignments,
        workload_level: activeAssignments <= 2 ? 'LOW' : activeAssignments <= 5 ? 'MEDIUM' : 'HIGH'
      });
    }

    return userWorkloads.sort((a, b) => a.active_assignments - b.active_assignments);
  }

  // ========== ASSIGNMENT QUERIES ==========
  async getAssignmentsByRole(role) {
    return await ProjectAssignment.find({ role: role })
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email')
      .sort({ assigned_at: -1 });
  }

  async getAssignmentsByStatus(status) {
    return await ProjectAssignment.find({ status: status })
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email')
      .sort({ assigned_at: -1 });
  }

  async getRecentAssignments(limit = 10) {
    return await ProjectAssignment.find()
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email')
      .sort({ assigned_at: -1 })
      .limit(limit);
  }

  async getAssignmentHistory(projectId, userId) {
    return await ProjectAssignment.find({
      project_id: projectId,
      user_id: userId
    })
      .populate('project_id', 'project_name project_code')
      .populate('user_id', 'full_name email')
      .sort({ assigned_at: -1 });
  }
}

module.exports = new ProjectAssignmentRepository();
