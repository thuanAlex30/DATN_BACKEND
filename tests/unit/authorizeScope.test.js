const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const { PermissionUtils, getHighestRole, PERMISSION_MATRIX } = require('../../utils/permissions');
const { ApiResponse } = require('../../utils/response');

describe('authorizeScope Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Permission Matrix Check', () => {
    it('should allow access when user has permission in matrix', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'company_admin',
          role_name: 'Company Admin',
          role_level: 90,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'all'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'create',
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks permission in matrix', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'employee',
          role_name: 'Employee',
          role_level: 10,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'own'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'delete',
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should support multiple modules and actions', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'manager',
          role_name: 'Manager',
          role_level: 70,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'hierarchy'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: ['user', 'project'],
        action: ['read', 'list'],
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Role Level Check', () => {
    it('should allow access when user meets minimum role level', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'manager',
          role_name: 'Manager',
          role_level: 70,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'hierarchy'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        minRoleLevel: 70,
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user role level is too low', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'employee',
          role_name: 'Employee',
          role_level: 10,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'own'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        minRoleLevel: 70,
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should deny access when user role level is too high', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'system_admin',
          role_name: 'System Admin',
          role_level: 100,
          scope_rules: {
            tenant_scope: 'global',
            department_scope: 'all'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        maxRoleLevel: 90,
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Tenant Scope Check', () => {
    it('should allow access when tenant scope matches', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'company_admin',
          role_name: 'Company Admin',
          role_level: 90,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'all'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'read',
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when tenant scope is insufficient', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'employee',
          role_name: 'Employee',
          role_level: 10,
          scope_rules: {
            tenant_scope: 'self',
            department_scope: 'own'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'read',
        tenantScope: 'tenant'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Department Scope Check', () => {
    it('should allow access when department scope matches', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'manager',
          role_name: 'Manager',
          role_level: 70,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'hierarchy'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'project',
        action: 'read',
        tenantScope: 'tenant',
        departmentScope: 'hierarchy'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when department scope is insufficient', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'employee',
          role_name: 'Employee',
          role_level: 10,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'own'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'project',
        action: 'read',
        tenantScope: 'tenant',
        departmentScope: 'hierarchy'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Combined Checks', () => {
    it('should pass when all checks pass', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'company_admin',
          role_name: 'Company Admin',
          role_level: 90,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'all'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'create',
        minRoleLevel: 90,
        tenantScope: 'tenant',
        departmentScope: 'all'
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail when any check fails', () => {
      req.user = {
        id: 'user1',
        role: {
          _id: 'role1',
          role_code: 'employee',
          role_name: 'Employee',
          role_level: 10,
          scope_rules: {
            tenant_scope: 'tenant',
            department_scope: 'own'
          }
        },
        tenant_id: 'tenant1',
        department_id: 'dept1'
      };

      const middleware = AuthMiddleware.authorizeScope({
        modules: 'user',
        action: 'create',
        minRoleLevel: 90,
        tenantScope: 'tenant',
        departmentScope: 'all'
      });

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getHighestRole Helper', () => {
    it('should return highest role level', () => {
      const roles = [
        { role_code: 'employee', role_level: 10, scope_rules: { tenant_scope: 'tenant' } },
        { role_code: 'manager', role_level: 70, scope_rules: { tenant_scope: 'tenant' } },
        { role_code: 'admin', role_level: 90, scope_rules: { tenant_scope: 'tenant' } }
      ];

      const highest = getHighestRole(roles);

      expect(highest.role_level).toBe(90);
      expect(highest.role_code).toBe('admin');
    });

    it('should prioritize tenant scope when role levels are equal', () => {
      const roles = [
        { role_code: 'role1', role_level: 70, scope_rules: { tenant_scope: 'tenant' } },
        { role_code: 'role2', role_level: 70, scope_rules: { tenant_scope: 'global' } }
      ];

      const highest = getHighestRole(roles);

      expect(highest.role_code).toBe('role2');
      expect(highest.scope_rules.tenant_scope).toBe('global');
    });
  });
});

