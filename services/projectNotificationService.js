/**
 * Project Notification Service
 * Wrapper service for sending project notifications via RealtimeNotificationService
 * Ensures all project notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class ProjectNotificationService {
  /**
   * Send notification when project is assigned to user
   * @param {Object} options - Notification options
   * @param {Object} options.project - Project data
   * @param {Object} options.assignee - Assignee information
   * @param {Object} options.assigner - Assigner information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyProjectAssigned({ project, assignee, assigner, tenantId }) {
    try {
      const notifications = [];

      // Notify assignee (personal notification)
      if (assignee && (assignee._id || assignee.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assignee._id || assignee.id,
            title: 'Project được gán cho bạn',
            message: `Bạn đã được gán vào Project "${project.project_name || project.name || project.title}"`,
            type: 'info',
            category: 'project',
            priority: project.priority === 'high' || project.priority === 'urgent' ? 'high' : 'medium',
            tenantId,
            actionUrl: `/projects/${project._id || project.id || project.project_id}`,
            data: {
              projectId: project._id || project.id || project.project_id,
              projectName: project.project_name || project.name || project.title,
              status: project.status,
              progress: project.progress || 0,
              startDate: project.start_date,
              endDate: project.end_date,
              priority: project.priority,
              assignerId: assigner?._id || assigner?.id,
              assignerName: assigner?.full_name || assigner?.name
            },
            eventName: 'project_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify assigner
      if (assigner && (assigner._id || assigner.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assigner._id || assigner.id,
            title: 'Project đã được gán',
            message: `Bạn đã gán ${assignee?.full_name || assignee?.name || 'người dùng'} vào Project "${project.project_name || project.name || project.title}"`,
            type: 'success',
            category: 'project',
            priority: 'low',
            tenantId,
            actionUrl: `/projects/${project._id || project.id || project.project_id}`,
            data: {
              projectId: project._id || project.id || project.project_id,
              projectName: project.project_name || project.name || project.title,
              assigneeId: assignee?._id || assignee?.id,
              assigneeName: assignee?.full_name || assignee?.name
            },
            eventName: 'project_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify managers and admins
      notifications.push(
        RealtimeNotificationService.sendToRole({
          role: 'manager',
          title: 'Project được gán',
          message: `Project "${project.project_name || project.name || project.title}" đã được gán cho ${assignee?.full_name || assignee?.name || 'người dùng'}`,
          type: 'info',
          category: 'project',
          priority: 'low',
          tenantId,
          actionUrl: `/projects/${project._id || project.id || project.project_id}`,
          data: {
            projectId: project._id || project.id || project.project_id,
            projectName: project.project_name || project.name || project.title,
            assigneeId: assignee?._id || assignee?.id,
            assigneeName: assignee?.full_name || assignee?.name
          },
          eventName: 'project_assigned',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Project assigned notifications sent', {
        projectId: project._id || project.id || project.project_id,
        assigneeId: assignee?._id || assignee?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending project assigned notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification for project communication
   * @param {Object} options - Notification options
   * @param {Object} options.project - Project data
   * @param {Object} options.notification - Notification data
   * @param {Object} options.creator - Creator information
   * @param {Array} options.projectUsers - Users in project
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyProjectCommunication({ project, notification, creator, projectUsers = [], tenantId }) {
    try {
      const notifications = [];

      // Notify all users in project
      for (const user of projectUsers) {
        if (user._id || user.id) {
          notifications.push(
            RealtimeNotificationService.sendToUser({
              userId: user._id || user.id,
              title: notification.title || 'Thông báo Project',
              message: notification.message || `Có thông báo mới trong Project "${project.project_name || project.name || project.title}"`,
              type: notification.type || 'info',
              category: 'project',
              priority: notification.priority || 'medium',
              tenantId,
              actionUrl: `/projects/${project._id || project.id || project.project_id}/communications`,
              data: {
                projectId: project._id || project.id || project.project_id,
                projectName: project.project_name || project.name || project.title,
                notificationId: notification._id || notification.id,
                creatorId: creator?._id || creator?.id,
                creatorName: creator?.full_name || creator?.name
              },
              eventName: 'project_communication',
              saveToDatabase: true,
              sendWebSocket: true
            })
          );
        }
      }

      await Promise.allSettled(notifications);

      logger.info('Project communication notifications sent', {
        projectId: project._id || project.id || project.project_id,
        notificationId: notification._id || notification.id,
        usersCount: projectUsers.length,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending project communication notifications:', error);
      throw error;
    }
  }
}

module.exports = ProjectNotificationService;

