const projectService = require('../services/projectService');

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
