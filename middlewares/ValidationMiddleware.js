const ApiResponse = require('../utils/response');

class ValidationMiddleware {
  // Validate request body
  static validateBody(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
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
      const errors = [];

      // Validate body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          errors.push(...error.details.map(detail => ({
            field: `body.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
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
          errors.push(...error.details.map(detail => ({
            field: `params.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
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
          errors.push(...error.details.map(detail => ({
            field: `query.${detail.path.join('.')}`,
            message: detail.message
          })));
        } else {
          req.query = value;
        }
      }

      if (errors.length > 0) {
        return ApiResponse.validationError(res, errors);
      }

      next();
    };
  }
}

module.exports = ValidationMiddleware;