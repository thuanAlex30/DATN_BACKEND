const express = require('express');
const RoleController = require('../controllers/roleController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const Joi = require('joi');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// Role validation schemas
const roleValidation = {
  create: Joi.object({
    role_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim(),
    description: Joi.string()
      .max(255)
      .optional()
      .trim(),
    permissions: Joi.object()
      .optional()
      .default({}),
    is_active: Joi.boolean()
      .optional()
      .default(true)
  }),

  update: Joi.object({
    role_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .trim(),
    description: Joi.string()
      .max(255)
      .optional()
      .trim(),
    permissions: Joi.object()
      .optional(),
    is_active: Joi.boolean()
      .optional()
  }).min(1),

  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(10),
    search: Joi.string()
      .optional()
      .trim(),
    is_active: Joi.boolean()
      .optional(),
    sort_by: Joi.string()
      .valid('role_name', 'created_at', 'updated_at')
      .optional()
      .default('role_name'),
    sort_order: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('asc')
  }),

  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid role ID format'
      })
  })
};

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Get roles with pagination and filters
router.get('/', 
  ValidationMiddleware.validateQuery(roleValidation.query),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_LIST),
  RoleController.getRoles
);

// Get all active roles (for dropdowns, etc.)
router.get('/active', 
  AuthMiddleware.authorize(PERMISSIONS.ROLE_LIST),
  RoleController.getAllActiveRoles
);

// Get all roles (including inactive)
router.get('/all', 
  AuthMiddleware.authorize(PERMISSIONS.ROLE_LIST),
  RoleController.getAllRoles
);

// Get role statistics
router.get('/stats', 
  AuthMiddleware.authorize(PERMISSIONS.ROLE_LIST),
  RoleController.getRoleStats
);

// Create new role
router.post('/', 
  ValidationMiddleware.validateBody(roleValidation.create),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_CREATE),
  RoleController.createRole
);

// Get role by ID
router.get('/:id', 
  ValidationMiddleware.validateParams(roleValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_READ),
  RoleController.getRoleById
);

// Update role
router.put('/:id', 
  ValidationMiddleware.validate({
    params: roleValidation.id,
    body: roleValidation.update
  }),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_UPDATE),
  RoleController.updateRole
);

// Delete role (soft delete)
router.delete('/:id', 
  ValidationMiddleware.validateParams(roleValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_DELETE),
  RoleController.deleteRole
);

// Toggle role status (activate/deactivate)
router.patch('/:id/toggle-status', 
  ValidationMiddleware.validateParams(roleValidation.id),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_UPDATE),
  RoleController.toggleRoleStatus
);

// Get user count for each role
router.get('/user-counts', 
  AuthMiddleware.authorize(PERMISSIONS.ROLE_LIST),
  RoleController.getRoleUserCounts
);

// Update role permissions
router.patch('/:id/permissions', 
  ValidationMiddleware.validate({
    params: roleValidation.id,
    body: Joi.object({
      permissions: Joi.object().optional().default({})
    })
  }),
  AuthMiddleware.authorize(PERMISSIONS.ROLE_UPDATE),
  RoleController.updateRolePermissions
);

module.exports = router;