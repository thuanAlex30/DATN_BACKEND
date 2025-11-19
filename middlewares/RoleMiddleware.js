/**
 * Role-based Authorization Middleware
 * Provides role-based access control for routes
 */

const AuthMiddleware = require('./AuthMiddleware');

class RoleMiddleware {
  /**
   * Check if user has specific role(s)
   * @param {string|Array} roles - Role name(s) to check
   * @returns {Function} Express middleware function
   */
  static requireRole(roles) {
    return AuthMiddleware.authorizeRole(roles);
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array} roles - Array of role names
   * @returns {Function} Express middleware function
   */
  static requireAnyRole(roles) {
    return AuthMiddleware.authorizeRole(roles);
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {Function} Express middleware function
   */
  static requirePermission(permission) {
    return AuthMiddleware.authorize(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array} permissions - Array of permissions
   * @returns {Function} Express middleware function
   */
  static requireAnyPermission(permissions) {
    return AuthMiddleware.authorizeAny(permissions);
  }

  /**
   * Check if user has all specified permissions
   * @param {Array} permissions - Array of permissions
   * @returns {Function} Express middleware function
   */
  static requireAllPermissions(permissions) {
    return AuthMiddleware.authorizeAll(permissions);
  }
}

module.exports = RoleMiddleware;
