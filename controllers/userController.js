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
    
    // Emit user registered event
    try {
      await UserEvents.emitUserRegistered(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
    } catch (eventError) {
      console.error('Failed to emit user registered event:', eventError);
    }
    
    return ApiResponse.success(res, result, 'User created successfully', 201);
  });

  // Get user by ID
  static getUserById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Enforce multi-tenant isolation: non System Admin users cannot read users from other tenants
    const currentUser = req.user;
    if (currentUser) {
      const isSystemAdmin =
        currentUser.role?.role_code === 'system_admin' ||
        currentUser.role_code === 'system_admin' ||
        currentUser.role?.role_level === 100 ||
        currentUser.scope_rules?.tenant_scope === 'global';

      if (!isSystemAdmin) {
        // Check if user is reading themselves FIRST - before querying database
        const currentUserId = currentUser.id?.toString() || currentUser._id?.toString();
        const requestId = id.toString();
        const isSelf = currentUserId === requestId || 
                       currentUser._id?.toString() === requestId ||
                       (currentUser._id && currentUser._id.toString() === id);
        
        console.log('🔍 getUserById - Self check (before DB query):', {
          currentUserId,
          currentUser_id: currentUser._id?.toString(),
          requestId,
          isSelf
        });
        
        // If reading self, allow immediately and skip all checks
        if (isSelf) {
          console.log('✅ getUserById - Self access detected, allowing immediately');
          // Continue to service to fetch user data - no authorization needed
        } else {
          // For non-self access, check tenant and department
          const targetUser = await UserRepository.findById(id, ['department_id']);
          if (!targetUser) {
            return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
          }

          // Check tenant isolation
          if (
            targetUser.tenant_id &&
            currentUser.tenant_id &&
            targetUser.tenant_id.toString() !== currentUser.tenant_id.toString()
          ) {
            return ApiResponse.forbidden(
              res,
              'Bạn không được phép truy cập người dùng thuộc tenant khác'
            );
          }

          // For Manager (role_level >= 70), allow reading users in same department
          const isManager = currentUser.role?.role_level >= 70;
          
          if (isManager) {
            // Manager can only read users in same department
            const currentDeptId = currentUser.department_id?.toString() || 
                                  currentUser.department?._id?.toString() ||
                                  currentUser.department_id;
            const targetDeptId = targetUser.department_id?._id?.toString() || 
                                targetUser.department_id?.toString() || 
                                (targetUser.department_id && typeof targetUser.department_id === 'object' ? targetUser.department_id._id?.toString() : targetUser.department_id);
            
            console.log('🔍 getUserById - Manager department check:', {
              currentUserId,
              targetUserId: targetUser._id?.toString(),
              currentDeptId,
              targetDeptId,
              isManager
            });
            
            if (!targetDeptId || !currentDeptId || targetDeptId !== currentDeptId) {
              console.log('❌ getUserById - Department mismatch');
              return ApiResponse.forbidden(
                res,
                'Bạn chỉ có thể xem thông tin người dùng trong cùng phòng ban'
              );
            }
          } else {
            // For non-manager roles, they need permission matrix check (already done in route)
            console.log('✅ getUserById - Permission matrix check passed');
          }
        }
      }
    }

    const result = await UserService.getUserById(id);
    return ApiResponse.success(res, result, 'User retrieved successfully');
  });

  // Update user
  static updateUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Enforce multi-tenant isolation for update operations
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
            'Bạn không được phép cập nhật người dùng thuộc tenant khác'
          );
        }
      }
    }

    const oldUser = await UserService.getUserById(id);
    const result = await UserService.updateUser(id, req.body);
    
    // Emit user profile updated event
    try {
      const changes = {};
      Object.keys(req.body).forEach(key => {
        if (oldUser[key] !== result[key]) {
          changes[key] = { old: oldUser[key], new: result[key] };
        }
      });
      
      await UserEvents.emitUserProfileUpdated(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, changes);
    } catch (eventError) {
      console.error('Failed to emit user profile updated event:', eventError);
    }
    
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
    
    // Emit user deleted event
    try {
      await UserEvents.emitUserDeleted(oldUser, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
    } catch (eventError) {
      console.error('Failed to emit user deleted event:', eventError);
    }
    
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

  // Get all active users
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
    
    // Emit user status updated event
    try {
      await UserEvents.emitUserStatusUpdated(result, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, oldUser.status, result.status);
    } catch (eventError) {
      console.error('Failed to emit user status updated event:', eventError);
    }
    
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
      console.log(`📁 Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
      const tenantId = req.user?.tenant_id || null;
      if (!tenantId) {
        return ApiResponse.error(res, 'Tenant ID not found in user context', 400);
      }

      // Truyền tenant_id từ token vào service, không cho phép chỉ định trong file Excel
      const result = await UserService.importUsersFromExcel(req.file, tenantId);
      console.log(`✅ Import completed: ${result.success.length} success, ${result.errors.length} errors`);
      return ApiResponse.success(res, result, 'Users imported successfully');
    } catch (error) {
      console.error('❌ Import error:', error.message);
      return ApiResponse.error(res, `Import failed: ${error.message}`, 500);
    }
  });
}

module.exports = UserController;