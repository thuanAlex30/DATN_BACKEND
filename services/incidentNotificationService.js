/**
 * Incident Notification Service
 * Wrapper service for sending incident notifications via RealtimeNotificationService
 * Ensures all incident notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class IncidentNotificationService {
  /**
   * Send notification when incident is reported
   * @param {Object} options - Notification options
   * @param {Object} options.incident - Incident data
   * @param {Object} options.reporter - Reporter information
   * @param {Array} options.stakeholders - Stakeholders to notify
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyIncidentReported({ incident, reporter, stakeholders = [], tenantId }) {
    try {
      const notifications = [];

      // Notify reporter
      if (reporter) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: reporter._id || reporter.id,
            title: 'Sự cố đã được báo cáo',
            message: `Sự cố "${incident.title || incident.incidentId}" đã được báo cáo thành công`,
            type: 'success',
            category: 'safety',
            priority: 'medium',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              severity: incident.severity,
              status: incident.status,
              location: incident.location
            },
            eventName: 'incident_reported',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder._id || stakeholder.id) {
          notifications.push(
            RealtimeNotificationService.sendToUser({
              userId: stakeholder._id || stakeholder.id,
              title: 'Sự cố mới được báo cáo',
              message: `${reporter?.full_name || reporter?.name || 'Người dùng'} đã báo cáo sự cố "${incident.title || incident.incidentId}"`,
              type: 'warning',
              category: 'safety',
              priority: incident.severity === 'critical' || incident.severity === 'high' ? 'high' : 'medium',
              tenantId,
              actionUrl: `/incidents/${incident._id || incident.id}`,
              data: {
                incidentId: incident._id || incident.id,
                incidentTitle: incident.title,
                severity: incident.severity,
                status: incident.status,
                location: incident.location,
                reporterId: reporter?._id || reporter?.id,
                reporterName: reporter?.full_name || reporter?.name
              },
              eventName: 'incident_reported',
              saveToDatabase: true,
              sendWebSocket: true
            })
          );
        }
      }

      // Broadcast to all users in tenant (for awareness)
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Sự cố mới được báo cáo',
          message: `Sự cố "${incident.title || incident.incidentId}" đã được báo cáo`,
          type: 'info',
          category: 'safety',
          priority: 'low',
          actionUrl: `/incidents/${incident._id || incident.id}`,
          data: {
            incidentId: incident._id || incident.id,
            incidentTitle: incident.title,
            severity: incident.severity
          },
          eventName: 'incident_reported',
          saveToDatabase: false, // Don't save broadcast to database
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Incident reported notifications sent', {
        incidentId: incident._id || incident.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending incident reported notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when incident is classified
   * @param {Object} options - Notification options
   * @param {Object} options.incident - Incident data
   * @param {Object} options.classifier - Classifier information
   * @param {Array} options.stakeholders - Stakeholders to notify
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyIncidentClassified({ incident, classifier, stakeholders = [], tenantId }) {
    try {
      const notifications = [];

      // Notify classifier
      if (classifier) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: classifier._id || classifier.id,
            title: 'Sự cố đã được phân loại',
            message: `Bạn đã phân loại sự cố "${incident.title || incident.incidentId}"`,
            type: 'success',
            category: 'safety',
            priority: 'medium',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              severity: incident.severity,
              status: incident.status
            },
            eventName: 'incident_classified',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder._id || stakeholder.id) {
          notifications.push(
            RealtimeNotificationService.sendToUser({
              userId: stakeholder._id || stakeholder.id,
              title: 'Sự cố đã được phân loại',
              message: `${classifier?.full_name || classifier?.name || 'Người dùng'} đã phân loại sự cố "${incident.title || incident.incidentId}"`,
              type: 'info',
              category: 'safety',
              priority: 'medium',
              tenantId,
              actionUrl: `/incidents/${incident._id || incident.id}`,
              data: {
                incidentId: incident._id || incident.id,
                incidentTitle: incident.title,
                severity: incident.severity,
                status: incident.status,
                classifierId: classifier?._id || classifier?.id,
                classifierName: classifier?.full_name || classifier?.name
              },
              eventName: 'incident_classified',
              saveToDatabase: true,
              sendWebSocket: true
            })
          );
        }
      }

      await Promise.allSettled(notifications);

      logger.info('Incident classified notifications sent', {
        incidentId: incident._id || incident.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending incident classified notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when incident is assigned
   * @param {Object} options - Notification options
   * @param {Object} options.incident - Incident data
   * @param {Object} options.assignee - Assignee information
   * @param {Object} options.assigner - Assigner information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyIncidentAssigned({ incident, assignee, assigner, tenantId }) {
    try {
      const notifications = [];

      // Notify assignee
      if (assignee) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assignee._id || assignee.id,
            title: 'Sự cố được phân công',
            message: `Bạn đã được phân công xử lý sự cố "${incident.title || incident.incidentId}"`,
            type: 'warning',
            category: 'safety',
            priority: incident.severity === 'critical' || incident.severity === 'high' ? 'high' : 'medium',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              severity: incident.severity,
              status: incident.status,
              assignerId: assigner?._id || assigner?.id,
              assignerName: assigner?.full_name || assigner?.name
            },
            eventName: 'incident_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify assigner
      if (assigner) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: assigner._id || assigner.id,
            title: 'Sự cố đã được phân công',
            message: `Bạn đã phân công ${assignee?.full_name || assignee?.name || 'người dùng'} xử lý sự cố "${incident.title || incident.incidentId}"`,
            type: 'info',
            category: 'safety',
            priority: 'low',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              assigneeId: assignee?._id || assignee?.id,
              assigneeName: assignee?.full_name || assignee?.name
            },
            eventName: 'incident_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      await Promise.allSettled(notifications);

      logger.info('Incident assigned notifications sent', {
        incidentId: incident._id || incident.id,
        assigneeId: assignee?._id || assignee?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending incident assigned notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when incident progress is updated
   * @param {Object} options - Notification options
   * @param {Object} options.incident - Incident data
   * @param {Object} options.updater - Updater information
   * @param {Array} options.stakeholders - Stakeholders to notify
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyIncidentProgressUpdated({ incident, updater, stakeholders = [], tenantId }) {
    try {
      const notifications = [];

      // Notify updater
      if (updater) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: updater._id || updater.id,
            title: 'Tiến độ sự cố đã được cập nhật',
            message: `Bạn đã cập nhật tiến độ sự cố "${incident.title || incident.incidentId}"`,
            type: 'success',
            category: 'safety',
            priority: 'low',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              status: incident.status,
              progress: incident.progress
            },
            eventName: 'incident_progress_updated',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder._id || stakeholder.id) {
          notifications.push(
            RealtimeNotificationService.sendToUser({
              userId: stakeholder._id || stakeholder.id,
              title: 'Tiến độ sự cố được cập nhật',
              message: `${updater?.full_name || updater?.name || 'Người dùng'} đã cập nhật tiến độ sự cố "${incident.title || incident.incidentId}"`,
              type: 'info',
              category: 'safety',
              priority: 'low',
              tenantId,
              actionUrl: `/incidents/${incident._id || incident.id}`,
              data: {
                incidentId: incident._id || incident.id,
                incidentTitle: incident.title,
                status: incident.status,
                progress: incident.progress,
                updaterId: updater?._id || updater?.id,
                updaterName: updater?.full_name || updater?.name
              },
              eventName: 'incident_progress_updated',
              saveToDatabase: true,
              sendWebSocket: true
            })
          );
        }
      }

      await Promise.allSettled(notifications);

      logger.info('Incident progress updated notifications sent', {
        incidentId: incident._id || incident.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending incident progress updated notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when incident is closed
   * @param {Object} options - Notification options
   * @param {Object} options.incident - Incident data
   * @param {Object} options.closer - Closer information
   * @param {Array} options.stakeholders - Stakeholders to notify
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyIncidentClosed({ incident, closer, stakeholders = [], tenantId }) {
    try {
      const notifications = [];

      // Notify closer
      if (closer) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: closer._id || closer.id,
            title: 'Sự cố đã được đóng',
            message: `Bạn đã đóng sự cố "${incident.title || incident.incidentId}"`,
            type: 'success',
            category: 'safety',
            priority: 'medium',
            tenantId,
            actionUrl: `/incidents/${incident._id || incident.id}`,
            data: {
              incidentId: incident._id || incident.id,
              incidentTitle: incident.title,
              status: incident.status,
              closedAt: incident.closedAt || new Date()
            },
            eventName: 'incident_closed',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder._id || stakeholder.id) {
          notifications.push(
            RealtimeNotificationService.sendToUser({
              userId: stakeholder._id || stakeholder.id,
              title: 'Sự cố đã được đóng',
              message: `${closer?.full_name || closer?.name || 'Người dùng'} đã đóng sự cố "${incident.title || incident.incidentId}"`,
              type: 'success',
              category: 'safety',
              priority: 'medium',
              tenantId,
              actionUrl: `/incidents/${incident._id || incident.id}`,
              data: {
                incidentId: incident._id || incident.id,
                incidentTitle: incident.title,
                status: incident.status,
                closedAt: incident.closedAt || new Date(),
                closerId: closer?._id || closer?.id,
                closerName: closer?.full_name || closer?.name
              },
              eventName: 'incident_closed',
              saveToDatabase: true,
              sendWebSocket: true
            })
          );
        }
      }

      await Promise.allSettled(notifications);

      logger.info('Incident closed notifications sent', {
        incidentId: incident._id || incident.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending incident closed notifications:', error);
      throw error;
    }
  }
}

module.exports = IncidentNotificationService;

