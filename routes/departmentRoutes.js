const express = require('express');
const Joi = require('joi');
const DepartmentController = require('../controllers/DepartmentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const { departmentValidation, commonValidation } = require('../validations/departmentValidation');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// =================== DEPARTMENT ROUTES ===================

// Department Statistics (Admin only)
router.get('/stats',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  DepartmentController.getDepartmentStats
);

// Department Options for dropdowns
router.get('/options',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  DepartmentController.getDepartmentOptions
);

// Search departments with advanced filters
router.get('/search',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(departmentValidation.search),
  DepartmentController.searchDepartments
);

// Get all active departments (simple list)
router.get('/active',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  DepartmentController.getActiveDepartments
);

// Bulk delete departments
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_DELETE),
  ValidationMiddleware.validateBody(departmentValidation.bulkDelete),
  DepartmentController.bulkDeleteDepartments
);

router.post('/transfer-employees',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_UPDATE),
  ValidationMiddleware.validateBody(Joi.object({
    fromDepartmentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid source department ID format',
        'any.required': 'Source department ID is required'
      }),
    toDepartmentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid target department ID format',
        'any.required': 'Target department ID is required'
      })
  })),
  DepartmentController.transferEmployees
);

// Get all departments with pagination and filters
router.get('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateQuery(departmentValidation.query),
  DepartmentController.getAllDepartments
);

// Get department by ID
router.get('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateParams(commonValidation.id),
  DepartmentController.getDepartmentById
);

// Get department summary by ID
router.get('/:id/summary',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_READ),
  ValidationMiddleware.validateParams(commonValidation.id),
  DepartmentController.getDepartmentSummary
);

// Create new department
router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_CREATE),
  ValidationMiddleware.validateBody(departmentValidation.create),
  DepartmentController.createDepartment
);

// Update department
router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_UPDATE),
  ValidationMiddleware.validate({
    params: commonValidation.id,
    body: departmentValidation.update
  }),
  DepartmentController.updateDepartment
);

// Delete department
router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PERMISSIONS.DEPARTMENT_DELETE),
  ValidationMiddleware.validateParams(commonValidation.id),
  DepartmentController.deleteDepartment
);

module.exports = router;