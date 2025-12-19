/**
 * PPE Advanced Routes
 * Routes for advanced PPE operations including optimistic locking, batch operations, and expiry management
 */

const express = require('express');
const router = express.Router();
const PPEAdvancedController = require('../controllers/PPEAdvancedController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const roleMiddleware = require('../middlewares/RoleMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========================================
// OPTIMISTIC LOCKING ROUTES
// ========================================

/**
 * @route GET /api/ppe-advanced/items/:itemId/version
 * @desc Get PPE item with version for optimistic locking
 * @access Private (All authenticated users)
 */
router.get('/items/:itemId/version', PPEAdvancedController.getItemWithVersion);

/**
 * @route PUT /api/ppe-advanced/items/:itemId/quantity
 * @desc Update PPE item quantity with optimistic locking
 * @access Private (Manager, Admin)
 * @body { quantity: number, operation: string, version?: number }
 */
router.put('/items/:itemId/quantity', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.updateItemQuantity
);

/**
 * @route POST /api/ppe-advanced/items/batch-update
 * @desc Batch update multiple PPE items
 * @access Private (Manager, Admin)
 * @body { updates: Array, options?: Object }
 */
router.post('/items/batch-update', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.batchUpdateItems
);

// ========================================
// BATCH ISSUANCE ROUTES
// ========================================

/**
 * @route POST /api/ppe-advanced/batch-issuance
 * @desc Create a new batch issuance
 * @access Private (Manager, Admin)
 * @body { batch_name: string, items: Array, issuance_level: string, manager_id?: string }
 */
router.post('/batch-issuance', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.createBatchIssuance
);

/**
 * @route POST /api/ppe-advanced/batch-issuance/:batchId/process
 * @desc Process batch issuance
 * @access Private (Manager, Admin)
 * @body { options?: Object }
 */
router.post('/batch-issuance/:batchId/process', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.processBatchIssuance
);

/**
 * @route GET /api/ppe-advanced/batch-issuance/:batchId/status
 * @desc Get batch processing status
 * @access Private (All authenticated users)
 */
router.get('/batch-issuance/:batchId/status', PPEAdvancedController.getBatchStatus);

/**
 * @route GET /api/ppe-advanced/batch-issuance
 * @desc Get all batches with filters
 * @access Private (Manager, Admin)
 * @query { status?: string, issued_by?: string, date_from?: string, date_to?: string, limit?: number }
 */
router.get('/batch-issuance', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.getBatches
);

// ========================================
// EXPIRY MANAGEMENT ROUTES
// ========================================

/**
 * @route POST /api/ppe-advanced/expiry-tracking
 * @desc Create expiry tracking record
 * @access Private (Manager, Admin)
 * @body { ppe_item_id: string, expiry_date: Date, manufacturing_date?: Date, batch_number?: string, serial_number?: string }
 */
router.post('/expiry-tracking', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.createExpiryTracking
);

/**
 * @route POST /api/ppe-advanced/items/:itemId/auto-tracking
 * @desc Auto-create tracking records for PPE item
 * @access Private (Manager, Admin)
 */
router.post('/items/:itemId/auto-tracking', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.autoCreateTrackingRecords
);

/**
 * @route GET /api/ppe-advanced/expiry/check
 * @desc Check and notify expiring items
 * @access Private (Manager, Admin)
 * @query { daysBefore?: number }
 */
router.get('/expiry/check', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.checkExpiringItems
);

/**
 * @route PUT /api/ppe-advanced/expiry-tracking/:trackingId/expired
 * @desc Mark PPE as expired
 * @access Private (Manager, Admin)
 * @body { options?: Object }
 */
router.put('/expiry-tracking/:trackingId/expired', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.markAsExpired
);

/**
 * @route PUT /api/ppe-advanced/expiry-tracking/:trackingId/replace
 * @desc Replace expired PPE
 * @access Private (Manager, Admin)
 * @body { replacement_item_id?: string, expiry_date?: Date, manufacturing_date?: Date, batch_number?: string, serial_number?: string, replacement_reason?: string }
 */
router.put('/expiry-tracking/:trackingId/replace', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.replaceExpiredPPE
);

/**
 * @route PUT /api/ppe-advanced/expiry-tracking/:trackingId/dispose
 * @desc Dispose expired PPE
 * @access Private (Manager, Admin)
 * @body { disposal_method: string, disposal_certificate?: string }
 */
router.put('/expiry-tracking/:trackingId/dispose', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.disposeExpiredPPE
);

/**
 * @route GET /api/ppe-advanced/expiry/report
 * @desc Get expiring items report
 * @access Private (Manager, Admin)
 * @query { days?: number, status?: string }
 */
router.get('/expiry/report', 
  roleMiddleware.requireRole(['manager', 'admin']), 
  PPEAdvancedController.getExpiringItemsReport
);

/**
 * @route POST /api/ppe-advanced/expiry/daily-check
 * @desc Run daily expiry check
 * @access Private (Admin only)
 */
router.post('/expiry/daily-check', 
  roleMiddleware.requireRole(['admin']), 
  PPEAdvancedController.runDailyExpiryCheck
);

// ========================================
// HEALTH CHECK ROUTES
// ========================================

/**
 * @route GET /api/ppe-advanced/health
 * @desc Health check for PPE advanced services
 * @access Private (All authenticated users)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PPE Advanced services are running',
    timestamp: new Date().toISOString(),
    services: {
      optimisticLocking: 'active',
      batchIssuance: 'active',
      expiryManagement: 'active'
    }
  });
});

module.exports = router;
