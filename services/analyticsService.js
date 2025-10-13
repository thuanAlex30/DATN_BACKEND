const kafkaConsumer = require('./kafkaConsumer');
const { eventTypes } = require('../config/kafkaConfig');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.metrics = new Map();
    this.realtimeData = new Map();
    this.isInitialized = false;
    this.isRunning = false;
    this.timeWindows = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
  }

  /**
   * Initialize Analytics Service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('📊 Analytics Service already initialized');
        return;
      }

      console.log('📊 Initializing Analytics Service...');

      // Initialize Kafka Consumer
      await kafkaConsumer.initialize();

      // Initialize metrics
      this.initializeMetrics();

      // Start consuming events
      await this.startConsuming();

      // Start periodic aggregation
      this.startPeriodicAggregation();

      this.isInitialized = true;
      this.isRunning = true;

      console.log('✅ Analytics Service initialized successfully');

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to initialize Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Initialize metrics
   */
  initializeMetrics() {
    // Project metrics
    this.metrics.set('projects', {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      created: 0,
      updated: 0,
      deleted: 0
    });

    // Task metrics
    this.metrics.set('tasks', {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      created: 0,
      updated: 0,
      deleted: 0
    });

    // Incident metrics
    this.metrics.set('incidents', {
      total: 0,
      open: 0,
      investigating: 0,
      resolved: 0,
      closed: 0,
      reported: 0,
      updated: 0,
      deleted: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    });

    // PPE metrics
    this.metrics.set('ppe', {
      total: 0,
      assigned: 0,
      available: 0,
      expired: 0,
      damaged: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      byCategory: {}
    });

    // User metrics
    this.metrics.set('users', {
      total: 0,
      active: 0,
      inactive: 0,
      registered: 0,
      loggedIn: 0,
      loggedOut: 0,
      byRole: {}
    });

    // Notification metrics
    this.metrics.set('notifications', {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      clicked: 0,
      failed: 0,
      byType: {}
    });

    // System metrics
    this.metrics.set('system', {
      uptime: 0,
      errors: 0,
      warnings: 0,
      performance: {
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 0
      }
    });

    console.log('✅ Metrics initialized');
  }

  /**
   * Start consuming events
   */
  async startConsuming() {
    try {
      console.log('📊 Starting analytics event consumption...');

      // Register analytics event handler for all event types
      // We'll use a wildcard approach - register for all possible event types
      const allEventTypes = Object.values(eventTypes);
      for (const eventType of allEventTypes) {
        kafkaConsumer.addEventHandler(eventType, this.processEvent.bind(this));
      }

      // Start consuming - kafkaConsumer will handle subscription internally
      await kafkaConsumer.startConsuming();

      console.log('✅ Analytics event consumption started');
    } catch (error) {
      console.error('❌ Failed to start analytics event consumption:', error);
      throw error;
    }
  }

  /**
   * Process event for analytics
   * @param {Object} eventData - Event data
   */
  async processEvent(eventData) {
    try {
      const { eventType, data, metadata, timestamp } = eventData;
      const eventTime = new Date(timestamp);

      // Update real-time data
      this.updateRealtimeData(eventType, data, eventTime);

      // Update metrics based on event type
      await this.updateMetrics(eventType, data, metadata);

      // Log analytics event
      logger.info('Analytics event processed', {
        eventType,
        eventId: eventData.eventId,
        timestamp: eventTime.toISOString()
      });

    } catch (error) {
      console.error(`❌ Error processing analytics event ${eventData.eventType}:`, error);
      logger.error('Analytics event processing error', {
        eventType: eventData.eventType,
        eventId: eventData.eventId,
        error: error.message
      });
    }
  }

  /**
   * Update real-time data
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Date} timestamp - Event timestamp
   */
  updateRealtimeData(eventType, data, timestamp) {
    const key = `${eventType}_${timestamp.getTime()}`;
    this.realtimeData.set(key, {
      eventType,
      data,
      timestamp
    });

    // Clean old data (keep last 24 hours)
    const cutoffTime = Date.now() - this.timeWindows['24h'];
    for (const [key, value] of this.realtimeData) {
      if (value.timestamp.getTime() < cutoffTime) {
        this.realtimeData.delete(key);
      }
    }
  }

  /**
   * Update metrics based on event type
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} metadata - Event metadata
   */
  async updateMetrics(eventType, data, metadata) {
    switch (eventType) {
      case eventTypes.PROJECT_CREATED:
        this.metrics.get('projects').total++;
        this.metrics.get('projects').created++;
        this.metrics.get('projects').active++;
        break;

      case eventTypes.PROJECT_UPDATED:
        this.metrics.get('projects').updated++;
        break;

      case eventTypes.PROJECT_DELETED:
        this.metrics.get('projects').total--;
        this.metrics.get('projects').deleted++;
        this.metrics.get('projects').active--;
        break;

      case eventTypes.TASK_CREATED:
        this.metrics.get('tasks').total++;
        this.metrics.get('tasks').created++;
        this.metrics.get('tasks').pending++;
        break;

      case eventTypes.TASK_STATUS_UPDATED:
        if (data.status === 'in_progress') {
          this.metrics.get('tasks').pending--;
          this.metrics.get('tasks').inProgress++;
        } else if (data.status === 'completed') {
          this.metrics.get('tasks').inProgress--;
          this.metrics.get('tasks').completed++;
        }
        break;

      case eventTypes.TASK_UPDATED:
        this.metrics.get('tasks').updated++;
        break;

      case eventTypes.TASK_DELETED:
        this.metrics.get('tasks').total--;
        this.metrics.get('tasks').deleted++;
        // Adjust status counts
        if (data.status === 'pending') this.metrics.get('tasks').pending--;
        else if (data.status === 'in_progress') this.metrics.get('tasks').inProgress--;
        else if (data.status === 'completed') this.metrics.get('tasks').completed--;
        break;

      case eventTypes.INCIDENT_REPORTED:
        this.metrics.get('incidents').total++;
        this.metrics.get('incidents').reported++;
        this.metrics.get('incidents').open++;
        // Update severity count
        if (data.severity) {
          this.metrics.get('incidents').bySeverity[data.severity.toLowerCase()]++;
        }
        break;

      case eventTypes.INCIDENT_STATUS_UPDATED:
        if (data.status === 'investigating') {
          this.metrics.get('incidents').open--;
          this.metrics.get('incidents').investigating++;
        } else if (data.status === 'resolved') {
          this.metrics.get('incidents').investigating--;
          this.metrics.get('incidents').resolved++;
        } else if (data.status === 'closed') {
          this.metrics.get('incidents').resolved--;
          this.metrics.get('incidents').closed++;
        }
        break;

      case eventTypes.INCIDENT_UPDATED:
        this.metrics.get('incidents').updated++;
        break;

      case eventTypes.INCIDENT_DELETED:
        this.metrics.get('incidents').total--;
        this.metrics.get('incidents').deleted++;
        // Adjust status counts
        if (data.status === 'open') this.metrics.get('incidents').open--;
        else if (data.status === 'investigating') this.metrics.get('incidents').investigating--;
        else if (data.status === 'resolved') this.metrics.get('incidents').resolved--;
        else if (data.status === 'closed') this.metrics.get('incidents').closed--;
        break;

      case eventTypes.PPE_ITEM_CREATED:
        this.metrics.get('ppe').total++;
        this.metrics.get('ppe').created++;
        this.metrics.get('ppe').available++;
        // Update category count
        if (data.category) {
          this.metrics.get('ppe').byCategory[data.category] = 
            (this.metrics.get('ppe').byCategory[data.category] || 0) + 1;
        }
        break;

      case eventTypes.PPE_ITEM_ASSIGNED:
        this.metrics.get('ppe').available--;
        this.metrics.get('ppe').assigned++;
        break;

      case eventTypes.PPE_ITEM_RETURNED:
        this.metrics.get('ppe').assigned--;
        this.metrics.get('ppe').available++;
        break;

      case eventTypes.PPE_ITEM_EXPIRED:
        this.metrics.get('ppe').expired++;
        break;

      case eventTypes.PPE_ITEM_DAMAGED:
        this.metrics.get('ppe').damaged++;
        break;

      case eventTypes.PPE_ITEM_UPDATED:
        this.metrics.get('ppe').updated++;
        break;

      case eventTypes.PPE_ITEM_DELETED:
        this.metrics.get('ppe').total--;
        this.metrics.get('ppe').deleted++;
        // Adjust status counts
        if (data.status === 'assigned') this.metrics.get('ppe').assigned--;
        else if (data.status === 'available') this.metrics.get('ppe').available--;
        break;

      case eventTypes.USER_REGISTERED:
        this.metrics.get('users').total++;
        this.metrics.get('users').registered++;
        this.metrics.get('users').active++;
        // Update role count
        if (data.role) {
          this.metrics.get('users').byRole[data.role] = 
            (this.metrics.get('users').byRole[data.role] || 0) + 1;
        }
        break;

      case eventTypes.USER_LOGIN:
        this.metrics.get('users').loggedIn++;
        break;

      case eventTypes.USER_LOGOUT:
        this.metrics.get('users').loggedOut++;
        break;

      case eventTypes.USER_STATUS_UPDATED:
        if (data.status === 'active') {
          this.metrics.get('users').inactive--;
          this.metrics.get('users').active++;
        } else if (data.status === 'inactive') {
          this.metrics.get('users').active--;
          this.metrics.get('users').inactive++;
        }
        break;

      case eventTypes.NOTIFICATION_SENT:
        this.metrics.get('notifications').total++;
        this.metrics.get('notifications').sent++;
        // Update type count
        if (data.type) {
          this.metrics.get('notifications').byType[data.type] = 
            (this.metrics.get('notifications').byType[data.type] || 0) + 1;
        }
        break;

      case eventTypes.NOTIFICATION_DELIVERED:
        this.metrics.get('notifications').delivered++;
        break;

      case eventTypes.NOTIFICATION_READ:
        this.metrics.get('notifications').read++;
        break;

      case eventTypes.NOTIFICATION_CLICKED:
        this.metrics.get('notifications').clicked++;
        break;

      case eventTypes.NOTIFICATION_FAILED:
        this.metrics.get('notifications').failed++;
        break;

      case eventTypes.SYSTEM_ERROR:
        this.metrics.get('system').errors++;
        break;

      case eventTypes.SYSTEM_PERFORMANCE:
        if (data.responseTime) {
          this.metrics.get('system').performance.avgResponseTime = 
            (this.metrics.get('system').performance.avgResponseTime + data.responseTime) / 2;
        }
        if (data.throughput) {
          this.metrics.get('system').performance.throughput = data.throughput;
        }
        if (data.errorRate) {
          this.metrics.get('system').performance.errorRate = data.errorRate;
        }
        break;

      default:
        // Handle other event types
        break;
    }
  }

  /**
   * Start periodic aggregation
   */
  startPeriodicAggregation() {
    // Aggregate every minute
    setInterval(() => {
      this.aggregateMetrics();
    }, 60000);

    // Clean old data every hour
    setInterval(() => {
      this.cleanOldData();
    }, 3600000);

    console.log('✅ Periodic aggregation started');
  }

  /**
   * Aggregate metrics
   */
  aggregateMetrics() {
    try {
      // Calculate derived metrics
      this.calculateDerivedMetrics();

      // Update system uptime
      this.metrics.get('system').uptime = process.uptime();

      console.log('📊 Metrics aggregated');
    } catch (error) {
      console.error('❌ Error aggregating metrics:', error);
    }
  }

  /**
   * Calculate derived metrics
   */
  calculateDerivedMetrics() {
    // Calculate completion rates
    const projects = this.metrics.get('projects');
    if (projects.total > 0) {
      projects.completionRate = (projects.completed / projects.total) * 100;
    }

    const tasks = this.metrics.get('tasks');
    if (tasks.total > 0) {
      tasks.completionRate = (tasks.completed / tasks.total) * 100;
    }

    // Calculate incident resolution rate
    const incidents = this.metrics.get('incidents');
    if (incidents.total > 0) {
      incidents.resolutionRate = ((incidents.resolved + incidents.closed) / incidents.total) * 100;
    }

    // Calculate notification delivery rate
    const notifications = this.metrics.get('notifications');
    if (notifications.sent > 0) {
      notifications.deliveryRate = (notifications.delivered / notifications.sent) * 100;
      notifications.readRate = (notifications.read / notifications.sent) * 100;
      notifications.clickRate = (notifications.clicked / notifications.sent) * 100;
    }
  }

  /**
   * Clean old data
   */
  cleanOldData() {
    const cutoffTime = Date.now() - this.timeWindows['24h'];
    let cleanedCount = 0;

    for (const [key, value] of this.realtimeData) {
      if (value.timestamp.getTime() < cutoffTime) {
        this.realtimeData.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} old data entries`);
    }
  }

  /**
   * Get metrics for a specific time window
   * @param {string} timeWindow - Time window (1m, 5m, 15m, 1h, 24h)
   * @returns {Object} Metrics for the time window
   */
  getMetricsForTimeWindow(timeWindow) {
    const windowMs = this.timeWindows[timeWindow];
    if (!windowMs) {
      throw new Error(`Invalid time window: ${timeWindow}`);
    }

    const cutoffTime = Date.now() - windowMs;
    const windowData = new Map();

    for (const [key, value] of this.realtimeData) {
      if (value.timestamp.getTime() >= cutoffTime) {
        windowData.set(key, value);
      }
    }

    return {
      timeWindow,
      dataCount: windowData.size,
      metrics: this.calculateWindowMetrics(windowData)
    };
  }

  /**
   * Calculate metrics for a specific window
   * @param {Map} windowData - Window data
   * @returns {Object} Calculated metrics
   */
  calculateWindowMetrics(windowData) {
    const metrics = {
      events: 0,
      byType: {},
      byHour: {},
      topEvents: []
    };

    for (const [, value] of windowData) {
      metrics.events++;
      
      // Count by type
      metrics.byType[value.eventType] = (metrics.byType[value.eventType] || 0) + 1;
      
      // Count by hour
      const hour = value.timestamp.getHours();
      metrics.byHour[hour] = (metrics.byHour[hour] || 0) + 1;
    }

    // Get top events
    metrics.topEvents = Object.entries(metrics.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    return metrics;
  }

  /**
   * Get dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    return {
      overview: {
        projects: this.metrics.get('projects'),
        tasks: this.metrics.get('tasks'),
        incidents: this.metrics.get('incidents'),
        ppe: this.metrics.get('ppe'),
        users: this.metrics.get('users'),
        notifications: this.metrics.get('notifications'),
        system: this.metrics.get('system')
      },
      realtime: {
        totalEvents: this.realtimeData.size,
        lastUpdated: new Date().toISOString()
      },
      timeWindows: {
        '1m': this.getMetricsForTimeWindow('1m'),
        '5m': this.getMetricsForTimeWindow('5m'),
        '15m': this.getMetricsForTimeWindow('15m'),
        '1h': this.getMetricsForTimeWindow('1h'),
        '24h': this.getMetricsForTimeWindow('24h')
      }
    };
  }

  /**
   * Get event trends
   * @param {string} eventType - Event type
   * @param {string} timeWindow - Time window
   * @returns {Object} Event trends
   */
  getEventTrends(eventType, timeWindow = '24h') {
    const windowMs = this.timeWindows[timeWindow];
    const cutoffTime = Date.now() - windowMs;
    const trends = [];

    for (const [, value] of this.realtimeData) {
      if (value.eventType === eventType && value.timestamp.getTime() >= cutoffTime) {
        trends.push({
          timestamp: value.timestamp,
          data: value.data
        });
      }
    }

    return {
      eventType,
      timeWindow,
      count: trends.length,
      trends: trends.sort((a, b) => a.timestamp - b.timestamp)
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      system: this.metrics.get('system'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export metrics
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported metrics
   */
  exportMetrics(format = 'json') {
    const data = {
      metrics: Object.fromEntries(this.metrics),
      realtime: Object.fromEntries(this.realtimeData),
      timestamp: new Date().toISOString()
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert data to CSV format
   * @param {Object} data - Data to convert
   * @returns {string} CSV data
   */
  convertToCSV(data) {
    // Simple CSV conversion - can be enhanced
    const rows = [];
    rows.push('Metric,Value,Timestamp');
    
    for (const [metric, value] of Object.entries(data.metrics)) {
      rows.push(`${metric},${JSON.stringify(value)},${data.timestamp}`);
    }
    
    return rows.join('\n');
  }

  /**
   * Shutdown Analytics Service
   */
  async shutdown() {
    try {
      console.log('📊 Shutting down Analytics Service...');
      
      this.isRunning = false;
      
      // Disconnect Kafka Consumer
      await kafkaConsumer.disconnect();
      
      console.log('✅ Analytics Service shutdown completed');
    } catch (error) {
      console.error('❌ Error during Analytics Service shutdown:', error);
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
