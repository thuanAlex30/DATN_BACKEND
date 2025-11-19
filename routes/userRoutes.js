const express = require('express');
const multer = require('multer');
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const userValidation = require('../validations/uservalidation');
const { PERMISSIONS } = require('../utils/permissions');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased from 5MB)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

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

// Get potential managers
router.get('/managers', 
  AuthMiddleware.authorize(PERMISSIONS.USER_LIST),
  UserController.getPotentialManagers
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

// Import users from Excel
router.post('/import', 
  upload.single('file'),
  AuthMiddleware.authorize(PERMISSIONS.USER_CREATE),
  (req, res, next) => {
    // Set timeout for this specific route
    req.setTimeout(300000); // 5 minutes
    next();
  },
  UserController.importUsers
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