const express = require('express');
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const userValidation = require('../validations/uservalidation');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Get users with pagination and filters
router.get('/', 
  ValidationMiddleware.validateQuery(userValidation.query),
  AuthMiddleware.authorize(PERMISSIONS.USER_LIST),
  UserController.getUsers
);

// Get all active users (for dropdowns, etc.)
router.get('/all', 
  AuthMiddleware.authorize(PERMISSIONS.USER_LIST),
  UserController.getAllUsers
);

// Get user statistics
router.get('/stats', 
  AuthMiddleware.authorize(PERMISSIONS.USER_LIST),
  UserController.getUserStats
);

// Create new user
router.post('/', 
  ValidationMiddleware.validateBody(userValidation.create),
  AuthMiddleware.authorize(PERMISSIONS.USER_CREATE),
  UserController.createUser
);

// Get user by ID
router.get('/:id', 
  ValidationMiddleware.validateParams(userValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.USER_READ),
  UserController.getUserById
);

// Update user
router.put('/:id', 
  ValidationMiddleware.validate({
    params: userValidation.id,
    body: userValidation.update
  }),
  AuthMiddleware.authorize(PERMISSIONS.USER_UPDATE),
  UserController.updateUser
);

// Delete user (soft delete)
router.delete('/:id', 
  ValidationMiddleware.validateParams(userValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.USER_DELETE),
  UserController.deleteUser
);

// Reset user password
router.post('/:id/reset-password', 
  ValidationMiddleware.validateParams(userValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.USER_UPDATE),
  UserController.resetPassword
);

// Toggle user status (activate/deactivate)
router.patch('/:id/toggle-status', 
  ValidationMiddleware.validateParams(userValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.USER_UPDATE),
  UserController.toggleUserStatus
);

module.exports = router;