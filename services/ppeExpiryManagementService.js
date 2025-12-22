/**
 * PPE Expiry Management Service
 * Handles PPE expiry tracking, notifications, and management
 */

const PPEExpiryTracking = require('../models/ppeExpiryTracking');
const PPEItem = require('../models/ppeItem');
const PPEIssuance = require('../models/ppeIssuance');
const User = require('../models/user');
const websocketService = require('./websocketService');
const logger = require('../utils/logger');

class PPEExpiryManagementService {
  constructor() {
    this.notificationDays = [30, 14, 7, 1]; // Days before expiry to notify
    this.autoExpiryCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Create expiry tracking record
   * @param {Object} trackingData - Tracking data
   * @returns {Promise<Object>} Created tracking record
   */
  async createTrackingRecord(trackingData) {
    try {
      logger.info('Creating PPE expiry tracking record', {
        ppeItemId: trackingData.ppe_item_id,
        expiryDate: trackingData.expiry_date
      });

      const tracking = await PPEExpiryTracking.createTrackingRecord(trackingData);

      logger.info('PPE expiry tracking record created', {
        trackingId: tracking._id,
        ppeItemId: tracking.ppe_item_id
      });

      return {
        success: true,
        data: tracking,
        message: 'Expiry tracking record created successfully'
      };

    } catch (error) {
      logger.error('Error creating expiry tracking record', {
        error: error.message,
        trackingData
      });
      return {
        success: false,
        message: 'Failed to create expiry tracking record',
        error: error.message
      };
    }
  }

  /**
   * Auto-create tracking records for PPE items
   * @param {string} ppeItemId - PPE item ID
   * @returns {Promise<Object>} Result
   */
  async autoCreateTrackingRecords(ppeItemId) {
    try {
      const ppeItem = await PPEItem.findById(ppeItemId).populate('category_id');
      if (!ppeItem) {
        return {
          success: false,
          message: 'PPE item not found'
        };
      }

      if (!ppeItem.expiry_date && !ppeItem.manufacturing_date) {
        return {
          success: false,
          message: 'No expiry or manufacturing date found'
        };
      }

      // Calculate expiry date if not provided
      let expiryDate = ppeItem.expiry_date;
      if (!expiryDate && ppeItem.manufacturing_date && ppeItem.category_id) {
        const manufacturingDate = new Date(ppeItem.manufacturing_date);
        expiryDate = new Date(manufacturingDate);
        expiryDate.setMonth(expiryDate.getMonth() + ppeItem.category_id.lifespan_months);
      }

      if (!expiryDate) {
        return {
          success: false,
          message: 'Cannot determine expiry date'
        };
      }

      // Create tracking record for each quantity
      const trackingRecords = [];
      for (let i = 0; i < ppeItem.quantity_available; i++) {
        const trackingData = {
          ppe_item_id: ppeItemId,
          expiry_date: expiryDate,
          manufacturing_date: ppeItem.manufacturing_date,
          batch_number: ppeItem.batch_number,
          serial_number: ppeItem.serial_numbers && ppeItem.serial_numbers[i] 
            ? ppeItem.serial_numbers[i] 
            : null,
          notifications: {
            notify_days_before: this.notificationDays
          }
        };

        const tracking = await PPEExpiryTracking.createTrackingRecord(trackingData);
        trackingRecords.push(tracking);
      }

      logger.info('Auto-created tracking records for PPE item', {
        ppeItemId,
        recordsCreated: trackingRecords.length
      });

      return {
        success: true,
        data: trackingRecords,
        message: `Created ${trackingRecords.length} tracking records`
      };

    } catch (error) {
      logger.error('Error auto-creating tracking records', {
        ppeItemId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to auto-create tracking records',
        error: error.message
      };
    }
  }

  /**
   * Check for expiring items and send notifications
   * @param {number} daysBefore - Days before expiry
   * @returns {Promise<Object>} Notification result
   */
  async checkAndNotifyExpiringItems(daysBefore = 30) {
    try {
      logger.info('Checking for expiring PPE items', { daysBefore });

      const expiringItems = await PPEExpiryTracking.getItemsNeedingNotification(daysBefore);
      
      if (expiringItems.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No items need notification'
        };
      }

      const notifications = [];
      for (const item of expiringItems) {
        try {
          const notification = await this.sendExpiryNotification(item, daysBefore);
          notifications.push(notification);
          
          // Update notification status
          item.updateNotificationStatus('sent');
          await item.save();
          
        } catch (error) {
          logger.error('Failed to send notification for item', {
            itemId: item._id,
            error: error.message
          });
        }
      }

      logger.info('Expiry notifications processed', {
        daysBefore,
        totalItems: expiringItems.length,
        notificationsSent: notifications.length
      });

      return {
        success: true,
        data: notifications,
        message: `Sent ${notifications.length} notifications`
      };

    } catch (error) {
      logger.error('Error checking and notifying expiring items', {
        daysBefore,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to check and notify expiring items',
        error: error.message
      };
    }
  }

  /**
   * Send expiry notification
   * @param {Object} trackingItem - Tracking item
   * @param {number} daysBefore - Days before expiry
   * @returns {Promise<Object>} Notification result
   */
  async sendExpiryNotification(trackingItem, daysBefore) {
    try {
      const notificationData = {
        type: 'ppe_expiry_warning',
        title: `PPE Expiring in ${daysBefore} days`,
        message: `PPE item "${trackingItem.ppe_item_id.item_name}" will expire on ${trackingItem.expiry_date.toDateString()}`,
        data: {
          trackingId: trackingItem._id,
          ppeItemId: trackingItem.ppe_item_id._id,
          itemName: trackingItem.ppe_item_id.item_name,
          expiryDate: trackingItem.expiry_date,
          daysUntilExpiry: trackingItem.days_until_expiry,
          userId: trackingItem.user_id?._id,
          batchNumber: trackingItem.batch_number,
          serialNumber: trackingItem.serial_number
        }
      };

      // Send realtime notification (WebSocket + Database) using PPENotificationService
      const PPENotificationService = require('./ppeNotificationService');
      const tenantId = trackingItem.tenant_id || trackingItem.tenantId;
      
      await PPENotificationService.notifyPPEExpiring({
        trackingItem,
        daysBefore,
        tenantId
      });
      
      // Also send WebSocket for backward compatibility
      if (trackingItem.user_id) {
        websocketService.emitToUser(
          trackingItem.user_id._id,
          'ppe_expiry_warning',
          notificationData
        );
      }
      websocketService.emitToRole('manager', 'ppe_expiry_warning', notificationData);
      websocketService.emitToRole('admin', 'ppe_expiry_warning', notificationData);

      return {
        success: true,
        trackingId: trackingItem._id,
        userId: trackingItem.user_id?._id,
        message: 'Notification sent successfully'
      };

    } catch (error) {
      logger.error('Error sending expiry notification', {
        trackingId: trackingItem._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mark PPE as expired
   * @param {string} trackingId - Tracking ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async markAsExpired(trackingId, options = {}) {
    try {
      const tracking = await PPEExpiryTracking.findById(trackingId);
      if (!tracking) {
        return {
          success: false,
          message: 'Tracking record not found'
        };
      }

      tracking.updateStatus('expired');
      await tracking.save();

      // Update PPE item condition if it's the last item
      const remainingActiveItems = await PPEExpiryTracking.countDocuments({
        ppe_item_id: tracking.ppe_item_id,
        status: { $in: ['active', 'expiring_soon'] }
      });

      if (remainingActiveItems === 0) {
        await PPEItem.findByIdAndUpdate(tracking.ppe_item_id, {
          condition_status: 'expired'
        });
      }

      // Send notification
      websocketService.emitPPEExpired(tracking);

      logger.info('PPE marked as expired', {
        trackingId,
        ppeItemId: tracking.ppe_item_id
      });

      return {
        success: true,
        data: tracking,
        message: 'PPE marked as expired'
      };

    } catch (error) {
      logger.error('Error marking PPE as expired', {
        trackingId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to mark PPE as expired',
        error: error.message
      };
    }
  }

  /**
   * Replace expired PPE
   * @param {string} trackingId - Tracking ID
   * @param {Object} replacementData - Replacement data
   * @returns {Promise<Object>} Result
   */
  async replaceExpiredPPE(trackingId, replacementData) {
    try {
      const tracking = await PPEExpiryTracking.findById(trackingId);
      if (!tracking) {
        return {
          success: false,
          message: 'Tracking record not found'
        };
      }

      tracking.markAsReplaced(replacementData);
      await tracking.save();

      // Create new tracking record for replacement
      if (replacementData.replacement_item_id) {
        const newTrackingData = {
          ppe_item_id: replacementData.replacement_item_id,
          ppe_issuance_id: tracking.ppe_issuance_id,
          user_id: tracking.user_id,
          expiry_date: replacementData.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
          manufacturing_date: replacementData.manufacturing_date || new Date(),
          batch_number: replacementData.batch_number,
          serial_number: replacementData.serial_number,
          notifications: {
            notify_days_before: this.notificationDays
          }
        };

        await PPEExpiryTracking.createTrackingRecord(newTrackingData);
      }

      // Send notification
      websocketService.emitPPEReplaced(tracking, replacementData);

      logger.info('PPE replaced successfully', {
        trackingId,
        replacementItemId: replacementData.replacement_item_id
      });

      return {
        success: true,
        data: tracking,
        message: 'PPE replaced successfully'
      };

    } catch (error) {
      logger.error('Error replacing expired PPE', {
        trackingId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to replace expired PPE',
        error: error.message
      };
    }
  }

  /**
   * Dispose expired PPE
   * @param {string} trackingId - Tracking ID
   * @param {Object} disposalData - Disposal data
   * @returns {Promise<Object>} Result
   */
  async disposeExpiredPPE(trackingId, disposalData) {
    try {
      const tracking = await PPEExpiryTracking.findById(trackingId);
      if (!tracking) {
        return {
          success: false,
          message: 'Tracking record not found'
        };
      }

      tracking.markAsDisposed(disposalData);
      await tracking.save();

      // Send notification
      websocketService.emitPPEDisposed(tracking, disposalData);

      logger.info('PPE disposed successfully', {
        trackingId,
        disposalMethod: disposalData.disposal_method
      });

      return {
        success: true,
        data: tracking,
        message: 'PPE disposed successfully'
      };

    } catch (error) {
      logger.error('Error disposing expired PPE', {
        trackingId,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to dispose expired PPE',
        error: error.message
      };
    }
  }

  /**
   * Get expiring items report
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Report data
   */
  async getExpiringItemsReport(filters = {}) {
    try {
      const { days = 30, status = 'active' } = filters;
      
      const expiringItems = await PPEExpiryTracking.getExpiringItems(days);
      const expiredItems = await PPEExpiryTracking.getExpiredItems();

      // Group by category
      const categoryStats = {};
      const userStats = {};

      [...expiringItems, ...expiredItems].forEach(item => {
        const category = item.ppe_item_id.category_id?.category_name || 'Unknown';
        const user = item.user_id?.full_name || 'Unassigned';

        if (!categoryStats[category]) {
          categoryStats[category] = { expiring: 0, expired: 0 };
        }
        if (!userStats[user]) {
          userStats[user] = { expiring: 0, expired: 0 };
        }

        if (item.status === 'expired') {
          categoryStats[category].expired++;
          userStats[user].expired++;
        } else {
          categoryStats[category].expiring++;
          userStats[user].expiring++;
        }
      });

      return {
        success: true,
        data: {
          summary: {
            totalExpiring: expiringItems.length,
            totalExpired: expiredItems.length,
            totalItems: expiringItems.length + expiredItems.length
          },
          categoryStats,
          userStats,
          expiringItems,
          expiredItems
        },
        message: 'Expiring items report generated successfully'
      };

    } catch (error) {
      logger.error('Error generating expiring items report', {
        filters,
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to generate expiring items report',
        error: error.message
      };
    }
  }

  /**
   * Run daily expiry check
   * @returns {Promise<Object>} Check result
   */
  async runDailyExpiryCheck() {
    try {
      logger.info('Running daily PPE expiry check');

      const results = {
        notificationsSent: 0,
        itemsMarkedExpired: 0,
        errors: []
      };

      // Check for items needing notification
      for (const days of this.notificationDays) {
        try {
          const notificationResult = await this.checkAndNotifyExpiringItems(days);
          if (notificationResult.success) {
            results.notificationsSent += notificationResult.data.length;
          }
        } catch (error) {
          results.errors.push(`Notification check for ${days} days: ${error.message}`);
        }
      }

      // Mark expired items
      try {
        const expiredItems = await PPEExpiryTracking.getExpiredItems();
        for (const item of expiredItems) {
          try {
            await this.markAsExpired(item._id);
            results.itemsMarkedExpired++;
          } catch (error) {
            results.errors.push(`Failed to mark item ${item._id} as expired: ${error.message}`);
          }
        }
      } catch (error) {
        results.errors.push(`Expired items check: ${error.message}`);
      }

      logger.info('Daily expiry check completed', results);

      return {
        success: true,
        data: results,
        message: 'Daily expiry check completed'
      };

    } catch (error) {
      logger.error('Error running daily expiry check', {
        error: error.message
      });
      return {
        success: false,
        message: 'Failed to run daily expiry check',
        error: error.message
      };
    }
  }
}

module.exports = new PPEExpiryManagementService();
