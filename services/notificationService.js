const Notification = require('../models/notification');
const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Gửi thông báo cho system admin (realtime + database)
   */
  async notifySystemAdmin({ type, message, orderId, tenantId, amount, title }) {
    try {
      // Validate type - chỉ chấp nhận enum values hợp lệ
      const validTypes = ['info', 'warning', 'error', 'success'];
      const notificationType = validTypes.includes(type) ? type : 'info';
      
      // Log để debug
      if (type && !validTypes.includes(type)) {
        logger.warn(`Invalid notification type "${type}" provided, using default "info"`);
      }

      // Tìm system admin users
      const User = require('../models/user');
      const Role = require('../models/role');

      const systemAdminRole = await Role.findOne({ role_code: 'system_admin' });
      if (!systemAdminRole) {
        logger.warn('System admin role not found');
        return;
      }

      const systemAdmins = await User.find({
        role_id: systemAdminRole._id,
        is_active: true
      });

      if (systemAdmins.length === 0) {
        logger.warn('No system admin users found');
        return;
      }

      // Gửi notification realtime + database cho từng system admin
      const results = await Promise.allSettled(
        systemAdmins.map(admin => 
          RealtimeNotificationService.sendToUser({
            userId: admin._id,
            title: title || 'Thông báo đơn hàng',
            message: message || `Có đơn hàng mới cần xử lý`,
            type: notificationType,
            category: 'system',
            priority: 'medium',
            tenantId: tenantId || admin.tenant_id || null,
            data: {
              orderId,
              amount,
              tenantId
            },
            eventName: 'notification',
            saveToDatabase: true,
            sendWebSocket: true
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      logger.info(`Sent ${successCount}/${systemAdmins.length} notifications to system admins`);

      return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value?.notification)
        .filter(Boolean);
    } catch (error) {
      logger.error('Error notifying system admin:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();

