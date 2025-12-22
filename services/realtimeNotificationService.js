/**
 * Realtime Notification Service
 * Unified service for sending realtime notifications via WebSocket and storing in database
 * Ensures all notifications are tenant-aware and persistent
 */

const Notification = require('../models/notification');
const websocketService = require('./websocketService');
const NotificationEvents = require('../events/notificationEvents');
const logger = require('../utils/logger');

class RealtimeNotificationService {
  /**
   * Send notification to single user (realtime + database)
   * @param {Object} options - Notification options
   * @param {string|ObjectId} options.userId - Target user ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type (info, success, warning, error)
   * @param {string} options.category - Notification category (system, training, safety, ppe, project, user, general)
   * @param {string} options.priority - Notification priority (low, medium, high, urgent)
   * @param {string} options.tenantId - Tenant ID (required for tenant isolation)
   * @param {string} options.actionUrl - Optional action URL
   * @param {Date} options.expiresAt - Optional expiration date
   * @param {Object} options.data - Optional additional data
   * @param {string} options.eventName - WebSocket event name (default: 'notification')
   * @param {boolean} options.saveToDatabase - Whether to save to database (default: true)
   * @param {boolean} options.sendWebSocket - Whether to send via WebSocket (default: true)
   * @returns {Promise<Object>} Created notification
   */
  static async sendToUser(options) {
    try {
      const {
        userId,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        tenantId,
        actionUrl = null,
        expiresAt = null,
        data = {},
        eventName = 'notification',
        saveToDatabase = true,
        sendWebSocket = true
      } = options;

      if (!userId || !title || !message) {
        throw new Error('Missing required fields: userId, title, message');
      }

      if (!tenantId) {
        logger.warn('Notification sent without tenant_id', { userId, title });
      }

      // Create notification object
      const notificationData = {
        user_id: userId,
        tenant_id: tenantId || null,
        title,
        message,
        type,
        category,
        priority,
        action_url: actionUrl,
        expires_at: expiresAt,
        is_read: false
      };

      let savedNotification = null;

      // Save to database if requested
      if (saveToDatabase) {
        savedNotification = await Notification.createNotification(notificationData);
      }

      // Send via WebSocket if requested
      if (sendWebSocket) {
        const wsData = {
          ...notificationData,
          _id: savedNotification?._id || null,
          data,
          timestamp: savedNotification?.created_at || new Date().toISOString()
        };

        // Filter by tenant when emitting
        if (tenantId) {
          websocketService.emitToUserInTenant(userId, tenantId, eventName, wsData);
        } else {
          websocketService.emitToUser(userId, eventName, wsData);
        }
      }

      // Emit Kafka event if notification was saved
      if (savedNotification) {
        try {
          await NotificationEvents.emitNotificationSent(
            savedNotification,
            { _id: 'system', role: 'system', full_name: 'System' }
          );
        } catch (eventError) {
          logger.error('Failed to emit notification sent event:', eventError);
        }
      }

      logger.debug('Notification sent to user', {
        userId,
        tenantId,
        title,
        type,
        saved: !!savedNotification
      });

      return {
        success: true,
        notification: savedNotification,
        sent: sendWebSocket
      };
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users (realtime + database)
   * @param {Object} options - Notification options
   * @param {Array<string|ObjectId>} options.userIds - Target user IDs
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type
   * @param {string} options.category - Notification category
   * @param {string} options.priority - Notification priority
   * @param {string} options.tenantId - Tenant ID (required)
   * @param {string} options.actionUrl - Optional action URL
   * @param {Date} options.expiresAt - Optional expiration date
   * @param {Object} options.data - Optional additional data
   * @param {string} options.eventName - WebSocket event name
   * @param {boolean} options.saveToDatabase - Whether to save to database
   * @param {boolean} options.sendWebSocket - Whether to send via WebSocket
   * @returns {Promise<Object>} Results
   */
  static async sendToUsers(options) {
    try {
      const {
        userIds,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        tenantId,
        actionUrl = null,
        expiresAt = null,
        data = {},
        eventName = 'notification',
        saveToDatabase = true,
        sendWebSocket = true
      } = options;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('userIds must be a non-empty array');
      }

      if (!tenantId) {
        logger.warn('Notification sent to multiple users without tenant_id', { userIds: userIds.length, title });
      }

      const results = {
        success: [],
        failed: [],
        notifications: []
      };

      // Send to each user
      for (const userId of userIds) {
        try {
          const result = await this.sendToUser({
            userId,
            title,
            message,
            type,
            category,
            priority,
            tenantId,
            actionUrl,
            expiresAt,
            data,
            eventName,
            saveToDatabase,
            sendWebSocket
          });
          results.success.push(userId);
          if (result.notification) {
            results.notifications.push(result.notification);
          }
        } catch (error) {
          logger.error(`Failed to send notification to user ${userId}:`, error);
          results.failed.push({ userId, error: error.message });
        }
      }

      logger.info('Notifications sent to multiple users', {
        total: userIds.length,
        success: results.success.length,
        failed: results.failed.length,
        tenantId
      });

      return results;
    } catch (error) {
      logger.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  /**
   * Send notification to users by role (realtime + database)
   * @param {Object} options - Notification options
   * @param {string} options.role - Target role (manager, admin, employee, etc.)
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type
   * @param {string} options.category - Notification category
   * @param {string} options.priority - Notification priority
   * @param {string} options.tenantId - Tenant ID (required for tenant isolation)
   * @param {string} options.actionUrl - Optional action URL
   * @param {Date} options.expiresAt - Optional expiration date
   * @param {Object} options.data - Optional additional data
   * @param {string} options.eventName - WebSocket event name
   * @param {boolean} options.saveToDatabase - Whether to save to database
   * @param {boolean} options.sendWebSocket - Whether to send via WebSocket
   * @returns {Promise<Object>} Results
   */
  static async sendToRole(options) {
    try {
      const {
        role,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        tenantId,
        actionUrl = null,
        expiresAt = null,
        data = {},
        eventName = 'notification',
        saveToDatabase = true,
        sendWebSocket = true
      } = options;

      if (!role || !title || !message) {
        throw new Error('Missing required fields: role, title, message');
      }

      if (!tenantId) {
        logger.warn('Notification sent to role without tenant_id', { role, title });
      }

      // Get all users with this role in the tenant
      const User = require('../models/user');
      const Role = require('../models/role');

      const roleDoc = await Role.findOne({ 
        $or: [
          { role_code: role },
          { role_name: { $regex: new RegExp(role, 'i') } }
        ]
      });

      if (!roleDoc) {
        logger.warn('Role not found', { role });
        return { success: false, message: 'Role not found', users: [] };
      }

      // Build query
      const query = { role_id: roleDoc._id, is_active: true };
      if (tenantId) {
        query.tenant_id = tenantId;
      }

      const users = await User.find(query).select('_id');

      if (users.length === 0) {
        logger.info('No users found for role', { role, tenantId });
        return { success: true, users: [], notifications: [] };
      }

      const userIds = users.map(u => u._id);

      // Send to all users with this role
      const results = await this.sendToUsers({
        userIds,
        title,
        message,
        type,
        category,
        priority,
        tenantId,
        actionUrl,
        expiresAt,
        data,
        eventName,
        saveToDatabase,
        sendWebSocket
      });

      // Also send WebSocket broadcast to role (for real-time updates)
      if (sendWebSocket) {
        const wsData = {
          title,
          message,
          type,
          category,
          priority,
          tenant_id: tenantId,
          data,
          timestamp: new Date().toISOString()
        };

        if (tenantId) {
          websocketService.emitToRoleInTenant(role, tenantId, eventName, wsData);
        } else {
          websocketService.emitToRole(role, eventName, wsData);
        }
      }

      return {
        success: true,
        role,
        tenantId,
        users: userIds,
        ...results
      };
    } catch (error) {
      logger.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Send notification to all users in tenant (realtime + database)
   * @param {Object} options - Notification options
   * @param {string} options.tenantId - Tenant ID (required)
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type
   * @param {string} options.category - Notification category
   * @param {string} options.priority - Notification priority
   * @param {string} options.actionUrl - Optional action URL
   * @param {Date} options.expiresAt - Optional expiration date
   * @param {Object} options.data - Optional additional data
   * @param {string} options.eventName - WebSocket event name
   * @param {boolean} options.saveToDatabase - Whether to save to database
   * @param {boolean} options.sendWebSocket - Whether to send via WebSocket
   * @returns {Promise<Object>} Results
   */
  static async sendToTenant(options) {
    try {
      const {
        tenantId,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        actionUrl = null,
        expiresAt = null,
        data = {},
        eventName = 'notification',
        saveToDatabase = true,
        sendWebSocket = true
      } = options;

      if (!tenantId) {
        throw new Error('tenantId is required for sendToTenant');
      }

      // Get all active users in tenant
      const User = require('../models/user');
      const users = await User.find({
        tenant_id: tenantId,
        is_active: true
      }).select('_id');

      if (users.length === 0) {
        logger.info('No users found in tenant', { tenantId });
        return { success: true, users: [], notifications: [] };
      }

      const userIds = users.map(u => u._id);

      // Send to all users in tenant
      const results = await this.sendToUsers({
        userIds,
        title,
        message,
        type,
        category,
        priority,
        tenantId,
        actionUrl,
        expiresAt,
        data,
        eventName,
        saveToDatabase,
        sendWebSocket
      });

      // Also send WebSocket broadcast to tenant (for real-time updates)
      if (sendWebSocket) {
        const wsData = {
          title,
          message,
          type,
          category,
          priority,
          tenant_id: tenantId,
          data,
          timestamp: new Date().toISOString()
        };

        websocketService.emitToTenant(tenantId, eventName, wsData);
      }

      return {
        success: true,
        tenantId,
        users: userIds,
        ...results
      };
    } catch (error) {
      logger.error('Error sending notification to tenant:', error);
      throw error;
    }
  }

  /**
   * Send notification to department (realtime + database)
   * @param {Object} options - Notification options
   * @param {string|ObjectId} options.departmentId - Department ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type
   * @param {string} options.category - Notification category
   * @param {string} options.priority - Notification priority
   * @param {string} options.tenantId - Tenant ID (required)
   * @param {string} options.actionUrl - Optional action URL
   * @param {Date} options.expiresAt - Optional expiration date
   * @param {Object} options.data - Optional additional data
   * @param {string} options.eventName - WebSocket event name
   * @param {boolean} options.saveToDatabase - Whether to save to database
   * @param {boolean} options.sendWebSocket - Whether to send via WebSocket
   * @returns {Promise<Object>} Results
   */
  static async sendToDepartment(options) {
    try {
      const {
        departmentId,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        tenantId,
        actionUrl = null,
        expiresAt = null,
        data = {},
        eventName = 'notification',
        saveToDatabase = true,
        sendWebSocket = true
      } = options;

      if (!departmentId || !tenantId) {
        throw new Error('departmentId and tenantId are required');
      }

      // Get all users in department
      const User = require('../models/user');
      const users = await User.find({
        department_id: departmentId,
        tenant_id: tenantId,
        is_active: true
      }).select('_id');

      if (users.length === 0) {
        logger.info('No users found in department', { departmentId, tenantId });
        return { success: true, users: [], notifications: [] };
      }

      const userIds = users.map(u => u._id);

      // Send to all users in department
      const results = await this.sendToUsers({
        userIds,
        title,
        message,
        type,
        category,
        priority,
        tenantId,
        actionUrl,
        expiresAt,
        data,
        eventName,
        saveToDatabase,
        sendWebSocket
      });

      // Also send WebSocket broadcast to department
      if (sendWebSocket) {
        const wsData = {
          title,
          message,
          type,
          category,
          priority,
          tenant_id: tenantId,
          department_id: departmentId,
          data,
          timestamp: new Date().toISOString()
        };

        websocketService.emitToDepartment(departmentId, eventName, wsData);
      }

      return {
        success: true,
        departmentId,
        tenantId,
        users: userIds,
        ...results
      };
    } catch (error) {
      logger.error('Error sending notification to department:', error);
      throw error;
    }
  }
}

module.exports = RealtimeNotificationService;

