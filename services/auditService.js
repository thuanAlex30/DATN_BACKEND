const kafkaConsumer = require('./kafkaConsumer');
const { eventTypes } = require('../config/kafkaConfig');
const logger = require('../utils/logger');

class AuditService {
  constructor() {
    this.auditLogs = new Map();
    this.isInitialized = false;
    this.isRunning = false;
    this.retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
    this.maxLogs = 100000; // Maximum number of logs to keep in memory
  }

  /**
   * Initialize Audit Service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('🔍 Audit Service already initialized');
        return;
      }

      console.log('🔍 Initializing Audit Service...');

      // Initialize Kafka Consumer
      await kafkaConsumer.initialize();

      // Start consuming events
      await this.startConsuming();

      // Start periodic cleanup
      this.startPeriodicCleanup();

      this.isInitialized = true;
      this.isRunning = true;

      console.log('✅ Audit Service initialized successfully');

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to initialize Audit Service:', error);
      throw error;
    }
  }

  /**
   * Start consuming events
   */
  async startConsuming() {
    try {
      console.log('🔍 Starting audit event consumption...');

      // Register audit event handler for all event types
      // We'll use a wildcard approach - register for all possible event types
      const allEventTypes = Object.values(eventTypes);
      for (const eventType of allEventTypes) {
        kafkaConsumer.addEventHandler(eventType, this.processEvent.bind(this));
      }

      // Start consuming - kafkaConsumer will handle subscription internally
      await kafkaConsumer.startConsuming();

      console.log('✅ Audit event consumption started');
    } catch (error) {
      console.error('❌ Failed to start audit event consumption:', error);
      throw error;
    }
  }

  /**
   * Process event for audit
   * @param {Object} eventData - Event data
   */
  async processEvent(eventData) {
    try {
      const { eventType, data, metadata, timestamp, eventId } = eventData;
      const eventTime = new Date(timestamp);

      // Create audit log entry
      const auditLog = {
        id: eventId,
        eventType,
        timestamp: eventTime,
        data: this.sanitizeData(data),
        metadata: this.sanitizeMetadata(metadata),
        severity: this.determineSeverity(eventType),
        category: this.categorizeEvent(eventType),
        action: this.extractAction(eventType),
        resource: this.extractResource(eventType, data),
        user: this.extractUser(metadata),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: metadata.sessionId,
        requestId: metadata.requestId
      };

      // Store audit log
      this.storeAuditLog(auditLog);

      // Log audit event
      logger.info('Audit event processed', {
        eventType,
        eventId,
        userId: metadata.userId,
        action: auditLog.action,
        resource: auditLog.resource,
        timestamp: eventTime.toISOString()
      });

    } catch (error) {
      console.error(`❌ Error processing audit event ${eventData.eventType}:`, error);
      logger.error('Audit event processing error', {
        eventType: eventData.eventType,
        eventId: eventData.eventId,
        error: error.message
      });
    }
  }

  /**
   * Sanitize data for audit
   * @param {Object} data - Event data
   * @returns {Object} Sanitized data
   */
  sanitizeData(data) {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Limit data size
    const dataStr = JSON.stringify(sanitized);
    if (dataStr.length > 10000) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: dataStr.length
      };
    }

    return sanitized;
  }

  /**
   * Sanitize metadata for audit
   * @param {Object} metadata - Event metadata
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Determine event severity
   * @param {string} eventType - Event type
   * @returns {string} Severity level
   */
  determineSeverity(eventType) {
    const highSeverityEvents = [
      eventTypes.USER_DELETED,
      eventTypes.PROJECT_DELETED,
      eventTypes.INCIDENT_REPORTED,
      eventTypes.SYSTEM_ERROR,
      eventTypes.SYSTEM_SECURITY
    ];

    const mediumSeverityEvents = [
      eventTypes.USER_ROLE_CHANGED,
      eventTypes.USER_STATUS_UPDATED,
      eventTypes.PROJECT_ASSIGNED,
      eventTypes.TASK_ASSIGNED,
      eventTypes.INCIDENT_ASSIGNED,
      eventTypes.PPE_ITEM_ASSIGNED
    ];

    if (highSeverityEvents.includes(eventType)) {
      return 'high';
    } else if (mediumSeverityEvents.includes(eventType)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Categorize event
   * @param {string} eventType - Event type
   * @returns {string} Event category
   */
  categorizeEvent(eventType) {
    if (eventType.startsWith('project_')) return 'project';
    if (eventType.startsWith('task_')) return 'task';
    if (eventType.startsWith('incident_')) return 'incident';
    if (eventType.startsWith('ppe_')) return 'ppe';
    if (eventType.startsWith('user_')) return 'user';
    if (eventType.startsWith('notification_')) return 'notification';
    if (eventType.startsWith('system_')) return 'system';
    return 'other';
  }

  /**
   * Extract action from event type
   * @param {string} eventType - Event type
   * @returns {string} Action
   */
  extractAction(eventType) {
    const actionMap = {
      'created': 'create',
      'updated': 'update',
      'deleted': 'delete',
      'assigned': 'assign',
      'reported': 'report',
      'resolved': 'resolve',
      'closed': 'close',
      'login': 'login',
      'logout': 'logout',
      'sent': 'send',
      'delivered': 'deliver',
      'read': 'read',
      'clicked': 'click',
      'failed': 'fail',
      'scheduled': 'schedule',
      'cancelled': 'cancel',
      'startup': 'startup',
      'shutdown': 'shutdown',
      'error': 'error',
      'performance': 'performance',
      'backup': 'backup',
      'restore': 'restore',
      'maintenance': 'maintenance',
      'security': 'security'
    };

    for (const [key, value] of Object.entries(actionMap)) {
      if (eventType.includes(key)) {
        return value;
      }
    }

    return 'unknown';
  }

  /**
   * Extract resource from event type and data
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @returns {string} Resource
   */
  extractResource(eventType, data) {
    if (data.projectId) return `project:${data.projectId}`;
    if (data.taskId) return `task:${data.taskId}`;
    if (data.incidentId) return `incident:${data.incidentId}`;
    if (data.ppeItemId) return `ppe:${data.ppeItemId}`;
    if (data.userId) return `user:${data.userId}`;
    if (data.notificationId) return `notification:${data.notificationId}`;
    if (data.templateId) return `template:${data.templateId}`;
    if (data.systemId) return `system:${data.systemId}`;
    
    return this.categorizeEvent(eventType);
  }

  /**
   * Extract user information
   * @param {Object} metadata - Event metadata
   * @returns {Object} User information
   */
  extractUser(metadata) {
    return {
      id: metadata.userId,
      role: metadata.userRole,
      name: metadata.userFullName,
      email: metadata.userEmail
    };
  }

  /**
   * Store audit log
   * @param {Object} auditLog - Audit log entry
   */
  storeAuditLog(auditLog) {
    // Store in memory
    this.auditLogs.set(auditLog.id, auditLog);

    // Check if we need to clean up
    if (this.auditLogs.size > this.maxLogs) {
      this.cleanupOldLogs();
    }
  }

  /**
   * Cleanup old logs
   */
  cleanupOldLogs() {
    const cutoffTime = Date.now() - this.retentionPeriod;
    let cleanedCount = 0;

    for (const [id, log] of this.auditLogs) {
      if (log.timestamp.getTime() < cutoffTime) {
        this.auditLogs.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} old audit logs`);
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    // Cleanup every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 3600000);

    console.log('✅ Periodic cleanup started');
  }

  /**
   * Get audit logs
   * @param {Object} filters - Filter criteria
   * @returns {Array} Audit logs
   */
  getAuditLogs(filters = {}) {
    const logs = Array.from(this.auditLogs.values());
    
    let filteredLogs = logs;

    // Apply filters
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.user.id === filters.userId);
    }

    if (filters.eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource.includes(filters.resource));
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const offset = (page - 1) * limit;

    return {
      logs: filteredLogs.slice(offset, offset + limit),
      total: filteredLogs.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLogs.length / limit)
    };
  }

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Object|null} Audit log
   */
  getAuditLogById(id) {
    return this.auditLogs.get(id) || null;
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Audit statistics
   */
  getAuditStatistics(filters = {}) {
    const logs = Array.from(this.auditLogs.values());
    
    // Apply basic filters
    let filteredLogs = logs;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    const stats = {
      total: filteredLogs.length,
      byCategory: {},
      bySeverity: {},
      byAction: {},
      byUser: {},
      byResource: {},
      byHour: {},
      byDay: {},
      topEvents: [],
      topUsers: [],
      topResources: []
    };

    // Calculate statistics
    for (const log of filteredLogs) {
      // By category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // By severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // By action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // By user
      if (log.user.id) {
        stats.byUser[log.user.id] = (stats.byUser[log.user.id] || 0) + 1;
      }
      
      // By resource
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      
      // By hour
      const hour = log.timestamp.getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      
      // By day
      const day = log.timestamp.toDateString();
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    }

    // Get top events
    stats.topEvents = Object.entries(stats.byAction)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Get top users
    stats.topUsers = Object.entries(stats.byUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Get top resources
    stats.topResources = Object.entries(stats.byResource)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    return stats;
  }

  /**
   * Search audit logs
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Search results
   */
  searchAuditLogs(query, filters = {}) {
    const logs = Array.from(this.auditLogs.values());
    const searchTerm = query.toLowerCase();
    
    let results = logs.filter(log => {
      return (
        log.eventType.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.resource.toLowerCase().includes(searchTerm) ||
        log.user.name?.toLowerCase().includes(searchTerm) ||
        log.user.email?.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm)
      );
    });

    // Apply additional filters
    if (filters.userId) {
      results = results.filter(log => log.user.id === filters.userId);
    }

    if (filters.category) {
      results = results.filter(log => log.category === filters.category);
    }

    if (filters.severity) {
      results = results.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      results = results.filter(log => log.timestamp >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      results = results.filter(log => log.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    return results;
  }

  /**
   * Export audit logs
   * @param {Object} filters - Filter criteria
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported audit logs
   */
  exportAuditLogs(filters = {}, format = 'json') {
    const { logs } = this.getAuditLogs(filters);
    
    const exportData = {
      logs,
      exportDate: new Date().toISOString(),
      totalCount: logs.length,
      filters
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert audit logs to CSV format
   * @param {Object} data - Audit log data
   * @returns {string} CSV data
   */
  convertToCSV(data) {
    const rows = [];
    rows.push('ID,Event Type,Timestamp,Action,Category,Severity,Resource,User ID,User Name,User Role,IP Address,User Agent');
    
    for (const log of data.logs) {
      rows.push([
        log.id,
        log.eventType,
        log.timestamp.toISOString(),
        log.action,
        log.category,
        log.severity,
        log.resource,
        log.user.id || '',
        log.user.name || '',
        log.user.role || '',
        log.ipAddress || '',
        log.userAgent || ''
      ].join(','));
    }
    
    return rows.join('\n');
  }

  /**
   * Get compliance report
   * @param {Object} filters - Filter criteria
   * @returns {Object} Compliance report
   */
  getComplianceReport(filters = {}) {
    const logs = Array.from(this.auditLogs.values());
    
    // Apply filters
    let filteredLogs = logs;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    const report = {
      period: {
        start: filters.startDate || new Date(Math.min(...logs.map(l => l.timestamp))).toISOString(),
        end: filters.endDate || new Date(Math.max(...logs.map(l => l.timestamp))).toISOString()
      },
      summary: {
        totalEvents: filteredLogs.length,
        highSeverityEvents: filteredLogs.filter(l => l.severity === 'high').length,
        mediumSeverityEvents: filteredLogs.filter(l => l.severity === 'medium').length,
        lowSeverityEvents: filteredLogs.filter(l => l.severity === 'low').length
      },
      categories: {},
      users: {},
      resources: {},
      compliance: {
        dataAccess: filteredLogs.filter(l => l.action === 'read' || l.action === 'view').length,
        dataModification: filteredLogs.filter(l => l.action === 'create' || l.action === 'update' || l.action === 'delete').length,
        userManagement: filteredLogs.filter(l => l.category === 'user').length,
        systemEvents: filteredLogs.filter(l => l.category === 'system').length
      }
    };

    // Calculate category breakdown
    for (const log of filteredLogs) {
      report.categories[log.category] = (report.categories[log.category] || 0) + 1;
    }

    // Calculate user activity
    for (const log of filteredLogs) {
      if (log.user.id) {
        if (!report.users[log.user.id]) {
          report.users[log.user.id] = {
            name: log.user.name,
            role: log.user.role,
            events: 0,
            lastActivity: log.timestamp
          };
        }
        report.users[log.user.id].events++;
        if (log.timestamp > report.users[log.user.id].lastActivity) {
          report.users[log.user.id].lastActivity = log.timestamp;
        }
      }
    }

    // Calculate resource activity
    for (const log of filteredLogs) {
      report.resources[log.resource] = (report.resources[log.resource] || 0) + 1;
    }

    return report;
  }

  /**
   * Shutdown Audit Service
   */
  async shutdown() {
    try {
      console.log('🔍 Shutting down Audit Service...');
      
      this.isRunning = false;
      
      // Disconnect Kafka Consumer
      await kafkaConsumer.disconnect();
      
      console.log('✅ Audit Service shutdown completed');
    } catch (error) {
      console.error('❌ Error during Audit Service shutdown:', error);
    }
  }
}

// Create singleton instance
const auditService = new AuditService();

module.exports = auditService;
