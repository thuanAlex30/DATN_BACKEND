const ProjectPhase = require('../models/projectPhase');
const Project = require('../models/project');
const ProjectTask = require('../models/projectTask');

class ProjectPhaseRepository {
  // ========== BASIC CRUD ==========
  async getAllPhases(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.phase_name) {
        query.phase_name = { $regex: filters.phase_name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
      }

      const phases = await ProjectPhase.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ phase_order: 1, created_at: -1 });

      return phases;
    } catch (error) {
      console.error('Error getting phases:', error);
      throw error;
    }
  }

  async getPhaseById(id) {
    try {
      const phase = await ProjectPhase.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return phase;
    } catch (error) {
      console.error('Error getting phase by id:', error);
      throw error;
    }
  }

  async createPhase(phaseData) {
    try {
      const phase = new ProjectPhase(phaseData);
      await phase.save();
      
      return await this.getPhaseById(phase._id);
    } catch (error) {
      console.error('Error creating phase:', error);
      throw error;
    }
  }

  async updatePhase(id, updateData) {
    try {
      const phase = await ProjectPhase.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return phase;
    } catch (error) {
      console.error('Error updating phase:', error);
      throw error;
    }
  }

  async deletePhase(id) {
    try {
      const phase = await ProjectPhase.findByIdAndDelete(id);
      return phase;
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }

  // ========== PROJECT PHASE QUERIES ==========
  async getProjectPhases(projectId) {
    try {
      const phases = await ProjectPhase.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ phase_order: 1 });

      return phases;
    } catch (error) {
      console.error('Error getting project phases:', error);
      throw error;
    }
  }

  async getActivePhases(projectId = null) {
    try {
      const query = { is_active: true };
      if (projectId) {
        query.project_id = projectId;
      }

      const phases = await ProjectPhase.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ phase_order: 1 });

      return phases;
    } catch (error) {
      console.error('Error getting active phases:', error);
      throw error;
    }
  }

  async getPhasesByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const phases = await ProjectPhase.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ phase_order: 1 });

      return phases;
    } catch (error) {
      console.error('Error getting phases by status:', error);
      throw error;
    }
  }

  // ========== PHASE VALIDATION ==========
  async validatePhase(phaseData) {
    try {
      const errors = [];

      // Check required fields
      if (!phaseData.project_id) {
        errors.push('Project ID is required');
      }
      if (!phaseData.phase_name) {
        errors.push('Phase name is required');
      }
      if (!phaseData.phase_order) {
        errors.push('Phase order is required');
      }

      // Check if project exists
      if (phaseData.project_id) {
        const project = await Project.findById(phaseData.project_id);
        if (!project) {
          errors.push('Project not found');
        }
      }

      // Check for duplicate phase order in same project
      if (phaseData.project_id && phaseData.phase_order) {
        const existingPhase = await ProjectPhase.findOne({
          project_id: phaseData.project_id,
          phase_order: phaseData.phase_order,
          _id: { $ne: phaseData._id }
        });
        if (existingPhase) {
          errors.push('Phase order already exists in this project');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating phase:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== PHASE ANALYTICS ==========
  async getPhaseAnalytics(projectId) {
    try {
      const phases = await ProjectPhase.find({ project_id: projectId });
      
      const analytics = {
        total_phases: phases.length,
        active_phases: phases.filter(p => p.is_active).length,
        completed_phases: phases.filter(p => p.status === 'COMPLETED').length,
        in_progress_phases: phases.filter(p => p.status === 'IN_PROGRESS').length,
        pending_phases: phases.filter(p => p.status === 'PENDING').length,
        phases_by_status: phases.reduce((acc, phase) => {
          acc[phase.status] = (acc[phase.status] || 0) + 1;
          return acc;
        }, {}),
        average_duration: phases.reduce((sum, phase) => {
          if (phase.planned_start_date && phase.planned_end_date) {
            const duration = new Date(phase.planned_end_date) - new Date(phase.planned_start_date);
            return sum + duration;
          }
          return sum;
        }, 0) / phases.length || 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting phase analytics:', error);
      throw error;
    }
  }

  async getPhaseStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const phases = await ProjectPhase.find(query);
      
      const stats = {
        total_phases: phases.length,
        phases_by_status: phases.reduce((acc, phase) => {
          acc[phase.status] = (acc[phase.status] || 0) + 1;
          return acc;
        }, {}),
        phases_by_project: phases.reduce((acc, phase) => {
          const projectId = phase.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        active_phases: phases.filter(p => p.is_active).length,
        completed_phases: phases.filter(p => p.status === 'COMPLETED').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting phase stats:', error);
      throw error;
    }
  }

  // ========== PHASE TASKS ==========
  async getPhaseTasks(phaseId) {
    try {
      const tasks = await ProjectTask.find({ phase_id: phaseId })
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting phase tasks:', error);
      throw error;
    }
  }

  async getPhaseTaskStats(phaseId) {
    try {
      const tasks = await ProjectTask.find({ phase_id: phaseId });
      
      const stats = {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'COMPLETED').length,
        in_progress_tasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        pending_tasks: tasks.filter(t => t.status === 'PENDING').length,
        overdue_tasks: tasks.filter(t => {
          if (t.planned_end_date && t.status !== 'COMPLETED') {
            return new Date(t.planned_end_date) < new Date();
          }
          return false;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting phase task stats:', error);
      throw error;
    }
  }

  // ========== PHASE SEARCH ==========
  async searchPhases(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { phase_name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
      }

      const phases = await ProjectPhase.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ phase_order: 1 });

      return phases;
    } catch (error) {
      console.error('Error searching phases:', error);
      throw error;
    }
  }

  // ========== PHASE MANAGEMENT ==========
  async updatePhaseOrder(projectId, phaseOrders) {
    try {
      const bulkOps = phaseOrders.map(({ phaseId, order }) => ({
        updateOne: {
          filter: { _id: phaseId, project_id: projectId },
          update: { phase_order: order, updated_at: new Date() }
        }
      }));

      await ProjectPhase.bulkWrite(bulkOps);
      return await this.getProjectPhases(projectId);
    } catch (error) {
      console.error('Error updating phase order:', error);
      throw error;
    }
  }

  async activatePhase(id) {
    try {
      return await this.updatePhase(id, { is_active: true });
    } catch (error) {
      console.error('Error activating phase:', error);
      throw error;
    }
  }

  async deactivatePhase(id) {
    try {
      return await this.updatePhase(id, { is_active: false });
    } catch (error) {
      console.error('Error deactivating phase:', error);
      throw error;
    }
  }

  async completePhase(id) {
    try {
      return await this.updatePhase(id, { 
        status: 'COMPLETED', 
        actual_end_date: new Date() 
      });
    } catch (error) {
      console.error('Error completing phase:', error);
      throw error;
    }
  }

  // ========== PHASE REPORTS ==========
  async generatePhaseReport(projectId) {
    try {
      const phases = await this.getProjectPhases(projectId);
      const analytics = await this.getPhaseAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        phases: phases,
        analytics: analytics,
        summary: {
          total_phases: analytics.total_phases,
          completed_phases: analytics.completed_phases,
          completion_rate: analytics.total_phases > 0 ? 
            (analytics.completed_phases / analytics.total_phases * 100).toFixed(2) : 0
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating phase report:', error);
      throw error;
    }
  }
}

module.exports = new ProjectPhaseRepository();
