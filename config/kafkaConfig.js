// Don't require kafkajs at top-level - lazy load it only when Kafka is enabled
// Check both ENABLE_KAFKA and KAFKA_ENABLED for compatibility
const isKafkaEnabled = 
  (process.env.ENABLE_KAFKA === 'true' || process.env.KAFKA_ENABLED === 'true') &&
  process.env.ENABLE_KAFKA !== 'false' && 
  process.env.KAFKA_ENABLED !== 'false' &&
  process.env.KAFKA_ENABLED !== '0';

// Helper function to lazy-load kafkajs
const getKafkaJS = () => {
  if (!isKafkaEnabled) {
    throw new Error('Kafka is disabled. Cannot load kafkajs module.');
  }
  try {
    return require('kafkajs');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('kafkajs module not found. Please install it with: npm install kafkajs');
    }
    throw error;
  }
};

// Kafka Configuration - lazy-load logLevel when needed
const getKafkaConfig = () => {
  const { logLevel } = getKafkaJS();
  return {
    clientId: process.env.KAFKA_CLIENT_ID || 'safety-management-system',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'safety-management-group',
    
    // Connection settings
    connectionTimeout: 3000,
    requestTimeout: 25000,
    retry: {
      initialRetryTime: 100,
      retries: 8
    },
    
    // Disable logging when Kafka is disabled to reduce log noise
    logLevel: isKafkaEnabled ? logLevel.INFO : logLevel.NOTHING,
  };
};

// Create kafkaConfig object (will be used in getKafka())
let kafkaConfig = null;

// Security settings (SSL/SASL) - will be applied in getKafkaConfig() when needed

// Kafka Topics Configuration
const topics = {
  PROJECT_EVENTS: process.env.KAFKA_TOPIC_PROJECT_EVENTS || 'project-events',
  TASK_EVENTS: process.env.KAFKA_TOPIC_TASK_EVENTS || 'task-events',
  INCIDENT_EVENTS: process.env.KAFKA_TOPIC_INCIDENT_EVENTS || 'incident-events',
  PPE_EVENTS: process.env.KAFKA_TOPIC_PPE_EVENTS || 'ppe-events',
  USER_EVENTS: process.env.KAFKA_TOPIC_USER_EVENTS || 'user-events',
  NOTIFICATION_EVENTS: process.env.KAFKA_TOPIC_NOTIFICATION_EVENTS || 'notification-events',
  SYSTEM_EVENTS: process.env.KAFKA_TOPIC_SYSTEM_EVENTS || 'system-events',
  ROLE_EVENTS: process.env.KAFKA_TOPIC_ROLE_EVENTS || 'role-events',
  DEPARTMENT_EVENTS: process.env.KAFKA_TOPIC_DEPARTMENT_EVENTS || 'department-events',
  TRAINING_EVENTS: process.env.KAFKA_TOPIC_TRAINING_EVENTS || 'training-events',
  QUALITY_EVENTS: process.env.KAFKA_TOPIC_QUALITY_EVENTS || 'quality-events',
  CERTIFICATE_EVENTS: process.env.KAFKA_TOPIC_CERTIFICATE_EVENTS || 'certificate-events'
};

// Event Types
const eventTypes = {
  // Project Events
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_ASSIGNED: 'project_assigned',
  PROJECT_PROGRESS_UPDATED: 'project_progress_updated',
  PROJECT_DELETED: 'project_deleted',
  
  // Task Events
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_UPDATED: 'task_status_updated',
  TASK_PROGRESS_UPDATED: 'task_progress_updated',
  TASK_COMMENT_ADDED: 'task_comment_added',
  TASK_DELETED: 'task_deleted',
  
  // Incident Events
  INCIDENT_REPORTED: 'incident_reported',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_ASSIGNED: 'incident_assigned',
  INCIDENT_STATUS_UPDATED: 'incident_status_updated',
  INCIDENT_INVESTIGATION_STARTED: 'incident_investigation_started',
  INCIDENT_INVESTIGATION_COMPLETED: 'incident_investigation_completed',
  INCIDENT_RESOLVED: 'incident_resolved',
  INCIDENT_CLOSED: 'incident_closed',
  INCIDENT_DELETED: 'incident_deleted',
  INCIDENT_COMMENT_ADDED: 'incident_comment_added',
  INCIDENT_ATTACHMENT_ADDED: 'incident_attachment_added',
  INCIDENT_ESCALATED: 'incident_escalated',
  
  // PPE Events
  PPE_ITEM_CREATED: 'ppe_item_created',
  PPE_ITEM_UPDATED: 'ppe_item_updated',
  PPE_ITEM_ASSIGNED: 'ppe_item_assigned',
  PPE_ITEM_RETURNED: 'ppe_item_returned',
  PPE_ITEM_INSPECTED: 'ppe_item_inspected',
  PPE_ITEM_MAINTENANCE_SCHEDULED: 'ppe_item_maintenance_scheduled',
  PPE_ITEM_MAINTENANCE_COMPLETED: 'ppe_item_maintenance_completed',
  PPE_ITEM_EXPIRED: 'ppe_item_expired',
  PPE_ITEM_DAMAGED: 'ppe_item_damaged',
  PPE_ITEM_DELETED: 'ppe_item_deleted',
  PPE_ITEM_STOCK_UPDATED: 'ppe_item_stock_updated',
  
  // User Events
  USER_REGISTERED: 'user_registered',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_STATUS_UPDATED: 'user_status_updated',
  USER_ASSIGNED_TO_PROJECT: 'user_assigned_to_project',
  USER_REMOVED_FROM_PROJECT: 'user_removed_from_project',
  USER_TRAINING_COMPLETED: 'user_training_completed',
  USER_CERTIFICATION_UPDATED: 'user_certification_updated',
  USER_PERFORMANCE_UPDATED: 'user_performance_updated',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_DELETED: 'user_deleted',
  
  // Notification Events
  NOTIFICATION_SENT: 'notification_sent',
  NOTIFICATION_DELIVERED: 'notification_delivered',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_FAILED: 'notification_failed',
  NOTIFICATION_SCHEDULED: 'notification_scheduled',
  NOTIFICATION_CANCELLED: 'notification_cancelled',
  NOTIFICATION_TEMPLATE_CREATED: 'notification_template_created',
  NOTIFICATION_TEMPLATE_UPDATED: 'notification_template_updated',
  NOTIFICATION_TEMPLATE_DELETED: 'notification_template_deleted',
  
  // System Events
  SYSTEM_STARTUP: 'system_startup',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  SYSTEM_HEALTH_CHECK: 'system_health_check',
  SYSTEM_ERROR: 'system_error',
  SYSTEM_PERFORMANCE: 'system_performance',
  SYSTEM_CONFIGURATION_UPDATED: 'system_configuration_updated',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_SECURITY: 'system_security',
  
  // Role Events
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_DELETED: 'role_deleted',
  ROLE_STATUS_TOGGLED: 'role_status_toggled',
  ROLE_PERMISSIONS_UPDATED: 'role_permissions_updated',
  ROLE_ASSIGNED_TO_USER: 'role_assigned_to_user',
  ROLE_REMOVED_FROM_USER: 'role_removed_from_user',
  
  // Department Events
  DEPARTMENT_CREATED: 'department_created',
  DEPARTMENT_UPDATED: 'department_updated',
  DEPARTMENT_DELETED: 'department_deleted',
  DEPARTMENT_MANAGER_ASSIGNED: 'department_manager_assigned',
  DEPARTMENT_MANAGER_REMOVED: 'department_manager_removed',
  EMPLOYEE_TRANSFERRED_TO_DEPARTMENT: 'employee_transferred_to_department',
  EMPLOYEE_REMOVED_FROM_DEPARTMENT: 'employee_removed_from_department',


  // Training Events
  COURSE_SET_CREATED: 'course_set_created',
  COURSE_SET_UPDATED: 'course_set_updated',
  COURSE_SET_DELETED: 'course_set_deleted',
  TRAINING_SESSION_CREATED: 'training_session_created',
  TRAINING_SESSION_UPDATED: 'training_session_updated',
  TRAINING_SESSION_DELETED: 'training_session_deleted',
  TRAINING_ENROLLMENT: 'training_enrollment',
  TRAINING_COMPLETION: 'training_completion',
  TRAINING_RETAKE: 'training_retake',

  // Quality Events
  QUALITY_CHECKPOINT_CREATED: 'quality_checkpoint_created',
  QUALITY_CHECKPOINT_UPDATED: 'quality_checkpoint_updated',
  QUALITY_CHECKPOINT_DELETED: 'quality_checkpoint_deleted',
  QUALITY_CHECKPOINT_COMPLETED: 'quality_checkpoint_completed',
  QUALITY_CHECKPOINT_STATUS_CHANGED: 'quality_checkpoint_status_changed',
  QUALITY_CHECKPOINT_ASSIGNED: 'quality_checkpoint_assigned',

  // Certificate Events
  CERTIFICATE_CREATED: 'certificate_created',
  CERTIFICATE_UPDATED: 'certificate_updated',
  CERTIFICATE_DELETED: 'certificate_deleted',
  CERTIFICATE_RENEWED: 'certificate_renewed',
  CERTIFICATE_EXPIRING_SOON: 'certificate_expiring_soon',
  CERTIFICATE_EXPIRED: 'certificate_expired',
  CERTIFICATE_REMINDER_SETTINGS_UPDATED: 'certificate_reminder_settings_updated',
  CERTIFICATE_STATUS_CHANGED: 'certificate_status_changed',
  CERTIFICATE_BULK_OPERATION: 'certificate_bulk_operation'
};

// Lazy create Kafka instance to avoid connection attempts when disabled
let kafkaInstance = null;
const getKafka = () => {
  // Don't create Kafka instance if disabled
  if (!isKafkaEnabled) {
    throw new Error('Kafka is disabled (ENABLE_KAFKA=false). Cannot create Kafka instance.');
  }
  // Only create Kafka instance when actually needed
  if (!kafkaInstance) {
    // Lazy-load kafkajs and create config
    const { Kafka } = getKafkaJS();
    if (!kafkaConfig) {
      kafkaConfig = getKafkaConfig();
      
      // Apply security settings (SSL/SASL) if env provided
      if (process.env.KAFKA_SSL === 'true' || process.env.KAFKA_SASL_MECHANISM) {
        kafkaConfig.ssl = {
          rejectUnauthorized: process.env.KAFKA_SSL_REJECT_UNAUTHORIZED !== 'false'
        };
      }
      
      if (process.env.KAFKA_SASL_MECHANISM) {
        kafkaConfig.sasl = {
          mechanism: process.env.KAFKA_SASL_MECHANISM,
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD
        };
      }
    }
    kafkaInstance = new Kafka(kafkaConfig);
  }
  return kafkaInstance;
};

// Producer configuration - lazy-load Partitioners when needed
const getProducerConfig = () => {
  const { Partitioners } = getKafkaJS();
  return {
    maxInFlightRequests: 5, // ✅ Tăng từ 1 lên 5 để cải thiện performance
    idempotent: true,
    transactionTimeout: 30000,
    retry: {
      initialRetryTime: 100,
      retries: 10 // ✅ Tăng retries để tránh warning về EoS guarantees
    },
    // Thêm compression để giảm bandwidth
    compression: 'gzip',
    // Batch settings để tối ưu throughput
    batchSize: 16384,
    lingerMs: 5,
    // ✅ Fix partitioner warning
    createPartitioner: Partitioners.LegacyPartitioner
  };
};

// Cache producerConfig to avoid recreating it
let producerConfigCache = null;
const producerConfig = new Proxy({}, {
  get(target, prop) {
    if (!producerConfigCache) {
      producerConfigCache = getProducerConfig();
    }
    return producerConfigCache[prop];
  },
  ownKeys() {
    if (!producerConfigCache) {
      producerConfigCache = getProducerConfig();
    }
    return Object.keys(producerConfigCache);
  },
  has(target, prop) {
    if (!producerConfigCache) {
      producerConfigCache = getProducerConfig();
    }
    return prop in producerConfigCache;
  }
});

// Consumer configuration - lazy-load kafkaConfig.groupId when needed
const getConsumerConfig = () => {
  // Get groupId from kafkaConfig (lazy-load it if needed)
  const config = kafkaConfig || getKafkaConfig();
  return {
    groupId: config.groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
    retry: {
      initialRetryTime: 100,
      retries: 8
    },
    // Cải thiện performance
    maxBytes: 1048576, // 1MB
    maxBytesPerPartition: 1048576, // 1MB per partition
    // Auto commit settings
    autoCommit: true,
    autoCommitInterval: 5000,
    // Fetch settings
    fetchMaxBytes: 1048576,
    fetchMinBytes: 1,
    fetchMaxWaitMs: 500
  };
};

// Cache consumerConfig to avoid recreating it
let consumerConfigCache = null;
const consumerConfig = new Proxy({}, {
  get(target, prop) {
    if (!consumerConfigCache) {
      consumerConfigCache = getConsumerConfig();
    }
    return consumerConfigCache[prop];
  },
  ownKeys() {
    if (!consumerConfigCache) {
      consumerConfigCache = getConsumerConfig();
    }
    return Object.keys(consumerConfigCache);
  },
  has(target, prop) {
    if (!consumerConfigCache) {
      consumerConfigCache = getConsumerConfig();
    }
    return prop in consumerConfigCache;
  }
});

module.exports = {
  get kafka() {
    // Lazy getter - only create Kafka instance when accessed
    return getKafka();
  },
  kafkaConfig,
  topics,
  eventTypes,
  producerConfig,
  consumerConfig
};
