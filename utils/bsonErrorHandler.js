/**
 * Enhanced BSON Error Handling Utility
 * Provides robust ObjectId serialization and error recovery mechanisms
 */

const mongoose = require('mongoose');
const logger = require('./logger');

class BSONErrorHandler {
    constructor() {
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            failedRecoveries: 0,
            errorTypes: new Map()
        };
    }

    /**
     * Safe ObjectId serialization with multiple fallback strategies
     * @param {*} obj - Object to serialize
     * @param {Object} options - Serialization options
     * @returns {*} - Serialized object
     */
    safeSerialize(obj, options = {}) {
        const {
            maxDepth = 10,
            currentDepth = 0,
            fallbackStrategy = 'replace',
            logErrors = true
        } = options;

        try {
            // Check depth limit
            if (currentDepth > maxDepth) {
                if (logErrors) {
                    logger.warn('BSON serialization depth limit exceeded', { maxDepth, currentDepth });
                }
                return this.getFallbackValue(fallbackStrategy);
            }

            // Handle null/undefined
            if (obj === null || obj === undefined) {
                return obj;
            }

            // Handle primitives
            if (typeof obj !== 'object') {
                return obj;
            }

            // Handle Date objects
            if (obj instanceof Date) {
                return obj.toISOString();
            }

            // Handle ObjectId
            if (obj.constructor && obj.constructor.name === 'ObjectId') {
                return this.safeObjectIdToString(obj, fallbackStrategy);
            }

            // Handle Arrays
            if (Array.isArray(obj)) {
                return obj.map((item, index) => {
                    try {
                        return this.safeSerialize(item, {
                            ...options,
                            currentDepth: currentDepth + 1
                        });
                    } catch (error) {
                        if (logErrors) {
                            logger.warn('Array item serialization failed', {
                                index,
                                error: error.message,
                                fallbackStrategy
                            });
                        }
                        return this.getFallbackValue(fallbackStrategy);
                    }
                });
            }

            // Handle plain objects
            const serialized = {};
            for (const [key, value] of Object.entries(obj)) {
                try {
                    serialized[key] = this.safeSerialize(value, {
                        ...options,
                        currentDepth: currentDepth + 1
                    });
                } catch (error) {
                    if (logErrors) {
                        logger.warn('Object property serialization failed', {
                            key,
                            error: error.message,
                            fallbackStrategy
                        });
                    }
                    serialized[key] = this.getFallbackValue(fallbackStrategy);
                }
            }

            return serialized;

        } catch (error) {
            this.recordError('serialization_error', error);
            
            if (logErrors) {
                logger.error('BSON serialization failed', {
                    error: error.message,
                    stack: error.stack,
                    fallbackStrategy
                });
            }

            return this.getFallbackValue(fallbackStrategy);
        }
    }

    /**
     * Safe ObjectId to string conversion with multiple strategies
     */
    safeObjectIdToString(objectId, fallbackStrategy = 'replace') {
        try {
            if (!objectId) return null;
            
            // Strategy 1: Direct toString
            if (typeof objectId === 'string') {
                return objectId;
            }
            
            if (typeof objectId === 'object' && objectId.toString) {
                const str = objectId.toString();
                if (this.isValidObjectId(str)) {
                    return str;
                }
            }
            
            // Strategy 2: Check for _id property
            if (typeof objectId === 'object' && objectId._id) {
                const str = objectId._id.toString();
                if (this.isValidObjectId(str)) {
                    return str;
                }
            }
            
            // Strategy 3: Check for id property
            if (typeof objectId === 'object' && objectId.id) {
                const str = objectId.id.toString();
                if (this.isValidObjectId(str)) {
                    return str;
                }
            }
            
            // Strategy 4: Try to create new ObjectId
            if (typeof objectId === 'object') {
                try {
                    const newObjectId = new mongoose.Types.ObjectId(objectId);
                    return newObjectId.toString();
                } catch (error) {
                    // Fall through to fallback
                }
            }
            
            // All strategies failed
            this.recordError('objectid_conversion_failed', new Error('All conversion strategies failed'));
            return this.getFallbackValue(fallbackStrategy);
            
        } catch (error) {
            this.recordError('objectid_conversion_error', error);
            return this.getFallbackValue(fallbackStrategy);
        }
    }

    /**
     * Validate ObjectId string format
     */
    isValidObjectId(str) {
        return typeof str === 'string' && 
               str.length === 24 && 
               /^[0-9a-fA-F]{24}$/.test(str);
    }

    /**
     * Get fallback value based on strategy
     */
    getFallbackValue(strategy) {
        switch (strategy) {
            case 'null':
                return null;
            case 'empty':
                return '';
            case 'replace':
                return 'invalid_id';
            case 'generate':
                return new mongoose.Types.ObjectId().toString();
            case 'skip':
                return undefined;
            default:
                return 'invalid_id';
        }
    }

    /**
     * Enhanced document transformation with error recovery
     */
    transformDocumentWithRecovery(doc, populatedFields = [], options = {}) {
        const {
            maxRetries = 3,
            fallbackStrategy = 'replace',
            logErrors = true
        } = options;

        let attempts = 0;
        let lastError = null;

        while (attempts < maxRetries) {
            try {
                attempts++;
                
                // Use safe serialization
                const serialized = this.safeSerialize(doc, {
                    fallbackStrategy,
                    logErrors: attempts === maxRetries // Only log on final attempt
                });

                // Transform _id to id
                if (serialized && serialized._id) {
                    serialized.id = this.safeObjectIdToString(serialized._id, fallbackStrategy);
                    delete serialized._id;
                }

                // Transform populated fields
                if (populatedFields && populatedFields.length > 0) {
                    populatedFields.forEach(field => {
                        if (serialized[field] && typeof serialized[field] === 'object') {
                            if (serialized[field]._id) {
                                serialized[field].id = this.safeObjectIdToString(
                                    serialized[field]._id, 
                                    fallbackStrategy
                                );
                                delete serialized[field]._id;
                            }
                        }
                    });
                }

                // Success
                if (attempts > 1) {
                    this.recordError('recovery_success', null, { attempts });
                }

                return serialized;

            } catch (error) {
                lastError = error;
                this.recordError('transformation_attempt_failed', error, { attempt: attempts });
                
                if (attempts < maxRetries) {
                    // Wait before retry
                    const delay = Math.pow(2, attempts) * 100; // Exponential backoff
                    this.sleep(delay);
                }
            }
        }

        // All attempts failed
        this.recordError('transformation_failed', lastError, { attempts });
        
        if (logErrors) {
            logger.error('Document transformation failed after all attempts', {
                error: lastError?.message,
                attempts,
                fallbackStrategy
            });
        }

        // Return minimal fallback
        return {
            id: this.getFallbackValue(fallbackStrategy),
            error: 'transformation_failed',
            originalError: lastError?.message
        };
    }

    /**
     * Batch transform multiple documents
     */
    transformDocumentsWithRecovery(docs, populatedFields = [], options = {}) {
        const results = [];
        const errors = [];

        docs.forEach((doc, index) => {
            try {
                const transformed = this.transformDocumentWithRecovery(doc, populatedFields, options);
                results.push(transformed);
            } catch (error) {
                errors.push({ index, error: error.message });
                results.push({
                    id: this.getFallbackValue(options.fallbackStrategy || 'replace'),
                    error: 'transformation_failed',
                    originalError: error.message
                });
            }
        });

        if (errors.length > 0) {
            logger.warn('Some documents failed transformation', {
                totalDocs: docs.length,
                failedDocs: errors.length,
                errors: errors.slice(0, 5) // Log first 5 errors
            });
        }

        return results;
    }

    /**
     * Record error statistics
     */
    recordError(type, error, metadata = {}) {
        this.errorStats.totalErrors++;
        
        const typeCount = this.errorStats.errorTypes.get(type) || 0;
        this.errorStats.errorTypes.set(type, typeCount + 1);

        if (type === 'recovery_success') {
            this.errorStats.recoveredErrors++;
        } else if (type === 'transformation_failed') {
            this.errorStats.failedRecoveries++;
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            ...this.errorStats,
            errorTypes: Object.fromEntries(this.errorStats.errorTypes),
            recoveryRate: this.errorStats.totalErrors > 0 
                ? (this.errorStats.recoveredErrors / this.errorStats.totalErrors * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Reset error statistics
     */
    resetErrorStats() {
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            failedRecoveries: 0,
            errorTypes: new Map()
        };
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check for BSON handling
     */
    healthCheck() {
        const stats = this.getErrorStats();
        const isHealthy = stats.failedRecoveries < 10; // Threshold for health
        
        return {
            isHealthy,
            stats,
            timestamp: new Date()
        };
    }
}

module.exports = new BSONErrorHandler();
