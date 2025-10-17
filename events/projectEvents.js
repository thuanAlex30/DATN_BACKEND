const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class ProjectEvents {
  /**
   * Emit project created event
   * @param {Object} project - Project data
   * @param {Object} creator - User who created the project
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectCreated(project, creator, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.PROJECT_CREATED,
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || [],
          siteId: project.site_id,
          leaderId: project.leader_id,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          priority: project.priority || 'medium'
        },
        metadata: {
          userId: creator._id || creator.id,
          userRole: creator.role || creator.role_id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.PROJECT_CREATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Project created event emitted: ${project._id || project.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project created event:', error);
      throw error;
    }
  }

  /**
   * Emit project updated event
   * @param {Object} project - Project data
   * @param {Object} updater - User who updated the project
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectUpdated(project, updater, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.PROJECT_UPDATED,
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || [],
          siteId: project.site_id,
          leaderId: project.leader_id,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          priority: project.priority || 'medium'
        },
        metadata: {
          userId: updater._id || updater.id,
          userRole: updater.role || updater.role_id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.PROJECT_UPDATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_UPDATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Project updated event emitted: ${project._id || project.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project assigned event
   * @param {Object} project - Project data
   * @param {Object} assignee - User who was assigned
   * @param {Object} assigner - User who assigned the project
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectAssigned(project, assignee, assigner, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.PROJECT_ASSIGNED,
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || [],
          siteId: project.site_id,
          leaderId: project.leader_id,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          priority: project.priority || 'medium'
        },
        metadata: {
          userId: assigner._id || assigner.id,
          userRole: assigner.role || assigner.role_id,
          assigneeId: assignee._id || assignee.id,
          assigneeName: assignee.full_name || assignee.name,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.PROJECT_ASSIGNED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_ASSIGNED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Project assigned event emitted: ${project._id || project.id} -> ${assignee._id || assignee.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit project progress updated event
   * @param {Object} project - Project data
   * @param {Object} updater - User who updated the progress
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectProgressUpdated(project, updater, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.PROJECT_PROGRESS_UPDATED,
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || [],
          siteId: project.site_id,
          leaderId: project.leader_id,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          priority: project.priority || 'medium'
        },
        metadata: {
          userId: updater._id || updater.id,
          userRole: updater.role || updater.role_id,
          previousProgress: metadata.previousProgress,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.PROJECT_PROGRESS_UPDATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_PROGRESS_UPDATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Project progress updated event emitted: ${project._id || project.id} (${project.progress}%)`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project progress updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project deleted event
   * @param {Object} project - Project data
   * @param {Object} deleter - User who deleted the project
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectDeleted(project, deleter, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.PROJECT_DELETED,
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || [],
          siteId: project.site_id,
          leaderId: project.leader_id,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          priority: project.priority || 'medium'
        },
        metadata: {
          userId: deleter._id || deleter.id,
          userRole: deleter.role || deleter.role_id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.PROJECT_DELETED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_DELETED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Project deleted event emitted: ${project._id || project.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project milestone achieved event
   * @param {Object} project - Project data
   * @param {Object} milestone - Milestone data
   * @param {Object} achiever - User who achieved the milestone
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectMilestoneAchieved(project, milestone, achiever, metadata = {}) {
    try {
      const eventData = {
        eventType: 'project_milestone_achieved',
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          milestoneId: milestone._id || milestone.id,
          milestoneName: milestone.name || milestone.title,
          milestoneDescription: milestone.description,
          achievedDate: new Date().toISOString(),
          status: project.status,
          progress: project.progress || 0
        },
        metadata: {
          userId: achiever._id || achiever.id,
          userRole: achiever.role || achiever.role_id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        'project_milestone_achieved',
        eventData.data,
        eventData.metadata
      );

      console.log(`✅ Project milestone achieved event emitted: ${project._id || project.id} - ${milestone._id || milestone.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project milestone achieved event:', error);
      throw error;
    }
  }

  /**
   * Emit project deadline approaching event
   * @param {Object} project - Project data
   * @param {Object} metadata - Additional metadata
   */
  static async emitProjectDeadlineApproaching(project, metadata = {}) {
    try {
      const eventData = {
        eventType: 'project_deadline_approaching',
        data: {
          projectId: project._id || project.id,
          projectName: project.name || project.title,
          endDate: project.end_date,
          daysRemaining: metadata.daysRemaining,
          status: project.status,
          progress: project.progress || 0,
          assignedUsers: project.assignedUsers || []
        },
        metadata: {
          userId: 'system',
          userRole: 'system',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Send to Kafka
      const result = await kafkaProducer.sendProjectEvent(
        'project_deadline_approaching',
        eventData.data,
        eventData.metadata
      );

      console.log(`✅ Project deadline approaching event emitted: ${project._id || project.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit project deadline approaching event:', error);
      throw error;
    }
  }
}

module.exports = ProjectEvents;
