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
// Cho phép Department Head, Company Admin, System Admin
router.post('/import', 
  AuthMiddleware.authenticate,
  upload.single('file'),
  AuthMiddleware.authorizeRole([
    'department_header',
    'company_admin',
    'system_admin'
  ]),
  (req, res, next) => {
    // Set timeout for this specific route
    req.setTimeout(300000); // 5 minutes
    next();
  },
  UserController.importUsers
);

// Get user by ID
// Allow Manager (role_level >= 70) to read users in same department for PPE issuance
router.get('/:id', 
  ValidationMiddleware.validateParams(userValidation.id),
  (req, res, next) => {
    // Check if user is reading themselves FIRST
    const currentUserId = req.user?.id?.toString() || req.user?._id?.toString();
    // Support both user_id (integer) and _id (ObjectId)
    const currentUserIntegerId = req.user?.user_id?.toString();
    const requestId = req.params.id?.toString();
    const isSelf = currentUserId === requestId || 
    currentUserIntegerId === requestId ||
    req.user?._id?.toString() === requestId ||
    (req.user?.user_id && req.user.user_id.toString() === requestId);

    
    // Allow self access for any role
    if (isSelf) {
      console.log('✅ GET /users/:id - Self access detected, allowing immediately');
      return next();
    }
    
    // Allow if user is Manager or higher (role_level >= 70) OR has permission
    const userRole = req.user?.role;
    const roleLevel = userRole?.role_level || req.user?.role_level;
    const isManagerOrHigher = roleLevel >= 70;
    
    console.log('🔍 GET /users/:id - Route middleware check:', {
      userId: req.user?.id,
      requestId,
      isSelf,
      roleName: userRole?.role_name,
      roleCode: userRole?.role_code,
      roleLevel: roleLevel,
      isManagerOrHigher,
      path: req.path
    });
    
    if (isManagerOrHigher) {
      // Manager can read users - check will be done in controller for same department
      console.log('✅ GET /users/:id - Manager access allowed, passing to controller');
      return next();
    }
    
    // For other roles, check permission matrix
    console.log('🔍 GET /users/:id - Checking permission matrix');
    return AuthMiddleware.authorizeScope({ 
      modules: 'user', 
      action: 'read', 
      tenantScope: 'tenant'
    })(req, res, next);
  },
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