/**
 * PPE Batch Issuance Service
 * Handles batch operations for PPE issuance
 */

const mongoose = require('mongoose');
const PPEBatchIssuance = require('../models/ppeBatchIssuance');
const PPEIssuance = require('../models/ppeIssuance');
const PPEItem = require('../models/ppeItem');
const User = require('../models/user');
const ppeOptimisticLockingService = require('./ppeOptimisticLockingService');
const websocketService = require('./websocketService');
const logger = require('../utils/logger');

class PPEBatchIssuanceService {
  constructor() {
    this.maxConcurrentItems = 10;
    this.processingTimeout = 30000; // 30 seconds
  }

  /**
   * Create a new batch issuance
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} Created batch
   */
  async createBatch(batchData) {
    try {
      logger.info('Creating PPE batch issuance', {
        batchName: batchData.batch_name,
        totalItems: batchData.items.length,
        issuedBy: batchData.issued_by
      });

      // Validate batch data
      const validation = await this.validateBatchData(batchData);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Batch validation failed',
          errors: validation.errors
        };
      }

      // Create batch
      const batch = await PPEBatchIssuance.createBatch(batchData);

      logger.info('PPE batch issuance created successfully', {
        batchId: batch.batch_id,
        batchName: batch.batch_name
      });

      return {
        success: true,
        data: batch,
        message: 'Batch issuance created successfully'
      };

    } catch (error) {
      logger.error('Error creating PPE batch issuance', {
        error: error.message,
        batchData
      });
      return {
        success: false,
        message: 'Failed to create batch issuance',
        error: error.message
      };
    }
  }

  /**
   * Process batch issuance
   * @param {string} batchId - Batch ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processBatch(batchId, options = {}) {
    const { maxConcurrentItems = this.maxConcurrentItems } = options;
    
    try {
      logger.info('Starting batch processing', { batchId });

      const batch = await PPEBatchIssuance.findOne({ batch_id: batchId });
      if (!batch) {
        return {
          success: false,
          message: 'Batch not found'
        };
      }

      if (batch.status !== 'pending') {
        return {
          success: false,
          message: `Batch is already ${batch.status}`
        };
      }

      // Update batch status to processing
      batch.updateStatus('processing');
      await batch.save();

      // Process items in chunks
      const results = await this.processBatchItems(batch, maxConcurrentItems);

      // Update batch with results
      batch.error_summary = this.generateErrorSummary(results.failed);
      await batch.save();

      // Emit WebSocket notification
      try {
        websocketService.emitBatchProcessingComplete(batch, results);
      } catch (wsError) {
        logger.error('Failed to emit batch processing WebSocket notification', {
          batchId,
          error: wsError.message
        });
      }

      logger.info('Batch processing completed', {
        batchId,
        successful: results.successful.length,
        failed: results.failed.length
      });

      return {
        success: true,
        data: {
          batch,
          results
        },
        message: 'Batch processing completed'
      };

    } catch (error) {
      logger.error('Error processing batch', {
        batchId,
        error: error.message
      });

      // Update batch status to failed
      try {
        const batch = await PPEBatchIssuance.findOne({ batch_id: batchId });
        if (batch) {
          batch.updateStatus('failed');
          batch.error_summary = error.message;
          await batch.save();
        }
      } catch (updateError) {
        logger.error('Failed to update batch status to failed', {
          batchId,
          error: updateError.message
        });
      }

      return {
        success: false,
        message: 'Failed to process batch',
        error: error.message
      };
    }
  }

  /**
   * Process batch items
   * @param {Object} batch - Batch object
   * @param {number} maxConcurrent - Max concurrent items
   * @returns {Promise<Object>} Processing results
   */
  async processBatchItems(batch, maxConcurrent) {
    const results = {
      successful: [],
      failed: []
    };

    // Process items in chunks
    for (let i = 0; i < batch.items.length; i += maxConcurrent) {
      const chunk = batch.items.slice(i, i + maxConcurrent);
      
      // Process chunk concurrently
      const chunkPromises = chunk.map((item, index) => 
        this.processBatchItem(batch, i + index, item)
      );

      const chunkResults = await Promise.allSettled(chunkPromises);

      // Process results
      chunkResults.forEach((result, index) => {
        const itemIndex = i + index;
        if (result.status === 'fulfilled' && result.value.success) {
          results.successful.push(result.value);
          batch.updateItemStatus(itemIndex, 'issued', null, result.value.issuanceId);
        } else {
          const errorMessage = result.status === 'rejected' 
            ? result.reason.message 
            : result.value.message;
          results.failed.push({
            itemIndex,
            error: errorMessage
          });
          batch.updateItemStatus(itemIndex, 'failed', errorMessage);
        }
      });

      // Save batch after each chunk
      await batch.save();
    }

    return results;
  }

  /**
   * Process individual batch item
   * @param {Object} batch - Batch object
   * @param {number} itemIndex - Item index
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Processing result
   */
  async processBatchItem(batch, itemIndex, item) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Validate item data
        const validation = await this.validateBatchItem(item);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Check if user exists
        const user = await User.findById(item.user_id);
        if (!user) {
          throw new Error('User not found');
        }

        // Check if PPE item exists and has sufficient quantity
        const ppeItem = await PPEItem.findById(item.item_id);
        if (!ppeItem) {
          throw new Error('PPE item not found');
        }

        if (ppeItem.quantity_available < item.quantity) {
          throw new Error(`Insufficient quantity. Available: ${ppeItem.quantity_available}, Requested: ${item.quantity}`);
        }

        // Allocate quantity using optimistic locking
        const allocationResult = await ppeOptimisticLockingService.allocateQuantity(
          item.item_id,
          item.quantity
        );

        if (!allocationResult.success) {
          throw new Error(allocationResult.message);
        }

        // Create PPE issuance
        const issuanceData = {
          user_id: item.user_id,
          item_id: item.item_id,
          quantity: item.quantity,
          issued_date: new Date(),
          expected_return_date: item.expected_return_date,
          issued_by: batch.issued_by,
          issuance_level: batch.issuance_level,
          manager_id: batch.manager_id,
          status: 'issued'
        };

        const issuance = new PPEIssuance(issuanceData);
        await issuance.save({ session });

        return {
          success: true,
          issuanceId: issuance._id,
          itemIndex
        };
      });

    } catch (error) {
      logger.error('Error processing batch item', {
        batchId: batch.batch_id,
        itemIndex,
        error: error.message
      });
      return {
        success: false,
        message: error.message,
        itemIndex
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Validate batch data
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} Validation result
   */
  async validateBatchData(batchData) {
    const errors = [];

    if (!batchData.batch_name) {
      errors.push('Batch name is required');
    }

    if (!batchData.issued_by) {
      errors.push('Issuer is required');
    }

    if (!batchData.issuance_level) {
      errors.push('Issuance level is required');
    }

    if (!batchData.items || !Array.isArray(batchData.items) || batchData.items.length === 0) {
      errors.push('Items array is required and must not be empty');
    }

    if (batchData.items && batchData.items.length > 100) {
      errors.push('Maximum 100 items allowed per batch');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate batch item
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Validation result
   */
  async validateBatchItem(item) {
    const errors = [];

    if (!item.user_id) {
      errors.push('User ID is required');
    }

    if (!item.item_id) {
      errors.push('Item ID is required');
    }

    if (!item.quantity || item.quantity < 1) {
      errors.push('Valid quantity is required');
    }

    if (!item.expected_return_date) {
      errors.push('Expected return date is required');
    }

    if (item.expected_return_date && new Date(item.expected_return_date) <= new Date()) {
      errors.push('Expected return date must be in the future');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate error summary
   * @param {Array} failedItems - Failed items
   * @returns {string} Error summary
   */
  generateErrorSummary(failedItems) {
    if (failedItems.length === 0) {
      return 'All items processed successfully';
    }

    const errorCounts = {};
    failedItems.forEach(item => {
      errorCounts[item.error] = (errorCounts[item.error] || 0) + 1;
    });

    const summary = Object.entries(errorCounts)
      .map(([error, count]) => `${error}: ${count} items`)
      .join('; ');

    return `Failed items: ${summary}`;
  }

  /**
   * Get batch status
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} Batch status
   */
  async getBatchStatus(batchId) {
    try {
      const batch = await PPEBatchIssuance.findOne({ batch_id: batchId });
      if (!batch) {
        return {
          success: false,
          message: 'Batch not found'
        };
      }

      return {
        success: true,
        data: {
          batchId: batch.batch_id,
          batchName: batch.batch_name,
          status: batch.status,
          progress: batch.getProgress(),
          createdAt: batch.createdAt,
          processingStartedAt: batch.processing_started_at,
          processingCompletedAt: batch.processing_completed_at,
          errorSummary: batch.error_summary
        }
      };
    } catch (error) {
      logger.error('Error getting batch status', {
        batchId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to get batch status',
        error: error.message
      };
    }
  }

  /**
   * Get all batches with filters
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Batches
   */
  async getBatches(filters = {}) {
    try {
      const query = {};
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.issued_by) {
        query.issued_by = filters.issued_by;
      }
      
      if (filters.date_from || filters.date_to) {
        query.createdAt = {};
        if (filters.date_from) {
          query.createdAt.$gte = new Date(filters.date_from);
        }
        if (filters.date_to) {
          query.createdAt.$lte = new Date(filters.date_to);
        }
      }

      const batches = await PPEBatchIssuance.find(query)
        .populate('issued_by', 'full_name email')
        .populate('manager_id', 'full_name email')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return {
        success: true,
        data: batches,
        message: 'Batches retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting batches', {
        filters,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to get batches',
        error: error.message
      };
    }
  }
}

module.exports = new PPEBatchIssuanceService();
