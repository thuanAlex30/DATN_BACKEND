const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class ProjectMilestoneEvents {
  /**
   * Emit project milestone created event
   * @param {Object} milestone - Milestone data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneCreated(milestone, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        assignedTo: milestone.assigned_to,
        assignedToName: milestone.assigned_to_name,
        assignedToEmail: milestone.assigned_to_email,
        assignedToRole: milestone.assigned_to_role,
        createdAt: new Date().toISOString(),
        createdBy: milestone.created_by,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone created event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone updated event
   * @param {Object} milestone - Updated milestone data
   * @param {Object} oldMilestone - Old milestone data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneUpdated(milestone, oldMilestone, changes, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        assignedTo: milestone.assigned_to,
        assignedToName: milestone.assigned_to_name,
        assignedToEmail: milestone.assigned_to_email,
        assignedToRole: milestone.assigned_to_role,
        updatedAt: new Date().toISOString(),
        updatedBy: milestone.updated_by,
        changes: changes,
        oldData: oldMilestone,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone deleted event
   * @param {Object} milestone - Milestone data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneDeleted(milestone, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        assignedTo: milestone.assigned_to,
        assignedToName: milestone.assigned_to_name,
        assignedToEmail: milestone.assigned_to_email,
        assignedToRole: milestone.assigned_to_role,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone completed event
   * @param {Object} milestone - Milestone data
   * @param {Object} completionData - Completion data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneCompleted(milestone, completionData, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        assignedTo: milestone.assigned_to,
        assignedToName: milestone.assigned_to_name,
        assignedToEmail: milestone.assigned_to_email,
        assignedToRole: milestone.assigned_to_role,
        completedAt: new Date().toISOString(),
        completedBy: metadata.userId,
        completerName: completionData.completer_name,
        completerEmail: completionData.completer_email,
        completerRole: completionData.completer_role,
        completionNotes: completionData.completion_notes,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone completed event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone status changed event
   * @param {Object} milestone - Milestone data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneStatusChanged(milestone, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        oldStatus: oldStatus,
        newStatus: newStatus,
        status: milestone.status,
        assignedTo: milestone.assigned_to,
        assignedToName: milestone.assigned_to_name,
        assignedToEmail: milestone.assigned_to_email,
        assignedToRole: milestone.assigned_to_role,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: metadata.userId,
        reason: metadata.reason,
        notes: metadata.notes,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone assigned event
   * @param {Object} milestone - Milestone data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneAssigned(milestone, assignee, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        assignedAt: new Date().toISOString(),
        assignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'primary',
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone unassigned event
   * @param {Object} milestone - Milestone data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectMilestoneUnassigned(milestone, assignee, metadata) {
    try {
      const eventData = {
        milestoneId: milestone._id,
        projectId: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        type: milestone.type,
        priority: milestone.priority,
        status: milestone.status,
        unassignedAt: new Date().toISOString(),
        unassignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'primary',
        reason: metadata.reason,
        notes: metadata.notes,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        dueDate: milestone.due_date,
        completedDate: milestone.completed_date,
        progress: milestone.progress,
        dependencies: milestone.dependencies || [],
        deliverables: milestone.deliverables || [],
        attachments: milestone.attachments || [],
        metadata: milestone.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_MILESTONE_UNASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Project milestone unassigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project milestone unassigned event:', error);
      throw error;
    }
  }
}

module.exports = ProjectMilestoneEvents;
