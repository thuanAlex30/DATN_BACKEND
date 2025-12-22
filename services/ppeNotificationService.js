/**
 * PPE Notification Service
 * Wrapper service for sending PPE notifications via RealtimeNotificationService
 * Ensures all PPE notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class PPENotificationService {
  /**
   * Send notification when PPE is issued to manager
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.issuer - Issuer (Admin) information
   * @param {Object} options.recipient - Recipient (Manager) information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEIssuedToManager({ issuance, issuer, recipient, tenantId }) {
    try {
      // Fetch item info if not populated
      let itemName = issuance.item_id?.item_name || issuance.itemName;
      let itemCode = issuance.item_id?.item_code || issuance.itemCode;
      
      if (!itemName && issuance.item_id) {
        const PPEItem = require('../models/ppeItem');
        const itemId = issuance.item_id._id || issuance.item_id;
        const item = await PPEItem.findById(itemId).select('item_name item_code').lean();
        if (item) {
          itemName = item.item_name;
          itemCode = item.item_code;
        }
      }
      
      // Fallback if still no name
      if (!itemName) {
        itemName = 'Thiết bị PPE';
        logger.warn('PPE item name not found', { issuanceId: issuance._id, itemId: issuance.item_id });
      }
      
      await RealtimeNotificationService.sendToUser({
        userId: recipient._id || recipient.id,
        title: 'PPE được phát cho Manager',
        message: `PPE "${itemName}" đã được phát cho bạn`,
        type: 'success',
        category: 'ppe',
        priority: 'medium',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: itemName,
          itemCode: itemCode,
          quantity: issuance.quantity,
          issuedBy: issuer.full_name || issuer.name,
          issuedById: issuer._id || issuer.id,
          issuedDate: issuance.issued_date,
          expectedReturnDate: issuance.expected_return_date
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      logger.info('PPE issued to manager notification sent', {
        recipientId: recipient._id || recipient.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE issued to manager notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when PPE is issued to employee
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.issuer - Issuer (Manager) information
   * @param {Object} options.recipient - Recipient (Employee) information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEIssuedToEmployee({ issuance, issuer, recipient, tenantId }) {
    try {
      // Notify employee
      await RealtimeNotificationService.sendToUser({
        userId: recipient._id || recipient.id,
        title: 'PPE được phát cho Employee',
        message: `PPE "${issuance.item_id?.item_name || issuance.itemName}" đã được phát cho bạn`,
        type: 'success',
        category: 'ppe',
        priority: 'medium',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          itemCode: issuance.item_id?.item_code || issuance.itemCode,
          quantity: issuance.quantity,
          issuedBy: issuer.full_name || issuer.name,
          issuedById: issuer._id || issuer.id,
          issuedDate: issuance.issued_date,
          expectedReturnDate: issuance.expected_return_date
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      // Notify manager
      await RealtimeNotificationService.sendToUser({
        userId: issuer._id || issuer.id,
        title: 'PPE đã được phát',
        message: `Bạn đã phát PPE "${issuance.item_id?.item_name || issuance.itemName}" cho ${recipient.full_name || recipient.name}`,
        type: 'info',
        category: 'ppe',
        priority: 'low',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          issuedTo: recipient.full_name || recipient.name,
          issuedToId: recipient._id || recipient.id
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      // Notify all managers and admins for quantity updates
      await RealtimeNotificationService.sendToRole({
        role: 'manager',
        title: 'Cập nhật số lượng PPE',
        message: `PPE "${issuance.item_id?.item_name || issuance.itemName}" đã được phát`,
        type: 'info',
        category: 'ppe',
        priority: 'low',
        tenantId,
        data: {
          itemId: issuance.item_id?._id || issuance.itemId,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          quantityIssued: issuance.quantity,
          issuedTo: recipient.full_name || recipient.name
        },
        eventName: 'ppe_quantity_update',
        saveToDatabase: false, // Don't save quantity updates to database
        sendWebSocket: true
      });

      await RealtimeNotificationService.sendToRole({
        role: 'admin',
        title: 'Cập nhật số lượng PPE',
        message: `PPE "${issuance.item_id?.item_name || issuance.itemName}" đã được phát`,
        type: 'info',
        category: 'ppe',
        priority: 'low',
        tenantId,
        data: {
          itemId: issuance.item_id?._id || issuance.itemId,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          quantityIssued: issuance.quantity,
          issuedTo: recipient.full_name || recipient.name
        },
        eventName: 'ppe_quantity_update',
        saveToDatabase: false,
        sendWebSocket: true
      });

      logger.info('PPE issued to employee notifications sent', {
        recipientId: recipient._id || recipient.id,
        issuerId: issuer._id || issuer.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE issued to employee notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when employee confirms receiving PPE
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.employee - Employee information
   * @param {Object} options.manager - Manager information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEConfirmed({ issuance, employee, manager, tenantId }) {
    try {
      await RealtimeNotificationService.sendToUser({
        userId: manager._id || manager.id,
        title: 'Xác nhận nhận PPE',
        message: `${employee.full_name || employee.name} đã xác nhận nhận PPE "${issuance.item_id?.item_name || issuance.itemName}"`,
        type: 'success',
        category: 'ppe',
        priority: 'medium',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          employeeId: employee._id || employee.id,
          employeeName: employee.full_name || employee.name,
          confirmedDate: new Date()
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      logger.info('PPE confirmed notification sent', {
        managerId: manager._id || manager.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE confirmed notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when employee returns PPE to manager
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.employee - Employee information
   * @param {Object} options.manager - Manager information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEReturnedToManager({ issuance, employee, manager, tenantId }) {
    try {
      await RealtimeNotificationService.sendToUser({
        userId: manager._id || manager.id,
        title: 'PPE được trả lại',
        message: `${employee.full_name || employee.name} đã trả PPE "${issuance.item_id?.item_name || issuance.itemName}"`,
        type: 'info',
        category: 'ppe',
        priority: 'medium',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          employeeId: employee._id || employee.id,
          employeeName: employee.full_name || employee.name,
          returnedDate: issuance.returned_date || new Date()
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      logger.info('PPE returned to manager notification sent', {
        managerId: manager._id || manager.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE returned to manager notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when manager returns PPE to admin
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.manager - Manager information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEReturnedToAdmin({ issuance, manager, tenantId }) {
    try {
      await RealtimeNotificationService.sendToUser({
        userId: manager._id || manager.id,
        title: 'PPE đã được trả lại',
        message: `Bạn đã trả PPE "${issuance.item_id?.item_name || issuance.itemName}" cho Admin`,
        type: 'info',
        category: 'ppe',
        priority: 'low',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          returnedDate: issuance.returned_date || new Date()
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      logger.info('PPE returned to admin notification sent', {
        managerId: manager._id || manager.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE returned to admin notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when employee confirms returning PPE
   * @param {Object} options - Notification options
   * @param {Object} options.issuance - PPE issuance data
   * @param {Object} options.employee - Employee information
   * @param {Object} options.manager - Manager information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEReturnConfirmed({ issuance, employee, manager, tenantId }) {
    try {
      await RealtimeNotificationService.sendToUser({
        userId: manager._id || manager.id,
        title: 'Xác nhận trả PPE',
        message: `${employee.full_name || employee.name} đã xác nhận trả PPE "${issuance.item_id?.item_name || issuance.itemName}"`,
        type: 'success',
        category: 'ppe',
        priority: 'medium',
        tenantId,
        data: {
          issuanceId: issuance._id,
          itemName: issuance.item_id?.item_name || issuance.itemName,
          employeeId: employee._id || employee.id,
          employeeName: employee.full_name || employee.name,
          confirmedDate: new Date()
        },
        eventName: 'ppe_notification',
        saveToDatabase: true,
        sendWebSocket: true
      });

      logger.info('PPE return confirmed notification sent', {
        managerId: manager._id || manager.id,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE return confirmed notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when PPE is overdue
   * @param {Object} options - Notification options
   * @param {Object} options.tracking - PPE tracking data
   * @param {Object} options.user - User with overdue PPE
   * @param {Object} options.issuer - Issuer information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEOverdue({ tracking, user, issuer, tenantId }) {
    try {
      const notifications = [];

      // Notify user with overdue PPE
      if (user) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: user._id || user.id,
            title: 'PPE quá hạn trả',
            message: `PPE "${tracking.ppe_item_id?.item_name || tracking.itemName}" đã quá hạn trả`,
            type: 'warning',
            category: 'ppe',
            priority: 'high',
            tenantId,
            data: {
              trackingId: tracking._id,
              itemName: tracking.ppe_item_id?.item_name || tracking.itemName,
              expectedReturnDate: tracking.expected_return_date,
              overdueDays: tracking.overdue_days || 0
            },
            eventName: 'ppe_notification',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify issuer
      if (issuer) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: issuer._id || issuer.id,
            title: 'PPE quá hạn trả',
            message: `PPE "${tracking.ppe_item_id?.item_name || tracking.itemName}" đã quá hạn trả`,
            type: 'warning',
            category: 'ppe',
            priority: 'high',
            tenantId,
            data: {
              trackingId: tracking._id,
              itemName: tracking.ppe_item_id?.item_name || tracking.itemName,
              userId: user?._id || user?.id,
              userName: user?.full_name || user?.name,
              overdueDays: tracking.overdue_days || 0
            },
            eventName: 'ppe_notification',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      await Promise.allSettled(notifications);

      logger.info('PPE overdue notifications sent', { tenantId });
    } catch (error) {
      logger.error('Error sending PPE overdue notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when PPE is expiring soon
   * @param {Object} options - Notification options
   * @param {Object} options.trackingItem - PPE tracking item
   * @param {number} options.daysBefore - Days before expiry
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyPPEExpiring({ trackingItem, daysBefore, tenantId }) {
    try {
      const notifications = [];

      // Notify user with expiring PPE
      if (trackingItem.user_id) {
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: trackingItem.user_id._id || trackingItem.user_id.id,
            title: `PPE sắp hết hạn (${daysBefore} ngày)`,
            message: `PPE "${trackingItem.ppe_item_id?.item_name || trackingItem.itemName}" sẽ hết hạn sau ${daysBefore} ngày`,
            type: 'warning',
            category: 'ppe',
            priority: daysBefore <= 7 ? 'high' : 'medium',
            tenantId,
            data: {
              trackingId: trackingItem._id,
              itemName: trackingItem.ppe_item_id?.item_name || trackingItem.itemName,
              expiryDate: trackingItem.expiry_date,
              daysUntilExpiry: daysBefore
            },
            eventName: 'ppe_expiry_warning',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Notify all managers
      notifications.push(
        RealtimeNotificationService.sendToRole({
          role: 'manager',
          title: `PPE sắp hết hạn (${daysBefore} ngày)`,
          message: `PPE "${trackingItem.ppe_item_id?.item_name || trackingItem.itemName}" sẽ hết hạn sau ${daysBefore} ngày`,
          type: 'warning',
          category: 'ppe',
          priority: daysBefore <= 7 ? 'high' : 'medium',
          tenantId,
          data: {
            trackingId: trackingItem._id,
            itemName: trackingItem.ppe_item_id?.item_name || trackingItem.itemName,
            expiryDate: trackingItem.expiry_date,
            daysUntilExpiry: daysBefore
          },
          eventName: 'ppe_expiry_warning',
          saveToDatabase: false, // Don't save to database for managers/admins (only for user)
          sendWebSocket: true
        })
      );

      // Notify all admins
      notifications.push(
        RealtimeNotificationService.sendToRole({
          role: 'admin',
          title: `PPE sắp hết hạn (${daysBefore} ngày)`,
          message: `PPE "${trackingItem.ppe_item_id?.item_name || trackingItem.itemName}" sẽ hết hạn sau ${daysBefore} ngày`,
          type: 'warning',
          category: 'ppe',
          priority: daysBefore <= 7 ? 'high' : 'medium',
          tenantId,
          data: {
            trackingId: trackingItem._id,
            itemName: trackingItem.ppe_item_id?.item_name || trackingItem.itemName,
            expiryDate: trackingItem.expiry_date,
            daysUntilExpiry: daysBefore
          },
          eventName: 'ppe_expiry_warning',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('PPE expiring notifications sent', {
        daysBefore,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending PPE expiring notifications:', error);
      throw error;
    }
  }
}

module.exports = PPENotificationService;

