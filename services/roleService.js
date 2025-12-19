const RoleRepository = require('../repository/RoleRepository');
const UserRepository = require('../repository/UserRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class RoleService {
  // Create new role
  static async createRole(roleData) {
    try {
      // Check if role name already exists
      const existingRole = await RoleRepository.nameExists(roleData.role_name);
      if (existingRole) {
        return createResponse(400, 'Role name already exists');
      }

      const role = await RoleRepository.create(roleData);

      return createResponse(201, 'Tạo vai trò thành công', {
        id: role._id,
        role_name: role.role_name,
        description: role.description,
        permissions: role.permissions,
        is_active: role.is_active,
        created_at: role.created_at
      });
    } catch (error) {
      console.error('Error creating role:', error);
      return createResponse(500, 'Lỗi khi tạo vai trò', null, error.message);
    }
  }

  // Get role by ID
  static async getRoleById(id) {
    try {
      const role = await RoleRepository.findById(id);
      
      if (!role) {
        return createResponse(404, 'Role not found');
      }

      return createResponse(200, 'Lấy thông tin vai trò thành công', {
        id: role._id,
        role_name: role.role_name,
        description: role.description,
        permissions: role.permissions,
        is_active: role.is_active,
        created_at: role.created_at,
        updated_at: role.updated_at
      });
    } catch (error) {
      console.error('Error getting role:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin vai trò', null, error.message);
    }
  }

  // Update role
  static async updateRole(id, updateData) {
    try {
      // Check if role name exists (excluding current role)
      if (updateData.role_name) {
        const nameExists = await RoleRepository.nameExists(updateData.role_name, id);
        if (nameExists) {
          return createResponse(400, 'Role name already exists');
        }
      }

      const updatedRole = await RoleRepository.updateById(id, updateData);
      
      if (!updatedRole) {
        return createResponse(404, 'Role not found');
      }

      return createResponse(200, 'Cập nhật vai trò thành công', {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        is_active: updatedRole.is_active,
        updated_at: updatedRole.updated_at
      });
    } catch (error) {
      console.error('Error updating role:', error);
      return createResponse(500, 'Lỗi khi cập nhật vai trò', null, error.message);
    }
  }

  // Delete role (soft delete)
  static async deleteRole(id) {
    try {
      // Check if role is being used by any users
      const userCount = await UserRepository.countByRole(id);
      if (userCount > 0) {
        return createResponse(400, `Cannot delete role. It is currently assigned to ${userCount} user(s)`);
      }

      const deletedRole = await RoleRepository.deleteById(id);
      
      if (!deletedRole) {
        return createResponse(404, 'Role not found');
      }

      return createResponse(200, 'Role deactivated successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      return createResponse(500, 'Lỗi khi xóa vai trò', null, error.message);
    }
  }

  // Get roles with pagination and filters
  static async getRoles(options = {}) {
    try {
      const result = await RoleRepository.findWithPagination(options);
      
      // Get user counts for each role
      const rolesWithUserCount = await Promise.all(
        result.roles.map(async (role) => {
          const userCount = await UserRepository.countByRole(role._id, {
            tenant_id: options.tenant_id || undefined
          });
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
      
      return createResponse(200, 'Lấy danh sách vai trò thành công', {
        roles: rolesWithUserCount,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách vai trò', null, error.message);
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
      
      return createResponse(200, 'Lấy danh sách vai trò đang hoạt động thành công', rolesWithUserCount);
    } catch (error) {
      console.error('Error getting active roles:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách vai trò đang hoạt động', null, error.message);
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
      
      return createResponse(200, 'Lấy danh sách tất cả vai trò thành công', rolesWithUserCount);
    } catch (error) {
      console.error('Error getting all roles:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách tất cả vai trò', null, error.message);
    }
  }

  // Toggle role status
  static async toggleRoleStatus(id) {
    try {
      const role = await RoleRepository.findById(id);
      
      if (!role) {
        return createResponse(404, 'Role not found');
      }

      // Check if role is being used (for warning purposes)
      const userCount = await UserRepository.countByRole(id);
      
      const updatedRole = await RoleRepository.updateById(id, { is_active: !role.is_active });

      let message = `Role ${updatedRole.is_active ? 'activated' : 'deactivated'} successfully`;
      
      // Add warning if deactivating a role that's in use
      if (!updatedRole.is_active && userCount > 0) {
        message += `. Warning: This role is currently assigned to ${userCount} user(s)`;
      }

      return createResponse(200, message, {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        is_active: updatedRole.is_active,
        user_count: userCount
      });
    } catch (error) {
      console.error('Error toggling role status:', error);
      return createResponse(500, 'Lỗi khi thay đổi trạng thái vai trò', null, error.message);
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

      return createResponse(200, 'Lấy thống kê vai trò thành công', {
        total: totalRoles.length,
        active: activeRoles.length,
        inactive: inactiveRoles.length
      });
    } catch (error) {
      console.error('Error getting role stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê vai trò', null, error.message);
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

      return createResponse(200, 'Lấy số lượng người dùng theo vai trò thành công', roleUserCounts);
    } catch (error) {
      console.error('Error getting role user counts:', error);
      return createResponse(500, 'Lỗi khi lấy số lượng người dùng theo vai trò', null, error.message);
    }
  }

  // Update role permissions
  static async updateRolePermissions(id, permissions) {
    try {
      const updatedRole = await RoleRepository.updateById(id, { permissions });
      
      if (!updatedRole) {
        return createResponse(404, 'Role not found');
      }

      return createResponse(200, 'Cập nhật quyền vai trò thành công', {
        id: updatedRole._id,
        role_name: updatedRole.role_name,
        permissions: updatedRole.permissions,
        updated_at: updatedRole.updated_at
      });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return createResponse(500, 'Lỗi khi cập nhật quyền vai trò', null, error.message);
    }
  }
}

module.exports = RoleService;