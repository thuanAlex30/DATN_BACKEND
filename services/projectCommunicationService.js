const ProjectMessage = require('../models/ProjectMessage');
const ProjectNotification = require('../models/ProjectNotification');
const ProjectMeeting = require('../models/ProjectMeeting');
const Project = require('../models/project');
const User = require('../models/user');

class ProjectCommunicationService {
  // ========== MESSAGE MANAGEMENT ==========
  
  static async getProjectMessages(projectId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const messages = await ProjectMessage.find({
        project_id: projectId,
        is_deleted: false
      })
      .populate('sender_id', 'full_name username email')
      .populate('reply_to')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

      const total = await ProjectMessage.countDocuments({
        project_id: projectId,
        is_deleted: false
      });

      return {
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Messages retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting project messages:', error);
      return {
        success: false,
        message: 'Failed to retrieve messages',
        error: error.message
      };
    }
  }

  static async sendMessage(messageData, senderId) {
    try {
      const message = new ProjectMessage({
        ...messageData,
        sender_id: senderId
      });

      await message.save();
      await message.populate('sender_id', 'full_name username email');

      return {
        success: true,
        data: message,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: 'Failed to send message',
        error: error.message
      };
    }
  }

  static async deleteMessage(messageId, userId) {
    try {
      const message = await ProjectMessage.findById(messageId);
      
      if (!message) {
        return {
          success: false,
          message: 'Message not found'
        };
      }

      // Check if user can delete (sender or admin)
      if (message.sender_id.toString() !== userId.toString()) {
        // Check if user is admin (you might want to add role check here)
        return {
          success: false,
          message: 'Unauthorized to delete this message'
        };
      }

      message.is_deleted = true;
      message.deleted_at = new Date();
      message.deleted_by = userId;
      await message.save();

      return {
        success: true,
        data: { id: messageId },
        message: 'Message deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        message: 'Failed to delete message',
        error: error.message
      };
    }
  }

  // ========== NOTIFICATION MANAGEMENT ==========
  
  static async getProjectNotifications(projectId) {
    try {
      const notifications = await ProjectNotification.find({
        project_id: projectId
      })
      .populate('user_id', 'full_name username email')
      .sort({ created_at: -1 });

      return {
        success: true,
        data: notifications,
        message: 'Project notifications retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting project notifications:', error);
      return {
        success: false,
        message: 'Failed to retrieve project notifications',
        error: error.message
      };
    }
  }

  static async getUserNotifications(userId, filters = {}) {
    try {
      const query = {
        user_id: userId,
        is_archived: false
      };
      
      // Add project filter if provided
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      
      const notifications = await ProjectNotification.find(query)
        .populate('project_id', 'project_name')
        .sort({ created_at: -1 });

      return {
        success: true,
        data: notifications,
        message: 'User notifications retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return {
        success: false,
        message: 'Failed to retrieve user notifications',
        error: error.message
      };
    }
  }

  static async createNotification(notificationData) {
    try {
      const notification = new ProjectNotification(notificationData);
      await notification.save();
      await notification.populate('user_id', 'full_name username email');

      return {
        success: true,
        data: notification,
        message: 'Notification created successfully'
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: 'Failed to create notification',
        error: error.message
      };
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      const notification = await ProjectNotification.findById(notificationId);
      
      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();

      return {
        success: true,
        data: notification,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      };
    }
  }

  static async markAllNotificationsAsRead(userId, filters = {}) {
    try {
      const query = { user_id: userId, is_read: false };
      
      // Add project filter if provided
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      
      const result = await ProjectNotification.updateMany(
        query,
        { 
          is_read: true, 
          read_at: new Date() 
        }
      );

      return {
        success: true,
        data: { updatedCount: result.modifiedCount },
        message: 'All notifications marked as read'
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      };
    }
  }

  // ========== MEETING MANAGEMENT ==========
  
  static async getProjectMeetings(projectId) {
    try {
      const meetings = await ProjectMeeting.find({
        project_id: projectId
      })
      .populate('created_by', 'full_name username email')
      .populate('attendees.user_id', 'full_name username email')
      .sort({ meeting_date: 1 });

      return {
        success: true,
        data: meetings,
        message: 'Project meetings retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting project meetings:', error);
      return {
        success: false,
        message: 'Failed to retrieve project meetings',
        error: error.message
      };
    }
  }

  static async createMeeting(meetingData, createdBy) {
    try {
      const meeting = new ProjectMeeting({
        ...meetingData,
        created_by: createdBy
      });

      await meeting.save();
      await meeting.populate('created_by', 'full_name username email');
      await meeting.populate('attendees.user_id', 'full_name username email');

      return {
        success: true,
        data: meeting,
        message: 'Meeting created successfully'
      };
    } catch (error) {
      console.error('Error creating meeting:', error);
      return {
        success: false,
        message: 'Failed to create meeting',
        error: error.message
      };
    }
  }

  static async updateMeeting(meetingId, updateData) {
    try {
      const meeting = await ProjectMeeting.findByIdAndUpdate(
        meetingId,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('created_by', 'full_name username email')
      .populate('attendees.user_id', 'full_name username email');

      if (!meeting) {
        return {
          success: false,
          message: 'Meeting not found'
        };
      }

      return {
        success: true,
        data: meeting,
        message: 'Meeting updated successfully'
      };
    } catch (error) {
      console.error('Error updating meeting:', error);
      return {
        success: false,
        message: 'Failed to update meeting',
        error: error.message
      };
    }
  }

  static async deleteMeeting(meetingId) {
    try {
      const meeting = await ProjectMeeting.findByIdAndDelete(meetingId);

      if (!meeting) {
        return {
          success: false,
          message: 'Meeting not found'
        };
      }

      return {
        success: true,
        data: { id: meetingId },
        message: 'Meeting deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return {
        success: false,
        message: 'Failed to delete meeting',
        error: error.message
      };
    }
  }

  // ========== STATISTICS ==========
  
  static async getCommunicationStats(projectId) {
    try {
      const [messageCount, notificationCount, meetingCount] = await Promise.all([
        ProjectMessage.countDocuments({ project_id: projectId, is_deleted: false }),
        ProjectNotification.countDocuments({ project_id: projectId }),
        ProjectMeeting.countDocuments({ project_id: projectId })
      ]);

      const unreadNotifications = await ProjectNotification.countDocuments({
        project_id: projectId,
        is_read: false
      });

      return {
        success: true,
        data: {
          totalMessages: messageCount,
          totalNotifications: notificationCount,
          totalMeetings: meetingCount,
          unreadNotifications
        },
        message: 'Communication statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting communication stats:', error);
      return {
        success: false,
        message: 'Failed to retrieve communication statistics',
        error: error.message
      };
    }
  }
}

module.exports = ProjectCommunicationService;
