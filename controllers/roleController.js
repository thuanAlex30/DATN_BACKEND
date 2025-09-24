const RoleService = require('../services/roleService ');
const ApiResponse = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class RoleController {
  // Create new role
  static createRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.createRole(req.body);
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
    const result = await RoleService.updateRole(id, req.body);
    return ApiResponse.success(res, result, 'Role updated successfully');
  });

  // Delete role
  static deleteRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await RoleService.deleteRole(id);
    return ApiResponse.success(res, result, 'Role deleted successfully');
  });

  // Get roles with pagination and filters
  static getRoles = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await RoleService.getRoles(req.query);
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
    const result = await RoleService.toggleRoleStatus(id);
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
    const result = await RoleService.updateRolePermissions(id, permissions);
    return ApiResponse.success(res, result, 'Role permissions updated successfully');
  });
}

module.exports = RoleController;