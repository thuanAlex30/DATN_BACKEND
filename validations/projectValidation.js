const Joi = require('joi');
const { ObjectId } = require('mongoose').Types;

// Validation schemas for project operations
const projectValidation = {
  // Create project validation
  createProject: Joi.object({
    project_name: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Tên dự án không được để trống',
        'string.min': 'Tên dự án phải có ít nhất 1 ký tự',
        'string.max': 'Tên dự án không được vượt quá 255 ký tự',
        'any.required': 'Tên dự án là bắt buộc'
      }),
    
    description: Joi.string().trim().min(1).max(1000).required()
      .messages({
        'string.empty': 'Mô tả dự án không được để trống',
        'string.min': 'Mô tả dự án phải có ít nhất 1 ký tự',
        'string.max': 'Mô tả dự án không được vượt quá 1000 ký tự',
        'any.required': 'Mô tả dự án là bắt buộc'
      }),
    
    start_date: Joi.date().iso().required()
      .messages({
        'date.base': 'Ngày bắt đầu phải là định dạng ngày hợp lệ',
        'date.format': 'Ngày bắt đầu phải có định dạng ISO (YYYY-MM-DD)',
        'any.required': 'Ngày bắt đầu là bắt buộc'
      }),
    
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required()
      .messages({
        'date.base': 'Ngày kết thúc phải là định dạng ngày hợp lệ',
        'date.format': 'Ngày kết thúc phải có định dạng ISO (YYYY-MM-DD)',
        'date.min': 'Ngày kết thúc phải sau ngày bắt đầu',
        'any.required': 'Ngày kết thúc là bắt buộc'
      }),
    
    project_type: Joi.string().valid('CONSTRUCTION', 'MAINTENANCE', 'RENOVATION', 'INSPECTION', 'SAFETY', 'TRAINING').required()
      .messages({
        'any.only': 'Loại dự án phải là một trong: CONSTRUCTION, MAINTENANCE, RENOVATION, INSPECTION, SAFETY, TRAINING',
        'any.required': 'Loại dự án là bắt buộc'
      }),
    
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').required()
      .messages({
        'any.only': 'Mức độ ưu tiên phải là một trong: LOW, MEDIUM, HIGH, URGENT',
        'any.required': 'Mức độ ưu tiên là bắt buộc'
      }),
    
    leader_id: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID trưởng dự án không hợp lệ',
        'any.required': 'ID trưởng dự án là bắt buộc'
      }),
    
    site_id: Joi.string().custom((value, helpers) => {
      if (value && !ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()  // ✅ Không bắt buộc
      .messages({
        'any.invalid': 'ID địa điểm dự án không hợp lệ'
      }),
    
    project_location: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Địa điểm dự án không được để trống',
        'string.min': 'Địa điểm dự án phải có ít nhất 1 ký tự',
        'string.max': 'Địa điểm dự án không được vượt quá 255 ký tự',
        'any.required': 'Địa điểm dự án là bắt buộc'
      })
  }),

  // Update project validation
  updateProject: Joi.object({
    project_name: Joi.string().trim().min(1).max(255).optional()
      .messages({
        'string.empty': 'Tên dự án không được để trống',
        'string.min': 'Tên dự án phải có ít nhất 1 ký tự',
        'string.max': 'Tên dự án không được vượt quá 255 ký tự'
      }),
    
    description: Joi.string().trim().min(1).max(1000).optional()
      .messages({
        'string.empty': 'Mô tả dự án không được để trống',
        'string.min': 'Mô tả dự án phải có ít nhất 1 ký tự',
        'string.max': 'Mô tả dự án không được vượt quá 1000 ký tự'
      }),
    
    start_date: Joi.date().iso().optional()
      .messages({
        'date.base': 'Ngày bắt đầu phải là định dạng ngày hợp lệ',
        'date.format': 'Ngày bắt đầu phải có định dạng ISO (YYYY-MM-DD)'
      }),
    
    end_date: Joi.date().iso().optional()
      .messages({
        'date.base': 'Ngày kết thúc phải là định dạng ngày hợp lệ',
        'date.format': 'Ngày kết thúc phải có định dạng ISO (YYYY-MM-DD)'
      }),
    
    project_type: Joi.string().valid('CONSTRUCTION', 'MAINTENANCE', 'RENOVATION', 'INSPECTION', 'SAFETY', 'TRAINING').optional()
      .messages({
        'any.only': 'Loại dự án phải là một trong: CONSTRUCTION, MAINTENANCE, RENOVATION, INSPECTION, SAFETY, TRAINING'
      }),
    
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional()
      .messages({
        'any.only': 'Mức độ ưu tiên phải là một trong: LOW, MEDIUM, HIGH, URGENT'
      }),
    
    leader_id: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
      .messages({
        'any.invalid': 'ID trưởng dự án không hợp lệ'
      }),
    
    site_id: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
      .messages({
        'any.invalid': 'ID địa điểm dự án không hợp lệ'
      }),
    
    project_location: Joi.string().trim().min(1).max(255).optional()
      .messages({
        'string.empty': 'Địa điểm dự án không được để trống',
        'string.min': 'Địa điểm dự án phải có ít nhất 1 ký tự',
        'string.max': 'Địa điểm dự án không được vượt quá 255 ký tự'
      }),
    
    status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED').optional()
      .messages({
        'any.only': 'Trạng thái dự án phải là một trong: PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED'
      })
  }),

  // Project ID validation
  projectId: Joi.object({
    id: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID dự án không hợp lệ',
        'any.required': 'ID dự án là bắt buộc'
      })
  }),

  // Project and User ID validation for user-specific endpoints
  projectUserParams: Joi.object({
    projectId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID dự án không hợp lệ',
        'any.required': 'ID dự án là bắt buộc'
      }),
    userId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID người dùng không hợp lệ',
        'any.required': 'ID người dùng là bắt buộc'
      })
  }),

  // Project progress validation
  updateProgress: Joi.object({
    progress: Joi.number().min(0).max(100).required()
      .messages({
        'number.base': 'Tiến độ phải là số',
        'number.min': 'Tiến độ phải từ 0 đến 100',
        'number.max': 'Tiến độ phải từ 0 đến 100',
        'any.required': 'Tiến độ là bắt buộc'
      })
  }),

  // Site validation
  createSite: Joi.object({
    site_name: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Tên địa điểm không được để trống',
        'string.min': 'Tên địa điểm phải có ít nhất 1 ký tự',
        'string.max': 'Tên địa điểm không được vượt quá 255 ký tự',
        'any.required': 'Tên địa điểm là bắt buộc'
      }),
    
    address: Joi.string().trim().min(1).max(500).required()
      .messages({
        'string.empty': 'Địa chỉ không được để trống',
        'string.min': 'Địa chỉ phải có ít nhất 1 ký tự',
        'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        'any.required': 'Địa chỉ là bắt buộc'
      }),
    
    description: Joi.string().trim().max(1000).optional()
      .messages({
        'string.max': 'Mô tả không được vượt quá 1000 ký tự'
      }),
    
    is_active: Joi.boolean().default(true)
      .messages({
        'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
      })
  }),

  // Update site validation
  updateSite: Joi.object({
    site_name: Joi.string().trim().min(1).max(255).optional()
      .messages({
        'string.empty': 'Tên địa điểm không được để trống',
        'string.min': 'Tên địa điểm phải có ít nhất 1 ký tự',
        'string.max': 'Tên địa điểm không được vượt quá 255 ký tự'
      }),
    
    address: Joi.string().trim().min(1).max(500).optional()
      .messages({
        'string.empty': 'Địa chỉ không được để trống',
        'string.min': 'Địa chỉ phải có ít nhất 1 ký tự',
        'string.max': 'Địa chỉ không được vượt quá 500 ký tự'
      }),
    
    description: Joi.string().trim().max(1000).optional()
      .messages({
        'string.max': 'Mô tả không được vượt quá 1000 ký tự'
      }),
    
    is_active: Joi.boolean().optional()
      .messages({
        'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
      })
  })
};

module.exports = projectValidation;
