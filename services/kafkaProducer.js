const KAFKA_ENABLED = process.env.ENABLE_KAFKA === 'true';

// Don't destructure kafka, producerConfig - lazy load them only when needed
const kafkaConfig = require('../config/kafkaConfig');
const { topics, eventTypes } = kafkaConfig;
const { v4: uuidv4 } = require('uuid');

class KafkaProducer {
  constructor() {
    this.producer = null;
    this.isConnected = false;
    this.isInitialized = false;
  }

  /**
   * Initialize Kafka Producer
   */
  async initialize() {
    // Guard: Kafka must be enabled
    if (!KAFKA_ENABLED) {
      return; // Silent return, no connection attempt
    }

    try {
      if (this.isInitialized) {
        console.log('📤 Kafka Producer already initialized');
        return;
      }

      // Lazy load kafka and producerConfig only when needed
      const kafka = kafkaConfig.kafka;
      const producerConfig = kafkaConfig.producerConfig;
      this.producer = kafka.producer(producerConfig);
      
      console.log('📤 Initializing Kafka Producer...');
      await this.producer.connect();
      
      this.isConnected = true;
      this.isInitialized = true;
      
      console.log('✅ Kafka Producer initialized successfully');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.disconnect());
      process.on('SIGTERM', () => this.disconnect());
      
    } catch (error) {
      console.error('❌ Failed to initialize Kafka Producer:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect Kafka Producer
   */
  async disconnect() {
    try {
      if (this.producer && this.isConnected) {
        console.log('📤 Disconnecting Kafka Producer...');
        await this.producer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka Producer disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Kafka Producer:', error);
    }
  }

  /**
   * Send event to Kafka topic
   * @param {string} topic - Kafka topic name
   * @param {Object} eventData - Event data to send
   * @param {string} key - Optional partition key
   */
  async sendEvent(topic, eventData, key = null) {
    // Guard: Kafka must be enabled - fail silent, don't throw
    if (!KAFKA_ENABLED) {
      return { success: false, error: 'Kafka is disabled' };
    }

    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Validate event data
      if (!eventData || !eventData.eventType) {
        throw new Error('Invalid event data: eventType is required');
      }

      // Add metadata
      const event = {
        ...eventData,
        eventId: eventData.eventId || uuidv4(),
        timestamp: eventData.timestamp || new Date().toISOString(),
        source: eventData.source || 'backend-api',
        version: eventData.version || '1.0'
      };

      // Send to Kafka
      const startTime = Date.now();
      const result = await this.producer.send({
        topic,
        messages: [{
          key: key || event.eventId,
          value: JSON.stringify(event),
          timestamp: Date.now()
        }]
      });

      const latency = Date.now() - startTime;
      
      // Update metrics if monitor is available
      try {
        const kafkaMonitor = require('./kafkaMonitor');
        if (kafkaMonitor && kafkaMonitor.incrementProducerMetrics) {
          kafkaMonitor.incrementProducerMetrics(true, latency);
        }
      } catch (error) {
        // Monitor not available, continue without metrics
      }

      console.log(`📤 Event sent to topic ${topic}:`, {
        eventType: event.eventType,
        eventId: event.eventId,
        partition: result[0].partition,
        offset: result[0].offset,
        latency: `${latency}ms`
      });

      return {
        success: true,
        eventId: event.eventId,
        partition: result[0].partition,
        offset: result[0].offset
      };

    } catch (error) {
      // Don't throw error - Kafka is optional, allow graceful degradation
      console.warn(`⚠️ Failed to send event to topic ${topic} (Kafka unavailable, non-critical):`, error.message || error.name);
      
      // Update metrics if monitor is available
      try {
        const kafkaMonitor = require('./kafkaMonitor');
        if (kafkaMonitor && kafkaMonitor.incrementProducerMetrics) {
          kafkaMonitor.incrementProducerMetrics(false);
        }
        if (kafkaMonitor && kafkaMonitor.setProducerError) {
          kafkaMonitor.setProducerError(error);
        }
      } catch (monitorError) {
        // Monitor not available, continue without metrics
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Project Event
   * @param {string} eventType - Type of project event
   * @param {Object} projectData - Project data
   * @param {Object} metadata - Event metadata
   */
  async sendProjectEvent(eventType, projectData, metadata = {}) {
    const event = {
      eventType,
      data: {
        projectId: projectData._id || projectData.id,
        projectName: projectData.name || projectData.title,
        status: projectData.status,
        progress: projectData.progress || 0,
        assignedUsers: projectData.assignedUsers || [],
        siteId: projectData.site_id,
        leaderId: projectData.leader_id,
        description: projectData.description,
        startDate: projectData.start_date,
        endDate: projectData.end_date,
        priority: projectData.priority
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.PROJECT_EVENTS, event, projectData._id || projectData.id);
  }

  /**
   * Send Task Event
   * @param {string} eventType - Type of task event
   * @param {Object} taskData - Task data
   * @param {Object} metadata - Event metadata
   */
  async sendTaskEvent(eventType, taskData, metadata = {}) {
    const event = {
      eventType,
      data: {
        taskId: taskData._id || taskData.id,
        taskName: taskData.name || taskData.title,
        projectId: taskData.project_id,
        status: taskData.status,
        priority: taskData.priority,
        progress: taskData.progress || 0,
        assigneeId: taskData.assignee_id,
        dueDate: taskData.due_date,
        dependencies: taskData.dependencies || [],
        description: taskData.description,
        estimatedHours: taskData.estimated_hours,
        actualHours: taskData.actual_hours
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.TASK_EVENTS, event, taskData._id || taskData.id);
  }

  /**
   * Send Incident Event
   * @param {string} eventType - Type of incident event
   * @param {Object} incidentData - Incident data
   * @param {Object} metadata - Event metadata
   */
  async sendIncidentEvent(eventType, incidentData, metadata = {}) {
    const event = {
      eventType,
      data: {
        incidentId: incidentData._id || incidentData.id,
        title: incidentData.title,
        description: incidentData.description,
        severity: incidentData.severity,
        status: incidentData.status,
        location: incidentData.location,
        assignedTo: incidentData.assignedTo,
        createdBy: incidentData.createdBy,
        images: incidentData.images || [],
        progress: incidentData.progress || 0
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.INCIDENT_EVENTS, event, incidentData._id || incidentData.id);
  }

  /**
   * Send PPE Event
   * @param {string} eventType - Type of PPE event
   * @param {Object} ppeData - PPE data
   * @param {Object} metadata - Event metadata
   */
  async sendPPEEvent(eventType, ppeData, metadata = {}) {
    const event = {
      eventType,
      data: {
        ppeId: ppeData._id || ppeData.id,
        itemName: ppeData.name || ppeData.item_name,
        category: ppeData.category,
        quantity: ppeData.quantity,
        status: ppeData.status,
        assignedTo: ppeData.assignedTo,
        expiryDate: ppeData.expiry_date,
        siteId: ppeData.site_id,
        maintenanceDate: ppeData.maintenance_date
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.PPE_EVENTS, event, ppeData._id || ppeData.id);
  }

  /**
   * Send User Event
   * @param {string} eventType - Type of user event
   * @param {Object} userData - User data
   * @param {Object} metadata - Event metadata
   */
  async sendUserEvent(eventType, userData, metadata = {}) {
    const event = {
      eventType,
      data: {
        userId: userData._id || userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        department: userData.department,
        isActive: userData.is_active,
        lastLogin: userData.last_login
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.USER_EVENTS, event, userData._id || userData.id);
  }

  /**
   * Send Notification Event
   * @param {string} eventType - Type of notification event
   * @param {Object} notificationData - Notification data
   * @param {Object} metadata - Event metadata
   */
  async sendNotificationEvent(eventType, notificationData, metadata = {}) {
    const event = {
      eventType,
      data: {
        notificationId: notificationData._id || notificationData.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        category: notificationData.category,
        priority: notificationData.priority,
        targetUsers: notificationData.target_users || [],
        targetRoles: notificationData.target_roles || [],
        isRead: notificationData.isRead || false
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.NOTIFICATION_EVENTS, event, notificationData._id || notificationData.id);
  }

  /**
   * Send System Event
   * @param {string} eventType - Type of system event
   * @param {Object} systemData - System data
   * @param {Object} metadata - Event metadata
   */
  async sendSystemEvent(eventType, systemData, metadata = {}) {
    // Guard: Kafka must be enabled - fail silent, don't throw
    if (!KAFKA_ENABLED) {
      return { success: false, error: 'Kafka is disabled' };
    }

    const event = {
      eventType,
      data: {
        systemId: systemData.systemId || 'safety-management-system',
        component: systemData.component,
        level: systemData.level || 'info',
        message: systemData.message,
        details: systemData.details || {},
        timestamp: new Date().toISOString()
      },
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    return await this.sendEvent(topics.SYSTEM_EVENTS, event, systemData.systemId || 'system');
  }

  /**
   * Send Role Event
   * @param {string} eventType - Type of role event
   * @param {Object} roleData - Role data
   * @param {Object} metadata - Event metadata
   */
  async sendRoleEvent(eventType, roleData, metadata = {}) {
    const event = {
      eventType,
      data: roleData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'role-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.ROLE_EVENTS, event, roleData.roleId || 'role');
  }

  /**
   * Send Department Event
   * @param {string} eventType - Type of department event
   * @param {Object} departmentData - Department data
   * @param {Object} metadata - Event metadata
   */
  async sendDepartmentEvent(eventType, departmentData, metadata = {}) {
    const event = {
      eventType,
      data: departmentData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'department-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.DEPARTMENT_EVENTS, event, departmentData.departmentId || 'department');
  }

  /**
   * Send Position Event
   * @param {string} eventType - Type of position event
   * @param {Object} positionData - Position data
   * @param {Object} metadata - Event metadata
   */
  async sendPositionEvent(eventType, positionData, metadata = {}) {
    const event = {
      eventType,
      data: positionData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'position-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.POSITION_EVENTS, event, positionData.positionId || 'position');
  }

  /**
   * Send Training Event
   * @param {string} eventType - Type of training event
   * @param {Object} trainingData - Training data
   * @param {Object} metadata - Event metadata
   */
  async sendTrainingEvent(eventType, trainingData, metadata = {}) {
    const event = {
      eventType,
      data: trainingData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'training-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.TRAINING_EVENTS, event, trainingData.trainingId || 'training');
  }

  /**
   * Send Quality Event
   * @param {string} eventType - Type of quality event
   * @param {Object} qualityData - Quality data
   * @param {Object} metadata - Event metadata
   */
  async sendQualityEvent(eventType, qualityData, metadata = {}) {
    const event = {
      eventType,
      data: qualityData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'quality-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.QUALITY_EVENTS, event, qualityData.qualityId || 'quality');
  }

  /**
   * Send Certificate Event
   * @param {string} eventType - Type of certificate event
   * @param {Object} certificateData - Certificate data
   * @param {Object} metadata - Event metadata
   */
  async sendCertificateEvent(eventType, certificateData, metadata = {}) {
    const event = {
      eventType,
      data: certificateData,
      metadata: {
        userId: metadata.userId,
        userRole: metadata.userRole,
        userFullName: metadata.userFullName,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString(),
        source: 'certificate-service',
        ...metadata
      }
    };

    return await this.sendEvent(topics.CERTIFICATE_EVENTS, event, certificateData.certificateId || 'certificate');
  }

  /**
   * Get connection status
   */
  getStatus() {
    // Guard: Kafka must be enabled
    if (!KAFKA_ENABLED) {
      return {
        isConnected: false,
        isInitialized: false,
        enabled: false
      };
    }

    return {
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      enabled: true
    };
  }
}

// Create singleton instance
const kafkaProducer = new KafkaProducer();

module.exports = kafkaProducer;
