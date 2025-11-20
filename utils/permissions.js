const { ROLE_CODES } = require('../config/roleMatrix');

const ROLES = {
  ...ROLE_CODES,
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  HEADER_DEPARTMENT: 'header_department' // Legacy role identifiers
};

/**
 * Permission Matrix: { module: { action: [role_codes/levels] } }
 * Defines which roles/levels can perform which actions on which modules
 */
const PERMISSION_MATRIX = {
  user: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100]
  },
  role: {
    create: [ROLE_CODES.SYSTEM_ADMIN, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    assign: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100]
  },
  department: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100]
  },
  project: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.MAINTENANCE_STAFF, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.MAINTENANCE_STAFF, 50, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100]
  },
  training: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.TRAINER, 55, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.TRAINER, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TRAINER, 55, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.TRAINER, 10, 100],
    enroll: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.TRAINER, 10, 100]
  },
  safety: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, 10, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, ROLE_CODES.WAREHOUSE_STAFF, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, 55, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, 10, 100],
    approve: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, 55, 100]
  },

  task_workflow: {
    create_campaign: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    breakdown: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, 70, 100],
    assign: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, 60, 100],
    update_progress: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100],
    comment: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100],
    view: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100],
    view_logs: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, 10, 100]
  },
  trainer_module: {
    sessions: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TRAINER],
    assignments: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TRAINER],
    assessments: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TRAINER, ROLE_CODES.TEAM_LEADER]
  },
  safety_module: {
    reports: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE],
    checklists: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.SAFETY_OFFICER],
    escalations: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.SAFETY_OFFICER]
  },
  warehouse_module: {
    stock: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.WAREHOUSE_STAFF],
    movements: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.WAREHOUSE_STAFF],
    requests: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.WAREHOUSE_STAFF, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE],
    approvals: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.WAREHOUSE_STAFF, ROLE_CODES.MANAGER]
  },
  maintenance_module: {
    equipment: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MAINTENANCE_STAFF],
    jobs: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MAINTENANCE_STAFF, ROLE_CODES.MANAGER],
    logs: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.MAINTENANCE_STAFF]
  },
  ppe: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.WAREHOUSE_STAFF, 50, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.WAREHOUSE_STAFF, ROLE_CODES.SAFETY_OFFICER, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.WAREHOUSE_STAFF, ROLE_CODES.SAFETY_OFFICER, ROLE_CODES.MAINTENANCE_STAFF, 50, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    issue: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.WAREHOUSE_STAFF, 50, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.WAREHOUSE_STAFF, 10, 100]
  },
  incident: {
    create: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, 10, 100],
    read: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, ROLE_CODES.WAREHOUSE_STAFF, ROLE_CODES.MAINTENANCE_STAFF, 10, 100],
    update: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, ROLE_CODES.MAINTENANCE_STAFF, 50, 100],
    delete: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, 80, 100],
    close: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, 55, 100],
    escalate: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.SAFETY_OFFICER, 55, 100],
    list: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.TEAM_LEADER, ROLE_CODES.EMPLOYEE, ROLE_CODES.SAFETY_OFFICER, 10, 100]
  },
  analytics: {
    view_global: [ROLE_CODES.SYSTEM_ADMIN, 100],
    view_tenant: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100],
    view_department: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.DEPARTMENT_HEADER, ROLE_CODES.MANAGER, ROLE_CODES.SAFETY_OFFICER, 55, 100],
    export_global: [ROLE_CODES.SYSTEM_ADMIN, 100],
    export_tenant: [ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.COMPANY_ADMIN, 90, 100]
  }
};

/**
 * Get the highest priority role from an array of user roles
 * Priority: highest role_level > tenant_scope (global > tenant > self)
 * @param {Array|Object} userRoles - Array of role objects or single role object
 * @returns {Object|null} - The highest priority role
 */
const getHighestRole = (userRoles) => {
  if (!userRoles) return null;
  
  // If single role object, return it
  if (!Array.isArray(userRoles)) {
    return userRoles;
  }
  
  // If empty array, return null
  if (userRoles.length === 0) return null;
  
  // If single role in array, return it
  if (userRoles.length === 1) return userRoles[0];
  
  // Sort by role_level (descending), then by tenant_scope priority
  const scopePriority = { 'global': 3, 'tenant': 2, 'self': 1 };
  
  return userRoles.reduce((highest, current) => {
    const currentLevel = current.role_level || 0;
    const highestLevel = highest.role_level || 0;
    
    // First priority: role_level
    if (currentLevel > highestLevel) {
      return current;
    }
    if (currentLevel < highestLevel) {
      return highest;
    }
    
    // If same level, compare tenant_scope
    const currentScope = current.scope_rules?.tenant_scope || 'tenant';
    const highestScope = highest.scope_rules?.tenant_scope || 'tenant';
    const currentScopePriority = scopePriority[currentScope] || 0;
    const highestScopePriority = scopePriority[highestScope] || 0;
    
    if (currentScopePriority > highestScopePriority) {
      return current;
    }
    
    return highest;
  });
};

const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',

  // Role management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_LIST: 'role:list',

  // Department management
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_READ: 'department:read',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',
  DEPARTMENT_LIST: 'department:list',

  // Safety reports
  SAFETY_REPORT_CREATE: 'safety_report:create',
  SAFETY_REPORT_READ: 'safety_report:read',
  SAFETY_REPORT_UPDATE: 'safety_report:update',
  SAFETY_REPORT_DELETE: 'safety_report:delete',
  SAFETY_REPORT_LIST: 'safety_report:list',
  SAFETY_REPORT_APPROVE: 'safety_report:approve',

  // Training management
  TRAINING_CREATE: 'training:create',
  TRAINING_READ: 'training:read',
  TRAINING_UPDATE: 'training:update',
  TRAINING_DELETE: 'training:delete',
  TRAINING_LIST: 'training:list',
  TRAINING_ENROLL: 'training:enroll',
  TRAINING_ENROLLMENT_READ: 'training_enrollment:read',
  TRAINING_ENROLLMENT_CREATE: 'training_enrollment:create',

  // Project management
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_LIST: 'project:list',

  // PPE & warehouse management
  PPE_CREATE: 'ppe:create',
  PPE_READ: 'ppe:read',
  PPE_UPDATE: 'ppe:update',
  PPE_DELETE: 'ppe:delete',
  PPE_ISSUE: 'ppe:issue',

  // Task workflow
  TASK_WORKFLOW_CREATE_CAMPAIGN: 'task_workflow:create_campaign',
  TASK_WORKFLOW_BREAKDOWN: 'task_workflow:breakdown',
  TASK_WORKFLOW_ASSIGN: 'task_workflow:assign',
  TASK_WORKFLOW_UPDATE_PROGRESS: 'task_workflow:update_progress',
  TASK_WORKFLOW_COMMENT: 'task_workflow:comment',
  TASK_WORKFLOW_VIEW: 'task_workflow:view',
  TASK_WORKFLOW_VIEW_LOGS: 'task_workflow:view_logs',

  // Trainer module
  TRAINER_SESSION_READ: 'trainer_session:read',
  TRAINER_SESSION_CREATE: 'trainer_session:create',
  TRAINER_SESSION_UPDATE: 'trainer_session:update',
  TRAINER_SESSION_DELETE: 'trainer_session:delete',
  TRAINER_ASSIGNMENT_READ: 'trainer_assignment:read',
  TRAINER_ASSIGNMENT_CREATE: 'trainer_assignment:create',
  TRAINER_ASSIGNMENT_UPDATE: 'trainer_assignment:update',
  TRAINER_ASSIGNMENT_DELETE: 'trainer_assignment:delete',
  TRAINER_ASSESSMENT_READ: 'trainer_assessment:read',
  TRAINER_ASSESSMENT_RECORD: 'trainer_assessment:record',

  // Safety module extensions
  SAFETY_CHECKLIST_CREATE: 'safety_checklist:create',
  SAFETY_CHECKLIST_READ: 'safety_checklist:read',
  SAFETY_CHECKLIST_UPDATE: 'safety_checklist:update',
  INCIDENT_ESCALATION_READ: 'incident_escalation:read',
  INCIDENT_ESCALATION_UPDATE: 'incident_escalation:update',

  // Warehouse module
  WAREHOUSE_STOCK_READ: 'warehouse_stock:read',
  WAREHOUSE_STOCK_UPDATE: 'warehouse_stock:update',
  WAREHOUSE_MOVEMENT_READ: 'warehouse_movement:read',
  WAREHOUSE_MOVEMENT_CREATE: 'warehouse_movement:create',
  WAREHOUSE_REQUEST_READ: 'warehouse_request:read',
  WAREHOUSE_REQUEST_CREATE: 'warehouse_request:create',
  WAREHOUSE_REQUEST_DECIDE: 'warehouse_request:decide',

  // Maintenance module
  MAINTENANCE_EQUIPMENT_READ: 'maintenance_equipment:read',
  MAINTENANCE_EQUIPMENT_UPDATE: 'maintenance_equipment:update',
  MAINTENANCE_JOB_READ: 'maintenance_job:read',
  MAINTENANCE_JOB_CREATE: 'maintenance_job:create',
  MAINTENANCE_JOB_UPDATE: 'maintenance_job:update',
  MAINTENANCE_LOG_READ: 'maintenance_log:read',
  MAINTENANCE_LOG_CREATE: 'maintenance_log:create',

  // Incident management
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_READ: 'incident:read',
  INCIDENT_UPDATE: 'incident:update',
  INCIDENT_DELETE: 'incident:delete',
  INCIDENT_CLOSE: 'incident:close',
  INCIDENT_ESCALATE: 'incident:escalate',

  // Analytics & reporting
  ANALYTICS_VIEW_GLOBAL: 'analytics:view_global',
  ANALYTICS_VIEW_TENANT: 'analytics:view_tenant',
  ANALYTICS_VIEW_DEPARTMENT: 'analytics:view_department'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Core administration
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.ROLE_LIST,
    PERMISSIONS.DEPARTMENT_CREATE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_UPDATE,
    PERMISSIONS.DEPARTMENT_DELETE,
    PERMISSIONS.DEPARTMENT_LIST,

    // Task workflow
    PERMISSIONS.TASK_WORKFLOW_CREATE_CAMPAIGN,
    PERMISSIONS.TASK_WORKFLOW_BREAKDOWN,
    PERMISSIONS.TASK_WORKFLOW_ASSIGN,
    PERMISSIONS.TASK_WORKFLOW_UPDATE_PROGRESS,
    PERMISSIONS.TASK_WORKFLOW_COMMENT,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.TASK_WORKFLOW_VIEW_LOGS,

    // Safety & training
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_DELETE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE,
    PERMISSIONS.SAFETY_CHECKLIST_CREATE,
    PERMISSIONS.SAFETY_CHECKLIST_READ,
    PERMISSIONS.SAFETY_CHECKLIST_UPDATE,
    PERMISSIONS.INCIDENT_ESCALATION_READ,
    PERMISSIONS.INCIDENT_ESCALATION_UPDATE,
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_DELETE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE,
    PERMISSIONS.TRAINER_SESSION_CREATE,
    PERMISSIONS.TRAINER_SESSION_READ,
    PERMISSIONS.TRAINER_SESSION_UPDATE,
    PERMISSIONS.TRAINER_SESSION_DELETE,
    PERMISSIONS.TRAINER_ASSIGNMENT_CREATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_READ,
    PERMISSIONS.TRAINER_ASSIGNMENT_UPDATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_DELETE,
    PERMISSIONS.TRAINER_ASSESSMENT_READ,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,

    // PPE & warehouse
    PERMISSIONS.PPE_CREATE,
    PERMISSIONS.PPE_READ,
    PERMISSIONS.PPE_UPDATE,
    PERMISSIONS.PPE_DELETE,
    PERMISSIONS.PPE_ISSUE,
    PERMISSIONS.WAREHOUSE_STOCK_READ,
    PERMISSIONS.WAREHOUSE_STOCK_UPDATE,
    PERMISSIONS.WAREHOUSE_MOVEMENT_READ,
    PERMISSIONS.WAREHOUSE_MOVEMENT_CREATE,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_CREATE,
    PERMISSIONS.WAREHOUSE_REQUEST_DECIDE,

    // Maintenance
    PERMISSIONS.MAINTENANCE_EQUIPMENT_READ,
    PERMISSIONS.MAINTENANCE_EQUIPMENT_UPDATE,
    PERMISSIONS.MAINTENANCE_JOB_READ,
    PERMISSIONS.MAINTENANCE_JOB_CREATE,
    PERMISSIONS.MAINTENANCE_JOB_UPDATE,
    PERMISSIONS.MAINTENANCE_LOG_READ,
    PERMISSIONS.MAINTENANCE_LOG_CREATE,

    // Incident
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.INCIDENT_DELETE,
    PERMISSIONS.INCIDENT_CLOSE,
    PERMISSIONS.INCIDENT_ESCALATE,

    // Analytics
    PERMISSIONS.ANALYTICS_VIEW_GLOBAL,
    PERMISSIONS.ANALYTICS_VIEW_TENANT,
    PERMISSIONS.ANALYTICS_VIEW_DEPARTMENT
  ],

  [ROLES.HEADER_DEPARTMENT]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_LIST,
    PERMISSIONS.TASK_WORKFLOW_CREATE_CAMPAIGN,
    PERMISSIONS.TASK_WORKFLOW_BREAKDOWN,
    PERMISSIONS.TASK_WORKFLOW_ASSIGN,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.TASK_WORKFLOW_VIEW_LOGS,
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE,
    PERMISSIONS.SAFETY_CHECKLIST_READ,
    PERMISSIONS.SAFETY_CHECKLIST_UPDATE,
    PERMISSIONS.INCIDENT_ESCALATION_READ,
    PERMISSIONS.INCIDENT_ESCALATION_UPDATE,
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_DELETE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE,
    PERMISSIONS.TRAINER_SESSION_CREATE,
    PERMISSIONS.TRAINER_SESSION_READ,
    PERMISSIONS.TRAINER_SESSION_UPDATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_CREATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_READ,
    PERMISSIONS.TRAINER_ASSIGNMENT_UPDATE,
    PERMISSIONS.TRAINER_ASSESSMENT_READ,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,
    PERMISSIONS.PPE_READ,
    PERMISSIONS.PPE_UPDATE,
    PERMISSIONS.PPE_ISSUE,
    PERMISSIONS.WAREHOUSE_STOCK_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_DECIDE,
    PERMISSIONS.MAINTENANCE_EQUIPMENT_READ,
    PERMISSIONS.MAINTENANCE_JOB_READ,
    PERMISSIONS.MAINTENANCE_JOB_UPDATE,
    PERMISSIONS.MAINTENANCE_LOG_READ,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.INCIDENT_ESCALATE,
    PERMISSIONS.ANALYTICS_VIEW_DEPARTMENT
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.TASK_WORKFLOW_BREAKDOWN,
    PERMISSIONS.TASK_WORKFLOW_ASSIGN,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE,
    PERMISSIONS.SAFETY_CHECKLIST_READ,
    PERMISSIONS.INCIDENT_ESCALATION_READ,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINER_SESSION_READ,
    PERMISSIONS.TRAINER_SESSION_UPDATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_READ,
    PERMISSIONS.TRAINER_ASSIGNMENT_UPDATE,
    PERMISSIONS.TRAINER_ASSESSMENT_READ,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,
    PERMISSIONS.PPE_READ,
    PERMISSIONS.PPE_ISSUE,
    PERMISSIONS.WAREHOUSE_STOCK_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_DECIDE,
    PERMISSIONS.MAINTENANCE_JOB_READ,
    PERMISSIONS.MAINTENANCE_JOB_UPDATE,
    PERMISSIONS.MAINTENANCE_LOG_READ,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW_DEPARTMENT
  ],

  [ROLES.TEAM_LEADER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.TASK_WORKFLOW_ASSIGN,
    PERMISSIONS.TASK_WORKFLOW_UPDATE_PROGRESS,
    PERMISSIONS.TASK_WORKFLOW_COMMENT,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINER_SESSION_READ,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,
    PERMISSIONS.WAREHOUSE_REQUEST_CREATE,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.MAINTENANCE_JOB_READ,
    PERMISSIONS.MAINTENANCE_LOG_READ,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ
  ],

  [ROLES.EMPLOYEE]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.TASK_WORKFLOW_UPDATE_PROGRESS,
    PERMISSIONS.TASK_WORKFLOW_COMMENT,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,
    PERMISSIONS.WAREHOUSE_REQUEST_CREATE,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ
  ],

  [ROLES.TRAINER]: [
    PERMISSIONS.TRAINER_SESSION_CREATE,
    PERMISSIONS.TRAINER_SESSION_READ,
    PERMISSIONS.TRAINER_SESSION_UPDATE,
    PERMISSIONS.TRAINER_SESSION_DELETE,
    PERMISSIONS.TRAINER_ASSIGNMENT_CREATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_READ,
    PERMISSIONS.TRAINER_ASSIGNMENT_UPDATE,
    PERMISSIONS.TRAINER_ASSIGNMENT_DELETE,
    PERMISSIONS.TRAINER_ASSESSMENT_READ,
    PERMISSIONS.TRAINER_ASSESSMENT_RECORD,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ
  ],

  [ROLES.SAFETY_OFFICER]: [
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_CHECKLIST_CREATE,
    PERMISSIONS.SAFETY_CHECKLIST_READ,
    PERMISSIONS.SAFETY_CHECKLIST_UPDATE,
    PERMISSIONS.INCIDENT_ESCALATION_READ,
    PERMISSIONS.INCIDENT_ESCALATION_UPDATE,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_READ,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.TASK_WORKFLOW_COMMENT,
    PERMISSIONS.TASK_WORKFLOW_VIEW,
    PERMISSIONS.TRAINING_READ
  ],

  [ROLES.WAREHOUSE_STAFF]: [
    PERMISSIONS.PPE_CREATE,
    PERMISSIONS.PPE_READ,
    PERMISSIONS.PPE_UPDATE,
    PERMISSIONS.PPE_ISSUE,
    PERMISSIONS.WAREHOUSE_STOCK_READ,
    PERMISSIONS.WAREHOUSE_STOCK_UPDATE,
    PERMISSIONS.WAREHOUSE_MOVEMENT_READ,
    PERMISSIONS.WAREHOUSE_MOVEMENT_CREATE,
    PERMISSIONS.WAREHOUSE_REQUEST_READ,
    PERMISSIONS.WAREHOUSE_REQUEST_DECIDE,
    PERMISSIONS.WAREHOUSE_REQUEST_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.INCIDENT_READ
  ],

  [ROLES.MAINTENANCE_STAFF]: [
    PERMISSIONS.MAINTENANCE_EQUIPMENT_READ,
    PERMISSIONS.MAINTENANCE_EQUIPMENT_UPDATE,
    PERMISSIONS.MAINTENANCE_JOB_READ,
    PERMISSIONS.MAINTENANCE_JOB_CREATE,
    PERMISSIONS.MAINTENANCE_JOB_UPDATE,
    PERMISSIONS.MAINTENANCE_LOG_READ,
    PERMISSIONS.MAINTENANCE_LOG_CREATE,
    PERMISSIONS.PPE_READ,
    PERMISSIONS.PPE_UPDATE,
    PERMISSIONS.INCIDENT_READ,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.TASK_WORKFLOW_COMMENT,
    PERMISSIONS.TASK_WORKFLOW_VIEW
  ]
};

ROLE_PERMISSIONS[ROLES.SYSTEM_ADMIN] = ROLE_PERMISSIONS[ROLES.ADMIN];
ROLE_PERMISSIONS[ROLES.COMPANY_ADMIN] = ROLE_PERMISSIONS[ROLES.ADMIN];
ROLE_PERMISSIONS[ROLES.DEPARTMENT_HEADER] = ROLE_PERMISSIONS[ROLES.HEADER_DEPARTMENT];

const normalizeRoleValue = (role) => {
  if (!role) {
    return null;
  }

  if (typeof role === 'string') {
    return role.trim().toLowerCase();
  }

  if (role.role_code) {
    return role.role_code.trim().toLowerCase();
  }

  if (role.role_name) {
    return role.role_name.trim().toLowerCase().replace(/\s+/g, '_');
  }

  return null;
};

/**
 * Check if user's tenant scope allows access
 * @param {Object} scopeRules - User's scope_rules from role
 * @param {string} userTenantId - User's tenant_id
 * @param {string} resourceTenantId - Resource's tenant_id (optional)
 * @param {string} requiredScope - Required tenant scope: 'global', 'tenant', 'self'
 * @returns {boolean}
 */
const checkTenantScope = (scopeRules, userTenantId, resourceTenantId = null, requiredScope = 'tenant') => {
  if (!scopeRules || !userTenantId) return false;

  const tenantScope = scopeRules.tenant_scope || 'tenant';

  // Global scope: can access all tenants
  if (tenantScope === 'global') {
    return true;
  }

  // Tenant scope: must match tenant_id
  if (tenantScope === 'tenant') {
    if (!resourceTenantId) return true; // No resource tenant means tenant-scoped access
    return userTenantId.toString() === resourceTenantId.toString();
  }

  // Self scope: only own tenant
  if (tenantScope === 'self') {
    if (!resourceTenantId) return true;
    return userTenantId.toString() === resourceTenantId.toString();
  }

  return false;
};

/**
 * Check if user's department scope allows access
 * @param {Object} scopeRules - User's scope_rules from role
 * @param {string} userDepartmentId - User's department_id
 * @param {string} resourceDepartmentId - Resource's department_id (optional)
 * @param {string} requiredScope - Required department scope: 'all', 'hierarchy', 'own', 'none'
 * @returns {boolean}
 */
const checkDepartmentScope = (scopeRules, userDepartmentId, resourceDepartmentId = null, requiredScope = 'own') => {
  if (!scopeRules) return false;

  const deptScope = scopeRules.department_scope || 'own';

  // All scope: can access all departments
  if (deptScope === 'all') {
    return true;
  }

  // Hierarchy scope: can access own department and sub-departments
  if (deptScope === 'hierarchy') {
    if (!resourceDepartmentId) return true;
    if (!userDepartmentId) return false;
    // For now, exact match. TODO: implement hierarchy check with Department model
    return userDepartmentId.toString() === resourceDepartmentId.toString();
  }

  // Own scope: only own department
  if (deptScope === 'own') {
    if (!resourceDepartmentId) return true;
    if (!userDepartmentId) return false;
    return userDepartmentId.toString() === resourceDepartmentId.toString();
  }

  // None scope: no department access
  if (deptScope === 'none') {
    return false;
  }

  return false;
};

/**
 * Check if user's role level meets minimum requirement
 * @param {Object} userRole - User's role object with role_level
 * @param {number|number[]} requiredLevel - Minimum role_level or array of allowed levels
 * @returns {boolean}
 */
const checkRoleLevel = (userRole, requiredLevel) => {
  if (!userRole || typeof userRole.role_level !== 'number') {
    return false;
  }

  if (Array.isArray(requiredLevel)) {
    return requiredLevel.includes(userRole.role_level);
  }

  return userRole.role_level >= requiredLevel;
};

const ADMIN_ROLE_CODES = new Set([
  'admin',
  ROLE_CODES.SYSTEM_ADMIN,
  ROLE_CODES.COMPANY_ADMIN
]);

const EMPLOYEE_ROLE_CODES = new Set([
  'employee',
  ROLE_CODES.EMPLOYEE
]);

class PermissionUtils {
  /**
   * Check if user has permission with scope validation
   * @param {Object} userRole - User's role object
   * @param {string} permission - Permission string
   * @param {Object} options - Additional options
   * @param {string} options.resourceTenantId - Resource tenant_id for scope check
   * @param {string} options.resourceDepartmentId - Resource department_id for scope check
   * @param {string} options.userTenantId - User's tenant_id
   * @param {string} options.userDepartmentId - User's department_id
   * @returns {boolean}
   */
  static hasPermission(userRole, permission, options = {}) {
    // If userRole is an object with permissions property, use it
    if (userRole && typeof userRole === 'object' && userRole.permissions) {
      const permissions = userRole.permissions;
      
      // Check boolean format (e.g., 'user:read': true)
      if (permissions[permission] === true) {
        return true;
      }
      
      // Check array format (e.g., user_management: ['create_user', 'read_user'])
      // Map permission to array format
      const permissionMapping = {
        'user:create': 'create_user',
        'user:read': 'read_user', 
        'user:update': 'update_user',
        'user:delete': 'delete_user',
        'user:list': 'read_user', // list is same as read for array format
        'role:create': 'create_role',
        'role:read': 'read_role',
        'role:update': 'update_role', 
        'role:delete': 'delete_role',
        'role:list': 'read_role', // list is same as read for array format
        'department:create': 'create_department',
        'department:read': 'read_department',
        'department:update': 'update_department',
        'department:delete': 'delete_department',
        'department:list': 'read_department',
        'safety_report:create': 'create_safety',
        'safety_report:read': 'read_safety',
        'safety_report:update': 'update_safety',
        'safety_report:delete': 'delete_safety',
        'safety_report:list': 'read_safety',
        'safety_report:approve': 'update_safety', // approve is same as update
        'training:create': 'create_training',
        'training:read': 'read_training',
        'training:update': 'update_training',
        'training:delete': 'delete_training',
        'training:list': 'read_training',
        'training:enroll': 'enroll_training',
        'project:create': 'create_project',
        'project:read': 'read_project',
        'project:update': 'update_project',
        'project:delete': 'delete_project',
        'project:list': 'read_project',
        'ppe:create': 'create_ppe',
        'ppe:read': 'read_ppe',
        'ppe:update': 'update_ppe',
        'ppe:delete': 'delete_ppe',
        'ppe:issue': 'issue_ppe',
        'incident:create': 'create_incident',
        'incident:read': 'read_incident',
        'incident:update': 'update_incident',
        'incident:delete': 'delete_incident',
        'incident:close': 'close_incident',
        'incident:escalate': 'escalate_incident',
        'analytics:view_global': 'view_global_metrics',
        'analytics:view_tenant': 'view_tenant_metrics',
        'analytics:view_department': 'view_department_metrics'
      };
      
      const arrayPermission = permissionMapping[permission];
      if (arrayPermission) {
        // Check in relevant management arrays
        const managementKeys = [
          'user_management',
          'role_management',
          'department_management',
          'project_management',
          'training_management',
          'safety_management',
          'ppe_management',
          'incident_management',
          'analytics'
        ];
        for (const key of managementKeys) {
          if (permissions[key] && Array.isArray(permissions[key]) && permissions[key].includes(arrayPermission)) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    // Fallback to role-based permissions for backward compatibility
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasBasicPermission = rolePermissions.includes(permission);
    
    // If no scope options provided, return basic permission check
    if (!options.resourceTenantId && !options.resourceDepartmentId) {
      return hasBasicPermission;
    }
    
    // Apply scope checks if provided
    if (hasBasicPermission && userRole.scope_rules) {
      const scopeRules = userRole.scope_rules;
      
      // Check tenant scope
      if (options.resourceTenantId && options.userTenantId) {
        const tenantAllowed = checkTenantScope(
          scopeRules,
          options.userTenantId,
          options.resourceTenantId
        );
        if (!tenantAllowed) return false;
      }
      
      // Check department scope
      if (options.resourceDepartmentId && options.userDepartmentId) {
        const deptAllowed = checkDepartmentScope(
          scopeRules,
          options.userDepartmentId,
          options.resourceDepartmentId
        );
        if (!deptAllowed) return false;
      }
    }
    
    return hasBasicPermission;
  }

  static hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  static hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  static getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  static isAdmin(userRole) {
    const normalized = normalizeRoleValue(userRole);
    return normalized ? ADMIN_ROLE_CODES.has(normalized) : false;
  }

  static isEmployee(userRole) {
    const normalized = normalizeRoleValue(userRole);
    return normalized ? EMPLOYEE_ROLE_CODES.has(normalized) : false;
  }

  /**
   * Check if user has access based on scope rules
   * @param {Object} userRole - User's role object with scope_rules
   * @param {Object} userContext - User context { tenant_id, department_id }
   * @param {Object} resourceContext - Resource context { tenant_id, department_id }
   * @param {Object} requiredScope - Required scope { tenantScope, departmentScope }
   * @returns {boolean}
   */
  static checkScope(userRole, userContext, resourceContext = {}, requiredScope = {}) {
    if (!userRole || !userRole.scope_rules) {
      return false;
    }

    const scopeRules = userRole.scope_rules;
    const { tenant_id: userTenantId, department_id: userDepartmentId } = userContext;
    const { tenant_id: resourceTenantId, department_id: resourceDepartmentId } = resourceContext;
    const { tenantScope = 'tenant', departmentScope = 'own' } = requiredScope;

    // Check tenant scope
    const tenantAllowed = checkTenantScope(
      scopeRules,
      userTenantId,
      resourceTenantId,
      tenantScope
    );
    if (!tenantAllowed) return false;

    // Check department scope
    const deptAllowed = checkDepartmentScope(
      scopeRules,
      userDepartmentId,
      resourceDepartmentId,
      departmentScope
    );
    if (!deptAllowed) return false;

    return true;
  }

  /**
   * Check if user's role level meets requirement
   * @param {Object} userRole - User's role object
   * @param {number|number[]} requiredLevel - Minimum level or array of allowed levels
   * @returns {boolean}
   */
  static checkRoleLevel(userRole, requiredLevel) {
    return checkRoleLevel(userRole, requiredLevel);
  }

  /**
   * Check if user has permission to perform action on module using permission matrix
   * @param {Object} userRole - User's role object with role_code and role_level
   * @param {string} module - Module name (e.g., 'user', 'project', 'training')
   * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
   * @returns {boolean}
   */
  static hasMatrixPermission(userRole, module, action) {
    if (!userRole || !module || !action) return false;
    
    const moduleMatrix = PERMISSION_MATRIX[module];
    if (!moduleMatrix) return false;
    
    const allowedRoles = moduleMatrix[action];
    if (!allowedRoles || allowedRoles.length === 0) return false;
    
    const userRoleCode = userRole.role_code?.toLowerCase();
    const userRoleLevel = userRole.role_level;
    
    // Check if user's role_code or role_level is in allowed list
    return allowedRoles.some(allowed => {
      // Check by role_code (string)
      if (typeof allowed === 'string' && userRoleCode === allowed.toLowerCase()) {
        return true;
      }
      // Check by role_level (number) - user level >= required level
      if (typeof allowed === 'number' && typeof userRoleLevel === 'number') {
        return userRoleLevel >= allowed;
      }
      return false;
    });
  }

  /**
   * Check if user has permission for any of the specified module:action pairs
   * @param {Object} userRole - User's role object
   * @param {Array} moduleActions - Array of { module, action } objects
   * @returns {boolean}
   */
  static hasAnyMatrixPermission(userRole, moduleActions) {
    if (!Array.isArray(moduleActions)) return false;
    return moduleActions.some(({ module, action }) => 
      this.hasMatrixPermission(userRole, module, action)
    );
  }
}

// Export helper functions for use in middleware
module.exports.checkTenantScope = checkTenantScope;
module.exports.checkDepartmentScope = checkDepartmentScope;
module.exports.checkRoleLevel = checkRoleLevel;
module.exports.getHighestRole = getHighestRole;
module.exports.PERMISSION_MATRIX = PERMISSION_MATRIX;

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_MATRIX,
  PermissionUtils,
  getHighestRole
};