const RoleRepository = require('../repository/RoleRepository');
const UserRepository = require('../repository/UserRepository');

class RoleService {
  // Create new role
  static async createRole(roleData) {
    try {
      // Check if role name already exists
      const existingRole = await RoleRepository.nameExists(roleData.role_name);
      if (existingRole) {
        throw new Error('Role name already exists');
      }

      const role = await RoleRepository.create(roleData);

      return {
        id: role._id,
        role_name: role.role_name,
        description: role.description,
        permissions: role.permissions,
        is_active: role.is_active,
        created_at: role.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Get role by ID
  static async getRoleById(id) {
    try {
      const role = await RoleRepository.findById(id);
      
      if (!role) {
        throw new Error('Role not found');
      }

      return {
        id: role._id,
        role_name: role.role_name,
        description: role.description,
        permissions: role.permissions,
        is_active: role.is_active,
        created_at: role.created_at,
        updated_at: role.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Update role
  static async updateRole(id, updateData) {
    try {
      // Check if role name exists (excluding current role)
      if (updateData.role_name) {
        const nameExists = await RoleRepository.nameExists(updateData.role_name, id);
        if (nameExists) {
          throw new Error('Role name already exists');
        }
      }

      const updatedRole = await RoleRepository.updateById(id, updateData);
      
      if (!updatedRole) {
        throw new Error('Role not found');
      }

      return {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        is_active: updatedRole.is_active,
        updated_at: updatedRole.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete role (soft delete)
  static async deleteRole(id) {
    try {
      // Check if role is being used by any users
      const userCount = await UserRepository.countByRole(id);
      if (userCount > 0) {
        throw new Error(`Cannot delete role. It is currently assigned to ${userCount} user(s)`);
      }

      const deletedRole = await RoleRepository.deleteById(id);
      
      if (!deletedRole) {
        throw new Error('Role not found');
      }

      return { message: 'Role deactivated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get roles with pagination and filters
  static async getRoles(options = {}) {
    try {
      const result = await RoleRepository.findWithPagination(options);
      
      // Get user counts for each role
      const rolesWithUserCount = await Promise.all(
        result.roles.map(async (role) => {
          const userCount = await UserRepository.countByRole(role._id);
          return {
            id: role._id,
            role_name: role.role_name,
            description: role.description,
            permissions: role.permissions,
            is_active: role.is_active,
            user_count: userCount,
            created_at: role.created_at,
            updated_at: role.updated_at
          };
        })
      );
      
      return {
        roles: rolesWithUserCount,
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all active roles
  static async getAllActiveRoles() {
    try {
      const roles = await RoleRepository.findAllActive();
      
      // Get user counts for each role
      const rolesWithUserCount = await Promise.all(
        roles.map(async (role) => {
          const userCount = await UserRepository.countByRole(role._id);
          return {
            id: role._id,
            role_name: role.role_name,
            description: role.description,
            permissions: role.permissions,
            is_active: role.is_active,
            user_count: userCount,
            created_at: role.created_at
          };
        })
      );
      
      return rolesWithUserCount;
    } catch (error) {
      throw error;
    }
  }

  // Get all roles (including inactive)
  static async getAllRoles() {
    try {
      const roles = await RoleRepository.findAll();
      
      // Get user counts for each role
      const rolesWithUserCount = await Promise.all(
        roles.map(async (role) => {
          const userCount = await UserRepository.countByRole(role._id);
          return {
            id: role._id,
            role_name: role.role_name,
            description: role.description,
            permissions: role.permissions,
            is_active: role.is_active,
            user_count: userCount,
            created_at: role.created_at,
            updated_at: role.updated_at
          };
        })
      );
      
      return rolesWithUserCount;
    } catch (error) {
      throw error;
    }
  }

  // Toggle role status
  static async toggleRoleStatus(id) {
    try {
      const role = await RoleRepository.findById(id);
      
      if (!role) {
        throw new Error('Role not found');
      }

      // Check if role is being used (for warning purposes)
      const userCount = await UserRepository.countByRole(id);
      
      const updatedRole = await RoleRepository.updateById(id, { is_active: !role.is_active });

      let message = `Role ${updatedRole.is_active ? 'activated' : 'deactivated'} successfully`;
      
      // Add warning if deactivating a role that's in use
      if (!updatedRole.is_active && userCount > 0) {
        message += `. Warning: This role is currently assigned to ${userCount} user(s)`;
      }

      return {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        is_active: updatedRole.is_active,
        user_count: userCount,
        message: message
      };
    } catch (error) {
      throw error;
    }
  }

  // Get role statistics
  static async getRoleStats() {
    try {
      const [totalRoles, activeRoles, inactiveRoles] = await Promise.all([
        RoleRepository.findAll(),
        RoleRepository.findAllActive(),
        RoleRepository.findAll().then(roles => roles.filter(r => !r.is_active))
      ]);

      return {
        total: totalRoles.length,
        active: activeRoles.length,
        inactive: inactiveRoles.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user count for each role
  static async getRoleUserCounts() {
    try {
      const roles = await RoleRepository.findAll();
      const roleUserCounts = await Promise.all(
        roles.map(async (role) => {
          const userCount = await UserRepository.countByRole(role._id);
          return {
            role_id: role._id,
            role_name: role.role_name,
            user_count: userCount
          };
        })
      );

      return roleUserCounts;
    } catch (error) {
      throw error;
    }
  }

  // Update role permissions
  static async updateRolePermissions(id, permissions) {
    try {
      const updatedRole = await RoleRepository.updateById(id, { permissions });
      
      if (!updatedRole) {
        throw new Error('Role not found');
      }

      return {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        permissions: updatedRole.permissions,
        updated_at: updatedRole.updated_at
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RoleService;