const express = require('express');
const router = express.Router();
const ContactMessageController = require('../controllers/contactMessageController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Public route - anyone can send contact message
router.post('/', ContactMessageController.createMessage);

// Protected routes - only system admin can access
// IMPORTANT: Specific routes must come before parameterized routes
router.get('/unread-count',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.getUnreadCount
);

router.get('/', 
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.getMessages
);

router.get('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.getMessageById
);

router.patch('/:id/read',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.markAsRead
);

router.post('/:id/reply',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.replyToMessage
);

router.patch('/:id/archive',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.archiveMessage
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  ContactMessageController.deleteMessage
);

module.exports = router;

