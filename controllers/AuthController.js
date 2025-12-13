const AuthService = require('../services/authService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const AuthEvents = require('../events/authEvents');

class AuthController {
  // Register new user
  static register = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    
    // Emit user registered event
    // try {
    //   const metadata = {ss
    //     userId: result.user?._id || result.user?.id,
    //     userRole: result.user?.role,
    //     userFullName: result.user?.full_name,
    //     ipAddress: req.ip,
    //     userAgent: req.get('User-Agent')
    //   };
    //   await AuthEvents.emitUserRegistered(result.user, metadata);
    // } catch (error) {
    //   console.error('❌ Error emitting user registered event:', error);
    //   // Don't fail the request if event emission fails
    // }
    
    return ApiResponse.success(res, result, 'User registered successfully', 201);
  });

  // Login user
  static login = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);
    
    // Emit user login event
    // try {
    //   const metadata = {
    //     userId: result.user?._id || result.user?.id,
    //     userRole: result.user?.role,
    //     userFullName: result.user?.full_name,
    //     ipAddress: req.ip,
    //     userAgent: req.get('User-Agent')
    //   };
    //   const loginData = {
    //     method: 'web',
    //     sessionId: result.sessionId,
    //     deviceInfo: req.get('User-Agent'),
    //     location: req.ip
    //   };
    //   await AuthEvents.emitUserLogin(result.user, loginData, metadata);
    // } catch (error) {
    //   console.error('❌ Error emitting user login event:', error);
    //   // Don't fail the request if event emission fails
    // }
    
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
    const userId = req.user._id || req.user.id;
    
    const result = await AuthService.changePassword(userId, currentPassword, newPassword);
    
    // Emit password changed event
    try {
      const metadata = {
        userId: req.user._id || req.user.id,
        userRole: req.user.role,
        userFullName: req.user.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      const changeData = {
        method: 'web',
        sessionId: req.sessionID,
        passwordStrength: result.passwordStrength,
        isForcedChange: false
      };
      // await AuthEvents.emitPasswordChanged(req.user, changeData, metadata);
    } catch (error) {
      console.error('❌ Error emitting password changed event:', error);
      // Don't fail the request if event emission fails
    }
    
    return ApiResponse.success(res, result, 'Password changed successfully');
  });

  // Get user profile
  static getProfile = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await AuthService.getProfile(userId);
    return ApiResponse.success(res, result, 'Profile retrieved successfully');
  });

  // Update user profile
  static updateProfile = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await AuthService.updateProfile(userId, req.body);
    return ApiResponse.success(res, result, 'Profile updated successfully');
  });

  // Logout user
  static logout = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await AuthService.logout(userId);
    
    // Emit user logout event
    try {
      const metadata = {
        userId: req.user._id || req.user.id,
        userRole: req.user.role,
        userFullName: req.user.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      const logoutData = {
        method: 'web',
        sessionId: result.sessionId,
        sessionDuration: result.sessionDuration
      };
      // await AuthEvents.emitUserLogout(req.user, logoutData, metadata);
    } catch (error) {
      console.error('❌ Error emitting user logout event:', error);
      // Don't fail the request if event emission fails
    }
    
    return ApiResponse.success(res, result, 'Logout successful');
  });

  // Get current user info
  static me = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const result = await AuthService.getProfile(userId);
    return ApiResponse.success(res, result.data, 'Current user info retrieved successfully');
  });
}

module.exports = AuthController;