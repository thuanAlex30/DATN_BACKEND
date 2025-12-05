const projectCommunicationService = require('../services/projectCommunicationService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class ProjectCommunicationController {
  // ========== MESSAGE MANAGEMENT ==========
  
  static getProjectMessages = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await projectCommunicationService.getProjectMessages(
      projectId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static sendMessage = ErrorMiddleware.asyncHandler(async (req, res) => {
    const messageData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectCommunicationService.sendMessage(messageData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static deleteMessage = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectCommunicationService.deleteMessage(messageId, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  // ========== NOTIFICATION MANAGEMENT ==========
  
  static getProjectNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    
    const result = await projectCommunicationService.getProjectNotifications(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static getUserNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    
    const result = await projectCommunicationService.getUserNotifications(userId, { project_id: projectId });
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static createNotification = ErrorMiddleware.asyncHandler(async (req, res) => {
    const notificationData = req.body;
    
    const result = await projectCommunicationService.createNotification(notificationData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static markNotificationAsRead = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    
    const result = await projectCommunicationService.markNotificationAsRead(notificationId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static markAllNotificationsAsRead = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    
    const result = await projectCommunicationService.markAllNotificationsAsRead(userId, { project_id: projectId });
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  // ========== MEETING MANAGEMENT ==========
  
  static getProjectMeetings = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    
    const result = await projectCommunicationService.getProjectMeetings(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static createMeeting = ErrorMiddleware.asyncHandler(async (req, res) => {
    const meetingData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectCommunicationService.createMeeting(meetingData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static updateMeeting = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const updateData = req.body;
    
    const result = await projectCommunicationService.updateMeeting(meetingId, updateData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  static deleteMeeting = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    
    const result = await projectCommunicationService.deleteMeeting(meetingId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });

  // ========== STATISTICS ==========
  
  static getCommunicationStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    
    const result = await projectCommunicationService.getCommunicationStats(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, 400, result.data);
    }
  });
}

module.exports = ProjectCommunicationController;
