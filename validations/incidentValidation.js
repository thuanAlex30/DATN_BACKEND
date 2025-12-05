const Joi = require('joi');
const { ObjectId } = require('mongoose').Types;


const incidentValidation = {

  id: Joi.object({
    id: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID incident không hợp lệ',
        'any.required': 'ID incident là bắt buộc'
      })
  }),

  userId: Joi.object({
    userId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID user không hợp lệ',
        'any.required': 'ID user là bắt buộc'
      })
  }),

  projectId: Joi.object({
    projectId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID project không hợp lệ',
        'any.required': 'ID project là bắt buộc'
      })
  }),

  // Create incident validation
  createIncident: Joi.object({
    title: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Tiêu đề sự cố không được để trống',
        'string.min': 'Tiêu đề sự cố phải có ít nhất 1 ký tự',
        'string.max': 'Tiêu đề sự cố không được vượt quá 255 ký tự',
        'any.required': 'Tiêu đề sự cố là bắt buộc'
      }),
    
    description: Joi.string().trim().min(1).max(2000).required()
      .messages({
        'string.empty': 'Mô tả sự cố không được để trống',
        'string.min': 'Mô tả sự cố phải có ít nhất 1 ký tự',
        'string.max': 'Mô tả sự cố không được vượt quá 2000 ký tự',
        'any.required': 'Mô tả sự cố là bắt buộc'
      }),
    
    location: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Địa điểm không được để trống',
        'string.min': 'Địa điểm phải có ít nhất 1 ký tự',
        'string.max': 'Địa điểm không được vượt quá 255 ký tự',
        'any.required': 'Địa điểm là bắt buộc'
      }),
    
    severity: Joi.string().valid('nhẹ', 'nặng', 'rất nghiêm trọng').default('nhẹ')
      .messages({
        'any.only': 'Mức độ nghiêm trọng phải là: nhẹ, nặng, hoặc rất nghiêm trọng'
      }),
    
    project_id: Joi.string().custom((value, helpers) => {
      if (value && !ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
      .messages({
        'any.invalid': 'ID project không hợp lệ'
      }),
    
    images: Joi.array().items(
      Joi.alternatives().try(
        Joi.string().uri(),
        Joi.string().pattern(/^data:image\//) // Cho phép base64 data URI
      )
    ).max(10).optional()
      .messages({
        'array.max': 'Không được upload quá 10 ảnh',
        'alternatives.match': 'Ảnh phải là URL hợp lệ hoặc base64 data URI'
      })
  }),

  // Update incident validation
  updateIncident: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional()
      .messages({
        'string.empty': 'Tiêu đề sự cố không được để trống',
        'string.min': 'Tiêu đề sự cố phải có ít nhất 1 ký tự',
        'string.max': 'Tiêu đề sự cố không được vượt quá 255 ký tự'
      }),
    
    description: Joi.string().trim().min(1).max(2000).optional()
      .messages({
        'string.empty': 'Mô tả sự cố không được để trống',
        'string.min': 'Mô tả sự cố phải có ít nhất 1 ký tự',
        'string.max': 'Mô tả sự cố không được vượt quá 2000 ký tự'
      }),
    
    location: Joi.string().trim().min(1).max(255).optional()
      .messages({
        'string.empty': 'Địa điểm không được để trống',
        'string.min': 'Địa điểm phải có ít nhất 1 ký tự',
        'string.max': 'Địa điểm không được vượt quá 255 ký tự'
      }),
    
    severity: Joi.string().valid('nhẹ', 'nặng', 'rất nghiêm trọng').optional()
      .messages({
        'any.only': 'Mức độ nghiêm trọng phải là: nhẹ, nặng, hoặc rất nghiêm trọng'
      }),
    
    status: Joi.string().valid('Mới ghi nhận', 'Đang xử lý', 'Đã đóng').optional()
      .messages({
        'any.only': 'Trạng thái phải là: Mới ghi nhận, Đang xử lý, hoặc Đã đóng'
      }),
    
    assignedTo: Joi.string().custom((value, helpers) => {
      if (value && !ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
      .messages({
        'any.invalid': 'ID người được phân công không hợp lệ'
      }),
    
    images: Joi.array().items(Joi.string().uri()).max(10).optional()
      .messages({
        'array.max': 'Không được upload quá 10 ảnh',
        'string.uri': 'URL ảnh không hợp lệ'
      })
  }),

  // Classify incident validation
  classifyIncident: Joi.object({
    severity: Joi.string().valid('nhẹ', 'nặng', 'rất nghiêm trọng').required()
      .messages({
        'any.only': 'Mức độ nghiêm trọng phải là: nhẹ, nặng, hoặc rất nghiêm trọng',
        'any.required': 'Mức độ nghiêm trọng là bắt buộc'
      })
  }),

  // Assign incident validation
  assignIncident: Joi.object({
    assignedTo: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
      .messages({
        'any.invalid': 'ID người được phân công không hợp lệ',
        'any.required': 'ID người được phân công là bắt buộc'
      })
  }),

  // Investigate incident validation
  investigateIncident: Joi.object({
    investigation: Joi.string().trim().min(1).max(3000).required()
      .messages({
        'string.empty': 'Kết quả điều tra không được để trống',
        'string.min': 'Kết quả điều tra phải có ít nhất 1 ký tự',
        'string.max': 'Kết quả điều tra không được vượt quá 3000 ký tự',
        'any.required': 'Kết quả điều tra là bắt buộc'
      }),
    
    solution: Joi.string().trim().min(1).max(2000).required()
      .messages({
        'string.empty': 'Khuyến nghị không được để trống',
        'string.min': 'Khuyến nghị phải có ít nhất 1 ký tự',
        'string.max': 'Khuyến nghị không được vượt quá 2000 ký tự',
        'any.required': 'Khuyến nghị là bắt buộc'
      }),
    
    findingsImages: Joi.array().items(Joi.string().uri()).max(5).optional()
      .messages({
        'array.max': 'Không được upload quá 5 ảnh minh chứng',
        'string.uri': 'URL ảnh minh chứng không hợp lệ'
      }),
    
    rootCauseImages: Joi.array().items(Joi.string().uri()).max(5).optional()
      .messages({
        'array.max': 'Không được upload quá 5 ảnh nguyên nhân',
        'string.uri': 'URL ảnh nguyên nhân không hợp lệ'
      })
  }),

  // Update progress validation
  updateProgress: Joi.object({
    note: Joi.string().trim().min(1).max(1000).required()
      .messages({
        'string.empty': 'Ghi chú tiến độ không được để trống',
        'string.min': 'Ghi chú tiến độ phải có ít nhất 1 ký tự',
        'string.max': 'Ghi chú tiến độ không được vượt quá 1000 ký tự',
        'any.required': 'Ghi chú tiến độ là bắt buộc'
      }),
    
    images: Joi.array().items(Joi.string().uri()).max(5).optional()
      .messages({
        'array.max': 'Không được upload quá 5 ảnh',
        'string.uri': 'URL ảnh không hợp lệ'
      })
  }),

  // Close incident validation
  closeIncident: Joi.object({
    note: Joi.string().trim().min(1).max(1000).optional()
      .messages({
        'string.empty': 'Ghi chú đóng sự cố không được để trống',
        'string.min': 'Ghi chú đóng sự cố phải có ít nhất 1 ký tự',
        'string.max': 'Ghi chú đóng sự cố không được vượt quá 1000 ký tự'
      }),
    
    images: Joi.array().items(Joi.string().uri()).max(5).optional()
      .messages({
        'array.max': 'Không được upload quá 5 ảnh',
        'string.uri': 'URL ảnh không hợp lệ'
      })
  }),

  // Search validation
  searchQuery: Joi.object({
    q: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Từ khóa tìm kiếm không được để trống',
        'string.min': 'Từ khóa tìm kiếm phải có ít nhất 1 ký tự',
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự',
        'any.required': 'Từ khóa tìm kiếm là bắt buộc'
      })
  }),

  // Status validation
  status: Joi.object({
    status: Joi.string().valid('Mới ghi nhận', 'Đang xử lý', 'Đã đóng').required()
      .messages({
        'any.only': 'Trạng thái phải là: Mới ghi nhận, Đang xử lý, hoặc Đã đóng',
        'any.required': 'Trạng thái là bắt buộc'
      })
  }),

  // Severity validation
  severity: Joi.object({
    severity: Joi.string().valid('nhẹ', 'nặng', 'rất nghiêm trọng').required()
      .messages({
        'any.only': 'Mức độ nghiêm trọng phải là: nhẹ, nặng, hoặc rất nghiêm trọng',
        'any.required': 'Mức độ nghiêm trọng là bắt buộc'
      })
  })
};

module.exports = incidentValidation;