<<<<<<< HEAD
const RoleService = require('../services/roleService ');
const ApiResponse = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class RoleController {
  // Create new role
  static createRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.createRole(req.body);
=======
const RoleService = require('../services/roleService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const RoleEvents = require('../events/roleEvents');

class RoleController {
  static _ensureCanModifyRole(req, res, role) {
    const isSystemRole = role?.role_code === 'system_admin' ||
      role?.role_name?.toLowerCase?.() === 'system admin' ||
      role?.role_level === 100;

    const userRole = req.user?.role;
    const isSystemAdminUser = userRole?.role_code === 'system_admin' ||
      userRole?.role_name?.toLowerCase?.() === 'system admin' ||
      userRole?.role_level === 100;

    if (isSystemRole && !isSystemAdminUser) {
      return ApiResponse.forbidden(res, 'Only System Admin can modify System Admin role');
    }

    return null;
  }

  // Create new role
  static createRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.createRole(req.body);
    
    // Emit role created event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await RoleEvents.emitRoleCreated(result, metadata);
    } catch (error) {
      console.error('❌ Error emitting role created event:', error);
      // Don't fail the request if event emission fails
    }
    
>>>>>>> origin/main
    return ApiResponse.success(res, result, 'Role created successfully', 201);
  });

  // Get role by ID
  static getRoleById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await RoleService.getRoleById(id);
    return ApiResponse.success(res, result, 'Role retrieved successfully');
  });

  // Update role
  static updateRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
<<<<<<< HEAD
    const result = await RoleService.updateRole(id, req.body);
=======
    
    // Get old role data for comparison
    const oldRole = await RoleService.getRoleById(id);
    const guard = RoleController._ensureCanModifyRole(req, res, oldRole);
    if (guard) return guard;

    const result = await RoleService.updateRole(id, req.body);
    
    // Emit role updated event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await RoleEvents.emitRoleUpdated(result, oldRole, metadata);
    } catch (error) {
      console.error('❌ Error emitting role updated event:', error);
      // Don't fail the request if event emission fails
    }
    
>>>>>>> origin/main
    return ApiResponse.success(res, result, 'Role updated successfully');
  });

  // Delete role
  static deleteRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
<<<<<<< HEAD
    const result = await RoleService.deleteRole(id);
=======
    
    // Get role data before deletion
    const roleData = await RoleService.getRoleById(id);
    const guard = RoleController._ensureCanModifyRole(req, res, roleData);
    if (guard) return guard;

    const result = await RoleService.deleteRole(id);
    
    // Emit role deleted event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await RoleEvents.emitRoleDeleted(roleData, metadata);
    } catch (error) {
      console.error('❌ Error emitting role deleted event:', error);
      // Don't fail the request if event emission fails
    }
    
>>>>>>> origin/main
    return ApiResponse.success(res, result, 'Role deleted successfully');
  });

  // Get roles with pagination and filters
  static getRoles = ErrorMiddleware.asyncHandler(async (req, res) => {
<<<<<<< HEAD
    const result = await RoleService.getRoles(req.query);
=======
    // Multi-tenant: System Admin có thể xem tất cả role, Company Admin chỉ xem trong tenant của mình
    const userRole = req.user?.role || {};
    const isSystemAdminUser =
      userRole.role_code === 'system_admin' ||
      userRole.role_name?.toLowerCase?.() === 'system admin' ||
      userRole.role_level === 100;

    const options = { ...req.query };

    if (!isSystemAdminUser) {
      const tenant = req.user?.tenant_id;
      const tenantId = tenant && typeof tenant === 'object' ? (tenant._id || tenant.id || tenant) : tenant;
      if (tenantId) {
        options.tenant_id = tenantId.toString();
      }
    }

    const result = await RoleService.getRoles(options);
>>>>>>> origin/main
    return ApiResponse.success(res, result, 'Roles retrieved successfully');
  });

  // Get all active roles
  static getAllActiveRoles = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.getAllActiveRoles();
    return ApiResponse.success(res, result, 'Active roles retrieved successfully');
  });

  // Get all roles
  static getAllRoles = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.getAllRoles();
    return ApiResponse.success(res, result, 'All roles retrieved successfully');
  });

  // Toggle role status
  static toggleRoleStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
<<<<<<< HEAD
    const result = await RoleService.toggleRoleStatus(id);
=======
    
    // Get old role data for comparison
    const oldRole = await RoleService.getRoleById(id);
    const guard = RoleController._ensureCanModifyRole(req, res, oldRole);
    if (guard) return guard;
    const result = await RoleService.toggleRoleStatus(id);
    
    // Emit role status toggled event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await RoleEvents.emitRoleStatusToggled(result, oldRole.status, metadata);
    } catch (error) {
      console.error('❌ Error emitting role status toggled event:', error);
      // Don't fail the request if event emission fails
    }
    
>>>>>>> origin/main
    return ApiResponse.success(res, result, result.message);
  });

  // Get role statistics
  static getRoleStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.getRoleStats();
    return ApiResponse.success(res, result, 'Role statistics retrieved successfully');
  });

  // Get user count for each role
  static getRoleUserCounts = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.getRoleUserCounts();
    return ApiResponse.success(res, result, 'Role user counts retrieved successfully');
  });

  // Update role permissions
  static updateRolePermissions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
<<<<<<< HEAD
    const result = await RoleService.updateRolePermissions(id, permissions);
=======
    
    // Get old role data for comparison
    const oldRole = await RoleService.getRoleById(id);
    const guard = RoleController._ensureCanModifyRole(req, res, oldRole);
    if (guard) return guard;
    const result = await RoleService.updateRolePermissions(id, permissions);
    
    // Emit role permissions updated event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await RoleEvents.emitRolePermissionsUpdated(result, oldRole.permissions || [], metadata);
    } catch (error) {
      console.error('❌ Error emitting role permissions updated event:', error);
      // Don't fail the request if event emission fails
    }
    
>>>>>>> origin/main
    return ApiResponse.success(res, result, 'Role permissions updated successfully');
  });
}

module.exports = RoleController;