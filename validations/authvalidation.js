const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9_]+$/)
      .min(3)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.pattern.base': 'Username must only contain alphanumeric characters and underscores',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
        'any.required': 'Username is required'
      }),

    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Confirm password must match password',
        'any.required': 'Confirm password is required'
      }),

    email: Joi.string()
      .email()
      .max(100)
      .required()
      .trim()
      .lowercase()
      .messages({
        'string.email': 'Please enter a valid email address',
        'string.max': 'Email must not exceed 100 characters',
        'any.required': 'Email is required'
      }),

    full_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 100 characters',
        'any.required': 'Full name is required'
      }),

    phone: Joi.string()
      .pattern(/^[0-9+\-\(\)\s]+$/)
      .max(20)
      .optional()
      .trim()
      .messages({
        'string.pattern.base': 'Please enter a valid phone number',
        'string.max': 'Phone number must not exceed 20 characters'
      }),

    birth_date: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Birth date cannot be in the future'
      }),

    address: Joi.string()
      .max(255)
      .optional()
      .trim(),

    role_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid role ID format',
        'any.required': 'Role ID is required'
      }),

    department_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid department ID format'
      })
  }),

  login: Joi.object({
    username: Joi.string()
      .required()
      .trim()
      .messages({
        'any.required': 'Username or email is required'
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),

    newPassword: Joi.string()
      .min(6)
      .max(128)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password must not exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),

    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Confirm new password must match new password',
        'any.required': 'Confirm new password is required'
      })
  })
};

module.exports = authValidation;