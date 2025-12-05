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
      status: req.query.status?.toLowerCase(),
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await TenantRepository.findAll(options);
    
    // Map tenants to frontend format
    const mappedTenants = result.tenants.map(tenant => {
      const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
      return {
        ...tenantObj,
        tenant_name: tenantObj.tenant_name || tenantObj.name,
        contact_name: tenantObj.contact_name || tenantObj.contact?.name,
        contact_email: tenantObj.contact_email || tenantObj.contact?.email,
        contact_phone: tenantObj.contact_phone || tenantObj.contact?.phone,
        subscription_plan: tenantObj.subscription_plan || tenantObj.subscription?.plan,
        subscription_expires_at: tenantObj.subscription_expires_at || tenantObj.subscription?.expires_at,
        status: tenantObj.status?.toUpperCase() || 'ACTIVE'
      };
    });
    
    return ApiResponse.success(res, {
      tenants: mappedTenants,
      pagination: result.pagination
    }, 'Tenants retrieved successfully');
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

    // Map frontend format to backend format
    const mappedData = {
      tenant_code: tenantData.tenant_code || tenantData.tax_code?.toLowerCase().replace(/\s+/g, '_'),
      name: tenantData.tenant_name || tenantData.name,
      tenant_name: tenantData.tenant_name || tenantData.name,
      tax_code: tenantData.tax_code,
      status: tenantData.status?.toLowerCase() || 'active',
      contact_name: tenantData.contact_name,
      contact_email: tenantData.contact_email,
      contact_phone: tenantData.contact_phone,
      subscription_plan: tenantData.subscription_plan,
      subscription_expires_at: tenantData.subscription_expires_at,
      contact: {
        name: tenantData.contact_name,
        email: tenantData.contact_email,
        phone: tenantData.contact_phone
      },
      subscription: {
        plan: tenantData.subscription_plan,
        expires_at: tenantData.subscription_expires_at
      }
    };

    // Check if tenant code already exists
    if (mappedData.tenant_code) {
      const codeExists = await TenantRepository.existsByCode(mappedData.tenant_code);
      if (codeExists) {
        return ApiResponse.error(res, 'Tenant code already exists', 409);
      }
    }

    const tenant = await TenantRepository.create(mappedData);
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

    // Map frontend format to backend format
    const mappedData = {};
    if (updateData.tenant_name !== undefined) {
      mappedData.name = updateData.tenant_name;
      mappedData.tenant_name = updateData.tenant_name;
    }
    if (updateData.tax_code !== undefined) mappedData.tax_code = updateData.tax_code;
    if (updateData.contact_name !== undefined) {
      mappedData.contact_name = updateData.contact_name;
      if (!mappedData.contact) mappedData.contact = {};
      mappedData.contact.name = updateData.contact_name;
    }
    if (updateData.contact_email !== undefined) {
      mappedData.contact_email = updateData.contact_email;
      if (!mappedData.contact) mappedData.contact = {};
      mappedData.contact.email = updateData.contact_email;
    }
    if (updateData.contact_phone !== undefined) {
      mappedData.contact_phone = updateData.contact_phone;
      if (!mappedData.contact) mappedData.contact = {};
      mappedData.contact.phone = updateData.contact_phone;
    }
    if (updateData.subscription_plan !== undefined) {
      mappedData.subscription_plan = updateData.subscription_plan;
      if (!mappedData.subscription) mappedData.subscription = {};
      mappedData.subscription.plan = updateData.subscription_plan;
    }
    if (updateData.subscription_expires_at !== undefined) {
      mappedData.subscription_expires_at = updateData.subscription_expires_at;
      if (!mappedData.subscription) mappedData.subscription = {};
      mappedData.subscription.expires_at = updateData.subscription_expires_at;
    }
    if (updateData.status !== undefined) {
      mappedData.status = updateData.status.toLowerCase();
    }

    // Check if new tenant code already exists (excluding current tenant)
    if (updateData.tenant_code) {
      const codeExists = await TenantRepository.existsByCode(updateData.tenant_code, id);
      if (codeExists) {
        return ApiResponse.error(res, 'Tenant code already exists', 409);
      }
      mappedData.tenant_code = updateData.tenant_code;
    }

    const tenant = await TenantRepository.updateById(id, mappedData);
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

  // Get participating customers (tenants with paid orders)
  static getParticipatingCustomers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const Order = require('../models/order');
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sort_by: req.query.sort_by || 'paymentDate',
      sort_order: req.query.sort_order || 'desc'
    };

    try {
      // Find all paid orders that have tenantId (account has been created)
      const orderFilter = {
        status: 'paid',
        tenantId: { $ne: null } // Only orders that have been processed and tenant created
      };

      if (options.search) {
        orderFilter.$or = [
          { 'companyInfo.name': { $regex: options.search, $options: 'i' } },
          { 'contactPerson.name': { $regex: options.search, $options: 'i' } },
          { 'companyInfo.email': { $regex: options.search, $options: 'i' } },
          { 'contactPerson.email': { $regex: options.search, $options: 'i' } }
        ];
      }

      const sortOrder = options.sort_order === 'asc' ? 1 : -1;
      const sortObj = { [options.sort_by]: sortOrder };

      const skip = (options.page - 1) * options.limit;

      // Get paid orders with tenant info
      const [orders, total] = await Promise.all([
        Order.find(orderFilter)
          .populate('tenantId', 'name tenant_code status subscription')
          .sort(sortObj)
          .skip(skip)
          .limit(options.limit),
        Order.countDocuments(orderFilter)
      ]);

      // Map to customer format - filter out orders without tenant
      const customers = orders
        .filter(order => order.tenantId) // Only include orders with valid tenant
        .map(order => {
          const tenant = order.tenantId;
          return {
            _id: tenant._id.toString(),
            companyName: order.companyInfo?.name || tenant?.name || 'N/A',
            contactPerson: order.contactPerson?.name || 'N/A',
            contactEmail: order.contactPerson?.email || order.companyInfo?.email || 'N/A',
            contactPhone: order.contactPerson?.phone || order.companyInfo?.phone || 'N/A',
            planType: order.planType,
            amount: order.amount,
            paymentDate: order.paymentDate || order.createdAt,
            tenantCode: tenant?.tenant_code || 'N/A',
            tenantStatus: tenant?.status || 'N/A',
            subscriptionPlan: tenant?.subscription?.plan || order.planType,
            subscriptionExpiresAt: tenant?.subscription?.expires_at || null,
            orderId: order.orderId
          };
        });

      return ApiResponse.success(res, {
        customers,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit),
          hasNextPage: options.page < Math.ceil(total / options.limit),
          hasPrevPage: options.page > 1
        }
      }, 'Participating customers retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  });
}

module.exports = TenantController;

