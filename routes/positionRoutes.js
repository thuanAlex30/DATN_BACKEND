const express = require('express');
const Joi = require('joi');
const PositionController = require('../controllers/PositionController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const { positionValidation, commonValidation } = require('../validations/departmentValidation');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// =================== POSITION ROUTES ===================

// Position Statistics
router.get('/stats',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  PositionController.getPositionStats
);

// Position Hierarchy/Management levels
router.get('/hierarchy',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  PositionController.getPositionHierarchy
);

// Position Options for dropdowns
router.get('/options',
  // AuthMiddleware.authenticate, // Temporarily disabled for testing
  // AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ), // Temporarily disabled for testing
  PositionController.getPositionOptions
);

// Search positions with advanced filters
router.get('/search',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(Joi.object({
    search: Joi.string().optional().trim(),
    levels: Joi.alternatives().try(
      Joi.number().integer().min(1).max(10),
      Joi.array().items(Joi.number().integer().min(1).max(10))
    ).optional(),
    is_active: Joi.string().valid('true', 'false').optional().default('true'),
    has_employees: Joi.string().valid('true', 'false').optional(),
    sort_by: Joi.string().valid('position_name', 'level', 'created_at').optional().default('position_name'),
    sort_order: Joi.string().valid('asc', 'desc').optional().default('asc'),
    limit: Joi.number().integer().min(1).max(100).optional().default(50)
  })),
  PositionController.searchPositions
);

// Get management positions (level 7+)
router.get('/management',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(Joi.object({
    minLevel: Joi.number().integer().min(1).max(10).optional().default(7)
  })),
  PositionController.getManagementPositions
);

// Get positions grouped by level
router.get('/grouped-by-level',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  PositionController.getPositionsGroupedByLevel
);

// Get positions by level range
router.get('/by-level',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(Joi.object({
    minLevel: Joi.number().integer().min(1).max(10).optional().default(1),
    maxLevel: Joi.number().integer().min(1).max(10).optional().default(10)
  })),
  PositionController.getPositionsByLevel
);

// Get promotion/demotion options for a position level
router.get('/promotion-options',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(Joi.object({
    currentLevel: Joi.number().integer().min(1).max(10).required()
  })),
  PositionController.getPromotionOptions
);

// Get positions by multiple levels (POST for complex query)
router.post('/by-multiple-levels',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateBody(Joi.object({
    levels: Joi.array()
      .items(Joi.number().integer().min(1).max(10))
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least one level is required',
        'array.max': 'Cannot query more than 10 levels at once'
      })
  })),
  PositionController.getPositionsByMultipleLevels
);

// Clone position
router.post('/:id/clone',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_CREATE),
  ValidationMiddleware.validate({
    params: commonValidation.id,
    body: Joi.object({
      position_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim()
        .messages({
          'string.min': 'Position name must be at least 2 characters long',
          'string.max': 'Position name must not exceed 100 characters',
          'any.required': 'Position name is required'
        }),
      level: Joi.number()
        .integer()
        .min(1)
        .max(10)
        .optional()
        .messages({
          'number.min': 'Position level must be at least 1',
          'number.max': 'Position level cannot exceed 10'
        })
    })
  }),
  PositionController.clonePosition
);

// Bulk delete positions
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_DELETE),
  ValidationMiddleware.validateBody(positionValidation.bulkDelete),
  PositionController.bulkDeletePositions
);

// Get all positions with pagination and filters
router.get('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(positionValidation.query),
  PositionController.getAllPositions
);

// Get position by ID
router.get('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateParams(commonValidation.id),
  PositionController.getPositionById
);

// Create new position
router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_CREATE),
  ValidationMiddleware.validateBody(positionValidation.create),
  PositionController.createPosition
);

// Update position
router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_UPDATE),
  ValidationMiddleware.validate({
    params: commonValidation.id,
    body: positionValidation.update
  }),
  PositionController.updatePosition
);

// Delete position
router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_DELETE),
  ValidationMiddleware.validateParams(commonValidation.id),
  PositionController.deletePosition
);

module.exports = router;