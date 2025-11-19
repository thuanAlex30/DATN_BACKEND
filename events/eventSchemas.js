const Joi = require('joi');

/**
 * Base Event Schema
 */
const baseEventSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  eventType: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
  source: Joi.string().default('backend-api'),
  version: Joi.string().default('1.0'),
  metadata: Joi.object({
    userId: Joi.string().required(),
    userRole: Joi.string().required(),
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().optional()
  }).required()
});

/**
 * Project Event Data Schema
 */
const projectEventDataSchema = Joi.object({
  projectId: Joi.string().required(),
  projectName: Joi.string().required(),
  status: Joi.string().valid('planning', 'in_progress', 'completed', 'cancelled', 'on_hold').required(),
  progress: Joi.number().min(0).max(100).default(0),
  assignedUsers: Joi.array().items(Joi.string()).default([]),
  siteId: Joi.string().optional(),
  leaderId: Joi.string().optional(),
  description: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  budget: Joi.number().min(0).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

/**
 * Task Event Data Schema
 */
const taskEventDataSchema = Joi.object({
  taskId: Joi.string().required(),
  taskName: Joi.string().required(),
  projectId: Joi.string().required(),
  status: Joi.string().valid('todo', 'in_progress', 'review', 'completed', 'cancelled').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  progress: Joi.number().min(0).max(100).default(0),
  assigneeId: Joi.string().optional(),
  dueDate: Joi.date().iso().optional(),
  dependencies: Joi.array().items(Joi.string()).default([]),
  description: Joi.string().optional(),
  estimatedHours: Joi.number().min(0).optional(),
  actualHours: Joi.number().min(0).optional()
});

/**
 * Incident Event Data Schema
 */
const incidentEventDataSchema = Joi.object({
  incidentId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  status: Joi.string().valid('reported', 'investigating', 'in_progress', 'resolved', 'closed').required(),
  location: Joi.string().required(),
  assignedTo: Joi.string().optional(),
  createdBy: Joi.string().required(),
  images: Joi.array().items(Joi.string()).default([]),
  progress: Joi.number().min(0).max(100).default(0)
});

/**
 * PPE Event Data Schema
 */
const ppeEventDataSchema = Joi.object({
  ppeId: Joi.string().required(),
  itemName: Joi.string().required(),
  category: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  status: Joi.string().valid('available', 'assigned', 'maintenance', 'expired', 'damaged').required(),
  assignedTo: Joi.string().optional(),
  expiryDate: Joi.date().iso().optional(),
  siteId: Joi.string().optional(),
  maintenanceDate: Joi.date().iso().optional()
});

/**
 * User Event Data Schema
 */
const userEventDataSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  role: Joi.string().required(),
  department: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
  lastLogin: Joi.date().iso().optional()
});

/**
 * Notification Event Data Schema
 */
const notificationEventDataSchema = Joi.object({
  notificationId: Joi.string().required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  type: Joi.string().valid('info', 'success', 'warning', 'error').required(),
  category: Joi.string().valid('system', 'project', 'task', 'incident', 'ppe', 'training').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  targetUsers: Joi.array().items(Joi.string()).default([]),
  targetRoles: Joi.array().items(Joi.string()).default([]),
  isRead: Joi.boolean().default(false)
});

/**
 * System Event Data Schema
 */
const systemEventDataSchema = Joi.object({
  systemId: Joi.string().default('safety-management-system'),
  component: Joi.string().required(),
  level: Joi.string().valid('debug', 'info', 'warn', 'error', 'fatal').default('info'),
  message: Joi.string().required(),
  details: Joi.object().default({}),
  timestamp: Joi.date().iso().required()
});

/**
 * Certificate Event Data Schema
 */
const certificateEventDataSchema = Joi.object({
  certificateId: Joi.string().required(),
  certificateName: Joi.string().required(),
  certificateCode: Joi.string().optional(),
  category: Joi.string().valid('SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER').required(),
  subCategory: Joi.string().optional(),
  description: Joi.string().optional(),
  issuingAuthority: Joi.string().required(),
  issueDate: Joi.date().iso().optional(),
  expiryDate: Joi.date().iso().optional(),
  validityPeriod: Joi.number().min(0).optional(),
  validityPeriodUnit: Joi.string().valid('MONTHS', 'YEARS').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED').required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  renewalRequired: Joi.boolean().default(true),
  cost: Joi.number().min(0).optional(),
  currency: Joi.string().default('VND'),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional()
  }).optional(),
  tags: Joi.array().items(Joi.string()).default([]),
  attachments: Joi.array().items(Joi.object({
    filename: Joi.string().required(),
    originalName: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().min(0).required(),
    uploadedAt: Joi.date().iso().required()
  })).default([]),
  reminderSettings: Joi.object({
    enabled: Joi.boolean().default(true),
    reminderDays: Joi.array().items(Joi.number().min(0)).default([30, 60, 90]),
    notificationMethods: Joi.array().items(Joi.string().valid('EMAIL', 'SMS', 'SYSTEM')).default(['EMAIL', 'SYSTEM']),
    recipients: Joi.array().items(Joi.string()).default([])
  }).optional(),
  complianceStandards: Joi.array().items(Joi.string()).default([]),
  siteId: Joi.string().optional(),
  projectId: Joi.string().optional(),
  assignedTo: Joi.string().optional(),
  notes: Joi.string().optional(),
  lastRenewalDate: Joi.date().iso().optional(),
  renewalNotes: Joi.string().optional(),
  changes: Joi.object().optional(),
  oldStatus: Joi.string().optional(),
  newStatus: Joi.string().optional(),
  statusChangedAt: Joi.date().iso().optional(),
  renewalDate: Joi.date().iso().optional(),
  previousExpiryDate: Joi.date().iso().optional(),
  daysUntilExpiry: Joi.number().optional(),
  operation: Joi.string().optional(),
  certificateIds: Joi.array().items(Joi.string()).optional(),
  certificateNames: Joi.array().items(Joi.string()).optional(),
  count: Joi.number().min(0).optional(),
  operationData: Joi.object().optional(),
  processedAt: Joi.date().iso().optional(),
  deletedAt: Joi.date().iso().optional()
});

/**
 * Complete Event Schemas
 */
const eventSchemas = {
  // Project Events
  project_created: baseEventSchema.keys({
    data: projectEventDataSchema.required()
  }),
  project_updated: baseEventSchema.keys({
    data: projectEventDataSchema.required()
  }),
  project_assigned: baseEventSchema.keys({
    data: projectEventDataSchema.required()
  }),
  project_progress_updated: baseEventSchema.keys({
    data: projectEventDataSchema.required()
  }),
  project_deleted: baseEventSchema.keys({
    data: projectEventDataSchema.required()
  }),

  // Task Events
  task_created: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_updated: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_assigned: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_status_updated: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_progress_updated: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_comment_added: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),
  task_deleted: baseEventSchema.keys({
    data: taskEventDataSchema.required()
  }),

  // Incident Events
  incident_reported: baseEventSchema.keys({
    data: incidentEventDataSchema.required()
  }),
  incident_classified: baseEventSchema.keys({
    data: incidentEventDataSchema.required()
  }),
  incident_assigned: baseEventSchema.keys({
    data: incidentEventDataSchema.required()
  }),
  incident_progress_updated: baseEventSchema.keys({
    data: incidentEventDataSchema.required()
  }),
  incident_closed: baseEventSchema.keys({
    data: incidentEventDataSchema.required()
  }),

  // PPE Events
  ppe_created: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),
  ppe_updated: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),
  ppe_assigned: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),
  ppe_returned: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),
  ppe_expiring: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),
  ppe_low_stock: baseEventSchema.keys({
    data: ppeEventDataSchema.required()
  }),

  // User Events
  user_created: baseEventSchema.keys({
    data: userEventDataSchema.required()
  }),
  user_updated: baseEventSchema.keys({
    data: userEventDataSchema.required()
  }),
  user_login: baseEventSchema.keys({
    data: userEventDataSchema.required()
  }),
  user_logout: baseEventSchema.keys({
    data: userEventDataSchema.required()
  }),
  user_role_changed: baseEventSchema.keys({
    data: userEventDataSchema.required()
  }),

  // Notification Events
  notification_created: baseEventSchema.keys({
    data: notificationEventDataSchema.required()
  }),
  notification_read: baseEventSchema.keys({
    data: notificationEventDataSchema.required()
  }),
  notification_sent: baseEventSchema.keys({
    data: notificationEventDataSchema.required()
  }),

  // System Events
  system_startup: baseEventSchema.keys({
    data: systemEventDataSchema.required()
  }),
  system_shutdown: baseEventSchema.keys({
    data: systemEventDataSchema.required()
  }),
  system_error: baseEventSchema.keys({
    data: systemEventDataSchema.required()
  }),
  system_warning: baseEventSchema.keys({
    data: systemEventDataSchema.required()
  }),

  // Certificate Events
  certificate_created: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_updated: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_deleted: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_renewed: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_expiring_soon: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_expired: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_reminder_settings_updated: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_status_changed: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  }),
  certificate_bulk_operation: baseEventSchema.keys({
    data: certificateEventDataSchema.required()
  })
};

/**
 * Validate event data against schema
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data to validate
 * @returns {Object} Validation result
 */
function validateEvent(eventType, eventData) {
  try {
    const schema = eventSchemas[eventType];
    if (!schema) {
      return {
        isValid: false,
        error: `Unknown event type: ${eventType}`
      };
    }

    const { error, value } = schema.validate(eventData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return {
        isValid: false,
        error: error.details.map(detail => detail.message).join(', ')
      };
    }

    return {
      isValid: true,
      data: value
    };

  } catch (err) {
    return {
      isValid: false,
      error: err.message
    };
  }
}

/**
 * Get all supported event types
 * @returns {Array} Array of event types
 */
function getSupportedEventTypes() {
  return Object.keys(eventSchemas);
}

/**
 * Get schema for specific event type
 * @param {string} eventType - Event type
 * @returns {Object} Joi schema or null
 */
function getEventSchema(eventType) {
  return eventSchemas[eventType] || null;
}

module.exports = {
  eventSchemas,
  validateEvent,
  getSupportedEventTypes,
  getEventSchema,
  baseEventSchema,
  projectEventDataSchema,
  taskEventDataSchema,
  incidentEventDataSchema,
  ppeEventDataSchema,
  userEventDataSchema,
  notificationEventDataSchema,
  systemEventDataSchema,
  certificateEventDataSchema
};
