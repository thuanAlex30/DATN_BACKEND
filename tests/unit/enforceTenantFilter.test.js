const enforceTenantFilter = require('../../middlewares/enforceTenantFilter');
const { ROLES } = require('../../utils/permissions');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  locals: {}
});

describe('enforceTenantFilter middleware', () => {
  it('injects tenant and department filters for scoped users', () => {
    const middleware = enforceTenantFilter();
    const req = {
      method: 'GET',
      query: {},
      params: {},
      body: {},
      user: {
        tenant_id: 'tenant-1',
        department_id: 'dept-1',
        role: { role_code: ROLES.MANAGER }
      }
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.scopeFilter).toEqual({
      tenant_id: 'tenant-1',
      department_id: 'dept-1'
    });
    expect(req.applyTenantFilter({ foo: 'bar' })).toEqual({
      foo: 'bar',
      tenant_id: 'tenant-1',
      department_id: 'dept-1'
    });
  });

  it('forces tenant/department onto write payloads', () => {
    const middleware = enforceTenantFilter();
    const req = {
      method: 'POST',
      query: {},
      params: {},
      body: {
        department_id: 'override-dept'
      },
      user: {
        tenant_id: 'tenant-9',
        department_id: 'dept-9',
        role: { role_code: ROLES.TRAINER }
      }
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.body.tenant_id).toBe('tenant-9');
    expect(req.body.department_id).toBe('override-dept');
    expect(req.scopeContext).toMatchObject({
      tenant_id: 'tenant-9',
      department_id: 'override-dept'
    });
  });

  it('blocks requests that miss required department context', () => {
    const middleware = enforceTenantFilter({ requireDepartment: true });
    const req = {
      method: 'GET',
      query: {},
      params: {},
      body: {},
      user: {
        tenant_id: 'tenant-2',
        role: { role_code: ROLES.COMPANY_ADMIN }
      }
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('allows system admins to bypass enforced filters', () => {
    const middleware = enforceTenantFilter();
    const req = {
      method: 'GET',
      query: {},
      params: {},
      body: {},
      user: {
        role: { role_code: ROLES.SYSTEM_ADMIN }
      }
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.scopeContext.bypass).toBe(true);
    expect(req.applyTenantFilter({ foo: 'bar' })).toEqual({ foo: 'bar' });
  });
});


