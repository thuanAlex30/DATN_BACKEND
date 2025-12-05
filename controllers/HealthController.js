/**
 * Health Check Controller
 * Provides system health monitoring and error statistics
 */

const EnhancedApiResponse = require('../utils/enhancedResponse');
const websocketErrorHandler = require('../services/websocketErrorHandler');
const bsonErrorHandler = require('../utils/bsonErrorHandler');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class HealthController {
    /**
     * General health check endpoint
     */
    static healthCheck = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    api: 'healthy',
                    database: 'healthy', // You can add actual DB health check here
                    websocket: 'healthy',
                    bson: 'healthy'
                },
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };

            // Check WebSocket health
            const wsHealth = await websocketErrorHandler.healthCheck();
            healthData.services.websocket = wsHealth.isHealthy ? 'healthy' : 'degraded';
            healthData.websocket = wsHealth;

            // Check BSON health
            const bsonHealth = bsonErrorHandler.healthCheck();
            healthData.services.bson = bsonHealth.isHealthy ? 'healthy' : 'degraded';
            healthData.bson = bsonHealth;

            // Determine overall status
            const allHealthy = Object.values(healthData.services).every(status => status === 'healthy');
            healthData.status = allHealthy ? 'healthy' : 'degraded';

            const statusCode = allHealthy ? 200 : 503;
            
            return EnhancedApiResponse.success(res, healthData, 'Health check completed', statusCode);

        } catch (error) {
            return EnhancedApiResponse.error(res, 'Health check failed', 500, { error: error.message });
        }
    });

    /**
     * Detailed error statistics endpoint
     */
    static errorStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const stats = {
                timestamp: new Date().toISOString(),
                websocket: websocketErrorHandler.getErrorStats(),
                bson: bsonErrorHandler.getErrorStats(),
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                }
            };

            return EnhancedApiResponse.success(res, stats, 'Error statistics retrieved', 200);

        } catch (error) {
            return EnhancedApiResponse.error(res, 'Failed to retrieve error statistics', 500, { error: error.message });
        }
    });

    /**
     * Reset error statistics endpoint (admin only)
     */
    static resetErrorStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return EnhancedApiResponse.forbidden(res, 'Only administrators can reset error statistics');
            }

            // Reset statistics
            bsonErrorHandler.resetErrorStats();
            // Note: websocketErrorHandler doesn't have reset method, but you can add one

            return EnhancedApiResponse.success(res, null, 'Error statistics reset successfully', 200);

        } catch (error) {
            return EnhancedApiResponse.error(res, 'Failed to reset error statistics', 500, { error: error.message });
        }
    });

    /**
     * WebSocket connection status endpoint
     */
    static websocketStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const websocketService = require('../services/websocketService');
            
            const status = {
                timestamp: new Date().toISOString(),
                connectedUsers: websocketService.connectedUsers.size,
                userRooms: websocketService.userRooms.size,
                roomUsers: websocketService.roomUsers.size,
                errorStats: websocketErrorHandler.getErrorStats()
            };

            return EnhancedApiResponse.success(res, status, 'WebSocket status retrieved', 200);

        } catch (error) {
            return EnhancedApiResponse.error(res, 'Failed to retrieve WebSocket status', 500, { error: error.message });
        }
    });

    /**
     * BSON error recovery test endpoint
     */
    static testBSONRecovery = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            // Test data with potential BSON issues
            const testData = {
                validObjectId: new require('mongoose').Types.ObjectId(),
                invalidObjectId: { _id: 'invalid_id' },
                nestedObject: {
                    user_id: new require('mongoose').Types.ObjectId(),
                    metadata: {
                        created_by: new require('mongoose').Types.ObjectId()
                    }
                },
                array: [
                    { id: new require('mongoose').Types.ObjectId() },
                    { id: 'invalid_id' }
                ]
            };

            // Test serialization
            const serialized = bsonErrorHandler.safeSerialize(testData, {
                fallbackStrategy: 'replace',
                logErrors: true
            });

            const result = {
                original: testData,
                serialized: serialized,
                stats: bsonErrorHandler.getErrorStats()
            };

            return EnhancedApiResponse.success(res, result, 'BSON recovery test completed', 200);

        } catch (error) {
            return EnhancedApiResponse.error(res, 'BSON recovery test failed', 500, { error: error.message });
        }
    });
}

module.exports = HealthController;
