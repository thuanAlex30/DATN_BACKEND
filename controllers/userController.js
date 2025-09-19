const UserService = require('../services/UserService');
const ApiResponse = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class UserController {
  // Create new user
  static createUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await UserService.createUser(req.body);
    return ApiResponse.success(res, result, 'User created successfully', 201);
  });

  // Get user by ID
  static getUserById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.getUserById(id);
    return ApiResponse.success(res, result, 'User retrieved successfully');
  });

  // Update user
  static updateUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.updateUser(id, req.body);
    return ApiResponse.success(res, result, 'User updated successfully');
  });

  // Delete user
  static deleteUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.deleteUser(id);
    return ApiResponse.success(res, result, 'User deleted successfully');
  });

  // Get users with pagination and filters
  static getUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await UserService.getUsers(req.query);
    return ApiResponse.success(res, result, 'Users retrieved successfully');
  });

  // Get all active users
  static getAllUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await UserService.getAllUsers();
    return ApiResponse.success(res, result, 'All users retrieved successfully');
  });

  // Reset user password
  static resetPassword = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await UserService.resetPassword(id, newPassword);
    return ApiResponse.success(res, result, 'Password reset successfully');
  });

  // Toggle user status
  static toggleUserStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.toggleUserStatus(id);
    return ApiResponse.success(res, result, result.message);
  });

  // Get user statistics
  static getUserStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await UserService.getUserStats();
    return ApiResponse.success(res, result, 'User statistics retrieved successfully');
  });

  // Import users from Excel
  static importUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    try {
      console.log(`📁 Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
      const result = await UserService.importUsersFromExcel(req.file);
      console.log(`✅ Import completed: ${result.success.length} success, ${result.errors.length} errors`);
      return ApiResponse.success(res, result, 'Users imported successfully');
    } catch (error) {
      console.error('❌ Import error:', error.message);
      return ApiResponse.error(res, `Import failed: ${error.message}`, 500);
    }
  });
}

module.exports = UserController;