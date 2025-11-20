const { ApiResponse } = require('../utils/response');
const { ROLES } = require('../utils/permissions');

/**
 * Middleware to enforce tenant/department scoping on every request
 * - Injects tenant_id and (optionally) department_id into queries & payloads
 * - Provides helper utilities via req.scopeContext & req.applyTenantFilter
 * - Supports bypass for System Admin or when explicitly allowed
 *
 * @param {Object} options
 * @param {boolean} options.includeDepartment - Should department filter be injected (default: true)
 * @param {boolean} options.requireDepartment - Reject if no department can be resolved (default: false)
 * @param {boolean} options.allowSystemBypass - Allow system admins to skip filter enforcement (default: true)
 */
const enforceTenantFilter = (options = {}) => {
  const {
    includeDepartment = true,
    requireDepartment = false,
    allowSystemBypass = true
  } = options;

  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return ApiResponse.unauthorized(res, 'User context required for tenant scoping');
    }

    const userRoleCode = user.role?.role_code || user.role_code;
    const isSystemAdmin = allowSystemBypass && userRoleCode === ROLES.SYSTEM_ADMIN;

    const tenantId = user.tenant_id || user.tenantId;
    if (!tenantId && !isSystemAdmin) {
      return ApiResponse.validationError(res, [{
        field: 'tenant_id',
        message: 'tenant_id is required for scoped operations'
      }]);
    }

    const requestDepartment =
      req.query.department_id ||
      req.body.department_id ||
      req.params.department_id ||
      user.department_id;

    if (requireDepartment && !requestDepartment && !isSystemAdmin) {
      return ApiResponse.validationError(res, [{
        field: 'department_id',
        message: 'department_id is required for this operation'
      }]);
    }

    const scopeFilter = {};

    if (!isSystemAdmin) {
      scopeFilter.tenant_id = tenantId;

      if (includeDepartment && requestDepartment) {
        scopeFilter.department_id = requestDepartment;
      }

      // Force tenant/department on write payloads
      if (req.method !== 'GET' && req.body && typeof req.body === 'object') {
        req.body.tenant_id = tenantId;
        if (includeDepartment && requestDepartment) {
          req.body.department_id = requestDepartment;
        }
      }
    }

    req.scopeContext = {
      tenant_id: tenantId,
      department_id: requestDepartment,
      bypass: isSystemAdmin,
      includeDepartment
    };

    req.applyTenantFilter = (query = {}, opts = {}) => {
      if (req.scopeContext.bypass && !opts.force) {
        return { ...query };
      }

      const composed = {
        ...query,
        tenant_id: tenantId
      };

      const shouldIncludeDept = (opts.includeDepartment ?? includeDepartment) && requestDepartment;
      if (shouldIncludeDept) {
        composed.department_id = requestDepartment;
      }

      return composed;
    };

    req.scopeFilter = scopeFilter;
    res.locals.scopeFilter = scopeFilter;

    return next();
  };
};

module.exports = enforceTenantFilter;


