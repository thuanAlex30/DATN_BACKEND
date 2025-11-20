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
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'list', tenantScope: 'tenant' }),
  UserController.getUsers
);

// Get all active users (for dropdowns, etc.)
router.get('/all', 
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'list', tenantScope: 'tenant' }),
  UserController.getAllUsers
);

// Get potential managers
router.get('/managers', 
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'read', tenantScope: 'tenant' }),
  UserController.getPotentialManagers
);

// Get user statistics
router.get('/stats', 
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'read', tenantScope: 'tenant' }),
  UserController.getUserStats
);

// Create new user
router.post('/', 
  ValidationMiddleware.validateBody(userValidation.create),
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'create', tenantScope: 'tenant' }),
  UserController.createUser
);

// Import users from Excel
router.post('/import', 
  upload.single('file'),
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'create', tenantScope: 'tenant' }),
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
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'read', tenantScope: 'tenant' }),
  UserController.getUserById
);

// Update user
router.put('/:id', 
  ValidationMiddleware.validate({
    params: userValidation.id,
    body: userValidation.update
  }),
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'update', tenantScope: 'tenant' }),
  UserController.updateUser
);

// Delete user (soft delete)
router.delete('/:id', 
  ValidationMiddleware.validateParams(userValidation.id),
  AuthMiddleware.authorizeScope({ modules: 'user', action: 'delete', tenantScope: 'tenant' }),
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