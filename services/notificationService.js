const Notification = require('../models/notification');

class NotificationService {
  /**
   * Gửi thông báo cho system admin
   */
  async notifySystemAdmin({ type, message, orderId, tenantId, amount, title }) {
    try {
      // Validate type - chỉ chấp nhận enum values hợp lệ
      const validTypes = ['info', 'warning', 'error', 'success'];
      const notificationType = validTypes.includes(type) ? type : 'info';
      
      // Log để debug
      if (type && !validTypes.includes(type)) {
        console.warn(`Invalid notification type "${type}" provided, using default "info"`);
      }

      // Tìm system admin users
      const User = require('../models/user');
      const Role = require('../models/role');

      const systemAdminRole = await Role.findOne({ role_code: 'system_admin' });
      if (!systemAdminRole) {
        console.warn('System admin role not found');
        return;
      }

      const systemAdmins = await User.find({
        role_id: systemAdminRole._id,
        is_active: true
      });

      if (systemAdmins.length === 0) {
        console.warn('No system admin users found');
        return;
      }

      // Tìm notification_id cao nhất để generate ID mới
      const lastNotification = await Notification.findOne(
        { notification_id: { $exists: true, $ne: null } },
        {},
        { sort: { notification_id: -1 } }
      );
      
      let nextNotificationId = 1;
      if (lastNotification && lastNotification.notification_id) {
        nextNotificationId = lastNotification.notification_id + 1;
      }

      // Tạo thông báo cho mỗi system admin với notification_id unique
      const notifications = systemAdmins.map((admin, index) => ({
        notification_id: nextNotificationId + index,
        user_id: admin._id,
        type: notificationType,
        title: title || 'Thông báo đơn hàng',
        message: message || `Có đơn hàng mới cần xử lý`,
        category: 'system',
        priority: 'medium',
        is_read: false
      }));

      await Notification.insertMany(notifications);

      console.log(`Sent ${notifications.length} notifications to system admins`);
      return notifications;
    } catch (error) {
      console.error('Error notifying system admin:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();

