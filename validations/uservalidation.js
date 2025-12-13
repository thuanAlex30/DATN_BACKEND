const Joi = require('joi');

const userValidation = {
  create: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .trim(),

    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')),

    email: Joi.string()
      .email()
      .max(100)
      .required()
      .trim()
      .lowercase(),

    full_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim(),

    phone: Joi.string()
      .pattern(/^[0-9+\-\(\)\s]+$/)
      .max(20)
      .optional()
      .trim(),

    birth_date: Joi.date()
      .max('now')
      .optional(),

    address: Joi.string()
      .max(255)
      .optional()
      .trim(),

    role_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),

    department_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),


    is_active: Joi.boolean()
      .optional()
  }),

  update: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .optional()
      .trim(),

    email: Joi.string()
      .email()
      .max(100)
      .optional()
      .trim()
      .lowercase(),

    full_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .trim(),

    phone: Joi.string()
      .pattern(/^[0-9+\-\(\)\s]+$/)
      .max(20)
      .optional()
      .trim(),

    birth_date: Joi.date()
      .max('now')
      .optional(),

    address: Joi.string()
      .max(255)
      .optional()
      .trim(),

    role_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    department_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
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

    role_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    department_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    is_active: Joi.boolean()
      .optional(),

    sort_by: Joi.string()
      .valid('username', 'email', 'full_name', 'created_at', 'updated_at')
      .optional()
      .default('created_at'),

    sort_order: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
  }),

  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format'
      })
  })
};

module.exports = userValidation;