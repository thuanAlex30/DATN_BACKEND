const Joi = require('joi');

const departmentValidation = {
  create: Joi.object({
    department_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .messages({
        'string.min': 'Department name must be at least 2 characters long',
        'string.max': 'Department name must not exceed 100 characters',
        'any.required': 'Department name is required'
      }),

    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),

    manager_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null)
      .messages({
        'string.pattern.base': 'Invalid manager ID format'
      }),

    is_active: Joi.boolean()
      .optional()
      .default(true)
  }),

  update: Joi.object({
    department_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .trim()
      .messages({
        'string.min': 'Department name must be at least 2 characters long',
        'string.max': 'Department name must not exceed 100 characters'
      }),

    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .allow('')
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),

    manager_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null)
      .messages({
        'string.pattern.base': 'Invalid manager ID format'
      }),

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
      .valid('department_name', 'created_at', 'updated_at')
      .optional()
      .default('created_at'),

    sort_order: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
  }),

  bulkDelete: Joi.object({
    ids: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Invalid department ID format'
          })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one department ID is required',
        'array.max': 'Cannot delete more than 50 departments at once',
        'any.required': 'Department IDs are required'
      })
  }),

  search: Joi.object({
    q: Joi.string()
      .optional()
      .trim()
      .allow('')
      .messages({
        'string.min': 'Search term must be at least 1 character long'
      }),
    
    has_manager: Joi.string()
      .valid('true', 'false')
      .optional(),
      
    has_employees: Joi.string()
      .valid('true', 'false')
      .optional(),
      
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(20)
  })
};

const positionValidation = {
  create: Joi.object({
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

    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),

    level: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.min': 'Position level must be at least 1',
        'number.max': 'Position level cannot exceed 10',
        'any.required': 'Position level is required'
      }),

    is_active: Joi.boolean()
      .optional()
      .default(true)
  }),

  update: Joi.object({
    position_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .trim()
      .messages({
        'string.min': 'Position name must be at least 2 characters long',
        'string.max': 'Position name must not exceed 100 characters'
      }),

    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .allow('')
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),

    level: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .optional()
      .messages({
        'number.min': 'Position level must be at least 1',
        'number.max': 'Position level cannot exceed 10'
      }),

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

    level: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .optional()
      .messages({
        'number.min': 'Level must be at least 1',
        'number.max': 'Level cannot exceed 10'
      }),

    sort_by: Joi.string()
      .valid('position_name', 'level', 'created_at', 'updated_at')
      .optional()
      .default('created_at'),

    sort_order: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
  }),

  bulkDelete: Joi.object({
    ids: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Invalid position ID format'
          })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one position ID is required',
        'array.max': 'Cannot delete more than 50 positions at once',
        'any.required': 'Position IDs are required'
      })
  }),

  levels: Joi.object({
    levels: Joi.array()
      .items(
        Joi.number()
          .integer()
          .min(1)
          .max(10)
      )
      .optional()
      .messages({
        'number.min': 'Level must be at least 1',
        'number.max': 'Level cannot exceed 10'
      })
  })
};

const commonValidation = {
  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required'
      })
  }),

  pagination: Joi.object({
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
      .default(10)
  }),

  search: Joi.object({
    search: Joi.string()
      .optional()
      .trim()
      .min(1)
      .messages({
        'string.min': 'Search term must be at least 1 character long'
      })
  })
};

module.exports = {
  departmentValidation,
  positionValidation,
  commonValidation
};