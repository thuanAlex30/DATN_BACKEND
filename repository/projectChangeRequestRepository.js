const ProjectChangeRequest = require('../models/projectChangeRequest');

class ProjectChangeRequestRepository {
  // ========== BASIC CRUD ==========
  async getAllChangeRequests(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.requested_by) {
        query.requested_by = filters.requested_by;
      }
      if (filters.approved_by) {
        query.approved_by = filters.approved_by;
      }
      if (filters.change_type) {
        query.change_type = filters.change_type;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting change requests:', error);
      throw error;
    }
  }

  async getChangeRequestById(id) {
    try {
      const changeRequest = await ProjectChangeRequest.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return changeRequest;
    } catch (error) {
      console.error('Error getting change request by id:', error);
      throw error;
    }
  }

  async createChangeRequest(changeRequestData) {
    try {
      const changeRequest = new ProjectChangeRequest(changeRequestData);
      await changeRequest.save();
      
      return await this.getChangeRequestById(changeRequest._id);
    } catch (error) {
      console.error('Error creating change request:', error);
      throw error;
    }
  }

  async updateChangeRequest(id, updateData) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return changeRequest;
    } catch (error) {
      console.error('Error updating change request:', error);
      throw error;
    }
  }

  async deleteChangeRequest(id) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndDelete(id);
      return changeRequest;
    } catch (error) {
      console.error('Error deleting change request:', error);
      throw error;
    }
  }

  // ========== PROJECT CHANGE REQUEST QUERIES ==========
  async getProjectChangeRequests(projectId) {
    try {
      const changeRequests = await ProjectChangeRequest.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting project change requests:', error);
      throw error;
    }
  }

  async getChangeRequestsByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting change requests by status:', error);
      throw error;
    }
  }

  async getChangeRequestsByPriority(priority, projectId = null) {
    try {
      const query = { priority };
      if (projectId) {
        query.project_id = projectId;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting change requests by priority:', error);
      throw error;
    }
  }

  async getUserChangeRequests(userId, filters = {}) {
    try {
      const query = { requested_by: userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting user change requests:', error);
      throw error;
    }
  }

  async getPendingChangeRequests(projectId = null) {
    try {
      const query = { status: 'PENDING' };
      if (projectId) {
        query.project_id = projectId;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ priority: -1, requested_at: 1 });

      return changeRequests;
    } catch (error) {
      console.error('Error getting pending change requests:', error);
      throw error;
    }
  }

  // ========== CHANGE REQUEST VALIDATION ==========
  async validateChangeRequest(changeRequestData) {
    try {
      const errors = [];

      // Check required fields
      if (!changeRequestData.project_id) {
        errors.push('Project ID is required');
      }
      if (!changeRequestData.requested_by) {
        errors.push('Requested by is required');
      }
      if (!changeRequestData.change_type) {
        errors.push('Change type is required');
      }
      if (!changeRequestData.description) {
        errors.push('Description is required');
      }
      if (!changeRequestData.priority) {
        errors.push('Priority is required');
      }

      // Check if change type is valid
      const validChangeTypes = ['SCOPE', 'SCHEDULE', 'BUDGET', 'RESOURCE', 'QUALITY', 'RISK', 'OTHER'];
      if (changeRequestData.change_type && !validChangeTypes.includes(changeRequestData.change_type)) {
        errors.push('Invalid change type');
      }

      // Check if priority is valid
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (changeRequestData.priority && !validPriorities.includes(changeRequestData.priority)) {
        errors.push('Invalid priority level');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating change request:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== CHANGE REQUEST ANALYTICS ==========
  async getChangeRequestAnalytics(projectId) {
    try {
      const changeRequests = await ProjectChangeRequest.find({ project_id: projectId });
      
      const analytics = {
        total_change_requests: changeRequests.length,
        pending_requests: changeRequests.filter(cr => cr.status === 'PENDING').length,
        approved_requests: changeRequests.filter(cr => cr.status === 'APPROVED').length,
        rejected_requests: changeRequests.filter(cr => cr.status === 'REJECTED').length,
        implemented_requests: changeRequests.filter(cr => cr.status === 'IMPLEMENTED').length,
        cancelled_requests: changeRequests.filter(cr => cr.status === 'CANCELLED').length,
        requests_by_status: changeRequests.reduce((acc, cr) => {
          acc[cr.status] = (acc[cr.status] || 0) + 1;
          return acc;
        }, {}),
        requests_by_priority: changeRequests.reduce((acc, cr) => {
          acc[cr.priority] = (acc[cr.priority] || 0) + 1;
          return acc;
        }, {}),
        requests_by_type: changeRequests.reduce((acc, cr) => {
          acc[cr.change_type] = (acc[cr.change_type] || 0) + 1;
          return acc;
        }, {}),
        approval_rate: changeRequests.length > 0 ? 
          (changeRequests.filter(cr => cr.status === 'APPROVED').length / changeRequests.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting change request analytics:', error);
      throw error;
    }
  }

  async getChangeRequestStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const changeRequests = await ProjectChangeRequest.find(query);
      
      const stats = {
        total_change_requests: changeRequests.length,
        requests_by_status: changeRequests.reduce((acc, cr) => {
          acc[cr.status] = (acc[cr.status] || 0) + 1;
          return acc;
        }, {}),
        requests_by_priority: changeRequests.reduce((acc, cr) => {
          acc[cr.priority] = (acc[cr.priority] || 0) + 1;
          return acc;
        }, {}),
        requests_by_type: changeRequests.reduce((acc, cr) => {
          acc[cr.change_type] = (acc[cr.change_type] || 0) + 1;
          return acc;
        }, {}),
        requests_by_project: changeRequests.reduce((acc, cr) => {
          const projectId = cr.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    } catch (error) {
      console.error('Error getting change request stats:', error);
      throw error;
    }
  }

  // ========== CHANGE REQUEST MANAGEMENT ==========
  async approveChangeRequest(id, approvedBy, comments = '') {
    try {
      const updateData = {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date(),
        approval_comments: comments
      };

      return await this.updateChangeRequest(id, updateData);
    } catch (error) {
      console.error('Error approving change request:', error);
      throw error;
    }
  }

  async rejectChangeRequest(id, rejectedBy, reason) {
    try {
      const updateData = {
        status: 'REJECTED',
        rejected_by: rejectedBy,
        rejected_at: new Date(),
        rejection_reason: reason
      };

      return await this.updateChangeRequest(id, updateData);
    } catch (error) {
      console.error('Error rejecting change request:', error);
      throw error;
    }
  }

  async implementChangeRequest(id, implementedBy, implementationNotes = '') {
    try {
      const updateData = {
        status: 'IMPLEMENTED',
        implemented_by: implementedBy,
        implemented_at: new Date(),
        implementation_notes: implementationNotes
      };

      return await this.updateChangeRequest(id, updateData);
    } catch (error) {
      console.error('Error implementing change request:', error);
      throw error;
    }
  }

  async cancelChangeRequest(id, cancelledBy, reason) {
    try {
      const updateData = {
        status: 'CANCELLED',
        cancelled_by: cancelledBy,
        cancelled_at: new Date(),
        cancellation_reason: reason
      };

      return await this.updateChangeRequest(id, updateData);
    } catch (error) {
      console.error('Error cancelling change request:', error);
      throw error;
    }
  }

  // ========== CHANGE REQUEST SEARCH ==========
  async searchChangeRequests(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { justification: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.change_type) {
        query.change_type = filters.change_type;
      }

      const changeRequests = await ProjectChangeRequest.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ requested_at: -1 });

      return changeRequests;
    } catch (error) {
      console.error('Error searching change requests:', error);
      throw error;
    }
  }

  // ========== CHANGE REQUEST REPORTS ==========
  async generateChangeRequestReport(projectId) {
    try {
      const changeRequests = await this.getProjectChangeRequests(projectId);
      const analytics = await this.getChangeRequestAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        change_requests: changeRequests,
        analytics: analytics,
        summary: {
          total_change_requests: analytics.total_change_requests,
          pending_requests: analytics.pending_requests,
          approved_requests: analytics.approved_requests,
          approval_rate: analytics.approval_rate
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating change request report:', error);
      throw error;
    }
  }
}

module.exports = new ProjectChangeRequestRepository();
