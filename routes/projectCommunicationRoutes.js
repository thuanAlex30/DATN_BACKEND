const express = require('express');
const router = express.Router();
const projectCommunicationController = require('../controllers/projectCommunicationController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const projectValidation = require('../validations/projectValidation');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== MESSAGE ROUTES ==========

// GET /api/project-communication/:projectId/messages - Get project messages
router.get('/:projectId/messages', projectCommunicationController.getProjectMessages);

// POST /api/project-communication/messages - Send message
router.post('/messages', projectCommunicationController.sendMessage);

// DELETE /api/project-communication/messages/:messageId - Delete message
router.delete('/messages/:messageId', projectCommunicationController.deleteMessage);

// ========== NOTIFICATION ROUTES ==========

// GET /api/project-communication/:projectId/notifications - Get project notifications
router.get('/:projectId/notifications', projectCommunicationController.getProjectNotifications);

// GET /api/project-communication/project/:projectId/notifications/user/:userId - Get user notifications in project
router.get('/project/:projectId/notifications/user/:userId', 
  ValidationMiddleware.validateParams(projectValidation.projectUserParams),
  projectCommunicationController.getUserNotifications);

// POST /api/project-communication/notifications - Create notification
router.post('/notifications', projectCommunicationController.createNotification);

// PUT /api/project-communication/notifications/:notificationId/read - Mark notification as read
router.put('/notifications/:notificationId/read', projectCommunicationController.markNotificationAsRead);

// PUT /api/project-communication/project/:projectId/notifications/user/:userId/read-all - Mark all user notifications as read in project
router.put('/project/:projectId/notifications/user/:userId/read-all', 
  ValidationMiddleware.validateParams(projectValidation.projectUserParams),
  projectCommunicationController.markAllNotificationsAsRead);

// ========== MEETING ROUTES ==========

// GET /api/project-communication/:projectId/meetings - Get project meetings
router.get('/:projectId/meetings', projectCommunicationController.getProjectMeetings);

// POST /api/project-communication/meetings - Create meeting
router.post('/meetings', projectCommunicationController.createMeeting);

// PUT /api/project-communication/meetings/:meetingId - Update meeting
router.put('/meetings/:meetingId', projectCommunicationController.updateMeeting);

// DELETE /api/project-communication/meetings/:meetingId - Delete meeting
router.delete('/meetings/:meetingId', projectCommunicationController.deleteMeeting);

// ========== STATISTICS ROUTES ==========

// GET /api/project-communication/:projectId/stats - Get communication statistics
router.get('/:projectId/stats', projectCommunicationController.getCommunicationStats);

module.exports = router;
