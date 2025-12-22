/**
 * Quality Notification Service
 * Wrapper service for sending quality checkpoint notifications via RealtimeNotificationService
 * Ensures all quality notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class QualityNotificationService {
  /**
   * Send notification when quality checkpoint is created
   * @param {Object} options - Notification options
   * @param {Object} options.checkpoint - Quality checkpoint data
   * @param {Object} options.creator - Creator information
   * @param {Object} options.assignedUser - Assigned user information (if any)
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyQualityCheckpointCreated({ checkpoint, creator, assignedUser, tenantId }) {
    try {
      const notifications = [];

      // Notify assigned user (personal notification)
      if (assignedUser && (assignedUser._id || assignedUser.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assignedUser._id || assignedUser.id,
            title: 'Quality Checkpoint được gán cho bạn',
            message: `Bạn đã được gán Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}"`,
            type: 'info',
            category: 'general',
            priority: checkpoint.priority === 'high' || checkpoint.priority === 'urgent' ? 'high' : 'medium',
            tenantId,
            actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
            data: {
              checkpointId: checkpoint._id || checkpoint.id,
              checkpointName: checkpoint.name || checkpoint.checkpointName,
              taskId: checkpoint.taskId || checkpoint.task_id,
              type: checkpoint.type,
              priority: checkpoint.priority,
              dueDate: checkpoint.dueDate || checkpoint.due_date,
              creatorId: creator?._id || creator?.id,
              creatorName: creator?.full_name || creator?.name
            },
            eventName: 'quality_checkpoint_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Quality Checkpoint mới được tạo',
          message: `Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}" đã được tạo`,
          type: 'info',
          category: 'general',
          priority: 'low',
          actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
          data: {
            checkpointId: checkpoint._id || checkpoint.id,
            checkpointName: checkpoint.name || checkpoint.checkpointName,
            creatorId: creator?._id || creator?.id,
            creatorName: creator?.full_name || creator?.name
          },
          eventName: 'quality_checkpoint_created',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Quality checkpoint created notifications sent', {
        checkpointId: checkpoint._id || checkpoint.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending quality checkpoint created notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when quality checkpoint is updated
   * @param {Object} options - Notification options
   * @param {Object} options.checkpoint - Quality checkpoint data
   * @param {Object} options.updater - Updater information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyQualityCheckpointUpdated({ checkpoint, updater, tenantId }) {
    try {
      await RealtimeNotificationService.sendToTenant({
        tenantId,
        title: 'Quality Checkpoint được cập nhật',
        message: `Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}" đã được cập nhật`,
        type: 'info',
        category: 'general',
        priority: 'low',
        actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
        data: {
          checkpointId: checkpoint._id || checkpoint.id,
          checkpointName: checkpoint.name || checkpoint.checkpointName,
          updaterId: updater?._id || updater?.id,
          updaterName: updater?.full_name || updater?.name
        },
        eventName: 'quality_checkpoint_updated',
        saveToDatabase: false,
        sendWebSocket: true
      });

      logger.info('Quality checkpoint updated notification sent', {
        checkpointId: checkpoint._id || checkpoint.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending quality checkpoint updated notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when quality checkpoint is assigned
   * @param {Object} options - Notification options
   * @param {Object} options.checkpoint - Quality checkpoint data
   * @param {Object} options.assignedUser - Assigned user information
   * @param {Object} options.previousUser - Previous assigned user (if changed)
   * @param {Object} options.assigner - Assigner information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyQualityCheckpointAssigned({ checkpoint, assignedUser, previousUser, assigner, tenantId }) {
    try {
      const notifications = [];

      // Notify newly assigned user
      if (assignedUser && (assignedUser._id || assignedUser.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assignedUser._id || assignedUser.id,
            title: 'Quality Checkpoint được gán cho bạn',
            message: `Bạn đã được gán Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}"`,
            type: 'info',
            category: 'general',
            priority: checkpoint.priority === 'high' || checkpoint.priority === 'urgent' ? 'high' : 'medium',
            tenantId,
            actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
            data: {
              checkpointId: checkpoint._id || checkpoint.id,
              checkpointName: checkpoint.name || checkpoint.checkpointName,
              assignerId: assigner?._id || assigner?.id,
              assignerName: assigner?.full_name || assigner?.name
            },
            eventName: 'quality_checkpoint_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify previous user if assignment changed
      if (previousUser && (previousUser._id || previousUser.id) && 
          previousUser._id?.toString() !== assignedUser?._id?.toString()) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: previousUser._id || previousUser.id,
            title: 'Quality Checkpoint đã được gán lại',
            message: `Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}" đã được gán cho người khác`,
            type: 'info',
            category: 'general',
            priority: 'low',
            tenantId,
            actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
            data: {
              checkpointId: checkpoint._id || checkpoint.id,
              checkpointName: checkpoint.name || checkpoint.checkpointName,
              newAssigneeId: assignedUser?._id || assignedUser?.id,
              newAssigneeName: assignedUser?.full_name || assignedUser?.name
            },
            eventName: 'quality_checkpoint_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      await Promise.allSettled(notifications);

      logger.info('Quality checkpoint assigned notifications sent', {
        checkpointId: checkpoint._id || checkpoint.id,
        assignedUserId: assignedUser?._id || assignedUser?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending quality checkpoint assigned notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when quality checkpoint is completed
   * @param {Object} options - Notification options
   * @param {Object} options.checkpoint - Quality checkpoint data
   * @param {Object} options.completer - Completer information
   * @param {Object} options.manager - Manager/Assigner information (if different)
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyQualityCheckpointCompleted({ checkpoint, completer, manager, tenantId }) {
    try {
      const notifications = [];

      // Notify completer
      if (completer) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: completer._id || completer.id,
            title: 'Quality Checkpoint đã hoàn thành',
            message: `Bạn đã hoàn thành Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}"`,
            type: 'success',
            category: 'general',
            priority: 'medium',
            tenantId,
            actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
            data: {
              checkpointId: checkpoint._id || checkpoint.id,
              checkpointName: checkpoint.name || checkpoint.checkpointName,
              completedAt: checkpoint.completedAt || checkpoint.completed_at || new Date()
            },
            eventName: 'quality_checkpoint_completed',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify manager/assigner if different from completer
      if (manager && (manager._id || manager.id) && 
          manager._id?.toString() !== completer?._id?.toString()) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: manager._id || manager.id,
            title: 'Quality Checkpoint đã hoàn thành',
            message: `${completer?.full_name || completer?.name || 'Người dùng'} đã hoàn thành Quality Checkpoint "${checkpoint.name || checkpoint.checkpointName}"`,
            type: 'success',
            category: 'general',
            priority: 'low',
            tenantId,
            actionUrl: `/quality/checkpoints/${checkpoint._id || checkpoint.id}`,
            data: {
              checkpointId: checkpoint._id || checkpoint.id,
              checkpointName: checkpoint.name || checkpoint.checkpointName,
              completerId: completer?._id || completer?.id,
              completerName: completer?.full_name || completer?.name,
              completedAt: checkpoint.completedAt || checkpoint.completed_at || new Date()
            },
            eventName: 'quality_checkpoint_completed',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      await Promise.allSettled(notifications);

      logger.info('Quality checkpoint completed notifications sent', {
        checkpointId: checkpoint._id || checkpoint.id,
        completerId: completer?._id || completer?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending quality checkpoint completed notifications:', error);
      throw error;
    }
  }
}

module.exports = QualityNotificationService;

