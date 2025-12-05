const ROLE_CODES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY_ADMIN: 'company_admin',
  DEPARTMENT_HEADER: 'department_header',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  TRAINER: 'trainer',
  SAFETY_OFFICER: 'safety_officer',
  WAREHOUSE_STAFF: 'warehouse_staff',
  MAINTENANCE_STAFF: 'maintenance_staff'
};

const buildPermissions = ({
  user = [],
  role = [],
  department = [],
  project = [],
  training = [],
  safety = [],
  ppe = [],
  incident = [],
  analytics = []
} = {}) => ({
  user_management: user,
  role_management: role,
  department_management: department,
  project_management: project,
  training_management: training,
  safety_management: safety,
  ppe_management: ppe,
  incident_management: incident,
  analytics
});

const ROLE_DEFINITIONS = [
  {
    role_code: ROLE_CODES.SYSTEM_ADMIN,
    role_name: 'System Admin',
    role_level: 100,
    description: 'Quản trị cấp cao toàn hệ thống',
    scope_rules: {
      tenant_scope: 'global',
      department_scope: 'all',
      data_scope: 'full',
      can_assign_lower_roles: true
    },
    permissions: buildPermissions({
      user: ['create_user', 'read_user', 'update_user', 'delete_user'],
      role: ['create_role', 'read_role', 'update_role', 'delete_role'],
      department: ['create_department', 'read_department', 'update_department', 'delete_department'],
      project: ['create_project', 'read_project', 'update_project', 'delete_project'],
      training: ['create_training', 'read_training', 'update_training', 'delete_training', 'enroll_training'],
      safety: ['create_safety', 'read_safety', 'update_safety', 'delete_safety', 'approve_safety'],
      ppe: ['create_ppe', 'read_ppe', 'update_ppe', 'delete_ppe', 'issue_ppe'],
      incident: ['create_incident', 'read_incident', 'update_incident', 'close_incident', 'escalate_incident'],
      analytics: ['view_global_metrics', 'export_global_reports']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.COMPANY_ADMIN,
    role_name: 'Company Admin',
    role_level: 90,
    description: 'Quản trị viên tenant/công ty',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'all',
      data_scope: 'full',
      can_assign_lower_roles: true
    },
    permissions: buildPermissions({
      user: ['create_user', 'read_user', 'update_user', 'delete_user'],
      role: ['read_role', 'assign_role', 'update_role'],
      department: ['create_department', 'read_department', 'update_department', 'delete_department'],
      project: ['create_project', 'read_project', 'update_project', 'delete_project'],
      training: ['create_training', 'read_training', 'update_training', 'delete_training', 'enroll_training'],
      safety: ['create_safety', 'read_safety', 'update_safety', 'approve_safety'],
      ppe: ['create_ppe', 'read_ppe', 'update_ppe', 'issue_ppe'],
      incident: ['create_incident', 'read_incident', 'update_incident', 'close_incident'],
      analytics: ['view_tenant_metrics', 'export_tenant_reports']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.DEPARTMENT_HEADER,
    role_name: 'Department Header',
    role_level: 80,
    description: 'Trưởng bộ phận',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'hierarchy',
      data_scope: 'full',
      can_assign_lower_roles: true
    },
    permissions: buildPermissions({
      user: ['read_user', 'update_user'],
      department: ['read_department', 'update_department'],
      project: ['create_project', 'read_project', 'update_project'],
      training: ['create_training', 'read_training', 'update_training', 'enroll_training'],
      safety: ['create_safety', 'read_safety', 'update_safety', 'approve_safety'],
      ppe: ['read_ppe', 'update_ppe', 'issue_ppe'],
      incident: ['create_incident', 'read_incident', 'update_incident', 'escalate_incident'],
      analytics: ['view_department_metrics']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.MANAGER,
    role_name: 'Department Manager',
    role_level: 70,
    description: 'Quản lý bộ phận/đội',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'hierarchy',
      data_scope: 'department',
      can_assign_lower_roles: true
    },
    permissions: buildPermissions({
      user: ['read_user', 'update_user'],
      department: ['read_department'],
      project: ['create_project', 'read_project', 'update_project'],
      training: ['read_training', 'update_training', 'enroll_training'],
      safety: ['create_safety', 'read_safety', 'update_safety'],
      ppe: ['read_ppe', 'issue_ppe'],
      incident: ['create_incident', 'read_incident', 'update_incident'],
      analytics: ['view_department_metrics']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.EMPLOYEE,
    role_name: 'Employee',
    role_level: 10,
    description: 'Nhân viên',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'own',
      data_scope: 'self',
      can_assign_lower_roles: false
    },
    permissions: buildPermissions({
      user: ['read_user'],
      project: ['read_project'],
      training: ['read_training', 'enroll_training'],
      safety: ['create_safety', 'read_safety'],
      ppe: ['read_ppe'],
      incident: ['create_incident', 'read_incident']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.TRAINER,
    role_name: 'Trainer',
    role_level: 55,
    description: 'Huấn luyện viên nội bộ',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'own',
      data_scope: 'department',
      can_assign_lower_roles: false
    },
    permissions: buildPermissions({
      training: ['create_training', 'read_training', 'update_training', 'enroll_training'],
      safety: ['read_safety'],
      user: ['read_user']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.SAFETY_OFFICER,
    role_name: 'Safety Officer',
    role_level: 55,
    description: 'Cán bộ an toàn',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'own',
      data_scope: 'department',
      can_assign_lower_roles: false
    },
    permissions: buildPermissions({
      safety: ['create_safety', 'read_safety', 'update_safety', 'approve_safety'],
      incident: ['create_incident', 'read_incident', 'update_incident', 'escalate_incident'],
      ppe: ['read_ppe', 'update_ppe'],
      analytics: ['view_safety_metrics']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.WAREHOUSE_STAFF,
    role_name: 'Warehouse Staff',
    role_level: 50,
    description: 'Nhân viên kho PPE',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'own',
      data_scope: 'department',
      can_assign_lower_roles: false
    },
    permissions: buildPermissions({
      ppe: ['create_ppe', 'read_ppe', 'update_ppe', 'issue_ppe'],
      incident: ['read_incident'],
      safety: ['read_safety']
    }),
    is_default: true
  },
  {
    role_code: ROLE_CODES.MAINTENANCE_STAFF,
    role_name: 'Maintenance Staff',
    role_level: 50,
    description: 'Nhân viên bảo trì',
    scope_rules: {
      tenant_scope: 'tenant',
      department_scope: 'own',
      data_scope: 'department',
      can_assign_lower_roles: false
    },
    permissions: buildPermissions({
      ppe: ['read_ppe', 'update_ppe'],
      incident: ['read_incident', 'update_incident'],
      project: ['read_project', 'update_project']
    }),
    is_default: true
  }
];

module.exports = {
  ROLE_CODES,
  ROLE_DEFINITIONS
};

