/**
 * Health Check Routes
 * Provides system monitoring and error statistics endpoints
 */

const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/HealthController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Public health check endpoint
router.get('/health', HealthController.healthCheck);

// Error statistics endpoint (requires authentication)
router.get('/error-stats', 
  authMiddleware.authenticate,
  HealthController.errorStats
);

// WebSocket status endpoint (requires authentication)
router.get('/websocket-status',
  authMiddleware.authenticate,
  HealthController.websocketStatus
);

// BSON recovery test endpoint (requires authentication)
router.get('/bson-test',
  authMiddleware.authenticate,
  HealthController.testBSONRecovery
);

// Reset error statistics endpoint (admin only)
router.post('/reset-error-stats',
  authMiddleware.authenticate,
  authMiddleware.authorizeRole(['admin']),
  HealthController.resetErrorStats
);

module.exports = router;
