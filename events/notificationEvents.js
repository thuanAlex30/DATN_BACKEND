const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class NotificationEvents {
  /**
   * Emit notification sent event
   * @param {Object} notification - Notification data
   * @param {Object} sender - Sender information
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationSent(notification, sender) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        sentAt: new Date().toISOString(),
        deliveryMethod: notification.delivery_method,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id,
        scheduledAt: notification.scheduled_at,
        expiresAt: notification.expires_at,
        readAt: notification.read_at,
        clickedAt: notification.clicked_at,
        actionTaken: notification.action_taken
      };

      const metadata = {
        userId: sender._id,
        userRole: sender.role,
        userFullName: sender.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_SENT,
        eventData,
        metadata
      );

      console.log(`✅ Notification sent event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification sent event:', error);
      throw error;
    }
  }

  /**
   * Emit notification delivered event
   * @param {Object} notification - Notification data
   * @param {Object} deliveryData - Delivery data
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationDelivered(notification, deliveryData) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        sentAt: notification.sent_at,
        deliveredAt: new Date().toISOString(),
        deliveryMethod: notification.delivery_method,
        deliveryStatus: deliveryData.status,
        deliveryProvider: deliveryData.provider,
        deliveryId: deliveryData.deliveryId,
        deliveryResponse: deliveryData.response,
        deliveryCost: deliveryData.cost,
        deliveryTime: deliveryData.deliveryTime,
        deliveryAttempts: deliveryData.attempts,
        deliveryErrors: deliveryData.errors || [],
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id
      };

      const metadata = {
        userId: notification.sender_id,
        userRole: notification.sender_role,
        userFullName: notification.sender_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_DELIVERED,
        eventData,
        metadata
      );

      console.log(`✅ Notification delivered event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification delivered event:', error);
      throw error;
    }
  }

  /**
   * Emit notification read event
   * @param {Object} notification - Notification data
   * @param {Object} reader - Reader information
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationRead(notification, reader) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        sentAt: notification.sent_at,
        deliveredAt: notification.delivered_at,
        readAt: new Date().toISOString(),
        deliveryMethod: notification.delivery_method,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id,
        readDuration: notification.read_duration,
        readLocation: notification.read_location,
        readDevice: notification.read_device
      };

      const metadata = {
        userId: reader._id,
        userRole: reader.role,
        userFullName: reader.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_READ,
        eventData,
        metadata
      );

      console.log(`✅ Notification read event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification read event:', error);
      throw error;
    }
  }

  /**
   * Emit notification clicked event
   * @param {Object} notification - Notification data
   * @param {Object} clicker - Clicker information
   * @param {Object} clickData - Click data
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationClicked(notification, clicker, clickData) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        sentAt: notification.sent_at,
        deliveredAt: notification.delivered_at,
        readAt: notification.read_at,
        clickedAt: new Date().toISOString(),
        deliveryMethod: notification.delivery_method,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id,
        clickLocation: clickData.location,
        clickDevice: clickData.device,
        clickAction: clickData.action,
        clickTarget: clickData.target,
        clickDuration: clickData.duration,
        clickSequence: clickData.sequence
      };

      const metadata = {
        userId: clicker._id,
        userRole: clicker.role,
        userFullName: clicker.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_CLICKED,
        eventData,
        metadata
      );

      console.log(`✅ Notification clicked event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification clicked event:', error);
      throw error;
    }
  }

  /**
   * Emit notification failed event
   * @param {Object} notification - Notification data
   * @param {Object} failureData - Failure data
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationFailed(notification, failureData) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        sentAt: notification.sent_at,
        failedAt: new Date().toISOString(),
        deliveryMethod: notification.delivery_method,
        failureReason: failureData.reason,
        failureCode: failureData.code,
        failureMessage: failureData.message,
        failureProvider: failureData.provider,
        failureAttempts: failureData.attempts,
        failureRetryable: failureData.retryable,
        failureNextRetry: failureData.nextRetry,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id
      };

      const metadata = {
        userId: notification.sender_id,
        userRole: notification.sender_role,
        userFullName: notification.sender_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_FAILED,
        eventData,
        metadata
      );

      console.log(`✅ Notification failed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification failed event:', error);
      throw error;
    }
  }

  /**
   * Emit notification scheduled event
   * @param {Object} notification - Notification data
   * @param {Object} scheduler - Scheduler information
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationScheduled(notification, scheduler) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        scheduledAt: new Date().toISOString(),
        scheduledFor: notification.scheduled_for,
        deliveryMethod: notification.delivery_method,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id,
        scheduleType: notification.schedule_type,
        scheduleFrequency: notification.schedule_frequency,
        scheduleConditions: notification.schedule_conditions || [],
        scheduleTimezone: notification.schedule_timezone
      };

      const metadata = {
        userId: scheduler._id,
        userRole: scheduler.role,
        userFullName: scheduler.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_SCHEDULED,
        eventData,
        metadata
      );

      console.log(`✅ Notification scheduled event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification scheduled event:', error);
      throw error;
    }
  }

  /**
   * Emit notification cancelled event
   * @param {Object} notification - Notification data
   * @param {Object} canceller - Canceller information
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationCancelled(notification, canceller, reason) {
    try {
      const eventData = {
        notificationId: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        status: notification.status,
        recipientId: notification.recipient_id,
        recipientEmail: notification.recipient_email,
        recipientName: notification.recipient_name,
        recipientRole: notification.recipient_role,
        senderId: notification.sender_id,
        senderEmail: notification.sender_email,
        senderName: notification.sender_name,
        senderRole: notification.sender_role,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        deliveryMethod: notification.delivery_method,
        templateId: notification.template_id,
        templateName: notification.template_name,
        attachments: notification.attachments || [],
        metadata: notification.metadata || {},
        projectId: notification.project_id,
        siteId: notification.site_id,
        taskId: notification.task_id,
        incidentId: notification.incident_id,
        ppeId: notification.ppe_id,
        userId: notification.user_id,
        scheduledFor: notification.scheduled_for,
        scheduleType: notification.schedule_type
      };

      const metadata = {
        userId: canceller._id,
        userRole: canceller.role,
        userFullName: canceller.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_CANCELLED,
        eventData,
        metadata
      );

      console.log(`✅ Notification cancelled event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification cancelled event:', error);
      throw error;
    }
  }

  /**
   * Emit notification template created event
   * @param {Object} template - Template data
   * @param {Object} creator - Creator information
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationTemplateCreated(template, creator) {
    try {
      const eventData = {
        templateId: template._id,
        name: template.name,
        type: template.type,
        category: template.category,
        subject: template.subject,
        content: template.content,
        htmlContent: template.html_content,
        textContent: template.text_content,
        variables: template.variables || [],
        attachments: template.attachments || [],
        metadata: template.metadata || {},
        status: template.status,
        version: template.version,
        language: template.language,
        timezone: template.timezone,
        createdBy: creator._id,
        createdAt: new Date().toISOString(),
        usageCount: template.usage_count,
        lastUsedAt: template.last_used_at,
        approvalRequired: template.approval_required,
        approvalStatus: template.approval_status,
        approvedBy: template.approved_by,
        approvedAt: template.approved_at
      };

      const metadata = {
        userId: creator._id,
        userRole: creator.role,
        userFullName: creator.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_TEMPLATE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Notification template created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification template created event:', error);
      throw error;
    }
  }

  /**
   * Emit notification template updated event
   * @param {Object} template - Updated template data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationTemplateUpdated(template, updater, changes) {
    try {
      const eventData = {
        templateId: template._id,
        name: template.name,
        type: template.type,
        category: template.category,
        subject: template.subject,
        content: template.content,
        htmlContent: template.html_content,
        textContent: template.text_content,
        variables: template.variables || [],
        attachments: template.attachments || [],
        metadata: template.metadata || {},
        status: template.status,
        version: template.version,
        language: template.language,
        timezone: template.timezone,
        updatedBy: updater._id,
        updatedAt: new Date().toISOString(),
        changes: changes,
        usageCount: template.usage_count,
        lastUsedAt: template.last_used_at,
        approvalRequired: template.approval_required,
        approvalStatus: template.approval_status,
        approvedBy: template.approved_by,
        approvedAt: template.approved_at
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_TEMPLATE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Notification template updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification template updated event:', error);
      throw error;
    }
  }

  /**
   * Emit notification template deleted event
   * @param {Object} template - Template data
   * @param {Object} deleter - Deleter information
   * @returns {Promise<Object>} Event result
   */
  static async emitNotificationTemplateDeleted(template, deleter) {
    try {
      const eventData = {
        templateId: template._id,
        name: template.name,
        type: template.type,
        category: template.category,
        subject: template.subject,
        content: template.content,
        htmlContent: template.html_content,
        textContent: template.text_content,
        variables: template.variables || [],
        attachments: template.attachments || [],
        metadata: template.metadata || {},
        status: template.status,
        version: template.version,
        language: template.language,
        timezone: template.timezone,
        deletedBy: deleter._id,
        deletedAt: new Date().toISOString(),
        deletionReason: template.deletion_reason,
        usageCount: template.usage_count,
        lastUsedAt: template.last_used_at
      };

      const metadata = {
        userId: deleter._id,
        userRole: deleter.role,
        userFullName: deleter.full_name,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_TEMPLATE_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Notification template deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting notification template deleted event:', error);
      throw error;
    }
  }
}

module.exports = NotificationEvents;
