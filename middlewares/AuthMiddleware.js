const JWTConfig = require('../config/jwt');
const ApiResponse = require('../utils/response');
const UserRepository = require('../repository/UserRepository');
const { PermissionUtils } = require('../utils/permissions');

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

      // Populate role information
      await user.populate('role_id');
      
      if (!user.role_id || !user.role_id.is_active) {
        return ApiResponse.unauthorized(res, 'Invalid or inactive role');
      }

      // Attach user info to request
      req.user = {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: {
          _id: user.role_id._id,
          role_name: user.role_id.role_name,
          permissions: user.role_id.permissions || {}
        },
        role_id: user.role_id._id,
        department_id: user.department_id,
        position_id: user.position_id,
        permissions: user.role_id.permissions || {}
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

  // Check if user has specific role
  static authorizeRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
      try {
        if (!req.user) {
          return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const userRoleName = req.user.role?.role_name || req.user.role;
        if (!allowedRoles.includes(userRoleName)) {
          return ApiResponse.forbidden(res, 'Insufficient role permissions');
        }

        next();
      } catch (error) {
        console.error('Role authorization error:', error);
        return ApiResponse.error(res, 'Role authorization failed', 500);
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