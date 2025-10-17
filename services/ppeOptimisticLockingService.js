/**
 * PPE Optimistic Locking Service
 * Handles concurrent updates to PPE items with version control
 */

const PPEItem = require('../models/ppeItem');
const logger = require('../utils/logger');

class PPEOptimisticLockingService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 100;
  }

  /**
   * Update PPE item quantity with optimistic locking
   * @param {string} itemId - PPE item ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Options for retry
   * @returns {Promise<Object>} Updated PPE item
   */
  async updateItemQuantity(itemId, updateData, options = {}) {
    const { maxRetries = this.maxRetries, retryDelay = this.retryDelay } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting to update PPE item ${itemId} (attempt ${attempt})`, {
          itemId,
          updateData,
          attempt
        });

        const result = await PPEItem.updateWithOptimisticLock(
          { _id: itemId },
          updateData,
          { maxRetries: 1, retryDelay }
        );

        if (result) {
          logger.info(`Successfully updated PPE item ${itemId}`, {
            itemId,
            newVersion: result.version,
            attempt
          });
          return {
            success: true,
            data: result,
            message: 'PPE item updated successfully'
          };
        }

        if (attempt === maxRetries) {
          throw new Error('Optimistic locking failed after maximum retries');
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        logger.error(`Failed to update PPE item ${itemId} (attempt ${attempt})`, {
          itemId,
          error: error.message,
          attempt
        });

        if (attempt === maxRetries) {
          return {
            success: false,
            message: 'Failed to update PPE item due to concurrent modifications',
            error: error.message
          };
        }

        // Wait before retry
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Allocate PPE quantity with optimistic locking
   * @param {string} itemId - PPE item ID
   * @param {number} quantity - Quantity to allocate
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async allocateQuantity(itemId, quantity, options = {}) {
    try {
      const item = await PPEItem.findById(itemId);
      if (!item) {
        return {
          success: false,
          message: 'PPE item not found'
        };
      }

      if (item.quantity_available < quantity) {
        return {
          success: false,
          message: 'Insufficient quantity available',
          data: {
            available: item.quantity_available,
            requested: quantity
          }
        };
      }

      const updateData = {
        $inc: {
          quantity_available: -quantity,
          quantity_allocated: quantity
        }
      };

      return await this.updateItemQuantity(itemId, updateData, options);

    } catch (error) {
      logger.error('Error allocating PPE quantity', {
        itemId,
        quantity,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to allocate PPE quantity',
        error: error.message
      };
    }
  }

  /**
   * Deallocate PPE quantity with optimistic locking
   * @param {string} itemId - PPE item ID
   * @param {number} quantity - Quantity to deallocate
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async deallocateQuantity(itemId, quantity, options = {}) {
    try {
      const item = await PPEItem.findById(itemId);
      if (!item) {
        return {
          success: false,
          message: 'PPE item not found'
        };
      }

      if (item.quantity_allocated < quantity) {
        return {
          success: false,
          message: 'Insufficient quantity allocated',
          data: {
            allocated: item.quantity_allocated,
            requested: quantity
          }
        };
      }

      const updateData = {
        $inc: {
          quantity_available: quantity,
          quantity_allocated: -quantity
        }
      };

      return await this.updateItemQuantity(itemId, updateData, options);

    } catch (error) {
      logger.error('Error deallocating PPE quantity', {
        itemId,
        quantity,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to deallocate PPE quantity',
        error: error.message
      };
    }
  }

  /**
   * Update PPE item condition with optimistic locking
   * @param {string} itemId - PPE item ID
   * @param {string} condition - New condition
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async updateCondition(itemId, condition, options = {}) {
    const updateData = {
      condition_status: condition,
      last_maintenance_date: new Date()
    };

    return await this.updateItemQuantity(itemId, updateData, options);
  }

  /**
   * Batch update multiple PPE items with optimistic locking
   * @param {Array} updates - Array of update objects
   * @param {Object} options - Options
   * @returns {Promise<Object>} Results
   */
  async batchUpdate(updates, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: updates.length
    };

    logger.info(`Starting batch update for ${updates.length} PPE items`);

    for (const update of updates) {
      try {
        const result = await this.updateItemQuantity(
          update.itemId,
          update.updateData,
          options
        );

        if (result.success) {
          results.successful.push({
            itemId: update.itemId,
            data: result.data
          });
        } else {
          results.failed.push({
            itemId: update.itemId,
            error: result.message
          });
        }
      } catch (error) {
        results.failed.push({
          itemId: update.itemId,
          error: error.message
        });
      }
    }

    results.successCount = results.successful.length;
    results.failureCount = results.failed.length;

    logger.info(`Batch update completed`, {
      total: results.total,
      successful: results.successCount,
      failed: results.failureCount
    });

    return results;
  }

  /**
   * Get PPE item with current version
   * @param {string} itemId - PPE item ID
   * @returns {Promise<Object>} PPE item with version
   */
  async getItemWithVersion(itemId) {
    try {
      const item = await PPEItem.findById(itemId);
      if (!item) {
        return {
          success: false,
          message: 'PPE item not found'
        };
      }

      return {
        success: true,
        data: {
          _id: item._id,
          item_code: item.item_code,
          item_name: item.item_name,
          quantity_available: item.quantity_available,
          quantity_allocated: item.quantity_allocated,
          condition_status: item.condition_status,
          version: item.version,
          updatedAt: item.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error getting PPE item with version', {
        itemId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to get PPE item',
        error: error.message
      };
    }
  }
}

module.exports = new PPEOptimisticLockingService();
