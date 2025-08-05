const AuthService = require('../services/AuthService');
const ApiResponse = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class AuthController {
  // Register new user
  static register = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    return ApiResponse.success(res, result, 'User registered successfully', 201);
  });

  // Login user
  static login = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);
    return ApiResponse.success(res, result, 'Login successful');
  });

  // Refresh access token
  static refreshToken = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    return ApiResponse.success(res, result, 'Token refreshed successfully');
  });

  // Change password
  static changePassword = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const result = await AuthService.changePassword(userId, currentPassword, newPassword);
    return ApiResponse.success(res, result, 'Password changed successfully');
  });

  // Get user profile
  static getProfile = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await AuthService.getProfile(userId);
    return ApiResponse.success(res, result, 'Profile retrieved successfully');
  });

  // Update user profile
  static updateProfile = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await AuthService.updateProfile(userId, req.body);
    return ApiResponse.success(res, result, 'Profile updated successfully');
  });

  // Logout user
  static logout = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await AuthService.logout(userId);
    return ApiResponse.success(res, result, 'Logout successful');
  });

  // Get current user info
  static me = ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      permissions: req.user.permissions
    };
    return ApiResponse.success(res, user, 'Current user info retrieved successfully');
  });
}

module.exports = AuthController;