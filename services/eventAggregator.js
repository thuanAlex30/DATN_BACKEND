const kafkaConsumer = require('./kafkaConsumer');
const { eventTypes } = require('../config/kafkaConfig');
const logger = require('../utils/logger');

class EventAggregator {
  constructor() {
    this.eventHandlers = new Map();
    this.eventStats = new Map();
    this.isInitialized = false;
    this.isRunning = false;
  }

  /**
   * Initialize Event Aggregator
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('🔄 Event Aggregator already initialized');
        return;
      }

      console.log('🔄 Initializing Event Aggregator...');

      // Initialize Kafka Consumer
      await kafkaConsumer.initialize();

      // Register event handlers
      this.registerEventHandlers();

      // Start consuming events
      await this.startConsuming();

      this.isInitialized = true;
      this.isRunning = true;

      console.log('✅ Event Aggregator initialized successfully');

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to initialize Event Aggregator:', error);
      throw error;
    }
  }

  /**
   * Register event handlers
   */
  registerEventHandlers() {
    // Project Events
    this.registerHandler(eventTypes.PROJECT_CREATED, this.handleProjectCreated.bind(this));
    this.registerHandler(eventTypes.PROJECT_UPDATED, this.handleProjectUpdated.bind(this));
    this.registerHandler(eventTypes.PROJECT_ASSIGNED, this.handleProjectAssigned.bind(this));
    this.registerHandler(eventTypes.PROJECT_PROGRESS_UPDATED, this.handleProjectProgressUpdated.bind(this));
    this.registerHandler(eventTypes.PROJECT_DELETED, this.handleProjectDeleted.bind(this));

    // Task Events
    this.registerHandler(eventTypes.TASK_CREATED, this.handleTaskCreated.bind(this));
    this.registerHandler(eventTypes.TASK_UPDATED, this.handleTaskUpdated.bind(this));
    this.registerHandler(eventTypes.TASK_ASSIGNED, this.handleTaskAssigned.bind(this));
    this.registerHandler(eventTypes.TASK_STATUS_UPDATED, this.handleTaskStatusUpdated.bind(this));
    this.registerHandler(eventTypes.TASK_PROGRESS_UPDATED, this.handleTaskProgressUpdated.bind(this));
    this.registerHandler(eventTypes.TASK_COMMENT_ADDED, this.handleTaskCommentAdded.bind(this));
    this.registerHandler(eventTypes.TASK_DELETED, this.handleTaskDeleted.bind(this));

    // Incident Events
    this.registerHandler(eventTypes.INCIDENT_REPORTED, this.handleIncidentReported.bind(this));
    this.registerHandler(eventTypes.INCIDENT_UPDATED, this.handleIncidentUpdated.bind(this));
    this.registerHandler(eventTypes.INCIDENT_ASSIGNED, this.handleIncidentAssigned.bind(this));
    this.registerHandler(eventTypes.INCIDENT_STATUS_UPDATED, this.handleIncidentStatusUpdated.bind(this));
    this.registerHandler(eventTypes.INCIDENT_INVESTIGATION_STARTED, this.handleIncidentInvestigationStarted.bind(this));
    this.registerHandler(eventTypes.INCIDENT_INVESTIGATION_COMPLETED, this.handleIncidentInvestigationCompleted.bind(this));
    this.registerHandler(eventTypes.INCIDENT_RESOLVED, this.handleIncidentResolved.bind(this));
    this.registerHandler(eventTypes.INCIDENT_CLOSED, this.handleIncidentClosed.bind(this));
    this.registerHandler(eventTypes.INCIDENT_DELETED, this.handleIncidentDeleted.bind(this));
    this.registerHandler(eventTypes.INCIDENT_COMMENT_ADDED, this.handleIncidentCommentAdded.bind(this));
    this.registerHandler(eventTypes.INCIDENT_ATTACHMENT_ADDED, this.handleIncidentAttachmentAdded.bind(this));

    // PPE Events
    this.registerHandler(eventTypes.PPE_ITEM_CREATED, this.handlePPEItemCreated.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_UPDATED, this.handlePPEItemUpdated.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_ASSIGNED, this.handlePPEItemAssigned.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_RETURNED, this.handlePPEItemReturned.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_INSPECTED, this.handlePPEItemInspected.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_MAINTENANCE_SCHEDULED, this.handlePPEItemMaintenanceScheduled.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_MAINTENANCE_COMPLETED, this.handlePPEItemMaintenanceCompleted.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_EXPIRED, this.handlePPEItemExpired.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_DAMAGED, this.handlePPEItemDamaged.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_DELETED, this.handlePPEItemDeleted.bind(this));
    this.registerHandler(eventTypes.PPE_ITEM_STOCK_UPDATED, this.handlePPEItemStockUpdated.bind(this));

    // User Events
    this.registerHandler(eventTypes.USER_REGISTERED, this.handleUserRegistered.bind(this));
    this.registerHandler(eventTypes.USER_PROFILE_UPDATED, this.handleUserProfileUpdated.bind(this));
    this.registerHandler(eventTypes.USER_ROLE_CHANGED, this.handleUserRoleChanged.bind(this));
    this.registerHandler(eventTypes.USER_STATUS_UPDATED, this.handleUserStatusUpdated.bind(this));
    this.registerHandler(eventTypes.USER_ASSIGNED_TO_PROJECT, this.handleUserAssignedToProject.bind(this));
    this.registerHandler(eventTypes.USER_REMOVED_FROM_PROJECT, this.handleUserRemovedFromProject.bind(this));
    this.registerHandler(eventTypes.USER_TRAINING_COMPLETED, this.handleUserTrainingCompleted.bind(this));
    this.registerHandler(eventTypes.USER_CERTIFICATION_UPDATED, this.handleUserCertificationUpdated.bind(this));
    this.registerHandler(eventTypes.USER_PERFORMANCE_UPDATED, this.handleUserPerformanceUpdated.bind(this));
    this.registerHandler(eventTypes.USER_LOGIN, this.handleUserLogin.bind(this));
    this.registerHandler(eventTypes.USER_LOGOUT, this.handleUserLogout.bind(this));
    this.registerHandler(eventTypes.USER_DELETED, this.handleUserDeleted.bind(this));

    // Notification Events
    this.registerHandler(eventTypes.NOTIFICATION_SENT, this.handleNotificationSent.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_DELIVERED, this.handleNotificationDelivered.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_READ, this.handleNotificationRead.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_CLICKED, this.handleNotificationClicked.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_FAILED, this.handleNotificationFailed.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_SCHEDULED, this.handleNotificationScheduled.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_CANCELLED, this.handleNotificationCancelled.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_TEMPLATE_CREATED, this.handleNotificationTemplateCreated.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_TEMPLATE_UPDATED, this.handleNotificationTemplateUpdated.bind(this));
    this.registerHandler(eventTypes.NOTIFICATION_TEMPLATE_DELETED, this.handleNotificationTemplateDeleted.bind(this));

    // System Events
    this.registerHandler(eventTypes.SYSTEM_STARTUP, this.handleSystemStartup.bind(this));
    this.registerHandler(eventTypes.SYSTEM_SHUTDOWN, this.handleSystemShutdown.bind(this));
    this.registerHandler(eventTypes.SYSTEM_HEALTH_CHECK, this.handleSystemHealthCheck.bind(this));
    this.registerHandler(eventTypes.SYSTEM_ERROR, this.handleSystemError.bind(this));
    this.registerHandler(eventTypes.SYSTEM_PERFORMANCE, this.handleSystemPerformance.bind(this));
    this.registerHandler(eventTypes.SYSTEM_CONFIGURATION_UPDATED, this.handleSystemConfigurationUpdated.bind(this));
    this.registerHandler(eventTypes.SYSTEM_BACKUP, this.handleSystemBackup.bind(this));
    this.registerHandler(eventTypes.SYSTEM_RESTORE, this.handleSystemRestore.bind(this));
    this.registerHandler(eventTypes.SYSTEM_MAINTENANCE, this.handleSystemMaintenance.bind(this));
    this.registerHandler(eventTypes.SYSTEM_SECURITY, this.handleSystemSecurity.bind(this));

    console.log(`✅ Registered ${this.eventHandlers.size} event handlers`);
  }

  /**
   * Register event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   */
  registerHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    this.eventStats.set(eventType, {
      count: 0,
      lastProcessed: null,
      errors: 0,
      avgProcessingTime: 0
    });
  }

  /**
   * Start consuming events
   */
  async startConsuming() {
    try {
      console.log('🔄 Starting event consumption...');

      // Register event handlers with kafkaConsumer
      for (const [eventType, handler] of this.eventHandlers) {
        kafkaConsumer.addEventHandler(eventType, handler);
      }

      // Start consuming - kafkaConsumer will handle subscription internally
      await kafkaConsumer.startConsuming();

      console.log('✅ Event consumption started');
    } catch (error) {
      console.error('❌ Failed to start event consumption:', error);
      throw error;
    }
  }

  /**
   * Handle incoming event
   * @param {Object} eventData - Event data
   */
  async handleEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;
      const startTime = Date.now();

      // Update statistics
      const stats = this.eventStats.get(eventType);
      if (stats) {
        stats.count++;
        stats.lastProcessed = new Date();
      }

      // Get handler
      const handler = this.eventHandlers.get(eventType);
      if (!handler) {
        console.warn(`⚠️ No handler found for event type: ${eventType}`);
        return;
      }

      // Process event
      await handler(eventData);

      // Update processing time
      const processingTime = Date.now() - startTime;
      if (stats) {
        stats.avgProcessingTime = (stats.avgProcessingTime + processingTime) / 2;
      }

      console.log(`✅ Event processed: ${eventType} (${processingTime}ms)`);

    } catch (error) {
      console.error(`❌ Error handling event ${eventData.eventType}:`, error);
      
      // Update error statistics
      const stats = this.eventStats.get(eventData.eventType);
      if (stats) {
        stats.errors++;
      }

      // Log error
      logger.error('Event processing error', {
        eventType: eventData.eventType,
        eventId: eventData.eventId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Project Event Handlers
  async handleProjectCreated(eventData) {
    console.log('📋 Project created:', eventData.data.projectId);
    // Add project creation logic here
  }

  async handleProjectUpdated(eventData) {
    console.log('📋 Project updated:', eventData.data.projectId);
    // Add project update logic here
  }

  async handleProjectAssigned(eventData) {
    console.log('📋 Project assigned:', eventData.data.projectId);
    // Add project assignment logic here
  }

  async handleProjectProgressUpdated(eventData) {
    console.log('📋 Project progress updated:', eventData.data.projectId);
    // Add project progress update logic here
  }

  async handleProjectDeleted(eventData) {
    console.log('📋 Project deleted:', eventData.data.projectId);
    // Add project deletion logic here
  }

  // Task Event Handlers
  async handleTaskCreated(eventData) {
    console.log('📝 Task created:', eventData.data.taskId);
    // Add task creation logic here
  }

  async handleTaskUpdated(eventData) {
    console.log('📝 Task updated:', eventData.data.taskId);
    // Add task update logic here
  }

  async handleTaskAssigned(eventData) {
    console.log('📝 Task assigned:', eventData.data.taskId);
    // Add task assignment logic here
  }

  async handleTaskStatusUpdated(eventData) {
    console.log('📝 Task status updated:', eventData.data.taskId);
    // Add task status update logic here
  }

  async handleTaskProgressUpdated(eventData) {
    console.log('📝 Task progress updated:', eventData.data.taskId);
    // Add task progress update logic here
  }

  async handleTaskCommentAdded(eventData) {
    console.log('📝 Task comment added:', eventData.data.taskId);
    // Add task comment logic here
  }

  async handleTaskDeleted(eventData) {
    console.log('📝 Task deleted:', eventData.data.taskId);
    // Add task deletion logic here
  }

  // Incident Event Handlers
  async handleIncidentReported(eventData) {
    console.log('🚨 Incident reported:', eventData.data.incidentId);
    // Add incident reporting logic here
  }

  async handleIncidentUpdated(eventData) {
    console.log('🚨 Incident updated:', eventData.data.incidentId);
    // Add incident update logic here
  }

  async handleIncidentAssigned(eventData) {
    console.log('🚨 Incident assigned:', eventData.data.incidentId);
    // Add incident assignment logic here
  }

  async handleIncidentStatusUpdated(eventData) {
    console.log('🚨 Incident status updated:', eventData.data.incidentId);
    // Add incident status update logic here
  }

  async handleIncidentInvestigationStarted(eventData) {
    console.log('🚨 Incident investigation started:', eventData.data.incidentId);
    // Add investigation start logic here
  }

  async handleIncidentInvestigationCompleted(eventData) {
    console.log('🚨 Incident investigation completed:', eventData.data.incidentId);
    // Add investigation completion logic here
  }

  async handleIncidentResolved(eventData) {
    console.log('🚨 Incident resolved:', eventData.data.incidentId);
    // Add incident resolution logic here
  }

  async handleIncidentClosed(eventData) {
    console.log('🚨 Incident closed:', eventData.data.incidentId);
    // Add incident closure logic here
  }

  async handleIncidentDeleted(eventData) {
    console.log('🚨 Incident deleted:', eventData.data.incidentId);
    // Add incident deletion logic here
  }

  async handleIncidentCommentAdded(eventData) {
    console.log('🚨 Incident comment added:', eventData.data.incidentId);
    // Add incident comment logic here
  }

  async handleIncidentAttachmentAdded(eventData) {
    console.log('🚨 Incident attachment added:', eventData.data.incidentId);
    // Add incident attachment logic here
  }

  // PPE Event Handlers
  async handlePPEItemCreated(eventData) {
    console.log('🛡️ PPE item created:', eventData.data.ppeItemId);
    // Add PPE item creation logic here
  }

  async handlePPEItemUpdated(eventData) {
    console.log('🛡️ PPE item updated:', eventData.data.ppeItemId);
    // Add PPE item update logic here
  }

  async handlePPEItemAssigned(eventData) {
    console.log('🛡️ PPE item assigned:', eventData.data.ppeItemId);
    // Add PPE item assignment logic here
  }

  async handlePPEItemReturned(eventData) {
    console.log('🛡️ PPE item returned:', eventData.data.ppeItemId);
    // Add PPE item return logic here
  }

  async handlePPEItemInspected(eventData) {
    console.log('🛡️ PPE item inspected:', eventData.data.ppeItemId);
    // Add PPE item inspection logic here
  }

  async handlePPEItemMaintenanceScheduled(eventData) {
    console.log('🛡️ PPE item maintenance scheduled:', eventData.data.ppeItemId);
    // Add PPE item maintenance scheduling logic here
  }

  async handlePPEItemMaintenanceCompleted(eventData) {
    console.log('🛡️ PPE item maintenance completed:', eventData.data.ppeItemId);
    // Add PPE item maintenance completion logic here
  }

  async handlePPEItemExpired(eventData) {
    console.log('🛡️ PPE item expired:', eventData.data.ppeItemId);
    // Add PPE item expiration logic here
  }

  async handlePPEItemDamaged(eventData) {
    console.log('🛡️ PPE item damaged:', eventData.data.ppeItemId);
    // Add PPE item damage logic here
  }

  async handlePPEItemDeleted(eventData) {
    console.log('🛡️ PPE item deleted:', eventData.data.ppeItemId);
    // Add PPE item deletion logic here
  }

  async handlePPEItemStockUpdated(eventData) {
    console.log('🛡️ PPE item stock updated:', eventData.data.ppeItemId);
    // Add PPE item stock update logic here
  }

  // User Event Handlers
  async handleUserRegistered(eventData) {
    console.log('👤 User registered:', eventData.data.userId);
    // Add user registration logic here
  }

  async handleUserProfileUpdated(eventData) {
    console.log('👤 User profile updated:', eventData.data.userId);
    // Add user profile update logic here
  }

  async handleUserRoleChanged(eventData) {
    console.log('👤 User role changed:', eventData.data.userId);
    // Add user role change logic here
  }

  async handleUserStatusUpdated(eventData) {
    console.log('👤 User status updated:', eventData.data.userId);
    // Add user status update logic here
  }

  async handleUserAssignedToProject(eventData) {
    console.log('👤 User assigned to project:', eventData.data.userId);
    // Add user project assignment logic here
  }

  async handleUserRemovedFromProject(eventData) {
    console.log('👤 User removed from project:', eventData.data.userId);
    // Add user project removal logic here
  }

  async handleUserTrainingCompleted(eventData) {
    console.log('👤 User training completed:', eventData.data.userId);
    // Add user training completion logic here
  }

  async handleUserCertificationUpdated(eventData) {
    console.log('👤 User certification updated:', eventData.data.userId);
    // Add user certification update logic here
  }

  async handleUserPerformanceUpdated(eventData) {
    console.log('👤 User performance updated:', eventData.data.userId);
    // Add user performance update logic here
  }

  async handleUserLogin(eventData) {
    console.log('👤 User login:', eventData.data.userId);
    // Add user login logic here
  }

  async handleUserLogout(eventData) {
    console.log('👤 User logout:', eventData.data.userId);
    // Add user logout logic here
  }

  async handleUserDeleted(eventData) {
    console.log('👤 User deleted:', eventData.data.userId);
    // Add user deletion logic here
  }

  // Notification Event Handlers
  async handleNotificationSent(eventData) {
    console.log('📧 Notification sent:', eventData.data.notificationId);
    // Add notification sent logic here
  }

  async handleNotificationDelivered(eventData) {
    console.log('📧 Notification delivered:', eventData.data.notificationId);
    // Add notification delivery logic here
  }

  async handleNotificationRead(eventData) {
    console.log('📧 Notification read:', eventData.data.notificationId);
    // Add notification read logic here
  }

  async handleNotificationClicked(eventData) {
    console.log('📧 Notification clicked:', eventData.data.notificationId);
    // Add notification click logic here
  }

  async handleNotificationFailed(eventData) {
    console.log('📧 Notification failed:', eventData.data.notificationId);
    // Add notification failure logic here
  }

  async handleNotificationScheduled(eventData) {
    console.log('📧 Notification scheduled:', eventData.data.notificationId);
    // Add notification scheduling logic here
  }

  async handleNotificationCancelled(eventData) {
    console.log('📧 Notification cancelled:', eventData.data.notificationId);
    // Add notification cancellation logic here
  }

  async handleNotificationTemplateCreated(eventData) {
    console.log('📧 Notification template created:', eventData.data.templateId);
    // Add notification template creation logic here
  }

  async handleNotificationTemplateUpdated(eventData) {
    console.log('📧 Notification template updated:', eventData.data.templateId);
    // Add notification template update logic here
  }

  async handleNotificationTemplateDeleted(eventData) {
    console.log('📧 Notification template deleted:', eventData.data.templateId);
    // Add notification template deletion logic here
  }

  // System Event Handlers
  async handleSystemStartup(eventData) {
    console.log('🖥️ System startup:', eventData.data.systemId);
    // Add system startup logic here
  }

  async handleSystemShutdown(eventData) {
    console.log('🖥️ System shutdown:', eventData.data.systemId);
    // Add system shutdown logic here
  }

  async handleSystemHealthCheck(eventData) {
    console.log('🖥️ System health check:', eventData.data.systemId);
    // Add system health check logic here
  }

  async handleSystemError(eventData) {
    console.log('🖥️ System error:', eventData.data.systemId);
    // Add system error logic here
  }

  async handleSystemPerformance(eventData) {
    console.log('🖥️ System performance:', eventData.data.systemId);
    // Add system performance logic here
  }

  async handleSystemConfigurationUpdated(eventData) {
    console.log('🖥️ System configuration updated:', eventData.data.systemId);
    // Add system configuration update logic here
  }

  async handleSystemBackup(eventData) {
    console.log('🖥️ System backup:', eventData.data.systemId);
    // Add system backup logic here
  }

  async handleSystemRestore(eventData) {
    console.log('🖥️ System restore:', eventData.data.systemId);
    // Add system restore logic here
  }

  async handleSystemMaintenance(eventData) {
    console.log('🖥️ System maintenance:', eventData.data.systemId);
    // Add system maintenance logic here
  }

  async handleSystemSecurity(eventData) {
    console.log('🖥️ System security:', eventData.data.systemId);
    // Add system security logic here
  }

  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getEventStats() {
    const stats = {};
    for (const [eventType, data] of this.eventStats) {
      stats[eventType] = { ...data };
    }
    return stats;
  }

  /**
   * Get overall statistics
   * @returns {Object} Overall statistics
   */
  getOverallStats() {
    let totalEvents = 0;
    let totalErrors = 0;
    let avgProcessingTime = 0;

    for (const [, data] of this.eventStats) {
      totalEvents += data.count;
      totalErrors += data.errors;
      avgProcessingTime += data.avgProcessingTime;
    }

    avgProcessingTime = this.eventStats.size > 0 ? avgProcessingTime / this.eventStats.size : 0;

    return {
      totalEvents,
      totalErrors,
      avgProcessingTime,
      errorRate: totalEvents > 0 ? (totalErrors / totalEvents) * 100 : 0,
      isRunning: this.isRunning,
      handlerCount: this.eventHandlers.size
    };
  }

  /**
   * Shutdown Event Aggregator
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down Event Aggregator...');
      
      this.isRunning = false;
      
      // Disconnect Kafka Consumer
      await kafkaConsumer.disconnect();
      
      console.log('✅ Event Aggregator shutdown completed');
    } catch (error) {
      console.error('❌ Error during Event Aggregator shutdown:', error);
    }
  }
}

// Create singleton instance
const eventAggregator = new EventAggregator();

module.exports = eventAggregator;
