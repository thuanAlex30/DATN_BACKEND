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
      // Ensure message is always a string
      const errorMessage = typeof err.message === 'string' 
        ? err.message 
        : (err.message?.toString() || 'An error occurred');
      return ApiResponse.error(res, errorMessage, err.statusCode);
    }

    // Default server error
    const errorMessage = typeof err.message === 'string' 
      ? err.message 
      : (err.message?.toString() || 'Internal server error');
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