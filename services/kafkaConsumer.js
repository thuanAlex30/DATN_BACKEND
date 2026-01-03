const { kafka, topics, eventTypes, consumerConfig } = require('../config/kafkaConfig');
const websocketService = require('./websocketService');
const kafkaMonitor = require('./kafkaMonitor');

class KafkaConsumer {
  constructor() {
    this.consumer = null;
    this.isConnected = false;
    this.isInitialized = false;
    this.isConsuming = false;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize Kafka Consumer
   */
  async initialize() {
    try {
      // Respect runtime flag to skip Kafka entirely
      if (process.env.KAFKA_ENABLED === 'false' || process.env.KAFKA_ENABLED === '0') {
        console.log('ℹ️ Kafka Consumer initialization skipped because KAFKA_ENABLED is false');
        return;
      }
      if (this.isInitialized) {
        console.log('📥 Kafka Consumer already initialized');
        return;
      }

      this.consumer = kafka.consumer(consumerConfig);
      
      console.log('📥 Initializing Kafka Consumer...');
      await this.consumer.connect();
      
      this.isConnected = true;
      this.isInitialized = true;
      
      console.log('✅ Kafka Consumer initialized successfully');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.disconnect());
      process.on('SIGTERM', () => this.disconnect());
      
    } catch (error) {
      console.error('❌ Failed to initialize Kafka Consumer:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect Kafka Consumer
   */
  async disconnect() {
    try {
      if (this.consumer && this.isConnected) {
        console.log('📥 Disconnecting Kafka Consumer...');
        await this.consumer.disconnect();
        this.isConnected = false;
        this.isConsuming = false;
        console.log('✅ Kafka Consumer disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Kafka Consumer:', error);
    }
  }

  /**
   * Subscribe to topics and start consuming
   */
  async startConsuming() {
    try {
      // If already consuming, just return (allow multiple services to call this)
      if (this.isConsuming) {
        console.log('📥 Kafka Consumer already consuming, skipping subscription');
        return;
      }

      if (!this.isConnected) {
        await this.initialize();
      }

      // Subscribe to all topics
      const topicList = Object.values(topics);
      await this.consumer.subscribe({ 
        topics: topicList,
        fromBeginning: false 
      });

      console.log(`📥 Subscribed to topics: ${topicList.join(', ')}`);

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.processMessageWithRetry(topic, partition, message);
        }
      });

      this.isConsuming = true;
      console.log('✅ Kafka Consumer started successfully');

    } catch (error) {
      console.error('❌ Failed to start Kafka Consumer:', error);
      this.isConsuming = false;
      throw error;
    }
  }

  /**
   * Send message to Dead Letter Queue
   * @param {string} originalTopic - Original topic name
   * @param {Object} message - Original message
   * @param {Error} error - Error that occurred
   */
  async sendToDLQ(originalTopic, message, error) {
    try {
      const dlqTopic = `${originalTopic}.dlq`;
      const dlqMessage = {
        originalTopic,
        originalMessage: {
          key: message.key ? message.key.toString() : null,
          value: message.value.toString(),
          partition: message.partition,
          offset: message.offset,
          timestamp: message.timestamp
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      // Send to DLQ using producer
      const kafkaProducer = require('./kafkaProducer');
      
      // Create proper event structure for DLQ
      const dlqEvent = {
        eventType: 'dlq_message',
        eventId: `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: dlqMessage,
        metadata: {
          originalTopic: originalTopic,
          originalPartition: message.partition,
          originalOffset: message.offset,
          dlqReason: 'message_processing_failed'
        }
      };
      
      await kafkaProducer.sendEvent(dlqTopic, dlqEvent, `dlq-${Date.now()}`);

      console.log(`📤 Message sent to DLQ: ${dlqTopic}`);
    } catch (dlqError) {
      console.error(`❌ Failed to send message to DLQ:`, dlqError);
    }
  }

  /**
   * Process message with retry mechanism
   * @param {string} topic - Kafka topic
   * @param {number} partition - Kafka partition
   * @param {Object} message - Kafka message
   * @param {number} retryCount - Current retry count
   */
  async processMessageWithRetry(topic, partition, message, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      await this.processMessage(topic, partition, message);
      kafkaMonitor.incrementConsumerMetrics(true);
    } catch (error) {
      console.error(`❌ Error processing message (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      kafkaMonitor.incrementConsumerMetrics(false);
      kafkaMonitor.setConsumerError(error);

      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await this.processMessageWithRetry(topic, partition, message, retryCount + 1);
      } else {
        console.error(`💀 Max retries exceeded, sending to DLQ`);
        await this.sendToDLQ(topic, message, error);
      }
    }
  }
  async processMessage(topic, partition, message) {
    try {
      const eventData = JSON.parse(message.value.toString());
      const eventKey = message.key ? message.key.toString() : null;

      console.log(`📥 Processing message from topic ${topic}:`, {
        eventType: eventData.eventType,
        eventId: eventData.eventId,
        partition,
        offset: message.offset,
        key: eventKey
      });

      // Route message based on topic
      switch (topic) {
        case topics.PROJECT_EVENTS:
          await this.handleProjectEvent(eventData);
          break;
        case topics.TASK_EVENTS:
          await this.handleTaskEvent(eventData);
          break;
        case topics.INCIDENT_EVENTS:
          await this.handleIncidentEvent(eventData);
          break;
        case topics.PPE_EVENTS:
          await this.handlePPEEvent(eventData);
          break;
        case topics.USER_EVENTS:
          await this.handleUserEvent(eventData);
          break;
        case topics.NOTIFICATION_EVENTS:
          await this.handleNotificationEvent(eventData);
          break;
        case topics.SYSTEM_EVENTS:
          await this.handleSystemEvent(eventData);
          break;
        case topics.ROLE_EVENTS:
          await this.handleRoleEvent(eventData);
          break;
        case topics.DEPARTMENT_EVENTS:
          await this.handleDepartmentEvent(eventData);
          break;
        case topics.TRAINING_EVENTS:
          await this.handleTrainingEvent(eventData);
          break;
        case topics.QUALITY_EVENTS:
          await this.handleQualityEvent(eventData);
          break;
        default:
          console.warn(`⚠️ Unknown topic: ${topic}`);
      }

      // Call custom event handlers
      const customHandler = this.eventHandlers.get(eventData.eventType);
      if (customHandler) {
        try {
          await customHandler(eventData);
        } catch (error) {
          console.error(`❌ Error in custom event handler for ${eventData.eventType}:`, error);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing message from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Handle Project Events
   * @param {Object} eventData - Event data
   */
  async handleProjectEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.PROJECT_CREATED:
          // Broadcast to WebSocket
          websocketService.emitToAll('project_created', {
            project: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PROJECT_UPDATED:
          websocketService.emitToAll('project_updated', {
            project: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PROJECT_ASSIGNED:
          websocketService.emitToAll('project_assigned', {
            project: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PROJECT_PROGRESS_UPDATED:
          websocketService.emitToAll('project_progress_updated', {
            project: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown project event type: ${eventType}`);
      }

      console.log(`✅ Processed project event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling project event:`, error);
      throw error;
    }
  }

  /**
   * Handle Task Events
   * @param {Object} eventData - Event data
   */
  async handleTaskEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.TASK_CREATED:
          websocketService.emitToAll('task_created', {
            task: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TASK_UPDATED:
          websocketService.emitToAll('task_updated', {
            task: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TASK_ASSIGNED:
          websocketService.emitToAll('task_assigned', {
            task: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TASK_STATUS_UPDATED:
          websocketService.emitToAll('task_status_updated', {
            task: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TASK_PROGRESS_UPDATED:
          websocketService.emitToAll('task_progress_updated', {
            task: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TASK_COMMENT_ADDED:
          websocketService.emitToAll('task_comment_added', {
            task: data,
            commenter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown task event type: ${eventType}`);
      }

      console.log(`✅ Processed task event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling task event:`, error);
      throw error;
    }
  }

  /**
   * Handle Incident Events
   * @param {Object} eventData - Event data
   */
  async handleIncidentEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.INCIDENT_REPORTED:
          websocketService.emitToAll('incident_reported', {
            incident: data,
            reporter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.INCIDENT_CLASSIFIED:
          websocketService.emitToAll('incident_classified', {
            incident: data,
            classifier: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.INCIDENT_ASSIGNED:
          websocketService.emitToAll('incident_assigned', {
            incident: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.INCIDENT_PROGRESS_UPDATED:
          websocketService.emitToAll('incident_progress_updated', {
            incident: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.INCIDENT_CLOSED:
          websocketService.emitToAll('incident_closed', {
            incident: data,
            closer: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.INCIDENT_ESCALATED:
          websocketService.emitToAll('incident_escalated', {
            incident: data,
            escalation: {
              escalationId: data.escalationId,
              escalationLevel: data.escalationLevel,
              reason: data.reason,
              departmentId: data.departmentId,
              escalatedAt: data.escalatedAt
            },
            escalator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown incident event type: ${eventType}`);
      }

      console.log(`✅ Processed incident event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling incident event:`, error);
      throw error;
    }
  }

  /**
   * Handle PPE Events
   * @param {Object} eventData - Event data
   */
  async handlePPEEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.PPE_CREATED:
          websocketService.emitToAll('ppe_item_created', {
            ppe: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PPE_UPDATED:
          websocketService.emitToAll('ppe_item_updated', {
            ppe: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PPE_ASSIGNED:
          websocketService.emitToAll('ppe_assigned', {
            ppe: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PPE_RETURNED:
          websocketService.emitToAll('ppe_returned', {
            ppe: data,
            returner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PPE_EXPIRING:
          websocketService.emitToAll('ppe_expiring', {
            ppe: data,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.PPE_LOW_STOCK:
          websocketService.emitToAll('ppe_low_stock', {
            ppe: data,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown PPE event type: ${eventType}`);
      }

      console.log(`✅ Processed PPE event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling PPE event:`, error);
      throw error;
    }
  }

  /**
   * Handle User Events
   * @param {Object} eventData - Event data
   */
  async handleUserEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.USER_LOGIN:
          websocketService.emitToAll('user_login', {
            user: data,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.USER_LOGOUT:
          websocketService.emitToAll('user_logout', {
            user: data,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.USER_ROLE_CHANGED:
          websocketService.emitToAll('user_role_changed', {
            user: data,
            changer: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown user event type: ${eventType}`);
      }

      console.log(`✅ Processed user event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling user event:`, error);
      throw error;
    }
  }

  /**
   * Handle Notification Events
   * @param {Object} eventData - Event data
   */
  async handleNotificationEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.NOTIFICATION_CREATED:
          websocketService.emitToAll('notification_created', {
            notification: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.NOTIFICATION_READ:
          websocketService.emitToAll('notification_read', {
            notification: data,
            reader: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown notification event type: ${eventType}`);
      }

      console.log(`✅ Processed notification event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling notification event:`, error);
      throw error;
    }
  }

  /**
   * Handle System Events
   * @param {Object} eventData - Event data
   */
  async handleSystemEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.SYSTEM_STARTUP:
          console.log('🚀 System startup event received');
          break;

        case eventTypes.SYSTEM_SHUTDOWN:
          console.log('🛑 System shutdown event received');
          break;

        case eventTypes.SYSTEM_ERROR:
          console.error('💥 System error event received:', data);
          break;

        case eventTypes.SYSTEM_WARNING:
          console.warn('⚠️ System warning event received:', data);
          break;

        default:
          console.warn(`⚠️ Unknown system event type: ${eventType}`);
      }

      console.log(`✅ Processed system event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling system event:`, error);
      throw error;
    }
  }

  /**
   * Add custom event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   */
  addEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Remove custom event handler
   * @param {string} eventType - Event type
   */
  removeEventHandler(eventType) {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Handle Role Events
   * @param {Object} eventData - Event data
   */
  async handleRoleEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.ROLE_CREATED:
          websocketService.emitToAll('role_created', {
            role: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_UPDATED:
          websocketService.emitToAll('role_updated', {
            role: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_DELETED:
          websocketService.emitToAll('role_deleted', {
            role: data,
            deleter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_STATUS_TOGGLED:
          websocketService.emitToAll('role_status_toggled', {
            role: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_PERMISSIONS_UPDATED:
          websocketService.emitToAll('role_permissions_updated', {
            role: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_ASSIGNED_TO_USER:
          websocketService.emitToUser(data.user.userId, 'role_assigned', {
            role: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.ROLE_REMOVED_FROM_USER:
          websocketService.emitToUser(data.user.userId, 'role_removed', {
            role: data,
            remover: metadata,
            timestamp: eventData.timestamp
          });
          break;

        default:
          console.warn(`⚠️ Unknown role event type: ${eventType}`);
      }

      console.log(`✅ Processed role event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling role event:`, error);
      throw error;
    }
  }

  /**
   * Handle Department Events
   * @param {Object} eventData - Event data
   */
  async handleDepartmentEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.DEPARTMENT_CREATED:
          websocketService.emitToAll('department_created', {
            department: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.DEPARTMENT_UPDATED:
          websocketService.emitToAll('department_updated', {
            department: data,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.DEPARTMENT_DELETED:
          websocketService.emitToAll('department_deleted', {
            department: data,
            deleter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.DEPARTMENT_MANAGER_ASSIGNED:
          // Send realtime notification (WebSocket + Database)
          try {
            const DepartmentNotificationService = require('./departmentNotificationService');
            const User = require('../models/user');
            const tenantId = data.tenant_id || metadata.tenantId;
            
            if (tenantId && data.manager && data.manager.managerId) {
              const manager = await User.findById(data.manager.managerId).select('_id full_name').lean();
              const assigner = metadata.userId ? await User.findById(metadata.userId).select('_id full_name').lean() : null;
              
              await DepartmentNotificationService.notifyManagerAssigned({
                department: data,
                manager: manager || { _id: data.manager.managerId, full_name: data.manager.managerName },
                assigner: assigner || { _id: metadata.userId, full_name: metadata.userFullName },
                tenantId
              });
            }
          } catch (notifError) {
            console.error('Failed to send manager assigned notification:', notifError);
          }
          
          // Also send WebSocket for backward compatibility
          websocketService.emitToAll('department_manager_assigned', {
            department: data,
            assigner: metadata,
            timestamp: eventData.timestamp
          });
          if (data.manager && data.manager.managerId) {
            websocketService.emitToUser(data.manager.managerId, 'manager_assigned', {
              department: data,
              assigner: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        case eventTypes.DEPARTMENT_MANAGER_REMOVED:
          // Send realtime notification (WebSocket + Database)
          try {
            const DepartmentNotificationService = require('./departmentNotificationService');
            const User = require('../models/user');
            const tenantId = data.tenant_id || metadata.tenantId;
            
            if (tenantId && data.manager && data.manager.managerId) {
              const manager = await User.findById(data.manager.managerId).select('_id full_name').lean();
              const remover = metadata.userId ? await User.findById(metadata.userId).select('_id full_name').lean() : null;
              
              await DepartmentNotificationService.notifyManagerRemoved({
                department: data,
                manager: manager || { _id: data.manager.managerId, full_name: data.manager.managerName },
                remover: remover || { _id: metadata.userId, full_name: metadata.userFullName },
                tenantId
              });
            }
          } catch (notifError) {
            console.error('Failed to send manager removed notification:', notifError);
          }
          
          // Also send WebSocket for backward compatibility
          websocketService.emitToAll('department_manager_removed', {
            department: data,
            remover: metadata,
            timestamp: eventData.timestamp
          });
          if (data.manager && data.manager.managerId) {
            websocketService.emitToUser(data.manager.managerId, 'manager_removed', {
              department: data,
              remover: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        case eventTypes.EMPLOYEE_TRANSFERRED_TO_DEPARTMENT:
          // Send realtime notification (WebSocket + Database)
          try {
            const DepartmentNotificationService = require('./departmentNotificationService');
            const User = require('../models/user');
            const tenantId = data.tenant_id || metadata.tenantId;
            
            if (tenantId && data.employee && data.employee.employeeId) {
              const employee = await User.findById(data.employee.employeeId).select('_id full_name').lean();
              const transferrer = metadata.userId ? await User.findById(metadata.userId).select('_id full_name').lean() : null;
              
              await DepartmentNotificationService.notifyEmployeeTransferred({
                department: data,
                employee: employee || { _id: data.employee.employeeId, full_name: data.employee.employeeName },
                transferrer: transferrer || { _id: metadata.userId, full_name: metadata.userFullName },
                tenantId
              });
            }
          } catch (notifError) {
            console.error('Failed to send employee transferred notification:', notifError);
          }
          
          // Also send WebSocket for backward compatibility
          websocketService.emitToAll('employee_transferred_to_department', {
            department: data,
            transferrer: metadata,
            timestamp: eventData.timestamp
          });
          if (data.employee && data.employee.employeeId) {
            websocketService.emitToUser(data.employee.employeeId, 'employee_transferred', {
              department: data,
              transferrer: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        case eventTypes.EMPLOYEE_REMOVED_FROM_DEPARTMENT:
          // Send realtime notification (WebSocket + Database)
          try {
            const DepartmentNotificationService = require('./departmentNotificationService');
            const User = require('../models/user');
            const tenantId = data.tenant_id || metadata.tenantId;
            
            if (tenantId && data.employee && data.employee.employeeId) {
              const employee = await User.findById(data.employee.employeeId).select('_id full_name').lean();
              const remover = metadata.userId ? await User.findById(metadata.userId).select('_id full_name').lean() : null;
              
              await DepartmentNotificationService.notifyEmployeeRemoved({
                department: data,
                employee: employee || { _id: data.employee.employeeId, full_name: data.employee.employeeName },
                remover: remover || { _id: metadata.userId, full_name: metadata.userFullName },
                tenantId
              });
            }
          } catch (notifError) {
            console.error('Failed to send employee removed notification:', notifError);
          }
          
          // Also send WebSocket for backward compatibility
          websocketService.emitToAll('employee_removed_from_department', {
            department: data,
            remover: metadata,
            timestamp: eventData.timestamp
          });
          if (data.employee && data.employee.employeeId) {
            websocketService.emitToUser(data.employee.employeeId, 'employee_removed_from_department', {
              department: data,
              remover: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        default:
          console.warn(`⚠️ Unknown department event type: ${eventType}`);
      }

      console.log(`✅ Processed department event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling department event:`, error);
      throw error;
    }
  }


  /**
   * Handle Training Events
   */
  async handleTrainingEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.COURSE_SET_CREATED:
          websocketService.emitToAll('course_set_created', {
            courseSet: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.COURSE_SET_UPDATED:
          websocketService.emitToAll('course_set_updated', {
            courseSet: data,
            changes: data.changes,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.COURSE_SET_DELETED:
          websocketService.emitToAll('course_set_deleted', {
            courseSet: data,
            deleter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TRAINING_SESSION_CREATED:
          websocketService.emitToAll('training_session_created', {
            session: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TRAINING_SESSION_UPDATED:
          websocketService.emitToAll('training_session_updated', {
            session: data,
            changes: data.changes,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TRAINING_SESSION_DELETED:
          websocketService.emitToAll('training_session_deleted', {
            session: data,
            deleter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.TRAINING_ENROLLMENT:
          websocketService.emitToAll('training_enrollment', {
            enrollment: data,
            enrolledBy: metadata,
            timestamp: eventData.timestamp
          });
          // Notify the enrolled user
          if (data.enrollment && data.enrollment.userId) {
            websocketService.emitToUser(data.enrollment.userId, 'training_enrolled', {
              enrollment: data,
              enrolledBy: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        case eventTypes.TRAINING_COMPLETION:
          websocketService.emitToAll('training_completion', {
            completion: data,
            completedBy: metadata,
            timestamp: eventData.timestamp
          });
          // Notify the user who completed training
          if (data.completion && data.completion.userId) {
            websocketService.emitToUser(data.completion.userId, 'training_completed', {
              completion: data,
              completedBy: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        case eventTypes.TRAINING_RETAKE:
          websocketService.emitToAll('training_retake', {
            retake: data,
            retakenBy: metadata,
            timestamp: eventData.timestamp
          });
          // Notify the user who retook training
          if (data.retake && data.retake.userId) {
            websocketService.emitToUser(data.retake.userId, 'training_retaken', {
              retake: data,
              retakenBy: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        default:
          console.warn(`⚠️ Unknown training event type: ${eventType}`);
      }

      console.log(`✅ Processed training event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling training event:`, error);
      throw error;
    }
  }

  /**
   * Handle Quality Events
   */
  async handleQualityEvent(eventData) {
    try {
      const { eventType, data, metadata } = eventData;

      switch (eventType) {
        case eventTypes.QUALITY_CHECKPOINT_CREATED:
          websocketService.emitToAll('quality_checkpoint_created', {
            checkpoint: data,
            creator: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.QUALITY_CHECKPOINT_UPDATED:
          websocketService.emitToAll('quality_checkpoint_updated', {
            checkpoint: data,
            changes: data.changes,
            updater: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.QUALITY_CHECKPOINT_DELETED:
          websocketService.emitToAll('quality_checkpoint_deleted', {
            checkpoint: data,
            deleter: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.QUALITY_CHECKPOINT_COMPLETED:
          websocketService.emitToAll('quality_checkpoint_completed', {
            checkpoint: data,
            completionData: data.completionData,
            completedBy: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.QUALITY_CHECKPOINT_STATUS_CHANGED:
          websocketService.emitToAll('quality_checkpoint_status_changed', {
            checkpoint: data,
            statusChange: data.statusChange,
            updatedBy: metadata,
            timestamp: eventData.timestamp
          });
          break;

        case eventTypes.QUALITY_CHECKPOINT_ASSIGNED:
          websocketService.emitToAll('quality_checkpoint_assigned', {
            checkpoint: data,
            assigneeId: data.assigneeId,
            assignedBy: metadata,
            timestamp: eventData.timestamp
          });
          // Notify the assigned user
          if (data.assigneeId) {
            websocketService.emitToUser(data.assigneeId, 'quality_checkpoint_assigned_to_you', {
              checkpoint: data,
              assignedBy: metadata,
              timestamp: eventData.timestamp
            });
          }
          break;

        default:
          console.warn(`⚠️ Unknown quality event type: ${eventType}`);
      }

      console.log(`✅ Processed quality event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error handling quality event:`, error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      isConsuming: this.isConsuming,
      eventHandlersCount: this.eventHandlers.size
    };
  }
}

// Create singleton instance
const kafkaConsumer = new KafkaConsumer();

module.exports = kafkaConsumer;
