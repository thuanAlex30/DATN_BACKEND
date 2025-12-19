const { ApiResponse } = require('../utils/response');

class ValidationMiddleware {
  // Validate request body
  static validateBody(schema) {
    return (req, res, next) => {
      console.log('🔍 ValidationMiddleware - req.body BEFORE validation:', req.body);
      
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: false
      });

      if (error) {
        console.log('❌ ValidationMiddleware - Validation error:', error.details);
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return ApiResponse.validationError(res, errors);
      }

      console.log('✅ ValidationMiddleware - req.body AFTER validation:', value);
      req.body = value;
      next();
    };
  }

  // Validate request params
  static validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return ApiResponse.validationError(res, errors);
      }

      req.params = value;
      next();
    };
  }

  // Validate request query
  static validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return ApiResponse.validationError(res, errors);
      }

      req.query = value;
      next();
    };
  }

  // Validate multiple parts of request
  static validate(schemas) {
    return (req, res, next) => {
      console.log(`🔍 ValidationMiddleware.validate - Starting validation for ${req.method} ${req.path}`);
      console.log(`🔍 ValidationMiddleware.validate - Request body:`, req.body);
      console.log(`🔍 ValidationMiddleware.validate - Request params:`, req.params);
      
      const errors = [];

      // Validate body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          console.log(`❌ ValidationMiddleware.validate - Body validation errors:`, error.details);
          errors.push(...error.details.map(detail => ({
            field: `body.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
          console.log(`✅ ValidationMiddleware.validate - Body validation passed`);
          req.body = value;
        }
      }

      // Validate params
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          console.log(`❌ ValidationMiddleware.validate - Params validation errors:`, error.details);
          errors.push(...error.details.map(detail => ({
            field: `params.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
          console.log(`✅ ValidationMiddleware.validate - Params validation passed`);
          req.params = value;
        }
      }

      // Validate query
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          console.log(`❌ ValidationMiddleware.validate - Query validation errors:`, error.details);
          errors.push(...error.details.map(detail => ({
            field: `query.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
          console.log(`✅ ValidationMiddleware.validate - Query validation passed`);
          req.query = value;
        }
      }

      if (errors.length > 0) {
        console.log(`❌ ValidationMiddleware.validate - Returning validation error with ${errors.length} errors`);
        return ApiResponse.validationError(res, errors);
      }

      console.log(`✅ ValidationMiddleware.validate - All validations passed, calling next()`);
      return next();
    };
  }
}

module.exports = ValidationMiddleware;