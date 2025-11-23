const Joi = require('joi');

// UUID validation helper
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const chatbotValidation = {
  // Validation cho gửi tin nhắn
  sendMessage: Joi.object({
    message: Joi.string()
      .trim()
      .min(1)
      .max(5000)
      .required()
      .messages({
        'string.empty': 'Tin nhắn không được để trống',
        'string.min': 'Tin nhắn phải có ít nhất 1 ký tự',
        'string.max': 'Tin nhắn không được vượt quá 5000 ký tự',
        'any.required': 'Tin nhắn là bắt buộc'
      }),
    sessionId: Joi.string()
      .pattern(uuidPattern)
      .optional()
      .messages({
        'string.pattern.base': 'SessionId phải có định dạng UUID hợp lệ'
      })
  }),

  // Validation cho sessionId trong query (GET /history)
  sessionIdQuery: Joi.object({
    sessionId: Joi.string()
      .pattern(uuidPattern)
      .required()
      .messages({
        'string.pattern.base': 'SessionId phải có định dạng UUID hợp lệ',
        'any.required': 'SessionId là bắt buộc'
      })
  }),

  // Validation cho sessionId trong body (DELETE /history)
  sessionIdBody: Joi.object({
    sessionId: Joi.string()
      .pattern(uuidPattern)
      .required()
      .messages({
        'string.pattern.base': 'SessionId phải có định dạng UUID hợp lệ',
        'any.required': 'SessionId là bắt buộc'
      })
  })
};

module.exports = chatbotValidation;

