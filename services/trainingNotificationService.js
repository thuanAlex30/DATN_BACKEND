/**
 * Training Notification Service
 * Wrapper service for sending training notifications via RealtimeNotificationService
 * Ensures all training notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class TrainingNotificationService {
  /**
   * Send notification when course set is created
   * @param {Object} options - Notification options
   * @param {Object} options.courseSet - Course set data
   * @param {Object} options.creator - Creator information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyCourseSetCreated({ courseSet, creator, tenantId }) {
    try {
      await RealtimeNotificationService.sendToTenant({
        tenantId,
        title: 'Course Set mới được tạo',
        message: `Course Set "${courseSet.name || courseSet.courseSetName}" đã được tạo`,
        type: 'info',
        category: 'training',
        priority: 'medium',
        actionUrl: `/training/course-sets/${courseSet._id || courseSet.id}`,
        data: {
          courseSetId: courseSet._id || courseSet.id,
          courseSetName: courseSet.name || courseSet.courseSetName,
          category: courseSet.category,
          duration: courseSet.duration,
          creatorId: creator?._id || creator?.id,
          creatorName: creator?.full_name || creator?.name
        },
        eventName: 'course_set_created',
        saveToDatabase: false, // Broadcast to all, don't save to database
        sendWebSocket: true
      });

      logger.info('Course set created notification sent', {
        courseSetId: courseSet._id || courseSet.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending course set created notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when course set is updated
   * @param {Object} options - Notification options
   * @param {Object} options.courseSet - Course set data
   * @param {Object} options.updater - Updater information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyCourseSetUpdated({ courseSet, updater, tenantId }) {
    try {
      await RealtimeNotificationService.sendToTenant({
        tenantId,
        title: 'Course Set được cập nhật',
        message: `Course Set "${courseSet.name || courseSet.courseSetName}" đã được cập nhật`,
        type: 'info',
        category: 'training',
        priority: 'low',
        actionUrl: `/training/course-sets/${courseSet._id || courseSet.id}`,
        data: {
          courseSetId: courseSet._id || courseSet.id,
          courseSetName: courseSet.name || courseSet.courseSetName,
          updaterId: updater?._id || updater?.id,
          updaterName: updater?.full_name || updater?.name
        },
        eventName: 'course_set_updated',
        saveToDatabase: false,
        sendWebSocket: true
      });

      logger.info('Course set updated notification sent', {
        courseSetId: courseSet._id || courseSet.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending course set updated notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when training session is created
   * @param {Object} options - Notification options
   * @param {Object} options.session - Training session data
   * @param {Object} options.creator - Creator information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyTrainingSessionCreated({ session, creator, tenantId }) {
    try {
      await RealtimeNotificationService.sendToTenant({
        tenantId,
        title: 'Training Session mới được tạo',
        message: `Training Session "${session.name || session.sessionName}" đã được tạo`,
        type: 'info',
        category: 'training',
        priority: 'medium',
        actionUrl: `/training/sessions/${session._id || session.id}`,
        data: {
          sessionId: session._id || session.id,
          sessionName: session.name || session.sessionName,
          courseSetId: session.courseSetId || session.course_set_id,
          startDate: session.startDate || session.start_date,
          endDate: session.endDate || session.end_date,
          creatorId: creator?._id || creator?.id,
          creatorName: creator?.full_name || creator?.name
        },
        eventName: 'training_session_created',
        saveToDatabase: false,
        sendWebSocket: true
      });

      logger.info('Training session created notification sent', {
        sessionId: session._id || session.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending training session created notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when user is enrolled in training
   * @param {Object} options - Notification options
   * @param {Object} options.enrollment - Enrollment data
   * @param {Object} options.user - Enrolled user information
   * @param {Object} options.enroller - Enroller information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyTrainingEnrollment({ enrollment, user, enroller, tenantId }) {
    try {
      const notifications = [];

      // Notify enrolled user (personal notification)
      if (user && (user._id || user.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: user._id || user.id,
            title: 'Bạn đã được đăng ký Training',
            message: `Bạn đã được đăng ký vào Training Session`,
            type: 'success',
            category: 'training',
            priority: 'medium',
            tenantId,
            actionUrl: `/training/sessions/${enrollment.sessionId || enrollment.session_id}`,
            data: {
              enrollmentId: enrollment._id || enrollment.id,
              sessionId: enrollment.sessionId || enrollment.session_id,
              enrolledAt: enrollment.enrolledAt || enrollment.enrolled_at,
              status: enrollment.status,
              enrollerId: enroller?._id || enroller?.id,
              enrollerName: enroller?.full_name || enroller?.name
            },
            eventName: 'training_enrolled',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Training Enrollment',
          message: `${user?.full_name || user?.name || 'Người dùng'} đã được đăng ký vào Training Session`,
          type: 'info',
          category: 'training',
          priority: 'low',
          actionUrl: `/training/sessions/${enrollment.sessionId || enrollment.session_id}`,
          data: {
            enrollmentId: enrollment._id || enrollment.id,
            userId: user?._id || user?.id,
            userName: user?.full_name || user?.name
          },
          eventName: 'training_enrollment',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Training enrollment notifications sent', {
        enrollmentId: enrollment._id || enrollment.id,
        userId: user?._id || user?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending training enrollment notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when training is completed
   * @param {Object} options - Notification options
   * @param {Object} options.completion - Completion data
   * @param {Object} options.user - User who completed training
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyTrainingCompletion({ completion, user, tenantId }) {
    try {
      const notifications = [];

      // Notify user who completed (personal notification)
      if (user && (user._id || user.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: user._id || user.id,
            title: 'Training đã hoàn thành',
            message: `Bạn đã hoàn thành Training Session`,
            type: 'success',
            category: 'training',
            priority: 'medium',
            tenantId,
            actionUrl: `/training/sessions/${completion.sessionId || completion.session_id}`,
            data: {
              completionId: completion._id || completion.id,
              sessionId: completion.sessionId || completion.session_id,
              completedAt: completion.completedAt || completion.completed_at,
              score: completion.score,
              status: completion.status
            },
            eventName: 'training_completed',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Training Completion',
          message: `${user?.full_name || user?.name || 'Người dùng'} đã hoàn thành Training Session`,
          type: 'success',
          category: 'training',
          priority: 'low',
          actionUrl: `/training/sessions/${completion.sessionId || completion.session_id}`,
          data: {
            completionId: completion._id || completion.id,
            userId: user?._id || user?.id,
            userName: user?.full_name || user?.name,
            score: completion.score
          },
          eventName: 'training_completion',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Training completion notifications sent', {
        completionId: completion._id || completion.id,
        userId: user?._id || user?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending training completion notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when training is retaken
   * @param {Object} options - Notification options
   * @param {Object} options.retake - Retake data
   * @param {Object} options.user - User who retook training
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyTrainingRetake({ retake, user, tenantId }) {
    try {
      const notifications = [];

      // Notify user who retook (personal notification)
      if (user && (user._id || user.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: user._id || user.id,
            title: 'Training được làm lại',
            message: `Bạn đã làm lại Training Session`,
            type: 'warning',
            category: 'training',
            priority: 'medium',
            tenantId,
            actionUrl: `/training/sessions/${retake.sessionId || retake.session_id}`,
            data: {
              retakeId: retake._id || retake.id,
              sessionId: retake.sessionId || retake.session_id,
              retakenAt: retake.retakenAt || retake.retaken_at,
              previousScore: retake.previousScore || retake.previous_score,
              status: retake.status
            },
            eventName: 'training_retaken',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Training Retake',
          message: `${user?.full_name || user?.name || 'Người dùng'} đã làm lại Training Session`,
          type: 'info',
          category: 'training',
          priority: 'low',
          actionUrl: `/training/sessions/${retake.sessionId || retake.session_id}`,
          data: {
            retakeId: retake._id || retake.id,
            userId: user?._id || user?.id,
            userName: user?.full_name || user?.name
          },
          eventName: 'training_retake',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Training retake notifications sent', {
        retakeId: retake._id || retake.id,
        userId: user?._id || user?.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending training retake notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when course is assigned to department
   * @param {Object} options - Notification options
   * @param {Object} options.assignment - Assignment data
   * @param {Object} options.departmentManager - Department manager information
   * @param {Object} options.assigner - Assigner information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyTrainingAssignment({ assignment, departmentManager, assigner, tenantId }) {
    try {
      const notifications = [];

      // Notify department manager (personal notification)
      if (departmentManager && (departmentManager._id || departmentManager.id)) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: departmentManager._id || departmentManager.id,
            title: 'Course được gán cho Department',
            message: `Course đã được gán cho Department của bạn`,
            type: 'info',
            category: 'training',
            priority: 'medium',
            tenantId,
            actionUrl: `/training/assignments/${assignment._id || assignment.id}`,
            data: {
              assignmentId: assignment._id || assignment.id,
              courseId: assignment.courseId || assignment.course_id,
              departmentId: assignment.departmentId || assignment.department_id,
              assignedAt: assignment.assignedAt || assignment.assigned_at,
              assignerId: assigner?._id || assigner?.id,
              assignerName: assigner?.full_name || assigner?.name
            },
            eventName: 'course_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Training Assignment',
          message: `Course đã được gán cho Department`,
          type: 'info',
          category: 'training',
          priority: 'low',
          actionUrl: `/training/assignments/${assignment._id || assignment.id}`,
          data: {
            assignmentId: assignment._id || assignment.id,
            courseId: assignment.courseId || assignment.course_id,
            departmentId: assignment.departmentId || assignment.department_id,
            assignerId: assigner?._id || assigner?.id,
            assignerName: assigner?.full_name || assigner?.name
          },
          eventName: 'training_assignment',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Training assignment notifications sent', {
        assignmentId: assignment._id || assignment.id,
        departmentId: assignment.departmentId || assignment.department_id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending training assignment notifications:', error);
      throw error;
    }
  }
}

module.exports = TrainingNotificationService;

