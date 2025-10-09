const ProjectMilestone = require('../models/projectMilestone');
const MilestoneDeliverable = require('../models/milestoneDeliverable');

class ProjectMilestoneRepository {
  // ========== BASIC CRUD ==========
  async getAllMilestones(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.milestone_name) {
        query.milestone_name = { $regex: filters.milestone_name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.responsible_user_id) {
        query.responsible_user_id = filters.responsible_user_id;
      }

      const milestones = await ProjectMilestone.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting milestones:', error);
      throw error;
    }
  }

  async getMilestoneById(id) {
    try {
      const milestone = await ProjectMilestone.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return milestone;
    } catch (error) {
      console.error('Error getting milestone by id:', error);
      throw error;
    }
  }

  async createMilestone(milestoneData) {
    try {
      const milestone = new ProjectMilestone(milestoneData);
      await milestone.save();
      
      return await this.getMilestoneById(milestone._id);
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  async updateMilestone(id, updateData) {
    try {
      const milestone = await ProjectMilestone.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return milestone;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  async deleteMilestone(id) {
    try {
      const milestone = await ProjectMilestone.findByIdAndDelete(id);
      return milestone;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  // ========== PROJECT MILESTONE QUERIES ==========
  async getProjectMilestones(projectId) {
    try {
      const milestones = await ProjectMilestone.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting project milestones:', error);
      throw error;
    }
  }


  async getUpcomingMilestones(days = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const milestones = await ProjectMilestone.find({
        planned_date: { $lte: futureDate, $gte: new Date() },
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      })
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      throw error;
    }
  }

  async getOverdueMilestones() {
    try {
      const milestones = await ProjectMilestone.find({
        planned_date: { $lt: new Date() },
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      })
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting overdue milestones:', error);
      throw error;
    }
  }

  async getMilestonesByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const milestones = await ProjectMilestone.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting milestones by status:', error);
      throw error;
    }
  }

  async getUserMilestones(userId, filters = {}) {
    try {
      const query = { responsible_user_id: userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const milestones = await ProjectMilestone.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error getting user milestones:', error);
      throw error;
    }
  }

  // ========== MILESTONE VALIDATION ==========
  async validateMilestone(milestoneData) {
    try {
      const errors = [];

      // Check required fields
      if (!milestoneData.project_id) {
        errors.push('Project ID is required');
      }
      if (!milestoneData.milestone_name) {
        errors.push('Milestone name is required');
      }
      if (!milestoneData.planned_date) {
        errors.push('Planned date is required');
      }
      if (!milestoneData.completion_criteria) {
        errors.push('Completion criteria is required');
      }
      if (!milestoneData.responsible_user_id) {
        errors.push('Responsible user is required');
      }

      // Check if planned date is in the future
      if (milestoneData.planned_date && new Date(milestoneData.planned_date) < new Date()) {
        errors.push('Planned date cannot be in the past');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating milestone:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== MILESTONE ANALYTICS ==========
  async getMilestoneAnalytics(projectId) {
    try {
      const milestones = await ProjectMilestone.find({ project_id: projectId });
      
      const analytics = {
        total_milestones: milestones.length,
        completed_milestones: milestones.filter(m => m.status === 'COMPLETED').length,
        in_progress_milestones: milestones.filter(m => m.status === 'IN_PROGRESS').length,
        pending_milestones: milestones.filter(m => m.status === 'PENDING').length,
        overdue_milestones: milestones.filter(m => {
          if (m.planned_date && m.status !== 'COMPLETED') {
            return new Date(m.planned_date) < new Date();
          }
          return false;
        }).length,
        milestones_by_status: milestones.reduce((acc, milestone) => {
          acc[milestone.status] = (acc[milestone.status] || 0) + 1;
          return acc;
        }, {}),
        completion_rate: milestones.length > 0 ? 
          (milestones.filter(m => m.status === 'COMPLETED').length / milestones.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting milestone analytics:', error);
      throw error;
    }
  }

  async getMilestoneStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const milestones = await ProjectMilestone.find(query);
      
      const stats = {
        total_milestones: milestones.length,
        milestones_by_status: milestones.reduce((acc, milestone) => {
          acc[milestone.status] = (acc[milestone.status] || 0) + 1;
          return acc;
        }, {}),
        milestones_by_project: milestones.reduce((acc, milestone) => {
          const projectId = milestone.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        completed_milestones: milestones.filter(m => m.status === 'COMPLETED').length,
        overdue_milestones: milestones.filter(m => {
          if (m.planned_date && m.status !== 'COMPLETED') {
            return new Date(m.planned_date) < new Date();
          }
          return false;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting milestone stats:', error);
      throw error;
    }
  }

  // ========== DELIVERABLES ==========
  async getMilestoneDeliverables(milestoneId) {
    try {
      const deliverables = await MilestoneDeliverable.find({ milestone_id: milestoneId })
        .populate('milestone_id', 'milestone_name')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ created_at: -1 });

      return deliverables;
    } catch (error) {
      console.error('Error getting milestone deliverables:', error);
      throw error;
    }
  }

  async createDeliverable(deliverableData) {
    try {
      const deliverable = new MilestoneDeliverable(deliverableData);
      await deliverable.save();
      
      return await this.getMilestoneDeliverables(deliverable.milestone_id);
    } catch (error) {
      console.error('Error creating deliverable:', error);
      throw error;
    }
  }

  async updateDeliverable(id, updateData) {
    try {
      const deliverable = await MilestoneDeliverable.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('milestone_id', 'milestone_name')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return deliverable;
    } catch (error) {
      console.error('Error updating deliverable:', error);
      throw error;
    }
  }

  async deleteDeliverable(id) {
    try {
      const deliverable = await MilestoneDeliverable.findByIdAndDelete(id);
      return deliverable;
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      throw error;
    }
  }

  // ========== MILESTONE MANAGEMENT ==========
  async completeMilestone(id, actualDate = null) {
    try {
      const updateData = {
        status: 'COMPLETED',
        actual_date: actualDate || new Date(),
        completed_at: new Date()
      };

      return await this.updateMilestone(id, updateData);
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  async startMilestone(id) {
    try {
      return await this.updateMilestone(id, { 
        status: 'IN_PROGRESS',
        started_at: new Date()
      });
    } catch (error) {
      console.error('Error starting milestone:', error);
      throw error;
    }
  }

  async cancelMilestone(id, reason) {
    try {
      return await this.updateMilestone(id, { 
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_at: new Date()
      });
    } catch (error) {
      console.error('Error cancelling milestone:', error);
      throw error;
    }
  }

  // ========== MILESTONE SEARCH ==========
  async searchMilestones(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { milestone_name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.responsible_user_id) {
        query.responsible_user_id = filters.responsible_user_id;
      }

      const milestones = await ProjectMilestone.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('responsible_user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ planned_date: 1 });

      return milestones;
    } catch (error) {
      console.error('Error searching milestones:', error);
      throw error;
    }
  }

  // ========== MILESTONE REPORTS ==========
  async generateMilestoneReport(projectId) {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const analytics = await this.getMilestoneAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        milestones: milestones,
        analytics: analytics,
        summary: {
          total_milestones: analytics.total_milestones,
          completed_milestones: analytics.completed_milestones,
          completion_rate: analytics.completion_rate,
          overdue_milestones: analytics.overdue_milestones
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating milestone report:', error);
      throw error;
    }
  }

  // ========== ADDITIONAL MILESTONE DELIVERABLE METHODS ==========
  async addMilestoneDeliverable(milestoneId, deliverableData, createdBy) {
    try {
      const deliverable = new MilestoneDeliverable({
        milestone_id: milestoneId,
        ...deliverableData,
        created_by: createdBy,
        status: 'DRAFT'
      });

      await deliverable.save();
      return deliverable;
    } catch (error) {
      console.error('Error adding milestone deliverable:', error);
      throw error;
    }
  }

  async updateMilestoneDeliverable(deliverableId, updateData, updatedBy) {
    try {
      const deliverable = await MilestoneDeliverable.findByIdAndUpdate(
        deliverableId,
        {
          ...updateData,
          updated_by: updatedBy,
          updated_at: new Date()
        },
        { new: true }
      ).populate('milestone_id', 'milestone_name')
       .populate('created_by', 'full_name email')
       .populate('updated_by', 'full_name email');

      if (!deliverable) {
        throw new Error('Milestone deliverable not found');
      }

      return deliverable;
    } catch (error) {
      console.error('Error updating milestone deliverable:', error);
      throw error;
    }
  }

  async submitDeliverable(deliverableId, submissionNote, submittedBy) {
    try {
      const deliverable = await MilestoneDeliverable.findByIdAndUpdate(
        deliverableId,
        {
          status: 'SUBMITTED',
          submission_note: submissionNote,
          submitted_by: submittedBy,
          submitted_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      ).populate('milestone_id', 'milestone_name')
       .populate('created_by', 'full_name email')
       .populate('submitted_by', 'full_name email');

      if (!deliverable) {
        throw new Error('Milestone deliverable not found');
      }

      return deliverable;
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      throw error;
    }
  }

  async reviewDeliverable(deliverableId, reviewStatus, reviewNote, reviewedBy) {
    try {
      const deliverable = await MilestoneDeliverable.findByIdAndUpdate(
        deliverableId,
        {
          status: reviewStatus,
          review_note: reviewNote,
          reviewed_by: reviewedBy,
          reviewed_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      ).populate('milestone_id', 'milestone_name')
       .populate('created_by', 'full_name email')
       .populate('reviewed_by', 'full_name email');

      if (!deliverable) {
        throw new Error('Milestone deliverable not found');
      }

      return deliverable;
    } catch (error) {
      console.error('Error reviewing deliverable:', error);
      throw error;
    }
  }
}

module.exports = new ProjectMilestoneRepository();
