const projectRepository = require('../repository/projectRepository');
const User = require('../models/user');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectService {
  // ========== PROJECT MANAGEMENT ==========
  async getAllProjects(filters = {}) {
    try {
      const projects = await projectRepository.getAllProjects(filters);
      return createResponse(200, 'Lấy danh sách dự án thành công',
        transformDocumentsId(projects, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error getting projects:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách dự án', null, error.message);
    }
  }

  async getProjectById(id) {
    try {
      const project = await projectRepository.getProjectById(id);
      
      if (!project) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      // Get project assignments
      const assignments = await projectRepository.getProjectAssignments(id);
      
      return createResponse(200, 'Lấy thông tin dự án thành công', {
        ...transformDocumentId(project, POPULATED_FIELDS.PROJECT),
        assignments: transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT)
      });
    } catch (error) {
      console.error('Error getting project:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin dự án', null, error.message);
    }
  }

  async createProject(projectData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['project_name', 'description', 'start_date', 'end_date', 'leader_id', 'site_name'];
      for (const field of requiredFields) {
        if (!projectData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate dates
      if (new Date(projectData.start_date) >= new Date(projectData.end_date)) {
        return createResponse(400, 'Ngày kết thúc phải sau ngày bắt đầu');
      }

      // Check if leader exists
      const leader = await User.findById(projectData.leader_id);
      if (!leader) {
        return createResponse(404, 'Không tìm thấy trưởng dự án');
      }

      // Handle site_name - create or find site
      const Site = require('../models/site');
      let site;
      
      // Try to find existing site by name
      site = await Site.findOne({ site_name: projectData.site_name });
      
      // If site doesn't exist, create a new one
      if (!site) {
        site = new Site({
          site_name: projectData.site_name,
          address: projectData.site_name, // Use site_name as address if not provided
          is_active: true
        });
        await site.save();
      }

      // Replace site_name with site_id in projectData
      const projectDataWithSiteId = {
        ...projectData,
        site_id: site._id
      };
      delete projectDataWithSiteId.site_name;

      const project = await projectRepository.createProject(projectDataWithSiteId);
      
      return createResponse(201, 'Tạo dự án thành công',
        transformDocumentId(project, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error creating project:', error);
      return createResponse(500, 'Lỗi khi tạo dự án', null, error.message);
    }
  }

  async updateProject(id, updateData, userId) {
    try {
      const existingProject = await projectRepository.getProjectById(id);
      if (!existingProject) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      // Validate dates if provided
      if (updateData.start_date && updateData.end_date) {
        if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
          return createResponse(400, 'Ngày kết thúc phải sau ngày bắt đầu');
        }
      }

      // Handle site_name if provided
      if (updateData.site_name) {
        const Site = require('../models/site');
        let site;
        
        // Try to find existing site by name
        site = await Site.findOne({ site_name: updateData.site_name });
        
        // If site doesn't exist, create a new one
        if (!site) {
          site = new Site({
            site_name: updateData.site_name,
            address: updateData.site_name,
            is_active: true
          });
          await site.save();
        }

        // Replace site_name with site_id
        updateData.site_id = site._id;
        delete updateData.site_name;
      }

      const project = await projectRepository.updateProject(id, updateData);
      
      return createResponse(200, 'Cập nhật dự án thành công',
        transformDocumentId(project, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error updating project:', error);
      return createResponse(500, 'Lỗi khi cập nhật dự án', null, error.message);
    }
  }

  async deleteProject(id, userId) {
    try {
      const project = await projectRepository.getProjectById(id);
      if (!project) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      // Check if user has permission to delete (only leader or admin)
      if (project.leader_id.toString() !== userId) {
        // Check if user is admin
        const user = await User.findById(userId);
        if (!user || user.role_id.toString() !== 'admin') {
          return createResponse(403, 'Bạn không có quyền xóa dự án này');
        }
      }

      const result = await projectRepository.deleteProject(id);
      
      if (result) {
        return createResponse(200, 'Xóa dự án thành công');
      } else {
        return createResponse(400, 'Không thể xóa dự án');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      return createResponse(500, 'Lỗi khi xóa dự án', null, error.message);
    }
  }

  // ========== PROJECT STATISTICS ==========
  async getProjectStats() {
    try {
      const stats = await projectRepository.getProjectStats();
      return createResponse(200, 'Lấy thống kê dự án thành công', stats);
    } catch (error) {
      console.error('Error getting project stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê dự án', null, error.message);
    }
  }

  // ========== PROJECT ASSIGNMENTS ==========
  async getProjectAssignments(projectId) {
    try {
      const assignments = await projectRepository.getProjectAssignments(projectId);
      return createResponse(200, 'Lấy danh sách thành viên dự án thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting project assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách thành viên dự án', null, error.message);
    }
  }

  async addProjectAssignment(assignmentData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['project_id', 'user_id', 'role_in_project', 'start_date'];
      for (const field of requiredFields) {
        if (!assignmentData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Check if project exists
      const project = await projectRepository.getProjectById(assignmentData.project_id);
      if (!project) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      // Check if user exists
      const user = await User.findById(assignmentData.user_id);
      if (!user) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      // Check if user is already assigned to this project
      const existingAssignment = await projectRepository.getProjectAssignments(assignmentData.project_id);
      const isAlreadyAssigned = existingAssignment.some(
        assignment => assignment.user_id._id.toString() === assignmentData.user_id
      );

      if (isAlreadyAssigned) {
        return createResponse(400, 'Người dùng đã được phân công vào dự án này');
      }

      const assignment = await projectRepository.addProjectAssignment(assignmentData);
      
      return createResponse(201, 'Thêm thành viên vào dự án thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error adding project assignment:', error);
      return createResponse(500, 'Lỗi khi thêm thành viên vào dự án', null, error.message);
    }
  }

  async updateProjectAssignment(id, updateData, userId) {
    try {
      const assignment = await projectRepository.updateProjectAssignment(id, updateData);
      
      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công dự án');
      }

      return createResponse(200, 'Cập nhật phân công dự án thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PROJECT_ASSIGNMENT));
    } catch (error) {
      console.error('Error updating project assignment:', error);
      return createResponse(500, 'Lỗi khi cập nhật phân công dự án', null, error.message);
    }
  }

  async removeProjectAssignment(id, userId) {
    try {
      const result = await projectRepository.removeProjectAssignment(id);
      
      if (result) {
        return createResponse(200, 'Xóa phân công dự án thành công');
      } else {
        return createResponse(404, 'Không tìm thấy phân công dự án');
      }
    } catch (error) {
      console.error('Error removing project assignment:', error);
      return createResponse(500, 'Lỗi khi xóa phân công dự án', null, error.message);
    }
  }

  // ========== USER PROJECTS ==========
  async getUserProjects(userId) {
    try {
      const projects = await projectRepository.getUserProjects(userId);
      return createResponse(200, 'Lấy danh sách dự án của người dùng thành công',
        transformDocumentsId(projects, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error getting user projects:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách dự án của người dùng', null, error.message);
    }
  }

  // ========== SITE MANAGEMENT ==========
  async getAllSites(filters = {}) {
    try {
      const sites = await projectRepository.getAllSites(filters);
      return createResponse(200, 'Lấy danh sách địa điểm thành công',
        transformDocumentsId(sites, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error getting sites:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm', null, error.message);
    }
  }

  async getSiteById(id) {
    try {
      const site = await projectRepository.getSiteById(id);
      
      if (!site) {
        return createResponse(404, 'Không tìm thấy địa điểm');
      }

      return createResponse(200, 'Lấy thông tin địa điểm thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error getting site:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin địa điểm', null, error.message);
    }
  }

  async createSite(siteData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['site_name', 'address'];
      for (const field of requiredFields) {
        if (!siteData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      const site = await projectRepository.createSite(siteData);
      
      return createResponse(201, 'Tạo địa điểm thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error creating site:', error);
      return createResponse(500, 'Lỗi khi tạo địa điểm', null, error.message);
    }
  }

  async updateSite(id, updateData, userId) {
    try {
      const site = await projectRepository.updateSite(id, updateData);
      
      if (!site) {
        return createResponse(404, 'Không tìm thấy địa điểm');
      }

      return createResponse(200, 'Cập nhật địa điểm thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error updating site:', error);
      return createResponse(500, 'Lỗi khi cập nhật địa điểm', null, error.message);
    }
  }

  async deleteSite(id, userId) {
    try {
      // Check if site is being used by any projects
      const projects = await projectRepository.getAllProjects({ site_id: id });
      if (projects.length > 0) {
        return createResponse(400, 'Không thể xóa địa điểm đang được sử dụng bởi các dự án');
      }

      const result = await projectRepository.deleteSite(id);
      
      if (result) {
        return createResponse(200, 'Xóa địa điểm thành công');
      } else {
        return createResponse(404, 'Không tìm thấy địa điểm');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      return createResponse(500, 'Lỗi khi xóa địa điểm', null, error.message);
    }
  }

  // ========== PROJECT PROGRESS ==========
  async updateProjectProgress(id, progress, userId) {
    try {
      const project = await projectRepository.getProjectById(id);
      if (!project) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      // Check if user has permission to update progress
      if (project.leader_id.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role_id.toString() !== 'admin') {
          return createResponse(403, 'Bạn không có quyền cập nhật tiến độ dự án này');
        }
      }

      const updatedProject = await projectRepository.updateProjectProgress(id, progress);
      
      return createResponse(200, 'Cập nhật tiến độ dự án thành công',
        transformDocumentId(updatedProject, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error updating project progress:', error);
      return createResponse(500, 'Lỗi khi cập nhật tiến độ dự án', null, error.message);
    }
  }

  // ========== PROJECT SEARCH ==========
  async searchProjects(searchTerm, filters = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return createResponse(400, 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
      }

      const projects = await projectRepository.searchProjects(searchTerm, filters);
      
      return createResponse(200, `Tìm thấy ${projects.length} dự án`,
        transformDocumentsId(projects, POPULATED_FIELDS.PROJECT));
    } catch (error) {
      console.error('Error searching projects:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm dự án', null, error.message);
    }
  }

  // ========== PROJECT TIMELINE ==========
  async getProjectTimeline(projectId) {
    try {
      const timeline = await projectRepository.getProjectTimeline(projectId);
      
      if (!timeline) {
        return createResponse(404, 'Không tìm thấy dự án');
      }

      return createResponse(200, 'Lấy timeline dự án thành công', timeline);
    } catch (error) {
      console.error('Error getting project timeline:', error);
      return createResponse(500, 'Lỗi khi lấy timeline dự án', null, error.message);
    }
  }

  async getAvailableEmployees() {
    try {
      // Get all users with role 'employee' and active status
      const employees = await User.find({ 
        is_active: true 
      })
      .populate('role_id', 'role_name')
      .populate('department_id', 'department_name')
      .populate('position_id', 'position_name')
      .select('username email full_name phone role_id department_id position_id');

      // Filter only employees (role_name = 'employee')
      const filteredEmployees = employees.filter(user => 
        user.role_id && user.role_id.role_name === 'employee'
      );

      return createResponse(200, 'Lấy danh sách nhân viên thành công',
        filteredEmployees.map(employee => ({
          id: employee._id,
          username: employee.username,
          email: employee.email,
          full_name: employee.full_name,
          phone: employee.phone,
          role: employee.role_id,
          department: employee.department_id,
          position: employee.position_id
        })));
    } catch (error) {
      console.error('Error getting available employees:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhân viên', null, error.message);
    }
  }
}

module.exports = new ProjectService();