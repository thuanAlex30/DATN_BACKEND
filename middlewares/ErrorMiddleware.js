const { ApiResponse } = require('../utils/response');

class ErrorMiddleware {
  // Global error handler
  static handle(err, req, res, next) {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }));
      return ApiResponse.validationError(res, errors, 'Validation failed');
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return ApiResponse.error(res, `${field} '${value}' already exists`, 409);
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid resource ID', 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }

    // Custom API errors
    if (err.statusCode) {
      // Ensure message is always a meaningful string
      let errorMessage = 'An error occurred';
      
      // Special handling for 429 (rate limit)
      if (err.statusCode === 429) {
        // Check if message is meaningful
        if (typeof err.message === 'string' && err.message.trim() && 
            err.message !== 'true' && err.message !== 'false') {
          errorMessage = err.message;
        } else {
          // Default rate limit message
          errorMessage = 'Rate limit exceeded. Please try again later.';
        }
      } else {
        // For other status codes
        if (typeof err.message === 'string' && err.message.trim()) {
          errorMessage = err.message;
        } else if (typeof err.message === 'boolean') {
          // Handle boolean messages
          errorMessage = 'An error occurred';
        } else if (err.message) {
          // Try to convert to string, but fallback to default if not meaningful
          const converted = String(err.message);
          errorMessage = converted && converted !== 'true' && converted !== 'false' 
            ? converted 
            : 'An error occurred';
        }
      }
      
      return ApiResponse.error(res, errorMessage, err.statusCode);
    }

    // Default server error
    let errorMessage = 'Internal server error';
    if (typeof err.message === 'string' && err.message.trim()) {
      errorMessage = err.message;
    } else if (typeof err.message === 'boolean') {
      errorMessage = 'Internal server error';
    } else if (err.message) {
      const converted = String(err.message);
      errorMessage = converted && converted !== 'true' && converted !== 'false' 
        ? converted 
        : 'Internal server error';
    }
    return ApiResponse.error(res, errorMessage, 500);
  }

  // 404 Not Found handler
  static notFound(req, res, next) {
    return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return async (req, res, next) => {
      try {
        await Promise.resolve(fn(req, res, next));
      } catch (error) {
        console.error(`❌ ErrorMiddleware.asyncHandler - Error caught:`, error);
        return next(error);
      }
    };
  }
}

module.exports = ErrorMiddleware;