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
    const userId = req.user._id || req.user.id;
    const tenantId = req.user.tenant_id;
    
    const result = await projectCommunicationService.createNotification(notificationData);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for project communication
      try {
        const ProjectNotificationService = require('../services/projectNotificationService');
        const Project = require('../models/project');
        const User = require('../models/user');
        const ProjectAssignment = require('../models/projectAssignment');
        
        // Get project info
        const project = await Project.findById(notificationData.project_id).select('_id project_name name title tenant_id').lean();
        
        if (project) {
          // Get all users assigned to project
          const assignments = await ProjectAssignment.find({
            project_id: notificationData.project_id,
            is_active: true
          }).select('user_id').lean();
          
          const userIds = assignments.map(a => a.user_id).filter(Boolean);
          const projectUsers = await User.find({
            _id: { $in: userIds },
            is_active: true
          }).select('_id full_name').lean();
          
          // Get creator info
          const creator = await User.findById(userId).select('_id full_name').lean();
          
          await ProjectNotificationService.notifyProjectCommunication({
            project,
            notification: result.data,
            creator: creator || { _id: userId, full_name: req.user.full_name || req.user.name },
            projectUsers,
            tenantId: tenantId || project.tenant_id
          });
        }
      } catch (notifError) {
        console.error('Failed to send project communication notification:', notifError);
      }
      
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
