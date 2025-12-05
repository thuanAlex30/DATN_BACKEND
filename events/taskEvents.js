const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class TaskEvents {
  /**
   * Emit task created event
   * @param {Object} task - Task data
   * @param {Object} creator - User who created the task
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskCreated(task, creator, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_CREATED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
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
      const validation = validateEvent(eventTypes.TASK_CREATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_CREATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task created event emitted: ${task._id || task.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task created event:', error);
      throw error;
    }
  }

  /**
   * Emit task updated event
   * @param {Object} task - Task data
   * @param {Object} updater - User who updated the task
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskUpdated(task, updater, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_UPDATED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
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
      const validation = validateEvent(eventTypes.TASK_UPDATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_UPDATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task updated event emitted: ${task._id || task.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task updated event:', error);
      throw error;
    }
  }

  /**
   * Emit task assigned event
   * @param {Object} task - Task data
   * @param {Object} assignee - User who was assigned
   * @param {Object} assigner - User who assigned the task
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskAssigned(task, assignee, assigner, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_ASSIGNED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
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
      const validation = validateEvent(eventTypes.TASK_ASSIGNED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_ASSIGNED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task assigned event emitted: ${task._id || task.id} -> ${assignee._id || assignee.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit task status updated event
   * @param {Object} task - Task data
   * @param {Object} updater - User who updated the status
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskStatusUpdated(task, updater, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_STATUS_UPDATED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
        },
        metadata: {
          userId: updater._id || updater.id,
          userRole: updater.role || updater.role_id,
          previousStatus: metadata.previousStatus,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Validate event data
      const validation = validateEvent(eventTypes.TASK_STATUS_UPDATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_STATUS_UPDATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task status updated event emitted: ${task._id || task.id} (${task.status})`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task status updated event:', error);
      throw error;
    }
  }

  /**
   * Emit task progress updated event
   * @param {Object} task - Task data
   * @param {Object} updater - User who updated the progress
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskProgressUpdated(task, updater, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_PROGRESS_UPDATED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
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
      const validation = validateEvent(eventTypes.TASK_PROGRESS_UPDATED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_PROGRESS_UPDATED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task progress updated event emitted: ${task._id || task.id} (${task.progress}%)`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task progress updated event:', error);
      throw error;
    }
  }

  /**
   * Emit task comment added event
   * @param {Object} task - Task data
   * @param {Object} comment - Comment data
   * @param {Object} commenter - User who added the comment
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskCommentAdded(task, comment, commenter, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_COMMENT_ADDED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours,
          commentId: comment._id || comment.id,
          commentText: comment.text || comment.content,
          commentType: comment.type || 'text'
        },
        metadata: {
          userId: commenter._id || commenter.id,
          userRole: commenter.role || commenter.role_id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_COMMENT_ADDED,
        eventData.data,
        eventData.metadata
      );

      console.log(`✅ Task comment added event emitted: ${task._id || task.id} - ${comment._id || comment.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task comment added event:', error);
      throw error;
    }
  }

  /**
   * Emit task deleted event
   * @param {Object} task - Task data
   * @param {Object} deleter - User who deleted the task
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskDeleted(task, deleter, metadata = {}) {
    try {
      const eventData = {
        eventType: eventTypes.TASK_DELETED,
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          status: task.status,
          priority: task.priority || 'medium',
          progress: task.progress || 0,
          assigneeId: task.assignee_id,
          dueDate: task.due_date,
          dependencies: task.dependencies || [],
          description: task.description,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours
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
      const validation = validateEvent(eventTypes.TASK_DELETED, eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.error}`);
      }

      // Send to Kafka
      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_DELETED,
        validation.data,
        validation.data.metadata
      );

      console.log(`✅ Task deleted event emitted: ${task._id || task.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit task deadline approaching event
   * @param {Object} task - Task data
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskDeadlineApproaching(task, metadata = {}) {
    try {
      const eventData = {
        eventType: 'task_deadline_approaching',
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          dueDate: task.due_date,
          daysRemaining: metadata.daysRemaining,
          status: task.status,
          progress: task.progress || 0,
          assigneeId: task.assignee_id
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
      const result = await kafkaProducer.sendTaskEvent(
        'task_deadline_approaching',
        eventData.data,
        eventData.metadata
      );

      console.log(`✅ Task deadline approaching event emitted: ${task._id || task.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task deadline approaching event:', error);
      throw error;
    }
  }

  /**
   * Emit task dependency completed event
   * @param {Object} task - Task data
   * @param {Object} dependency - Dependency task data
   * @param {Object} metadata - Additional metadata
   */
  static async emitTaskDependencyCompleted(task, dependency, metadata = {}) {
    try {
      const eventData = {
        eventType: 'task_dependency_completed',
        data: {
          taskId: task._id || task.id,
          taskName: task.name || task.title,
          projectId: task.project_id,
          dependencyId: dependency._id || dependency.id,
          dependencyName: dependency.name || dependency.title,
          status: task.status,
          progress: task.progress || 0,
          assigneeId: task.assignee_id
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
      const result = await kafkaProducer.sendTaskEvent(
        'task_dependency_completed',
        eventData.data,
        eventData.metadata
      );

      console.log(`✅ Task dependency completed event emitted: ${task._id || task.id} - ${dependency._id || dependency.id}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to emit task dependency completed event:', error);
      throw error;
    }
  }
}

module.exports = TaskEvents;
