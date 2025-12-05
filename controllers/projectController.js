const projectService = require('../services/projectService');
<<<<<<< HEAD

class ProjectController {
  // ========== PROJECT MANAGEMENT ==========
  async getAllProjects(req, res) {
    try {
      const filters = {
        status: req.query.status,
        site_id: req.query.site_id,
        leader_id: req.query.leader_id,
        search: req.query.search
      };

      const result = await projectService.getAllProjects(filters);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getAllProjects controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách dự án',
        error: error.message
      });
    }
  }

  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const result = await projectService.getProjectById(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in getProjectById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin dự án',
        error: error.message
      });
    }
  }

  async createProject(req, res) {
    try {
      const projectData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.createProject(projectData, userId);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createProject controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo dự án',
        error: error.message
      });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.updateProject(id, updateData, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateProject controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật dự án',
        error: error.message
      });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.deleteProject(id, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in deleteProject controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa dự án',
        error: error.message
      });
    }
  }

  // ========== PROJECT STATISTICS ==========
  async getProjectStats(req, res) {
    try {
      const result = await projectService.getProjectStats();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getProjectStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê dự án',
        error: error.message
      });
    }
  }

  // ========== PROJECT ASSIGNMENTS ==========
  async getProjectAssignments(req, res) {
    try {
      const { projectId } = req.params;
      const result = await projectService.getProjectAssignments(projectId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getProjectAssignments controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thành viên dự án',
        error: error.message
      });
    }
  }

  async addProjectAssignment(req, res) {
    try {
      const assignmentData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.addProjectAssignment(assignmentData, userId);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in addProjectAssignment controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi thêm thành viên vào dự án',
        error: error.message
      });
    }
  }

  async updateProjectAssignment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.updateProjectAssignment(id, updateData, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateProjectAssignment controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật phân công dự án',
        error: error.message
      });
    }
  }

  async removeProjectAssignment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.removeProjectAssignment(id, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in removeProjectAssignment controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa phân công dự án',
        error: error.message
      });
    }
  }

  // ========== USER PROJECTS ==========
  async getUserProjects(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const result = await projectService.getUserProjects(userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getUserProjects controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách dự án của người dùng',
        error: error.message
      });
    }
  }

  // ========== SITE MANAGEMENT ==========
  async getAllSites(req, res) {
    try {
      const filters = {
        is_active: req.query.is_active,
        search: req.query.search
      };

      const result = await projectService.getAllSites(filters);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getAllSites controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách địa điểm',
        error: error.message
      });
    }
  }

  async getSiteById(req, res) {
    try {
      const { id } = req.params;
      const result = await projectService.getSiteById(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in getSiteById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin địa điểm',
        error: error.message
      });
    }
  }

  async createSite(req, res) {
    try {
      const siteData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.createSite(siteData, userId);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createSite controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo địa điểm',
        error: error.message
      });
    }
  }

  async updateSite(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.updateSite(id, updateData, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateSite controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật địa điểm',
        error: error.message
      });
    }
  }

  async deleteSite(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id || req.user.id;
      
      const result = await projectService.deleteSite(id, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in deleteSite controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa địa điểm',
        error: error.message
      });
    }
  }

  // ========== PROJECT PROGRESS ==========
  async updateProjectProgress(req, res) {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const userId = req.user._id || req.user.id;
      
      if (progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tiến độ phải từ 0 đến 100'
        });
      }
      
      const result = await projectService.updateProjectProgress(id, progress, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateProjectProgress controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật tiến độ dự án',
        error: error.message
      });
    }
  }

  // ========== PROJECT SEARCH ==========
  async searchProjects(req, res) {
    try {
      const { q } = req.query;
      const filters = {
        status: req.query.status,
        site_id: req.query.site_id
      };

      const result = await projectService.searchProjects(q, filters);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in searchProjects controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tìm kiếm dự án',
        error: error.message
      });
    }
  }

  // ========== PROJECT TIMELINE ==========
  async getProjectTimeline(req, res) {
    try {
      const { projectId } = req.params;
      const result = await projectService.getProjectTimeline(projectId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in getProjectTimeline controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy timeline dự án',
        error: error.message
      });
    }
  }

  async getAvailableEmployees(req, res) {
    try {
      const result = await projectService.getAvailableEmployees();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getAvailableEmployees controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nhân viên',
        error: error.message
      });
    }
  }
}

module.exports = new ProjectController();
=======
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const ProjectEvents = require('../events/projectEvents');

class ProjectController {
  // ========== PROJECT MANAGEMENT ==========
  static getAllProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const filters = {
      status: req.query.status,
      site_id: req.query.site_id,
      leader_id: req.query.leader_id,
      search: req.query.search
    };

    const result = await projectService.getAllProjects(filters, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getProjectById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await projectService.getProjectById(id, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const projectData = req.body;
    const userId = req.user._id || req.user.id;
    const tenantId = req.user.tenant_id;
    
    const result = await projectService.createProject(projectData, userId, tenantId);
    
    // Emit WebSocket event for project created
    if (result.success && result.data) {
      websocketService.emitProjectCreated(result.data, req.user);
    }
    
    // Emit Kafka event for project created
    if (result.success && result.data) {
      try {
        await ProjectEvents.emitProjectCreated(result.data, req.user, {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (eventError) {
        console.error('Failed to emit project created event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    const tenantId = req.user.tenant_id;
    
    const result = await projectService.updateProject(id, updateData, userId, tenantId);
    
    // Emit WebSocket event for project updated
    if (result.success && result.data) {
      websocketService.emitToAll('project_updated', {
        project: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    // Emit Kafka event for project updated
    if (result.success && result.data) {
      try {
        await ProjectEvents.emitProjectUpdated(result.data, req.user, {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (eventError) {
        console.error('Failed to emit project updated event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const tenantId = req.user.tenant_id;
    
    // Get project data before deletion for event
    const projectData = await projectService.getProjectById(id, tenantId);
    
    const result = await projectService.deleteProject(id, userId, tenantId);
    
    // Emit Kafka event for project deleted
    if (result.success && projectData.success) {
      try {
        await ProjectEvents.emitProjectDeleted(projectData.data, req.user, {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (eventError) {
        console.error('Failed to emit project deleted event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT STATISTICS ==========
  static getProjectStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await projectService.getProjectStats(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT ASSIGNMENTS ==========
  static getProjectAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectService.getProjectAssignments(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const assignmentData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.addProjectAssignment(assignmentData, userId);
    
    // Emit WebSocket event for project assignment
    if (result.success && result.data) {
      // Get assignee info for WebSocket notification
      const User = require('../models/user');
      const assignee = await User.findById(assignmentData.user_id);
      
      if (assignee) {
        websocketService.emitProjectAssigned(result.data, assignee, req.user);
      }
    }
    
    // Emit Kafka event for project assigned
    if (result.success && result.data) {
      try {
        const User = require('../models/user');
        const assignee = await User.findById(assignmentData.user_id);
        const project = await projectService.getProjectById(assignmentData.project_id);
        
        if (assignee && project.success) {
          await ProjectEvents.emitProjectAssigned(project.data, assignee, req.user, {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
      } catch (eventError) {
        console.error('Failed to emit project assigned event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateProjectAssignment(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeProjectAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.removeProjectAssignment(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== USER PROJECTS ==========
  static getUserProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await projectService.getUserProjects(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== SITE MANAGEMENT ==========
  static getAllSites = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      is_active: req.query.is_active,
      search: req.query.search
    };

    const result = await projectService.getAllSites(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getSiteById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectService.getSiteById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const siteData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.createSite(siteData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateSite(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.deleteSite(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT PROGRESS ==========
  static updateProjectProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (progress < 0 || progress > 100) {
      return ApiResponse.error(res, 'Tiến độ phải từ 0 đến 100', 400);
    }
    
    // Get old progress for event
    const oldProject = await projectService.getProjectById(id);
    const oldProgress = oldProject.success ? oldProject.data.progress : 0;
    
    const result = await projectService.updateProjectProgress(id, progress, userId);
    
    // Emit WebSocket event for project progress updated
    if (result.success && result.data) {
      websocketService.emitProjectProgressUpdated(result.data, req.user);
    }
    
    // Emit Kafka event for project progress updated
    if (result.success && result.data) {
      try {
        await ProjectEvents.emitProjectProgressUpdated(result.data, req.user, {
          previousProgress: oldProgress,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (eventError) {
        console.error('Failed to emit project progress updated event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT SEARCH ==========
  static searchProjects = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      status: req.query.status,
      site_id: req.query.site_id
    };

    const result = await projectService.searchProjects(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== PROJECT TIMELINE ==========
  static getProjectTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await projectService.getProjectTimeline(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static getAvailableEmployees = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await projectService.getAvailableEmployees();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectController;
>>>>>>> origin/main
