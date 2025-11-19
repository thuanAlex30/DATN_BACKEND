const QualityCheckpoint = require('../models/qualityCheckpoint');

class QualityCheckpointRepository {
  // ========== BASIC CRUD ==========
  async getAllCheckpoints(filters = {}) {
    try {
      const query = {};
      
      if (filters.task_id) {
        query.task_id = filters.task_id;
      }
      if (filters.inspector_id) {
        query.inspector_id = filters.inspector_id;
      }
      if (filters.checkpoint_name) {
        query.checkpoint_name = { $regex: filters.checkpoint_name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.checkpoint_type) {
        query.checkpoint_type = filters.checkpoint_type;
      }

      const checkpoints = await QualityCheckpoint.find(query)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting checkpoints:', error);
      throw error;
    }
  }

  async getCheckpointById(id) {
    try {
      const checkpoint = await QualityCheckpoint.findById(id)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return checkpoint;
    } catch (error) {
      console.error('Error getting checkpoint by id:', error);
      throw error;
    }
  }

  async createCheckpoint(checkpointData) {
    try {
      const checkpoint = new QualityCheckpoint(checkpointData);
      await checkpoint.save();
      
      return await this.getCheckpointById(checkpoint._id);
    } catch (error) {
      console.error('Error creating checkpoint:', error);
      throw error;
    }
  }

  async updateCheckpoint(id, updateData) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return checkpoint;
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      throw error;
    }
  }

  async deleteCheckpoint(id) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndDelete(id);
      return checkpoint;
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      throw error;
    }
  }

  // ========== TASK CHECKPOINT QUERIES ==========
  async getTaskCheckpoints(taskId) {
    try {
      const checkpoints = await QualityCheckpoint.find({ task_id: taskId })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting task checkpoints:', error);
      throw error;
    }
  }

  async getCheckpointsByInspector(inspectorId, filters = {}) {
    try {
      const query = { inspector_id: inspectorId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.task_id) {
        query.task_id = filters.task_id;
      }

      const checkpoints = await QualityCheckpoint.find(query)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting checkpoints by inspector:', error);
      throw error;
    }
  }

  async getCheckpointsByStatus(status, taskId = null) {
    try {
      const query = { status };
      if (taskId) {
        query.task_id = taskId;
      }

      const checkpoints = await QualityCheckpoint.find(query)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting checkpoints by status:', error);
      throw error;
    }
  }

  async getScheduledCheckpoints(startDate, endDate) {
    try {
      const checkpoints = await QualityCheckpoint.find({
        scheduled_date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting scheduled checkpoints:', error);
      throw error;
    }
  }

  async getUpcomingCheckpoints(days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const checkpoints = await QualityCheckpoint.find({
        scheduled_date: { $lte: futureDate, $gte: new Date() },
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
      })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting upcoming checkpoints:', error);
      throw error;
    }
  }

  async getOverdueCheckpoints() {
    try {
      const checkpoints = await QualityCheckpoint.find({
        scheduled_date: { $lt: new Date() },
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
      })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error getting overdue checkpoints:', error);
      throw error;
    }
  }

  // ========== CHECKPOINT VALIDATION ==========
  async validateCheckpoint(checkpointData) {
    try {
      const errors = [];

      // Check required fields
      if (!checkpointData.task_id) {
        errors.push('Task ID is required');
      }
      if (!checkpointData.inspector_id) {
        errors.push('Inspector ID is required');
      }
      if (!checkpointData.checkpoint_name) {
        errors.push('Checkpoint name is required');
      }
      if (!checkpointData.scheduled_date) {
        errors.push('Scheduled date is required');
      }
      if (!checkpointData.checkpoint_type) {
        errors.push('Checkpoint type is required');
      }

      // Check if scheduled date is in the future
      if (checkpointData.scheduled_date && new Date(checkpointData.scheduled_date) < new Date()) {
        errors.push('Scheduled date cannot be in the past');
      }

      // Check if checkpoint type is valid
      const validCheckpointTypes = ['QUALITY', 'SAFETY', 'COMPLIANCE', 'PERFORMANCE', 'OTHER'];
      if (checkpointData.checkpoint_type && !validCheckpointTypes.includes(checkpointData.checkpoint_type)) {
        errors.push('Invalid checkpoint type');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating checkpoint:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== CHECKPOINT ANALYTICS ==========
  async getCheckpointAnalytics(taskId) {
    try {
      const checkpoints = await QualityCheckpoint.find({ task_id: taskId });
      
      const analytics = {
        total_checkpoints: checkpoints.length,
        completed_checkpoints: checkpoints.filter(cp => cp.status === 'COMPLETED').length,
        in_progress_checkpoints: checkpoints.filter(cp => cp.status === 'IN_PROGRESS').length,
        scheduled_checkpoints: checkpoints.filter(cp => cp.status === 'SCHEDULED').length,
        failed_checkpoints: checkpoints.filter(cp => cp.status === 'FAILED').length,
        cancelled_checkpoints: checkpoints.filter(cp => cp.status === 'CANCELLED').length,
        checkpoints_by_status: checkpoints.reduce((acc, checkpoint) => {
          acc[checkpoint.status] = (acc[checkpoint.status] || 0) + 1;
          return acc;
        }, {}),
        checkpoints_by_type: checkpoints.reduce((acc, checkpoint) => {
          acc[checkpoint.checkpoint_type] = (acc[checkpoint.checkpoint_type] || 0) + 1;
          return acc;
        }, {}),
        completion_rate: checkpoints.length > 0 ? 
          (checkpoints.filter(cp => cp.status === 'COMPLETED').length / checkpoints.length * 100).toFixed(2) : 0,
        pass_rate: checkpoints.filter(cp => cp.status === 'COMPLETED').length > 0 ? 
          (checkpoints.filter(cp => cp.status === 'COMPLETED' && cp.result === 'PASS').length / 
           checkpoints.filter(cp => cp.status === 'COMPLETED').length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting checkpoint analytics:', error);
      throw error;
    }
  }

  async getCheckpointStats(filters = {}) {
    try {
      const query = {};
      if (filters.task_id) {
        query.task_id = filters.task_id;
      }

      const checkpoints = await QualityCheckpoint.find(query);
      
      const stats = {
        total_checkpoints: checkpoints.length,
        checkpoints_by_status: checkpoints.reduce((acc, checkpoint) => {
          acc[checkpoint.status] = (acc[checkpoint.status] || 0) + 1;
          return acc;
        }, {}),
        checkpoints_by_type: checkpoints.reduce((acc, checkpoint) => {
          acc[checkpoint.checkpoint_type] = (acc[checkpoint.checkpoint_type] || 0) + 1;
          return acc;
        }, {}),
        checkpoints_by_task: checkpoints.reduce((acc, checkpoint) => {
          const taskId = checkpoint.task_id.toString();
          acc[taskId] = (acc[taskId] || 0) + 1;
          return acc;
        }, {}),
        completed_checkpoints: checkpoints.filter(cp => cp.status === 'COMPLETED').length,
        overdue_checkpoints: checkpoints.filter(cp => {
          if (cp.scheduled_date && cp.status !== 'COMPLETED') {
            return new Date(cp.scheduled_date) < new Date();
          }
          return false;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting checkpoint stats:', error);
      throw error;
    }
  }

  // ========== CHECKPOINT MANAGEMENT ==========
  async startCheckpoint(id, startedBy) {
    try {
      const updateData = {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        started_by: startedBy
      };

      return await this.updateCheckpoint(id, updateData);
    } catch (error) {
      console.error('Error starting checkpoint:', error);
      throw error;
    }
  }

  async completeCheckpoint(id, result, completedBy, notes = '') {
    try {
      const updateData = {
        status: 'COMPLETED',
        result: result,
        completed_at: new Date(),
        completed_by: completedBy,
        completion_notes: notes
      };

      return await this.updateCheckpoint(id, updateData);
    } catch (error) {
      console.error('Error completing checkpoint:', error);
      throw error;
    }
  }

  async failCheckpoint(id, reason, failedBy) {
    try {
      const updateData = {
        status: 'FAILED',
        result: 'FAIL',
        failure_reason: reason,
        failed_at: new Date(),
        failed_by: failedBy
      };

      return await this.updateCheckpoint(id, updateData);
    } catch (error) {
      console.error('Error failing checkpoint:', error);
      throw error;
    }
  }

  async cancelCheckpoint(id, reason, cancelledBy) {
    try {
      const updateData = {
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_at: new Date(),
        cancelled_by: cancelledBy
      };

      return await this.updateCheckpoint(id, updateData);
    } catch (error) {
      console.error('Error cancelling checkpoint:', error);
      throw error;
    }
  }

  // ========== CHECKPOINT SEARCH ==========
  async searchCheckpoints(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { checkpoint_name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { criteria: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.task_id) {
        query.task_id = filters.task_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.checkpoint_type) {
        query.checkpoint_type = filters.checkpoint_type;
      }
      if (filters.inspector_id) {
        query.inspector_id = filters.inspector_id;
      }

      const checkpoints = await QualityCheckpoint.find(query)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ scheduled_date: 1 });

      return checkpoints;
    } catch (error) {
      console.error('Error searching checkpoints:', error);
      throw error;
    }
  }

  // ========== CHECKPOINT REPORTS ==========
  async generateCheckpointReport(taskId) {
    try {
      const checkpoints = await this.getTaskCheckpoints(taskId);
      const analytics = await this.getCheckpointAnalytics(taskId);
      
      const report = {
        task_id: taskId,
        generated_at: new Date(),
        checkpoints: checkpoints,
        analytics: analytics,
        summary: {
          total_checkpoints: analytics.total_checkpoints,
          completed_checkpoints: analytics.completed_checkpoints,
          completion_rate: analytics.completion_rate,
          pass_rate: analytics.pass_rate
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating checkpoint report:', error);
      throw error;
    }
  }
}

module.exports = new QualityCheckpointRepository();
