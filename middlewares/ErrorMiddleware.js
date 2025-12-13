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
      return ApiResponse.error(res, err.message, err.statusCode);
    }

    // Default server error
    return ApiResponse.error(res, 'Internal server error', 500);
  }

  // 404 Not Found handler
  static notFound(req, res, next) {
    return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return (req, res, next) => {
      console.log(`🔍 ErrorMiddleware.asyncHandler - Wrapping function for ${req.method} ${req.path}`);
      console.log(`🔍 ErrorMiddleware.asyncHandler - Function type: ${typeof fn}, is function: ${typeof fn === 'function'}`);
      console.log(`🔍 ErrorMiddleware.asyncHandler - About to call wrapped function...`);
      console.log(`🔍 ErrorMiddleware.asyncHandler - Function name: ${fn.name || 'anonymous'}`);
      console.log(`🔍 ErrorMiddleware.asyncHandler - Function toString: ${fn.toString().substring(0, 200)}...`);
      
      try {
        // Call the function and handle the promise
        console.log(`🔍 ErrorMiddleware.asyncHandler - About to call fn(req, res, next)...`);
        const promise = Promise.resolve(fn(req, res, next));
        console.log(`🔍 ErrorMiddleware.asyncHandler - Promise created, isPromise: ${promise instanceof Promise}`);
        console.log(`🔍 ErrorMiddleware.asyncHandler - Promise state: ${promise.toString()}`);
        
        // Add then/catch handlers to track execution
        promise
          .then((result) => {
            console.log(`✅ ErrorMiddleware.asyncHandler - Promise resolved with result:`, typeof result, result?.constructor?.name);
            return result;
          })
          .catch((error) => {
            console.error(`❌ ErrorMiddleware.asyncHandler - Error caught in promise:`, error);
            console.error(`❌ ErrorMiddleware.asyncHandler - Error message:`, error.message);
            console.error(`❌ ErrorMiddleware.asyncHandler - Error stack:`, error.stack);
            return next(error);
          });
        
        console.log(`🔍 ErrorMiddleware.asyncHandler - Returning promise...`);
        return promise;
      } catch (error) {
        console.error(`❌ ErrorMiddleware.asyncHandler - Synchronous error:`, error);
        console.error(`❌ ErrorMiddleware.asyncHandler - Synchronous error stack:`, error.stack);
        return next(error);
      }
    };
  }
}

module.exports = ErrorMiddleware;