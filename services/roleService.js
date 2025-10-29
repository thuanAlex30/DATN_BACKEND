const RoleRepository = require('../repository/RoleRepository');
const UserRepository = require('../repository/UserRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class RoleService {
  // Create new role
  static async createRole(roleData) {
    try {
      // Check if role name already exists
      const existingRole = await RoleRepository.findByName(roleData.role_name);
      if (existingRole) {
        return createResponse(false, null, 'Role name already exists');
      }

      const role = await RoleRepository.create(roleData);
      return createResponse(true, transformDocumentId(role), 'Role created successfully');
    } catch (error) {
      console.error('Error creating role:', error);
      return createResponse(false, null, 'Failed to create role');
    }
  }

  // Get role by ID
  static async getRoleById(id) {
    try {
      const role = await RoleRepository.findById(id);
      if (!role) {
        return createResponse(false, null, 'Role not found');
      }
      return createResponse(true, transformDocumentId(role), 'Role retrieved successfully');
    } catch (error) {
      console.error('Error getting role by ID:', error);
      return createResponse(false, null, 'Failed to retrieve role');
    }
  }

  // Update role
  static async updateRole(id, updateData) {
    try {
      // Check if role name already exists (excluding current role)
      if (updateData.role_name) {
        const existingRole = await RoleRepository.findByName(updateData.role_name);
        if (existingRole && existingRole._id.toString() !== id) {
          return createResponse(false, null, 'Role name already exists');
        }
      }

      const role = await RoleRepository.updateById(id, updateData);
      if (!role) {
        return createResponse(false, null, 'Role not found');
      }
      return createResponse(true, transformDocumentId(role), 'Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      return createResponse(false, null, 'Failed to update role');
    }
  }

  // Delete role
  static async deleteRole(id) {
    try {
      // Check if role is being used by any users
      const usersWithRole = await UserRepository.findByRole(id);
      if (usersWithRole.length > 0) {
        return createResponse(false, null, 'Cannot delete role that is assigned to users');
      }

      const result = await RoleRepository.deleteById(id);
      if (!result) {
        return createResponse(false, null, 'Role not found');
      }
      return createResponse(true, null, 'Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      return createResponse(false, null, 'Failed to delete role');
    }
  }

  // Get roles with pagination and filters
  static async getRoles(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        is_active = null,
        sort_by = 'role_name',
        sort_order = 'asc'
      } = options;

      const filter = {};
      
      // Add search filter
      if (search) {
        filter.$or = [
          { role_name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Add active filter
      if (is_active !== null) {
        filter.is_active = is_active;
      }

      const roles = await RoleRepository.findWithPagination(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort_by]: sort_order === 'asc' ? 1 : -1 }
      });

      return createResponse(true, {
        roles: transformDocumentsId(roles.data),
        pagination: roles.pagination
      }, 'Roles retrieved successfully');
    } catch (error) {
      console.error('Error getting roles:', error);
      return createResponse(false, null, 'Failed to retrieve roles');
    }
  }

  // Get all active roles
  static async getAllActiveRoles() {
    try {
      const roles = await RoleRepository.findActive();
      return createResponse(true, transformDocumentsId(roles), 'Active roles retrieved successfully');
    } catch (error) {
      console.error('Error getting active roles:', error);
      return createResponse(false, null, 'Failed to retrieve active roles');
    }
  }

  // Get all roles (including inactive)
  static async getAllRoles() {
    try {
      const roles = await RoleRepository.findAll();
      return createResponse(true, transformDocumentsId(roles), 'All roles retrieved successfully');
    } catch (error) {
      console.error('Error getting all roles:', error);
      return createResponse(false, null, 'Failed to retrieve all roles');
    }
  }

  // Get role statistics
  static async getRoleStats() {
    try {
      const totalRoles = await RoleRepository.count();
      const activeRoles = await RoleRepository.countActive();
      const inactiveRoles = totalRoles - activeRoles;

      return createResponse(true, {
        total: totalRoles,
        active: activeRoles,
        inactive: inactiveRoles
      }, 'Role statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting role statistics:', error);
      return createResponse(false, null, 'Failed to retrieve role statistics');
    }
  }

  // Update role permissions
  static async updateRolePermissions(id, permissions) {
    try {
      const role = await RoleRepository.updateById(id, { permissions });
      if (!role) {
        return createResponse(false, null, 'Role not found');
      }
      return createResponse(true, transformDocumentId(role), 'Role permissions updated successfully');
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return createResponse(false, null, 'Failed to update role permissions');
    }
  }
}

module.exports = RoleService;
