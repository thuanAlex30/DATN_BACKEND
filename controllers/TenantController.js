const TenantRepository = require('../repository/TenantRepository');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class TenantController {
  // Get all tenants
  static getAllTenants = ErrorMiddleware.asyncHandler(async (req, res) => {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      status: req.query.status,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await TenantRepository.findAll(options);
    return ApiResponse.success(res, result, 'Tenants retrieved successfully');
  });

  // Get tenant by ID
  static getTenantById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenant = await TenantRepository.findById(id);

    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    return ApiResponse.success(res, tenant, 'Tenant retrieved successfully');
  });

  // Create new tenant
  static createTenant = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantData = req.body;

    // Check if tenant code already exists
    if (tenantData.tenant_code) {
      const codeExists = await TenantRepository.existsByCode(tenantData.tenant_code);
      if (codeExists) {
        return ApiResponse.error(res, 'Tenant code already exists', 409);
      }
    }

    const tenant = await TenantRepository.create(tenantData);
    return ApiResponse.success(res, tenant, 'Tenant created successfully', 201);
  });

  // Update tenant
  static updateTenant = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingTenant = await TenantRepository.findById(id);
    if (!existingTenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    // Check if new tenant code already exists (excluding current tenant)
    if (updateData.tenant_code) {
      const codeExists = await TenantRepository.existsByCode(updateData.tenant_code, id);
      if (codeExists) {
        return ApiResponse.error(res, 'Tenant code already exists', 409);
      }
    }

    const tenant = await TenantRepository.updateById(id, updateData);
    return ApiResponse.success(res, tenant, 'Tenant updated successfully');
  });

  // Delete tenant (soft delete)
  static deleteTenant = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    await TenantRepository.deleteById(id);
    return ApiResponse.success(res, null, 'Tenant deleted successfully');
  });

  // Update subscription
  static updateSubscription = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subscriptionData = req.body;

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    const updatedTenant = await TenantRepository.updateSubscription(id, subscriptionData);
    return ApiResponse.success(res, updatedTenant, 'Subscription updated successfully');
  });

  // Update tenant status (activate/deactivate/suspend)
  static updateStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status. Must be: active, inactive, or suspended', 400);
    }

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    const updatedTenant = await TenantRepository.updateStatus(id, status);
    return ApiResponse.success(res, updatedTenant, `Tenant ${status} successfully`);
  });

  // Reset tenant (suspend and deactivate all users)
  static resetTenant = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    const resetTenant = await TenantRepository.resetTenant(id);
    return ApiResponse.success(res, resetTenant, 'Tenant reset successfully');
  });

  // Assign Company Admin
  static assignCompanyAdmin = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return ApiResponse.error(res, 'user_id is required', 400);
    }

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    try {
      const user = await TenantRepository.assignCompanyAdmin(id, user_id);
      return ApiResponse.success(res, user, 'Company Admin assigned successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  });

  // Get tenant statistics
  static getTenantStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tenant = await TenantRepository.findById(id);
    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    const stats = await TenantRepository.getTenantStats(id);
    return ApiResponse.success(res, stats, 'Tenant statistics retrieved successfully');
  });
}

module.exports = TenantController;

