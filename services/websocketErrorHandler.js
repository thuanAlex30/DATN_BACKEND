/**
 * Enhanced WebSocket Error Handling Service
 * Provides robust error handling, retry mechanisms, and fallback strategies
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class WebSocketErrorHandler extends EventEmitter {
    constructor() {
        super();
        this.retryQueue = new Map(); // userId -> retry attempts
        this.failedConnections = new Set(); // Track failed connections
        this.circuitBreaker = new Map(); // userId -> circuit breaker state
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.circuitBreakerThreshold = 5; // failures before opening circuit
        this.circuitBreakerTimeout = 30000; // 30 seconds
    }

    /**
     * Enhanced emit with error handling and retry mechanism
     * @param {Object} io - Socket.IO instance
     * @param {string} userId - Target user ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @param {Object} options - Additional options
     */
    async emitWithErrorHandling(io, userId, event, data, options = {}) {
        const {
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
            fallbackToDatabase = true,
            logErrors = true
        } = options;

        try {
            // Check circuit breaker
            if (this.isCircuitBreakerOpen(userId)) {
                if (logErrors) {
                    logger.warn('Circuit breaker open for user', { userId, event });
                }
                
                if (fallbackToDatabase) {
                    await this.fallbackToDatabase(userId, event, data);
                }
                return false;
            }

            // Attempt to emit
            const success = await this.attemptEmit(io, userId, event, data);
            
            if (success) {
                // Reset circuit breaker on success
                this.resetCircuitBreaker(userId);
                this.clearRetryQueue(userId);
                return true;
            } else {
                // Handle failure
                await this.handleEmitFailure(userId, event, data, {
                    maxRetries,
                    retryDelay,
                    fallbackToDatabase,
                    logErrors
                });
                return false;
            }

        } catch (error) {
            if (logErrors) {
                logger.error('WebSocket emit error', {
                    userId,
                    event,
                    error: error.message,
                    stack: error.stack
                });
            }
            
            // Increment circuit breaker
            this.incrementCircuitBreaker(userId);
            
            if (fallbackToDatabase) {
                await this.fallbackToDatabase(userId, event, data);
            }
            
            return false;
        }
    }

    /**
     * Attempt to emit WebSocket event
     */
    async attemptEmit(io, userId, event, data) {
        return new Promise((resolve) => {
            try {
                // Check if user is connected
                const connectedUsers = io.sockets.adapter.rooms.get(userId);
                if (!connectedUsers || connectedUsers.size === 0) {
                    resolve(false);
                    return;
                }

                // Emit with timeout
                const timeout = setTimeout(() => {
                    resolve(false);
                }, 5000); // 5 second timeout

                io.to(userId).emit(event, data, (ack) => {
                    clearTimeout(timeout);
                    resolve(true);
                });

            } catch (error) {
                resolve(false);
            }
        });
    }

    /**
     * Handle emit failure with retry logic
     */
    async handleEmitFailure(userId, event, data, options) {
        const { maxRetries, retryDelay, fallbackToDatabase, logErrors } = options;
        
        // Get current retry count
        const retryCount = this.retryQueue.get(userId) || 0;
        
        if (retryCount < maxRetries) {
            // Schedule retry
            this.retryQueue.set(userId, retryCount + 1);
            
            if (logErrors) {
                logger.warn('WebSocket emit failed, scheduling retry', {
                    userId,
                    event,
                    retryCount: retryCount + 1,
                    maxRetries
                });
            }

            setTimeout(async () => {
                await this.emitWithErrorHandling(
                    require('./websocketService').io,
                    userId,
                    event,
                    data,
                    { ...options, maxRetries: maxRetries - 1 }
                );
            }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff

        } else {
            // Max retries exceeded
            if (logErrors) {
                logger.error('WebSocket emit failed after max retries', {
                    userId,
                    event,
                    maxRetries
                });
            }

            // Increment circuit breaker
            this.incrementCircuitBreaker(userId);
            
            // Fallback to database
            if (fallbackToDatabase) {
                await this.fallbackToDatabase(userId, event, data);
            }
        }
    }

    /**
     * Circuit breaker management
     */
    isCircuitBreakerOpen(userId) {
        const state = this.circuitBreaker.get(userId);
        if (!state) return false;
        
        if (state.state === 'open') {
            // Check if timeout has passed
            if (Date.now() - state.lastFailure > this.circuitBreakerTimeout) {
                state.state = 'half-open';
                return false;
            }
            return true;
        }
        
        return false;
    }

    incrementCircuitBreaker(userId) {
        const state = this.circuitBreaker.get(userId) || {
            failures: 0,
            state: 'closed',
            lastFailure: 0
        };
        
        state.failures++;
        state.lastFailure = Date.now();
        
        if (state.failures >= this.circuitBreakerThreshold) {
            state.state = 'open';
        }
        
        this.circuitBreaker.set(userId, state);
    }

    resetCircuitBreaker(userId) {
        this.circuitBreaker.delete(userId);
    }

    /**
     * Clear retry queue for user
     */
    clearRetryQueue(userId) {
        this.retryQueue.delete(userId);
    }

    /**
     * Fallback to database when WebSocket fails
     */
    async fallbackToDatabase(userId, event, data) {
        try {
            // Store notification in database for later delivery
            const Notification = require('../models/Notification');
            
            const notification = new Notification({
                user_id: userId,
                type: 'websocket_fallback',
                title: 'Real-time Notification',
                message: `Event: ${event}`,
                data: {
                    event,
                    originalData: data,
                    timestamp: new Date(),
                    source: 'websocket_fallback'
                },
                is_read: false,
                created_at: new Date()
            });

            await notification.save();
            
            logger.info('WebSocket fallback to database successful', {
                userId,
                event,
                notificationId: notification._id
            });

        } catch (error) {
            logger.error('WebSocket fallback to database failed', {
                userId,
                event,
                error: error.message
            });
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            retryQueue: Object.fromEntries(this.retryQueue),
            circuitBreaker: Object.fromEntries(this.circuitBreaker),
            failedConnections: Array.from(this.failedConnections)
        };
    }

    /**
     * Health check for WebSocket connections
     */
    async healthCheck(io) {
        const stats = {
            totalConnections: io.sockets.sockets.size,
            retryQueueSize: this.retryQueue.size,
            circuitBreakerOpen: Array.from(this.circuitBreaker.values())
                .filter(state => state.state === 'open').length,
            timestamp: new Date()
        };

        logger.info('WebSocket health check', stats);
        return stats;
    }
}

module.exports = new WebSocketErrorHandler();
