const ROLES = {
  ADMIN: 'admin',
  LEADER: 'leader', 
  EMPLOYEE: 'employee'
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
  SAFETY_REPORT_APPROVE: 'safety_report:approve'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
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
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_DELETE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE
  ],
  
  [ROLES.LEADER]: [
    // User management for their department
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.USER_UPDATE, // Limited to their department
    
    // Department read access
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_LIST,
    
    // Safety reports - can approve and manage
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE
  ],
  
  [ROLES.EMPLOYEE]: [
    // Basic user access
    PERMISSIONS.USER_READ, // Only their own profile
    
    // Safety reports - can create and view their own
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ, // Only their own
    PERMISSIONS.SAFETY_REPORT_LIST // Only their own
  ]
};

class PermissionUtils {
  static hasPermission(userRole, permission) {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
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
    return userRole === ROLES.ADMIN;
  }

  static isLeader(userRole) {
    return userRole === ROLES.LEADER;
  }

  static isEmployee(userRole) {
    return userRole === ROLES.EMPLOYEE;
  }
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PermissionUtils
};