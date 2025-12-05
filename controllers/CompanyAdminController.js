const UserRepository = require('../repository/UserRepository');
const UserService = require('../services/userService');
const Role = require('../models/role');
const User = require('../models/user');
const PPEItem = require('../models/ppeItem');
const PPEIssuance = require('../models/ppeIssuance');
const TrainingEnrollment = require('../models/trainingEnrollment');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class CompanyAdminController {
  // Assign role to user (Department Header, Manager, specialized roles)
  static assignRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return ApiResponse.error(res, 'user_id and role_id are required', 400);
    }

    // Verify user exists and belongs to tenant
    const user = await UserRepository.findById(user_id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    // Check tenant scope
    if (req.user.tenant_id && user.tenant_id.toString() !== req.user.tenant_id.toString()) {
      return ApiResponse.error(res, 'User does not belong to your tenant', 403);
    }

    // Verify role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return ApiResponse.notFound(res, 'Role not found');
    }

    // Không cho phép Company Admin (hoặc bất kỳ ai) tự đổi role của chính mình qua endpoint này
    if (req.user._id?.toString() === user._id.toString() || req.user.id?.toString() === user._id.toString()) {
      return ApiResponse.error(res, 'Bạn không được phép thay đổi vai trò của chính mình qua endpoint này', 403);
    }

    // Nếu role hiện tại có thể gán role thấp hơn (can_assign_lower_roles), kiểm tra level
    const currentUserRole = req.user.role;
    if (currentUserRole && currentUserRole.scope_rules?.can_assign_lower_roles) {
      const currentLevel = currentUserRole.role_level || 0;
      const targetLevel = role.role_level || 0;

      // Chỉ được gán role có level nhỏ hơn role của mình
      if (targetLevel >= currentLevel) {
        return ApiResponse.error(
          res,
          'Bạn chỉ được phép gán các vai trò có level thấp hơn vai trò hiện tại của bạn',
          403
        );
      }
    }

    // Update user role
    const updatedUser = await UserRepository.updateById(user_id, { role_id });

    return ApiResponse.success(res, updatedUser, 'Role assigned successfully');
  });

  // Get quota information for PPE and Training
  static getQuotas = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      return ApiResponse.error(res, 'Tenant ID not found', 400);
    }

    // Get PPE statistics
    const ppeItems = await PPEItem.find({ tenant_id: tenantId });
    const ppeIssuances = await PPEIssuance.find({ 
      tenant_id: tenantId,
      status: 'issued'
    });

    const ppeStats = {
      total_items: ppeItems.length,
      total_quantity: ppeItems.reduce((sum, item) => sum + (item.quantity_available || 0), 0),
      allocated_quantity: ppeIssuances.reduce((sum, issuance) => sum + (issuance.quantity || 0), 0),
      available_quantity: ppeItems.reduce((sum, item) => sum + (item.quantity_available || 0), 0) - 
                          ppeIssuances.reduce((sum, issuance) => sum + (issuance.quantity || 0), 0)
    };

    // Get Training statistics
    const trainingEnrollments = await TrainingEnrollment.find({ tenant_id: tenantId });
    const trainingStats = {
      total_enrollments: trainingEnrollments.length,
      active_enrollments: trainingEnrollments.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length,
      completed_enrollments: trainingEnrollments.filter(e => e.status === 'completed').length,
      pending_enrollments: trainingEnrollments.filter(e => e.status === 'pending').length
    };

    // Get subscription info from tenant
    const Tenant = require('../models/tenant');
    const tenant = await Tenant.findById(tenantId);

    const quotas = {
      ppe: {
        ...ppeStats,
        quota_limit: tenant?.subscription?.seats || 0, // Using seats as quota limit
        usage_percentage: tenant?.subscription?.seats ? 
          ((ppeStats.allocated_quantity / tenant.subscription.seats) * 100).toFixed(2) : 0
      },
      training: {
        ...trainingStats,
        quota_limit: tenant?.subscription?.seats || 0,
        usage_percentage: tenant?.subscription?.seats ? 
          ((trainingStats.active_enrollments / tenant.subscription.seats) * 100).toFixed(2) : 0
      },
      subscription: tenant?.subscription || null
    };

    return ApiResponse.success(res, quotas, 'Quota information retrieved successfully');
  });

  // Update quota limits (if allowed by subscription)
  static updateQuota = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { type, limit } = req.body; // type: 'ppe' or 'training'

    if (!type || !limit) {
      return ApiResponse.error(res, 'type and limit are required', 400);
    }

    if (!['ppe', 'training'].includes(type)) {
      return ApiResponse.error(res, 'type must be "ppe" or "training"', 400);
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return ApiResponse.error(res, 'Tenant ID not found', 400);
    }

    // Note: In a real system, quota limits would be managed through subscription
    // This is a simplified version that updates metadata
    const Tenant = require('../models/tenant');
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    // Update metadata with quota limit
    if (!tenant.metadata) {
      tenant.metadata = {};
    }
    tenant.metadata[`${type}_quota_limit`] = parseInt(limit);
    await tenant.save();

    return ApiResponse.success(res, tenant, `${type} quota limit updated successfully`);
  });

  // Get users by role for role management
  static getUsersByRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { role_id } = req.params;
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      return ApiResponse.error(res, 'Tenant ID not found', 400);
    }

    const users = await UserRepository.findByRole(role_id, {
      is_active: req.query.is_active !== 'false'
    });

    // Filter by tenant
    const tenantUsers = users.filter(user => 
      user.tenant_id && user.tenant_id.toString() === tenantId.toString()
    );

    return ApiResponse.success(res, tenantUsers, 'Users by role retrieved successfully');
  });

  // Bulk assign role to multiple users
  static bulkAssignRole = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { user_ids, role_id } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return ApiResponse.error(res, 'user_ids array is required', 400);
    }

    if (!role_id) {
      return ApiResponse.error(res, 'role_id is required', 400);
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return ApiResponse.error(res, 'Tenant ID not found', 400);
    }

    // Verify role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return ApiResponse.notFound(res, 'Role not found');
    }

    // Không cho phép Company Admin bulk-assign vai trò cho chính mình
    const currentUserId = req.user._id?.toString() || req.user.id?.toString();
    if (currentUserId && user_ids.some(uid => uid.toString() === currentUserId)) {
      return ApiResponse.error(res, 'Bạn không được phép thay đổi vai trò của chính mình qua bulk-assign', 403);
    }

    // Nếu role hiện tại có thể gán role thấp hơn (can_assign_lower_roles), kiểm tra level
    const currentUserRole = req.user.role;
    if (currentUserRole && currentUserRole.scope_rules?.can_assign_lower_roles) {
      const currentLevel = currentUserRole.role_level || 0;
      const targetLevel = role.role_level || 0;

      if (targetLevel >= currentLevel) {
        return ApiResponse.error(
          res,
          'Bạn chỉ được phép gán các vai trò có level thấp hơn vai trò hiện tại của bạn',
          403
        );
      }
    }

    // Verify all users exist and belong to tenant
    const users = await User.find({ 
      _id: { $in: user_ids },
      tenant_id: tenantId
    });

    if (users.length !== user_ids.length) {
      return ApiResponse.error(res, 'Some users not found or do not belong to tenant', 400);
    }

    // Bulk update roles
    const result = await User.updateMany(
      { _id: { $in: user_ids } },
      { role_id, updated_at: new Date() }
    );

    return ApiResponse.success(res, {
      updated_count: result.modifiedCount,
      user_ids
    }, 'Roles assigned successfully');
  });

  // Get all Department Headers in tenant
  static getDepartmentHeaders = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      return ApiResponse.error(res, 'Tenant ID not found', 400);
    }

    // Find role with code 'department_header' or 'DEPARTMENT_HEADER'
    const departmentHeaderRole = await Role.findOne({
      $or: [
        { role_code: 'department_header' },
        { role_code: 'DEPARTMENT_HEADER' },
        { role_name: { $regex: /department.*header/i } }
      ]
    });

    if (!departmentHeaderRole) {
      return ApiResponse.success(res, [], 'No Department Header role found');
    }

    // Find all users with Department Header role in tenant
    const departmentHeaders = await User.find({
      tenant_id: tenantId,
      role_id: departmentHeaderRole._id,
      is_active: req.query.is_active !== 'false'
    })
      .populate('role_id', 'role_name role_code role_level')
      .populate('department_id', 'department_name')
      .select('-password_hash')
      .sort({ full_name: 1 });

    return ApiResponse.success(res, departmentHeaders, 'Department Headers retrieved successfully');
  });
}

module.exports = CompanyAdminController;

