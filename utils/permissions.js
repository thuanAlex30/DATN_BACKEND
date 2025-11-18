const ROLES = {
  ADMIN: 'admin',
  LEADER: 'leader', 
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  TRAINER: 'trainer',
  SAFETY_OFFICER: 'safety_officer',
  HEADER_DEPARTMENT: 'header_department' // Trưởng bộ phận (Header Department)
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
  TRAINING_ENROLLMENT_CREATE: 'training_enrollment:create'
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
    PERMISSIONS.SAFETY_REPORT_APPROVE,
    // Training management - full access
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_DELETE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE
  ],
  
  [ROLES.LEADER]: [
    // User management for their department
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.USER_UPDATE, // Limited to their department
    
    // Role read access for user management
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_LIST, // Needed for user management dropdowns
    
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
  
  [ROLES.MANAGER]: [
    // User management for their department
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.USER_UPDATE, // Limited to their department
    
    // Role read access for user management
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_LIST,
    
    // Department read access
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_LIST,
    
    // Safety reports - can approve and manage
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE,
    
    // Training management - can manage training for their department
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE
  ],
  
  [ROLES.TRAINER]: [
    // Basic user access
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    
    // Safety reports - can create and manage training-related reports
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST
  ],
  
  [ROLES.SAFETY_OFFICER]: [
    // User read access for safety management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    
    // Safety reports - full access
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_DELETE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE
  ],
  
  [ROLES.EMPLOYEE]: [
    // Basic user access
    PERMISSIONS.USER_READ, // Only their own profile
    
    // Safety reports - can create and view their own
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ, // Only their own
    PERMISSIONS.SAFETY_REPORT_LIST, // Only their own
    
    // Training - can view and enroll in training
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ, // Only their own enrollments
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE // Only for themselves
  ],

  // Header Department (trưởng bộ phận) - quản lý an toàn & đào tạo trong phạm vi bộ phận
  [ROLES.HEADER_DEPARTMENT]: [
    // User read access trong bộ phận
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,

    // Department read access
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_LIST,

    // Safety reports - xem và phê duyệt trong bộ phận
    PERMISSIONS.SAFETY_REPORT_CREATE,
    PERMISSIONS.SAFETY_REPORT_READ,
    PERMISSIONS.SAFETY_REPORT_UPDATE,
    PERMISSIONS.SAFETY_REPORT_LIST,
    PERMISSIONS.SAFETY_REPORT_APPROVE,

    // Training management - quản lý training cho nhân viên trong bộ phận
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_READ,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_DELETE,
    PERMISSIONS.TRAINING_LIST,
    PERMISSIONS.TRAINING_ENROLL,
    PERMISSIONS.TRAINING_ENROLLMENT_READ,
    PERMISSIONS.TRAINING_ENROLLMENT_CREATE
  ]
};

class PermissionUtils {
  static hasPermission(userRole, permission) {
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
        'safety_report:approve': 'update_safety' // approve is same as update
      };
      
      const arrayPermission = permissionMapping[permission];
      if (arrayPermission) {
        // Check in relevant management arrays
        const managementKeys = ['user_management', 'role_management', 'department_management', 'safety_management'];
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
    if (userRole && typeof userRole === 'object') {
      return userRole.role_name === ROLES.ADMIN;
    }
    return userRole === ROLES.ADMIN;
  }

  static isLeader(userRole) {
    if (userRole && typeof userRole === 'object') {
      return userRole.role_name === ROLES.LEADER;
    }
    return userRole === ROLES.LEADER;
  }

  static isEmployee(userRole) {
    if (userRole && typeof userRole === 'object') {
      return userRole.role_name === ROLES.EMPLOYEE;
    }
    return userRole === ROLES.EMPLOYEE;
  }
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PermissionUtils
};