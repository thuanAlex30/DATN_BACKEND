const UserService = require('../services/userService');
const UserRepository = require('../repository/UserRepository');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const UserEvents = require('../events/userEvents');

class UserController {
  // Create new user
  static createUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const tenantId = currentUser?.tenant_id || null;

    // Luôn ép tenant_id từ token, không cho phép client chỉ định tenant_id
    const userData = {
      ...req.body,
      tenant_id: tenantId || undefined
    };

    const result = await UserService.createUser(userData);
    
    // Emit user registered event (non-blocking with timeout)
    // Don't wait for event to complete - send response immediately
    process.nextTick(() => {
      (async () => {
        try {
          await Promise.race([
            UserEvents.emitUserRegistered(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 5000)
            )
          ]);
    } catch (eventError) {
          // Log but don't throw - event failure shouldn't affect user creation
          console.warn('⚠️ Failed to emit user registered event (non-critical, user creation succeeded):', eventError.message);
    }
      })().catch(err => {
        // Extra safety: catch any unhandled promise rejections
        console.warn('⚠️ Unhandled error in user registered event (non-critical):', err.message);
      });
    });
    
    return ApiResponse.success(res, result, 'User created successfully', 201);
  });

  // Get user by ID
  static getUserById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser) {
      // Check role from multiple possible locations
      const roleCode = currentUser.role?.role_code || currentUser.role_code;
      const roleLevel = currentUser.role?.role_level || currentUser.role_level;
      const roleName = currentUser.role?.role_name || currentUser.role_name;
      
      const isSystemAdmin =
        roleCode === 'system_admin' ||
        roleLevel === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global' ||
        (roleName && roleName.toLowerCase() === 'system admin');
      
      const isCompanyAdmin =
        roleCode === 'company_admin' ||
        roleLevel === 90 ||
        (roleName && roleName.toLowerCase() === 'company admin');

      // System Admin can read any user, Company Admin can read users in same tenant
      if (!isSystemAdmin && !isCompanyAdmin) {
        // Check if user is reading themselves FIRST - before querying database
        const currentUserId = currentUser.id?.toString() || currentUser._id?.toString();
        const requestId = id.toString();
        const isSelf = currentUserId === requestId || 
                       currentUser._id?.toString() === requestId ||
                       (currentUser._id && currentUser._id.toString() === id);
        
        // If reading self, allow immediately and skip all checks
        if (!isSelf) {
          // For non-self access, check tenant and department
          const targetUser = await UserRepository.findById(id, ['department_id']);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

          // Check tenant isolation
          const currentTenantId = currentUser.tenant_id?._id 
            ? currentUser.tenant_id._id.toString() 
            : (currentUser.tenant_id?.toString ? currentUser.tenant_id.toString() : null);
          
          const targetTenantId = targetUser.tenant_id?.toString 
            ? targetUser.tenant_id.toString() 
            : (targetUser.tenant_id?._id ? targetUser.tenant_id._id.toString() : null);

          if (
            targetTenantId &&
            currentTenantId &&
            targetTenantId !== currentTenantId
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép truy cập người dùng thuộc tenant khác'
          );
          }

          // For Manager (role_level >= 70), allow reading users in same department
          const isManager = roleLevel >= 70;
          
          if (isManager) {
            const currentDeptId = currentUser.department_id?._id?.toString() || 
                                  currentUser.department_id?.toString() ||
                                  (currentUser.department?._id?.toString());
            const targetDeptId = targetUser.department_id?._id?.toString() || 
                                targetUser.department_id?.toString() || 
                                (targetUser.department_id && typeof targetUser.department_id === 'object' ? targetUser.department_id._id?.toString() : targetUser.department_id);
            
            if (!targetDeptId || !currentDeptId || targetDeptId !== currentDeptId) {
              return ApiResponse.forbidden(
                res,
                'Bạn chỉ có thể xem thông tin người dùng trong cùng phòng ban'
              );
            }
          }
        }
      } else if (isCompanyAdmin) {
        // Company Admin can read users in same tenant
        const targetUser = await UserRepository.findById(id, ['department_id']);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        // Extract tenant_id from currentUser (could be ObjectId or populated object)
        const currentTenantId = currentUser.tenant_id?._id 
          ? currentUser.tenant_id._id.toString() 
          : (currentUser.tenant_id?.toString ? currentUser.tenant_id.toString() : null);
        
        // Extract tenant_id from targetUser (should be ObjectId)
        const targetTenantId = targetUser.tenant_id?.toString 
          ? targetUser.tenant_id.toString() 
          : (targetUser.tenant_id?._id ? targetUser.tenant_id._id.toString() : null);

        if (
          targetTenantId &&
          currentTenantId &&
          targetTenantId !== currentTenantId
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép truy cập người dùng thuộc tenant khác'
          );
          }
        }
      // System Admin can read any user, no checks needed
    }

    const result = await UserService.getUserById(id);
    return ApiResponse.success(res, result, 'User retrieved successfully');
  });

  // Update user
  static updateUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser) {
      const roleCode = currentUser.role?.role_code || currentUser.role_code;
      const roleLevel = currentUser.role?.role_level || currentUser.role_level;
      const roleName = currentUser.role?.role_name || currentUser.role_name;
      
      const isSystemAdmin =
        roleCode === 'system_admin' ||
        roleLevel === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global' ||
        (roleName && roleName.toLowerCase() === 'system admin');
      
      const isCompanyAdmin =
        roleCode === 'company_admin' ||
        roleLevel === 90 ||
        (roleName && roleName.toLowerCase() === 'company admin');

      // Allow System Admin and Company Admin to update users in their tenant
      if (!isSystemAdmin && !isCompanyAdmin) {
        const targetUser = await UserRepository.findById(id);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        const currentTenantId = currentUser.tenant_id?._id 
          ? currentUser.tenant_id._id.toString() 
          : (currentUser.tenant_id?.toString ? currentUser.tenant_id.toString() : null);
        
        const targetTenantId = targetUser.tenant_id?.toString 
          ? targetUser.tenant_id.toString() 
          : (targetUser.tenant_id?._id ? targetUser.tenant_id._id.toString() : null);

        if (
          targetTenantId &&
          currentTenantId &&
          targetTenantId !== currentTenantId
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép cập nhật người dùng thuộc tenant khác'
          );
        }
      } else if (isCompanyAdmin) {
        // Company Admin can only update users in same tenant
        const targetUser = await UserRepository.findById(id);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        const currentTenantId = currentUser.tenant_id?._id 
          ? currentUser.tenant_id._id.toString() 
          : (currentUser.tenant_id?.toString ? currentUser.tenant_id.toString() : null);
        
        const targetTenantId = targetUser.tenant_id?.toString 
          ? targetUser.tenant_id.toString() 
          : (targetUser.tenant_id?._id ? targetUser.tenant_id._id.toString() : null);
        
        if (
          targetTenantId &&
          currentTenantId &&
          targetTenantId !== currentTenantId
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép cập nhật người dùng thuộc tenant khác'
          );
        }
      }
      // System Admin can update any user, no checks needed
    }

    const oldUser = await UserService.getUserById(id);
    const result = await UserService.updateUser(id, req.body);
    
    // Emit user profile updated event (non-blocking with timeout)
    // Don't wait for event to complete - send response immediately
    // Use process.nextTick to ensure it runs after response is sent
    process.nextTick(() => {
      (async () => {
    try {
      const changes = {};
      Object.keys(req.body).forEach(key => {
        if (oldUser[key] !== result[key]) {
          changes[key] = { old: oldUser[key], new: result[key] };
        }
      });
      
          // Add timeout to prevent hanging
          await Promise.race([
            UserEvents.emitUserProfileUpdated(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, changes),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 5000)
            )
          ]);
    } catch (eventError) {
          // Log but don't throw - event failure shouldn't affect user update
          // Use console.warn instead of console.error to indicate it's non-critical
          console.warn('⚠️ Failed to emit user profile updated event (non-critical, user update succeeded):', eventError.message);
    }
      })().catch(err => {
        // Extra safety: catch any unhandled promise rejections
        console.warn('⚠️ Unhandled error in user profile updated event (non-critical):', err.message);
      });
    });
    
    return ApiResponse.success(res, result, 'User updated successfully');
  });

  // Delete user
  static deleteUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Enforce multi-tenant isolation for delete operations
    const currentUser = req.user;
    if (currentUser) {
      const isSystemAdmin =
        currentUser.role?.role_code === 'system_admin' ||
        currentUser.role_code === 'system_admin' ||
        currentUser.role?.role_level === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global';

      if (!isSystemAdmin) {
        const targetUser = await UserRepository.findById(id);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        if (
          targetUser.tenant_id &&
          currentUser.tenant_id &&
          targetUser.tenant_id.toString() !== currentUser.tenant_id.toString()
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép xóa người dùng thuộc tenant khác'
          );
        }
      }
    }

    const oldUser = await UserService.getUserById(id);
    const result = await UserService.deleteUser(id);
    
    // Emit user deleted event (non-blocking with timeout)
    // Don't wait for event to complete - send response immediately
    process.nextTick(() => {
      (async () => {
        try {
          await Promise.race([
            UserEvents.emitUserDeleted(oldUser, req.user || { _id: 'system', role: 'admin', full_name: 'System' }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 5000)
            )
          ]);
    } catch (eventError) {
          // Log but don't throw - event failure shouldn't affect user deletion
          console.warn('⚠️ Failed to emit user deleted event (non-critical, user deletion succeeded):', eventError.message);
    }
      })().catch(err => {
        // Extra safety: catch any unhandled promise rejections
        console.warn('⚠️ Unhandled error in user deleted event (non-critical):', err.message);
      });
    });
    
    return ApiResponse.success(res, result, 'User deleted successfully');
  });

  // Get users with pagination and filters
  static getUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    // Chỉ lấy user trong tenant của current user
    const tenantId = req.user?.tenant_id || null;
    const result = await UserService.getUsers({
      ...req.query,
      tenant_id: tenantId || undefined
    });
    return ApiResponse.success(res, result, 'Users retrieved successfully');
  });

  // Get all users (includes both active and inactive users)
  static getAllUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id || null;
    const result = await UserService.getAllUsers(tenantId);
    return ApiResponse.success(res, result, 'All users retrieved successfully');
  });

  // Get potential managers
  static getPotentialManagers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await UserService.getPotentialManagers();
    return ApiResponse.success(res, result, 'Potential managers retrieved successfully');
  });

  // Reset user password
  static resetPassword = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Enforce multi-tenant isolation for password reset
    const currentUser = req.user;
    if (currentUser) {
      const isSystemAdmin =
        currentUser.role?.role_code === 'system_admin' ||
        currentUser.role_code === 'system_admin' ||
        currentUser.role?.role_level === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global';

      if (!isSystemAdmin) {
        const targetUser = await UserRepository.findById(id);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        if (
          targetUser.tenant_id &&
          currentUser.tenant_id &&
          targetUser.tenant_id.toString() !== currentUser.tenant_id.toString()
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép đặt lại mật khẩu cho người dùng thuộc tenant khác'
          );
        }
      }
    }

    const result = await UserService.resetPassword(id, newPassword);
    return ApiResponse.success(res, result, 'Password reset successfully');
  });

  // Toggle user status
  static toggleUserStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Enforce multi-tenant isolation for status toggle
    const currentUser = req.user;
    if (currentUser) {
      const isSystemAdmin =
        currentUser.role?.role_code === 'system_admin' ||
        currentUser.role_code === 'system_admin' ||
        currentUser.role?.role_level === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global';

      if (!isSystemAdmin) {
        const targetUser = await UserRepository.findById(id);
        if (!targetUser) {
          return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
        }

        if (
          targetUser.tenant_id &&
          currentUser.tenant_id &&
          targetUser.tenant_id.toString() !== currentUser.tenant_id.toString()
        ) {
          return ApiResponse.forbidden(
            res,
            'Bạn không được phép thay đổi trạng thái người dùng thuộc tenant khác'
          );
        }
      }
    }

    const oldUser = await UserService.getUserById(id);
    const result = await UserService.toggleUserStatus(id);
    
    // Emit user status updated event (non-blocking with timeout)
    // Don't wait for event to complete - send response immediately
    process.nextTick(() => {
      (async () => {
        try {
          await Promise.race([
            UserEvents.emitUserStatusUpdated(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, oldUser.status, result.status),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 5000)
            )
          ]);
    } catch (eventError) {
          // Log but don't throw - event failure shouldn't affect status update
          console.warn('⚠️ Failed to emit user status updated event (non-critical, status update succeeded):', eventError.message);
    }
      })().catch(err => {
        // Extra safety: catch any unhandled promise rejections
        console.warn('⚠️ Unhandled error in user status updated event (non-critical):', err.message);
      });
    });
    
    return ApiResponse.success(res, result, result.message);
  });

  // Get user statistics
  static getUserStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id || null;
    const result = await UserService.getUserStats(tenantId);
    return ApiResponse.success(res, result, 'User statistics retrieved successfully');
  });

  // Import users from Excel
  static importUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    try {
      const tenantId = req.user?.tenant_id || null;
      if (!tenantId) {
        return ApiResponse.error(res, 'Tenant ID not found in user context', 400);
      }

      // Optional: attach imported users to a specific project
      const projectId = req.body?.project_id || req.query?.project_id || null;
      const importedBy = req.user?._id || req.user?.id || null;

      const result = await UserService.importUsersFromExcel(req.file, tenantId, {
        projectId,
        importedBy
      });
      return ApiResponse.success(res, result.data || result, 'Users imported successfully');
    } catch (error) {
      console.error('Import error:', error.message);
      return ApiResponse.error(res, `Import failed: ${error.message}`, 500);
    }
  });
}

module.exports = UserController;
