/**
 * Enhanced API Response Handler with BSON Error Recovery
 * Provides robust error handling and data serialization
 */

const bsonErrorHandler = require('./bsonErrorHandler');
const logger = require('./logger');

class EnhancedApiResponse {
    /**
     * Enhanced success response with BSON error handling
     */
    static async success(res, data = null, message = 'Success', statusCode = 200, options = {}) {
        const {
            fallbackStrategy = 'replace',
            logErrors = true,
            maxRetries = 3
        } = options;

        try {
            // Attempt to serialize data safely
            const serializedData = await this.safeSerializeData(data, {
                fallbackStrategy,
                logErrors,
                maxRetries
            });

            return res.status(statusCode).json({
                success: true,
                message,
                data: serializedData,
                timestamp: new Date().toISOString(),
                metadata: {
                    serializationAttempts: serializedData._serializationAttempts || 1,
                    hasErrors: serializedData._hasErrors || false
                }
            });

        } catch (error) {
            logger.error('Enhanced API response failed', {
                error: error.message,
                message,
                statusCode
            });

            // Fallback to basic response
            return res.status(statusCode).json({
                success: true,
                message: message + ' (Response serialized with errors)',
                data: null,
                timestamp: new Date().toISOString(),
                error: 'Serialization failed'
            });
        }
    }

    /**
     * Enhanced error response with detailed error information
     */
    static error(res, message = 'Internal Server Error', statusCode = 500, errors = null, options = {}) {
        const {
            includeStack = process.env.NODE_ENV === 'development',
            logError = true
        } = options;

        if (logError) {
            logger.error('API Error Response', {
                message,
                statusCode,
                errors,
                timestamp: new Date().toISOString()
            });
        }

        const errorResponse = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            errorResponse.errors = errors;
        }

        if (includeStack && errors && errors.stack) {
            errorResponse.stack = errors.stack;
        }

        return res.status(statusCode).json(errorResponse);
    }

    /**
     * Safe data serialization with multiple fallback strategies
     */
    static async safeSerializeData(data, options = {}) {
        const {
            fallbackStrategy = 'replace',
            logErrors = true,
            maxRetries = 3
        } = options;

        if (!data) {
            return data;
        }

        let attempts = 0;
        let lastError = null;

        while (attempts < maxRetries) {
            try {
                attempts++;
                
                // Use BSON error handler for safe serialization
                const serialized = bsonErrorHandler.safeSerialize(data, {
                    fallbackStrategy,
                    logErrors: attempts === maxRetries
                });

                // Add metadata
                serialized._serializationAttempts = attempts;
                serialized._hasErrors = false;

                return serialized;

            } catch (error) {
                lastError = error;
                
                if (attempts < maxRetries) {
                    // Wait before retry
                    const delay = Math.pow(2, attempts) * 100;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All attempts failed - return fallback
        if (logErrors) {
            logger.error('Data serialization failed after all attempts', {
                error: lastError?.message,
                attempts,
                fallbackStrategy
            });
        }

        return {
            _serializationAttempts: attempts,
            _hasErrors: true,
            error: 'Serialization failed',
            originalError: lastError?.message,
            fallbackData: this.getFallbackData(data, fallbackStrategy)
        };
    }

    /**
     * Get fallback data based on strategy
     */
    static getFallbackData(originalData, strategy) {
        switch (strategy) {
            case 'null':
                return null;
            case 'empty':
                return Array.isArray(originalData) ? [] : {};
            case 'replace':
                return {
                    message: 'Data unavailable due to serialization error',
                    type: Array.isArray(originalData) ? 'array' : 'object',
                    length: Array.isArray(originalData) ? originalData.length : Object.keys(originalData || {}).length
                };
            case 'minimal':
                return Array.isArray(originalData) ? [] : { id: 'invalid_id' };
            default:
                return null;
        }
    }

    /**
     * Validation error response with detailed field information
     */
    static validationError(res, errors, message = 'Validation Error', options = {}) {
        const {
            includeFieldDetails = true,
            logErrors = true
        } = options;

        if (logErrors) {
            logger.warn('Validation Error', {
                message,
                errors,
                timestamp: new Date().toISOString()
            });
        }

        const errorResponse = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (includeFieldDetails) {
            errorResponse.validationErrors = this.formatValidationErrors(errors);
        } else {
            errorResponse.errors = errors;
        }

        return res.status(400).json(errorResponse);
    }

    /**
     * Format validation errors for better frontend handling
     */
    static formatValidationErrors(errors) {
        if (Array.isArray(errors)) {
            return errors.map(error => ({
                field: error.path || error.field || 'unknown',
                message: error.message || error.msg || 'Invalid value',
                value: error.value,
                type: error.type || 'validation'
            }));
        }

        if (typeof errors === 'object') {
            return Object.entries(errors).map(([field, error]) => ({
                field,
                message: typeof error === 'string' ? error : error.message || 'Invalid value',
                type: 'validation'
            }));
        }

        return [{ field: 'general', message: 'Validation failed', type: 'validation' }];
    }

    /**
     * Unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized', options = {}) {
        const { logError = true } = options;

        if (logError) {
            logger.warn('Unauthorized Access', {
                message,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Forbidden response
     */
    static forbidden(res, message = 'Forbidden', options = {}) {
        const { logError = true } = options;

        if (logError) {
            logger.warn('Forbidden Access', {
                message,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Not found response
     */
    static notFound(res, message = 'Resource not found', options = {}) {
        const { logError = false } = options; // Usually don't log 404s

        if (logError) {
            logger.info('Resource Not Found', {
                message,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Rate limit exceeded response
     */
    static rateLimitExceeded(res, message = 'Rate limit exceeded', options = {}) {
        const { 
            retryAfter = 60,
            logError = true 
        } = options;

        if (logError) {
            logger.warn('Rate Limit Exceeded', {
                message,
                retryAfter,
                timestamp: new Date().toISOString()
            });
        }

        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
            success: false,
            message,
            retryAfter,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get BSON error handler statistics
     */
    static getBSONErrorStats() {
        return bsonErrorHandler.getErrorStats();
    }

    /**
     * Health check for response handling
     */
    static healthCheck() {
        const bsonHealth = bsonErrorHandler.healthCheck();
        
        return {
            isHealthy: bsonHealth.isHealthy,
            bsonStats: bsonHealth.stats,
            timestamp: new Date()
        };
    }
}

module.exports = EnhancedApiResponse;
