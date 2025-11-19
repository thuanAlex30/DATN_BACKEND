/**
 * PPE Advanced Controller
 * Handles advanced PPE operations including optimistic locking, batch operations, and expiry management
 */

const ppeOptimisticLockingService = require('../services/ppeOptimisticLockingService');
const ppeBatchIssuanceService = require('../services/ppeBatchIssuanceService');
const ppeExpiryManagementService = require('../services/ppeExpiryManagementService');
const logger = require('../utils/logger');

class PPEAdvancedController {
  /**
   * Get PPE item with version for optimistic locking
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getItemWithVersion(req, res) {
    try {
      const { itemId } = req.params;

      const result = await ppeOptimisticLockingService.getItemWithVersion(itemId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error getting PPE item with version', {
        error: error.message,
        itemId: req.params.itemId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update PPE item quantity with optimistic locking
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateItemQuantity(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity, operation, version } = req.body;

      // Validate request
      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      if (!operation || !['allocate', 'deallocate', 'update'].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Valid operation is required (allocate, deallocate, update)'
        });
      }

      let result;
      switch (operation) {
        case 'allocate':
          result = await ppeOptimisticLockingService.allocateQuantity(itemId, quantity);
          break;
        case 'deallocate':
          result = await ppeOptimisticLockingService.deallocateQuantity(itemId, quantity);
          break;
        case 'update':
          result = await ppeOptimisticLockingService.updateItemQuantity(itemId, { quantity_available: quantity });
          break;
      }

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Error updating PPE item quantity', {
        error: error.message,
        itemId: req.params.itemId,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Batch update PPE items
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async batchUpdateItems(req, res) {
    try {
      const { updates, options } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Updates array is required and must not be empty'
        });
      }

      if (updates.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 items allowed per batch update'
        });
      }

      const result = await ppeOptimisticLockingService.batchUpdate(updates, options);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Batch update completed'
      });
    } catch (error) {
      logger.error('Error in batch update', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Create batch issuance
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createBatchIssuance(req, res) {
    try {
      const batchData = {
        ...req.body,
        issued_by: req.user.id // Get from authenticated user
      };

      const result = await ppeBatchIssuanceService.createBatch(batchData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      logger.error('Error creating batch issuance', {
        error: error.message,
        body: req.body,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Process batch issuance
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async processBatchIssuance(req, res) {
    try {
      const { batchId } = req.params;
      const { options } = req.body;

      const result = await ppeBatchIssuanceService.processBatch(batchId, options);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error processing batch issuance', {
        error: error.message,
        batchId: req.params.batchId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get batch status
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getBatchStatus(req, res) {
    try {
      const { batchId } = req.params;

      const result = await ppeBatchIssuanceService.getBatchStatus(batchId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error getting batch status', {
        error: error.message,
        batchId: req.params.batchId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all batches
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getBatches(req, res) {
    try {
      const filters = {
        status: req.query.status,
        issued_by: req.query.issued_by,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await ppeBatchIssuanceService.getBatches(filters);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error getting batches', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Create expiry tracking record
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createExpiryTracking(req, res) {
    try {
      const result = await ppeExpiryManagementService.createTrackingRecord(req.body);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error creating expiry tracking', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Auto-create tracking records for PPE item
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async autoCreateTrackingRecords(req, res) {
    try {
      const { itemId } = req.params;

      const result = await ppeExpiryManagementService.autoCreateTrackingRecords(itemId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error auto-creating tracking records', {
        error: error.message,
        itemId: req.params.itemId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Check and notify expiring items
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async checkExpiringItems(req, res) {
    try {
      const { daysBefore = 30 } = req.query;

      const result = await ppeExpiryManagementService.checkAndNotifyExpiringItems(parseInt(daysBefore));

      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      logger.error('Error checking expiring items', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Mark PPE as expired
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async markAsExpired(req, res) {
    try {
      const { trackingId } = req.params;

      const result = await ppeExpiryManagementService.markAsExpired(trackingId, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error marking PPE as expired', {
        error: error.message,
        trackingId: req.params.trackingId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Replace expired PPE
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async replaceExpiredPPE(req, res) {
    try {
      const { trackingId } = req.params;

      const result = await ppeExpiryManagementService.replaceExpiredPPE(trackingId, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error replacing expired PPE', {
        error: error.message,
        trackingId: req.params.trackingId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Dispose expired PPE
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async disposeExpiredPPE(req, res) {
    try {
      const { trackingId } = req.params;

      const result = await ppeExpiryManagementService.disposeExpiredPPE(trackingId, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error disposing expired PPE', {
        error: error.message,
        trackingId: req.params.trackingId
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get expiring items report
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getExpiringItemsReport(req, res) {
    try {
      const filters = {
        days: parseInt(req.query.days) || 30,
        status: req.query.status || 'active'
      };

      const result = await ppeExpiryManagementService.getExpiringItemsReport(filters);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Error getting expiring items report', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Run daily expiry check
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async runDailyExpiryCheck(req, res) {
    try {
      const result = await ppeExpiryManagementService.runDailyExpiryCheck();

      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      logger.error('Error running daily expiry check', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new PPEAdvancedController();
