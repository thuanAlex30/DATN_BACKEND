/**
 * Resolve tenant & department IDs from request context
 * @param {Object} req
 * @returns {{ tenantId: string|null, departmentId: string|null }}
 */
const resolveScopeIds = (req = {}) => {
  const tenantId =
    req.scopeContext?.tenant_id ||
    req.body?.tenant_id ||
    req.query?.tenant_id ||
    req.params?.tenant_id ||
    req.user?.tenant_id ||
    null;

  const departmentId =
    req.scopeContext?.department_id ||
    req.body?.department_id ||
    req.query?.department_id ||
    req.params?.department_id ||
    req.user?.department_id ||
    null;

  return { tenantId, departmentId };
};

/**
 * Apply tenant/department filter to query payloads even if middleware is skipped
 * @param {Object} req
 * @param {Object} baseFilter
 * @param {Object} options
 * @param {boolean} options.includeDepartment - default true
 * @param {boolean} options.force - bypass System Admin skip
 * @returns {Object}
 */
const applyScopeFilter = (req = {}, baseFilter = {}, options = {}) => {
  const { includeDepartment = true, force = false } = options;

  if (typeof req.applyTenantFilter === 'function') {
    return req.applyTenantFilter(baseFilter, { includeDepartment, force });
  }

  const { tenantId, departmentId } = resolveScopeIds(req);
  const filter = { ...baseFilter };

  if (tenantId) {
    filter.tenant_id = tenantId;
  }

  if (includeDepartment && departmentId) {
    filter.department_id = departmentId;
  }

  return filter;
};

module.exports = {
  resolveScopeIds,
  applyScopeFilter
};


