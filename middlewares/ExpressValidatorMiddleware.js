const { validationResult } = require('express-validator');
const { ApiResponse } = require('../utils/response');

class ExpressValidatorMiddleware {
  // Handle validation results from express-validator
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));
      
      return ApiResponse.validationError(res, formattedErrors);
    }
    
    next();
  }
}

module.exports = ExpressValidatorMiddleware;
