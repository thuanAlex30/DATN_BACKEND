const SystemSettings = require('../models/systemSettings');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class SystemSettingsController {
  // Get system settings
  static getSettings = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const settings = await SystemSettings.getSettings();
      return ApiResponse.success(res, settings, 'System settings retrieved successfully');
    } catch (error) {
      console.error('Error getting system settings:', error);
      return ApiResponse.error(res, 'Failed to retrieve system settings', 500);
    }
  });

  // Update system settings
  static updateSettings = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const updateData = req.body;
      
      // Get existing settings or create new
      let settings = await SystemSettings.findOne();
      if (!settings) {
        settings = new SystemSettings(updateData);
      } else {
        Object.assign(settings, updateData);
        settings.updated_at = new Date();
      }
      
      await settings.save();
      
      return ApiResponse.success(res, settings, 'System settings updated successfully');
    } catch (error) {
      console.error('Error updating system settings:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.error(res, error.message, 400);
      }
      return ApiResponse.error(res, 'Failed to update system settings', 500);
    }
  });
}

module.exports = SystemSettingsController;

