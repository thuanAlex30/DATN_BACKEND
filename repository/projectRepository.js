const Project = require('../models/project');
const Site = require('../models/site');
const ProjectAssignment = require('../models/projectAssignment');
const User = require('../models/user');

class ProjectRepository {
  // ========== PROJECT CRUD ==========
  async getAllProjects(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.site_id) {
      query.site_id = filters.site_id;
    }
    
    if (filters.leader_id) {
      query.leader_id = filters.leader_id;
    }
    
    if (filters.search) {
      query.$or = [
        { project_name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('leader_id', 'full_name email phone')
      .populate('site_id', 'site_name address')
      .sort({ created_at: -1 });

    // Transform _id to id for frontend compatibility
    return projects.map(project => {
      const projectObj = project.toObject();
      projectObj.id = projectObj._id;
      delete projectObj._id;
      return projectObj;
    });
  }

  async getProjectById(id) {
    const project = await Project.findById(id)
      .populate('leader_id', 'full_name email phone')
      .populate('site_id', 'site_name address coordinates contact_person contact_phone contact_email');
    
    if (!project) return null;
    
    // Transform _id to id for frontend compatibility
    const projectObj = project.toObject();
    projectObj.id = projectObj._id;
    delete projectObj._id;
    return projectObj;
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    await project.save();
    
    return await this.getProjectById(project._id);
  }

  async updateProject(id, updateData) {
    const project = await Project.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    
    if (!project) return null;
    
    // Transform _id to id for frontend compatibility
    const projectObj = project.toObject();
    projectObj.id = projectObj._id;
    delete projectObj._id;
    return projectObj;
  }

  async deleteProject(id) {
    const result = await Project.findByIdAndDelete(id);
    return !!result;
  }

  // ========== PROJECT STATISTICS ==========
  async getProjectStats() {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      result[stat._id] = stat.count;
    });

    return result;
  }

  // ========== PROJECT ASSIGNMENTS ==========
  async getProjectAssignments(projectId) {
    const assignments = await ProjectAssignment.find({ project_id: projectId })
      .populate('user_id', 'full_name email phone')
      .sort({ created_at: -1 });

    // Transform _id to id for frontend compatibility
    return assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      assignmentObj.id = assignmentObj._id;
      delete assignmentObj._id;
      return assignmentObj;
    });
  }

  async addProjectAssignment(assignmentData) {
    const assignment = new ProjectAssignment(assignmentData);
    await assignment.save();
    
    const savedAssignment = await ProjectAssignment.findById(assignment._id)
      .populate('user_id', 'full_name email phone');
    
    if (!savedAssignment) return null;
    
    // Transform _id to id for frontend compatibility
    const assignmentObj = savedAssignment.toObject();
    assignmentObj.id = assignmentObj._id;
    delete assignmentObj._id;
    return assignmentObj;
  }

  async updateProjectAssignment(id, updateData) {
    const assignment = await ProjectAssignment.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    ).populate('user_id', 'full_name email phone');
    
    if (!assignment) return null;
    
    // Transform _id to id for frontend compatibility
    const assignmentObj = assignment.toObject();
    assignmentObj.id = assignmentObj._id;
    delete assignmentObj._id;
    return assignmentObj;
  }

  async removeProjectAssignment(id) {
    const result = await ProjectAssignment.findByIdAndDelete(id);
    return !!result;
  }

  async getUserProjects(userId) {
    const assignments = await ProjectAssignment.find({ user_id: userId })
      .populate({
        path: 'project_id',
        populate: [
          { path: 'leader_id', select: 'full_name email phone' },
          { path: 'site_id', select: 'site_name address' }
        ]
      });

    return assignments.map(assignment => ({
      ...assignment.project_id.toObject(),
      role_in_project: assignment.role_in_project,
      assignment_start_date: assignment.start_date,
      assignment_end_date: assignment.end_date,
      assignment_status: assignment.status
    }));
  }

  // ========== SITE MANAGEMENT ==========
  async getAllSites(filters = {}) {
    const query = {};
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    if (filters.search) {
      query.$or = [
        { site_name: { $regex: filters.search, $options: 'i' } },
        { address: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sites = await Site.find(query).sort({ site_name: 1 });
    
    // Transform _id to id for frontend compatibility
    return sites.map(site => {
      const siteObj = site.toObject();
      siteObj.id = siteObj._id;
      delete siteObj._id;
      return siteObj;
    });
  }

  async getSiteById(id) {
    const site = await Site.findById(id);
    
    if (!site) return null;
    
    // Transform _id to id for frontend compatibility
    const siteObj = site.toObject();
    siteObj.id = siteObj._id;
    delete siteObj._id;
    return siteObj;
  }

  async createSite(siteData) {
    const site = new Site(siteData);
    await site.save();
    
    // Transform _id to id for frontend compatibility
    const siteObj = site.toObject();
    siteObj.id = siteObj._id;
    delete siteObj._id;
    return siteObj;
  }

  async updateSite(id, updateData) {
    const site = await Site.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    
    if (!site) return null;
    
    // Transform _id to id for frontend compatibility
    const siteObj = site.toObject();
    siteObj.id = siteObj._id;
    delete siteObj._id;
    return siteObj;
  }

  async deleteSite(id) {
    const result = await Site.findByIdAndDelete(id);
    return !!result;
  }

  // ========== PROJECT PROGRESS ==========
  async updateProjectProgress(id, progress) {
    const project = await Project.findByIdAndUpdate(
      id,
      { progress: Math.max(0, Math.min(100, progress)), updated_at: new Date() },
      { new: true }
    );
    
    if (!project) return null;
    
    // Transform _id to id for frontend compatibility
    const projectObj = project.toObject();
    projectObj.id = projectObj._id;
    delete projectObj._id;
    return projectObj;
  }

  // ========== PROJECT SEARCH ==========
  async searchProjects(searchTerm, filters = {}) {
    const query = {
      $or: [
        { project_name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.site_id) {
      query.site_id = filters.site_id;
    }

    const projects = await Project.find(query)
      .populate('leader_id', 'full_name email phone')
      .populate('site_id', 'site_name address')
      .sort({ created_at: -1 });

    // Transform _id to id for frontend compatibility
    return projects.map(project => {
      const projectObj = project.toObject();
      projectObj.id = projectObj._id;
      delete projectObj._id;
      return projectObj;
    });
  }

  // ========== PROJECT TIMELINE ==========
  async getProjectTimeline(projectId) {
    const project = await Project.findById(projectId)
      .populate('leader_id', 'full_name')
      .populate('site_id', 'site_name address');

    if (!project) {
      return null;
    }

    const assignments = await ProjectAssignment.find({ project_id: projectId })
      .populate('user_id', 'full_name')
      .sort({ created_at: -1 });

    return {
      project: {
        ...project.toObject(),
        id: project._id
      },
      assignments: assignments.map(assignment => {
        const assignmentObj = assignment.toObject();
        assignmentObj.id = assignmentObj._id;
        delete assignmentObj._id;
        return assignmentObj;
      }),
      timeline: {
        start_date: project.start_date,
        end_date: project.end_date,
        current_progress: project.progress,
        status: project.status
      }
    };
  }
}

module.exports = new ProjectRepository();
