const JWTConfig = require('../config/jwt');
const { ApiResponse } = require('../utils/response');
const UserRepository = require('../repository/UserRepository');
const { PermissionUtils, getHighestRole } = require('../utils/permissions');

class AuthMiddleware {
  // Verify JWT token and extract user info
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponse.unauthorized(res, 'Access token is required');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        return ApiResponse.unauthorized(res, 'Access token is required');
      }

      // Verify token
      const decoded = JWTConfig.verifyAccessToken(token);
      
      // Get user from database
      const user = await UserRepository.findById(decoded.userId);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'User not found');
      }

      if (!user.is_active) {
        return ApiResponse.unauthorized(res, 'Account is deactivated');
      }

      // Populate role and department information
      await user.populate({
        path: 'role_id',
        select: 'role_name role_code role_level scope_rules permissions is_active'
      });
      await user.populate(['department_id', 'tenant_id']);
      
      if (!user.role_id || !user.role_id.is_active) {
        return ApiResponse.unauthorized(res, 'Invalid or inactive role');
      }

      // Support for multi-role: if user has multiple roles, select the one with highest level
      // Currently user has single role_id, but designed for future expansion
      let roles = [user.role_id]; // Array for future multi-role support
      
      // If user has multiple roles (future: user.roles array), use getHighestRole
      // For now, user has single role_id, but we prepare for multi-role support
      let primaryRole = getHighestRole(roles);
      
      // Fallback: if no role selected, use the first one
      if (!primaryRole && roles.length > 0) {
        primaryRole = roles[0];
      }
      
      // Ensure scope_rules exists (fallback if not populated)
      if (!primaryRole.scope_rules || Object.keys(primaryRole.scope_rules).length === 0) {
        // Infer scope_rules from role_code/role_name
        const roleCode = primaryRole.role_code?.toLowerCase();
        const roleName = primaryRole.role_name?.toLowerCase();
        
        primaryRole.scope_rules = {
          tenant_scope: (roleCode === 'system_admin' || roleName === 'system admin') ? 'global' : 'tenant',
          department_scope: (roleCode === 'system_admin' || roleCode === 'company_admin' || 
                            roleName === 'system admin' || roleName === 'company admin') ? 'all' : 
                           (roleCode === 'department_header' || roleName === 'department header') ? 'hierarchy' : 'own',
          data_scope: (roleCode === 'system_admin' || roleCode === 'company_admin' || 
                      roleName === 'system admin' || roleName === 'company admin') ? 'full' : 'department',
          can_assign_lower_roles: (primaryRole.role_level || 0) >= 70
        };
        
        console.log('⚠️ Scope rules not found, inferred from role:', {
          roleCode,
          roleName,
          inferredScopeRules: primaryRole.scope_rules
        });
      }

      // Attach user info to request
      req.user = {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        tenant: user.tenant_id ? {
          _id: user.tenant_id._id || user.tenant_id,
          tenant_code: user.tenant_id.tenant_code,
          name: user.tenant_id.name
        } : null,
        role: {
          _id: primaryRole._id,
          role_name: primaryRole.role_name,
          role_code: primaryRole.role_code,
          role_level: primaryRole.role_level,
          scope_rules: primaryRole.scope_rules || {},
          permissions: primaryRole.permissions || {}
        },
        role_id: primaryRole._id,
        role_code: primaryRole.role_code,
        role_level: primaryRole.role_level,
        scope_rules: primaryRole.scope_rules || {},
        department_id: user.department_id?._id || user.department_id,
        department: user.department_id ? {
          _id: user.department_id._id || user.department_id,
          department_name: user.department_id.department_name
        } : null,
        position_id: user.position_id,
        permissions: primaryRole.permissions || {},
        // Store all roles for future multi-role support
        roles: roles.map(r => ({
          _id: r._id,
          role_code: r.role_code,
          role_level: r.role_level,
          scope_rules: r.scope_rules || {}
        }))
      };

      next();
    } catch (error) {
      if (error.message === 'Invalid access token') {
        return ApiResponse.unauthorized(res, 'Invalid or expired token');
      }
      
      console.error('Authentication error:', error);
      return ApiResponse.error(res, 'Authentication failed', 500);
    }
  }

  // Check if user has specific permission
  static authorize(permission) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const hasPermission = PermissionUtils.hasPermission(req.user.role, permission);
        
        if (!hasPermission) {
          return ApiResponse.forbidden(res, 'Insufficient permissions');
        }

        next();
      } catch (error) {
        console.error('Authorization error:', error);
        return ApiResponse.error(res, 'Authorization failed', 500);
      }
    };
  }

  // Check if user has any of the specified permissions
  static authorizeAny(permissions) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const hasAnyPermission = PermissionUtils.hasAnyPermission(req.user.role, permissions);
        
        if (!hasAnyPermission) {
          return ApiResponse.forbidden(res, 'Insufficient permissions');
        }

        next();
      } catch (error) {
        console.error('Authorization error:', error);
        return ApiResponse.error(res, 'Authorization failed', 500);
      }
    };
  }

  // Check if user has all specified permissions
  static authorizeAll(permissions) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const hasAllPermissions = PermissionUtils.hasAllPermissions(req.user.role, permissions);
        
        if (!hasAllPermissions) {
          return ApiResponse.forbidden(res, 'Insufficient permissions');
        }

        next();
      } catch (error) {
        console.error('Authorization error:', error);
        return ApiResponse.error(res, 'Authorization failed', 500);
      }
    };
  }

  // Check if user has specific role (legacy - use authorizeScope instead)
  static authorizeRole(roles) {
    const allowedRoles = (Array.isArray(roles) ? roles : [roles]).map(role =>
      typeof role === 'string' ? role.trim().toLowerCase() : role
    );
    
    return (req, res, next) => {
      try {
        const userRole = req.user?.role;
        const userRoleName = userRole?.role_name ? userRole.role_name.trim().toLowerCase() : null;
        const userRoleCode = userRole?.role_code ? userRole.role_code.trim().toLowerCase() : null;
        const userRoleLevel = userRole?.role_level;

        // Map role codes to role names for backward compatibility
        const roleCodeToNameMap = {
          'company_admin': 'company admin',
          'system_admin': 'system admin',
          'department_header': 'header_department',
          'department_manager': 'manager'
        };

        // Check if user has any of the allowed roles
        const hasAccess = allowedRoles.some(allowed => {
          const allowedLower = typeof allowed === 'string' ? allowed.trim().toLowerCase() : allowed;
          
          // Check by role name
          if (userRoleName && userRoleName === allowedLower) {
            return true;
          }
          
          // Check by role code
          if (userRoleCode && userRoleCode === allowedLower) {
            return true;
          }
          
          // Check by mapped role code (e.g., 'company_admin' -> 'company admin')
          if (userRoleCode && roleCodeToNameMap[userRoleCode] === allowedLower) {
            return true;
          }
          
          // Check if allowed is a role code that maps to user's role name
          if (userRoleName && Object.values(roleCodeToNameMap).some(mapped => mapped === allowedLower && roleCodeToNameMap[userRoleCode] === mapped)) {
            return true;
          }
          
          // Check by role level (if allowed is a number)
          if (typeof allowed === 'number' && userRoleLevel && userRoleLevel >= allowed) {
            return true;
          }
          
          return false;
        });

        console.log('🔍 Role Authorization Debug:', {
          allowedRoles,
          user: req.user ? {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
          } : null,
          userRoleName,
          userRoleCode,
          userRoleLevel,
          hasAccess
        });

        if (!req.user) {
          console.log('❌ No user found in request');
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        if (!hasAccess) {
          console.log('❌ User role not in allowed roles:', {
            userRoleName: userRoleName || userRole?.role_name || req.user.role,
            userRoleCode: userRoleCode || userRole?.role_code,
            userRoleLevel: userRoleLevel || userRole?.role_level,
            allowedRoles
          });
          return ApiResponse.forbidden(res, 'Insufficient role permissions');
        }

        console.log('✅ Role authorization successful');
        next();
      } catch (error) {
        console.error('Role authorization error:', error);
        return ApiResponse.error(res, 'Role authorization failed', 500);
      }
    };
  }

  /**
   * Advanced scope-based authorization with permission matrix support
   * @param {Object} options - Authorization options
   * @param {string|string[]} options.modules - Module name(s) to check (e.g., 'user', 'project', 'training')
   * @param {string|string[]} options.action - Action name(s) to check (e.g., 'create', 'read', 'update', 'delete')
   * @param {string|string[]|number|number[]} options.roles - Allowed role codes/names or role levels (legacy)
   * @param {string} options.tenantScope - Required tenant scope: 'global', 'tenant', 'self'
   * @param {string} options.departmentScope - Required department scope: 'all', 'hierarchy', 'own', 'none'
   * @param {number|number[]} options.minRoleLevel - Minimum role level required
   * @param {number|number[]} options.maxRoleLevel - Maximum role level allowed
   * @param {boolean} options.requireExactTenant - Require exact tenant_id match
   * @param {boolean} options.requireExactDepartment - Require exact department_id match
   * @returns {Function} Express middleware
   */
  static authorizeScope(options = {}) {
    const {
      modules = null,
      action = null,
      roles = null,
      tenantScope = null,
      departmentScope = null,
      minRoleLevel = null,
      maxRoleLevel = null,
      requireExactTenant = false,
      requireExactDepartment = false
    } = options;

    return (req, res, next) => {
      try {
        if (!req.user) {
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const userRole = req.user.role;
        const userTenantId = req.user.tenant_id;
        const userDepartmentId = req.user.department_id;

        // Debug: Log user role information
        console.log(`🔍 authorizeScope - User role info:`, {
          userRole: userRole ? {
            role_code: userRole.role_code,
            role_name: userRole.role_name,
            role_level: userRole.role_level,
            _id: userRole._id
          } : null,
          reqUserRole: req.user.role ? {
            role_code: req.user.role.role_code,
            role_name: req.user.role.role_name,
            role_level: req.user.role.role_level
          } : null,
          reqUserRoleId: req.user.role_id,
          path: req.path
        });

        // Check permission matrix if modules and action provided
        if (modules && action) {
          const moduleList = Array.isArray(modules) ? modules : [modules];
          const actionList = Array.isArray(action) ? action : [action];
          
          console.log(`🔍 authorizeScope - Checking permission matrix:`, {
            modules: moduleList,
            actions: actionList,
            userRole: {
              role_code: userRole?.role_code,
              role_name: userRole?.role_name,
              role_level: userRole?.role_level
            },
            path: req.path
          });
          
          // Check if user has permission for any module:action combination
          const hasPermission = moduleList.some(module => 
            actionList.some(act => {
              const hasPerm = PermissionUtils.hasMatrixPermission(userRole, module, act);
              console.log(`🔍 Permission check result for ${module}:${act}:`, {
                hasPermission: hasPerm,
                userRoleCode: userRole?.role_code,
                userRoleLevel: userRole?.role_level,
                userRoleName: userRole?.role_name
              });
              if (!hasPerm) {
                console.log(`❌ Permission check failed:`, {
                  module,
                  action,
                  userRole: {
                    role_code: userRole?.role_code,
                    role_level: userRole?.role_level,
                    role_name: userRole?.role_name
                  },
                  path: req.path
                });
              }
              return hasPerm;
            })
          );
          
          if (!hasPermission) {
            console.log(`❌ Authorization failed for ${req.path}:`, {
              userRole: {
                role_code: userRole?.role_code,
                role_level: userRole?.role_level,
                role_name: userRole?.role_name
              },
              requiredModules: moduleList,
              requiredActions: actionList
            });
            return ApiResponse.forbidden(res, `Insufficient permissions for ${moduleList.join(',')}:${actionList.join(',')}`);
          }
          
          console.log(`✅ Permission matrix check passed for ${req.path}`);
        }

        // Check role codes/names if provided (legacy support)
        if (roles) {
          const allowedRoles = Array.isArray(roles) ? roles : [roles];
          const roleMatches = allowedRoles.some(allowed => {
            // Check by role code
            if (userRole.role_code && 
                (typeof allowed === 'string' && userRole.role_code.toLowerCase() === allowed.toLowerCase())) {
              return true;
            }
            // Check by role name
            if (userRole.role_name && 
                (typeof allowed === 'string' && userRole.role_name.toLowerCase() === allowed.toLowerCase())) {
              return true;
            }
            // Check by role level (if allowed is a number)
            if (typeof allowed === 'number' && userRole.role_level === allowed) {
              return true;
            }
            return false;
          });

          if (!roleMatches) {
            return ApiResponse.forbidden(res, 'Insufficient role permissions');
          }
        }

        // Check minimum role level if provided
        if (minRoleLevel !== null) {
          if (!userRole.role_level || userRole.role_level < minRoleLevel) {
            return ApiResponse.forbidden(res, 'Insufficient role level');
          }
        }

        // Check maximum role level if provided
        if (maxRoleLevel !== null) {
          if (!userRole.role_level || userRole.role_level > maxRoleLevel) {
            return ApiResponse.forbidden(res, 'Role level too high');
          }
        }

        // Check tenant scope
        if (tenantScope || requireExactTenant) {
          // Infer tenant scope from role if scope_rules not available
          let userTenantScope = userRole.scope_rules?.tenant_scope;
          
          if (!userTenantScope) {
            // Fallback: infer from role_code/role_name
            const userRoleCode = userRole.role_code?.toLowerCase();
            const userRoleName = userRole.role_name?.toLowerCase();
            
            if (userRoleCode === 'system_admin' || userRoleName === 'system admin') {
              userTenantScope = 'global';
            } else if (userRoleCode === 'company_admin' || userRoleName === 'company admin') {
              userTenantScope = 'tenant';
            } else {
              userTenantScope = 'tenant'; // Default for other roles
            }
            
            console.log('⚠️ Tenant scope not in scope_rules, inferred:', {
              roleCode: userRoleCode,
              roleName: userRoleName,
              inferredTenantScope: userTenantScope
            });
          }

          console.log(`🔍 Tenant scope check:`, {
            requiredTenantScope: tenantScope,
            userTenantScope,
            requireExactTenant,
            path: req.path
          });

          if (requireExactTenant) {
            // For exact tenant match, check if resource tenant_id matches user tenant_id
            const resourceTenantId = req.params.tenant_id || req.body.tenant_id || req.query.tenant_id;
            if (resourceTenantId && userTenantId) {
              if (resourceTenantId.toString() !== userTenantId.toString()) {
                console.log('❌ Tenant access denied - tenant_id mismatch');
                return ApiResponse.forbidden(res, 'Tenant access denied');
              }
            }
          } else if (tenantScope) {
            // Check if user's scope allows the required tenant scope
            if (tenantScope === 'global' && userTenantScope !== 'global') {
              console.log('❌ Tenant scope insufficient - global required but user has:', userTenantScope);
              return ApiResponse.forbidden(res, 'Global tenant access required');
            }
            if (tenantScope === 'tenant' && userTenantScope === 'self') {
              console.log('❌ Tenant scope insufficient - tenant required but user has: self');
              return ApiResponse.forbidden(res, 'Tenant scope insufficient');
            }
          }
          
          console.log('✅ Tenant scope check passed');
        }

        // Check department scope
        if (departmentScope || requireExactDepartment) {
          // For Manager (role_level >= 70), allow access even if scope_rules not set
          const isManagerOrHigher = userRole?.role_level >= 70;
          
          // Infer department scope if not available
          let userDeptScope;
          if (userRole.scope_rules?.department_scope) {
            userDeptScope = userRole.scope_rules.department_scope;
          } else {
            // Fallback: infer from role_code/role_name
            const userRoleCode = userRole.role_code?.toLowerCase();
            const userRoleName = userRole.role_name?.toLowerCase();
            
            if (userRoleCode === 'system_admin' || userRoleCode === 'company_admin' ||
                userRoleName === 'system admin' || userRoleName === 'company admin') {
              userDeptScope = 'all';
            } else if (userRoleCode === 'department_header' || userRoleName === 'department header') {
              userDeptScope = 'hierarchy';
            } else if (isManagerOrHigher) {
              userDeptScope = 'hierarchy';
            } else {
              userDeptScope = 'own';
            }
            
            console.log('⚠️ Department scope not in scope_rules, inferred:', {
              roleCode: userRoleCode,
              roleName: userRoleName,
              inferredDeptScope: userDeptScope
            });
          }

          console.log('🔍 Department scope check:', {
            path: req.path,
            requiredDepartmentScope: departmentScope,
            userDepartmentScope: userDeptScope,
            userRole: {
              role_code: userRole.role_code,
              role_level: userRole.role_level,
              role_name: userRole.role_name
            },
            scopeRules: userRole.scope_rules || {}
          });

          if (requireExactDepartment) {
            // For exact department match, check if resource department_id matches user department_id
            const resourceDeptId = req.params.department_id || req.body.department_id || req.query.department_id;
            if (resourceDeptId && userDepartmentId) {
              if (resourceDeptId.toString() !== userDepartmentId.toString()) {
                return ApiResponse.forbidden(res, 'Department access denied');
              }
            }
          } else if (departmentScope) {
            // Check if user's scope allows the required department scope
            // Hierarchy scope allows: 'all', 'hierarchy'
            // Own scope only allows: 'own'
            if (departmentScope === 'all' && userDeptScope !== 'all') {
              console.log('❌ Department scope check failed - all required but user has:', userDeptScope);
              return ApiResponse.forbidden(res, 'All departments access required');
            }
            if (departmentScope === 'hierarchy') {
              // Hierarchy scope allows both 'hierarchy' and 'all'
              // Also allow Manager (role_level >= 70) even if scope_rules not set correctly
              const isManagerOrHigher = userRole?.role_level >= 70;
              
              if (isManagerOrHigher) {
                console.log('✅ Department scope check - Manager access allowed (role_level >= 70)');
                // Allow Manager to proceed, department check will be done in controller
              } else if (userDeptScope !== 'hierarchy' && userDeptScope !== 'all') {
                console.log('❌ Department scope check failed - hierarchy required but user has:', userDeptScope);
                return ApiResponse.forbidden(res, 'Department hierarchy scope required');
              }
            }
          }
          
          console.log('✅ Department scope check passed');
        }

        // Final check - ensure we're not blocking valid requests
        console.log(`✅ authorizeScope - All checks passed for ${req.path}, proceeding to controller`);
        console.log(`🔍 Final authorization state:`, {
          hasPermission: true,
          userRole: {
            code: userRole?.role_code,
            name: userRole?.role_name,
            level: userRole?.role_level
          },
          path: req.path,
          method: req.method,
          userId: req.user?.id || req.user?._id,
          tenantId: req.user?.tenant_id
        });
        console.log(`🚀 Calling next() to proceed to controller...`);
        console.log(`🔍 authorizeScope - res.headersSent: ${res.headersSent}`);
        console.log(`🔍 authorizeScope - res.finished: ${res.finished}`);
        const result = next();
        console.log(`🔍 authorizeScope - After next(), result:`, result);
        return result;
      } catch (error) {
        console.error('Scope authorization error:', error);
        return ApiResponse.error(res, 'Scope authorization failed', 500);
      }
    };
  }

  // Optional authentication (doesn't fail if no token)
  static optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // If token exists, try to authenticate
    return AuthMiddleware.authenticate(req, res, next);
  }
}

module.exports = AuthMiddleware;