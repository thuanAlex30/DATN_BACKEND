/**
 * Department Notification Service
 * Wrapper service for sending department notifications via RealtimeNotificationService
 * Ensures all department notifications are saved to database and sent via WebSocket
 */

const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');

class DepartmentNotificationService {
  /**
   * Send notification when manager is assigned to department
   * @param {Object} options - Notification options
   * @param {Object} options.department - Department data
   * @param {Object} options.manager - Manager information
   * @param {Object} options.assigner - Assigner information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyManagerAssigned({ department, manager, assigner, tenantId }) {
    try {
      const notifications = [];

      // Notify manager (personal notification)
      if (manager && (manager._id || manager.id || manager.managerId)) {
        const managerId = manager._id || manager.id || manager.managerId;
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: managerId,
            title: 'Bạn được gán làm Manager của Department',
            message: `Bạn đã được gán làm Manager của Department "${department.department_name || department.name || department.departmentName}"`,
            type: 'success',
            category: 'user',
            priority: 'high',
            tenantId,
            actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
            data: {
              departmentId: department.departmentId || department._id || department.id,
              departmentName: department.department_name || department.name || department.departmentName,
              assignerId: assigner?._id || assigner?.id,
              assignerName: assigner?.full_name || assigner?.name
            },
            eventName: 'manager_assigned',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Manager được gán cho Department',
          message: `${manager?.full_name || manager?.name || manager?.managerName || 'Người dùng'} đã được gán làm Manager của Department "${department.department_name || department.name || department.departmentName}"`,
          type: 'info',
          category: 'user',
          priority: 'medium',
          actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
          data: {
            departmentId: department.departmentId || department._id || department.id,
            departmentName: department.department_name || department.name || department.departmentName,
            managerId: manager?._id || manager?.id || manager?.managerId,
            managerName: manager?.full_name || manager?.name || manager?.managerName
          },
          eventName: 'department_manager_assigned',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Manager assigned to department notifications sent', {
        departmentId: department.departmentId || department._id || department.id,
        managerId: manager?._id || manager?.id || manager?.managerId,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending manager assigned notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when manager is removed from department
   * @param {Object} options - Notification options
   * @param {Object} options.department - Department data
   * @param {Object} options.manager - Manager information
   * @param {Object} options.remover - Remover information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyManagerRemoved({ department, manager, remover, tenantId }) {
    try {
      const notifications = [];

      // Notify manager (personal notification)
      if (manager && (manager._id || manager.id || manager.managerId)) {
        const managerId = manager._id || manager.id || manager.managerId;
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: managerId,
            title: 'Bạn đã bị gỡ khỏi Department',
            message: `Bạn đã bị gỡ khỏi vị trí Manager của Department "${department.department_name || department.name || department.departmentName}"`,
            type: 'warning',
            category: 'user',
            priority: 'high',
            tenantId,
            actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
            data: {
              departmentId: department.departmentId || department._id || department.id,
              departmentName: department.department_name || department.name || department.departmentName,
              removerId: remover?._id || remover?.id,
              removerName: remover?.full_name || remover?.name
            },
            eventName: 'manager_removed',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Manager bị gỡ khỏi Department',
          message: `${manager?.full_name || manager?.name || manager?.managerName || 'Người dùng'} đã bị gỡ khỏi vị trí Manager của Department "${department.department_name || department.name || department.departmentName}"`,
          type: 'info',
          category: 'user',
          priority: 'medium',
          actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
          data: {
            departmentId: department.departmentId || department._id || department.id,
            departmentName: department.department_name || department.name || department.departmentName,
            managerId: manager?._id || manager?.id || manager?.managerId,
            managerName: manager?.full_name || manager?.name || manager?.managerName
          },
          eventName: 'department_manager_removed',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Manager removed from department notifications sent', {
        departmentId: department.departmentId || department._id || department.id,
        managerId: manager?._id || manager?.id || manager?.managerId,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending manager removed notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when employee is transferred to department
   * @param {Object} options - Notification options
   * @param {Object} options.department - Department data
   * @param {Object} options.employee - Employee information
   * @param {Object} options.transferrer - Transferrer information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyEmployeeTransferred({ department, employee, transferrer, tenantId }) {
    try {
      const notifications = [];

      // Notify employee (personal notification)
      if (employee && (employee._id || employee.id || employee.employeeId)) {
        const employeeId = employee._id || employee.id || employee.employeeId;
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: employeeId,
            title: 'Bạn được chuyển đến Department',
            message: `Bạn đã được chuyển đến Department "${department.department_name || department.name || department.departmentName}"`,
            type: 'info',
            category: 'user',
            priority: 'medium',
            tenantId,
            actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
            data: {
              departmentId: department.departmentId || department._id || department.id,
              departmentName: department.department_name || department.name || department.departmentName,
              transferrerId: transferrer?._id || transferrer?.id,
              transferrerName: transferrer?.full_name || transferrer?.name
            },
            eventName: 'employee_transferred',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Employee được chuyển đến Department',
          message: `${employee?.full_name || employee?.name || employee?.employeeName || 'Người dùng'} đã được chuyển đến Department "${department.department_name || department.name || department.departmentName}"`,
          type: 'info',
          category: 'user',
          priority: 'low',
          actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
          data: {
            departmentId: department.departmentId || department._id || department.id,
            departmentName: department.department_name || department.name || department.departmentName,
            employeeId: employee?._id || employee?.id || employee?.employeeId,
            employeeName: employee?.full_name || employee?.name || employee?.employeeName
          },
          eventName: 'employee_transferred_to_department',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Employee transferred to department notifications sent', {
        departmentId: department.departmentId || department._id || department.id,
        employeeId: employee?._id || employee?.id || employee?.employeeId,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending employee transferred notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when employee is removed from department
   * @param {Object} options - Notification options
   * @param {Object} options.department - Department data
   * @param {Object} options.employee - Employee information
   * @param {Object} options.remover - Remover information
   * @param {string} options.tenantId - Tenant ID
   */
  static async notifyEmployeeRemoved({ department, employee, remover, tenantId }) {
    try {
      const notifications = [];

      // Notify employee (personal notification)
      if (employee && (employee._id || employee.id || employee.employeeId)) {
        const employeeId = employee._id || employee.id || employee.employeeId;
        notifications.push(
          RealtimeNotificationService.sendToUser({
            userId: employeeId,
            title: 'Bạn đã bị gỡ khỏi Department',
            message: `Bạn đã bị gỡ khỏi Department "${department.department_name || department.name || department.departmentName}"`,
            type: 'warning',
            category: 'user',
            priority: 'high',
            tenantId,
            actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
            data: {
              departmentId: department.departmentId || department._id || department.id,
              departmentName: department.department_name || department.name || department.departmentName,
              removerId: remover?._id || remover?.id,
              removerName: remover?.full_name || remover?.name
            },
            eventName: 'employee_removed_from_department',
            saveToDatabase: true,
            sendWebSocket: true
          })
        );
      }

      // Broadcast to all users in tenant
      notifications.push(
        RealtimeNotificationService.sendToTenant({
          tenantId,
          title: 'Employee bị gỡ khỏi Department',
          message: `${employee?.full_name || employee?.name || employee?.employeeName || 'Người dùng'} đã bị gỡ khỏi Department "${department.department_name || department.name || department.departmentName}"`,
          type: 'info',
          category: 'user',
          priority: 'medium',
          actionUrl: `/departments/${department.departmentId || department._id || department.id}`,
          data: {
            departmentId: department.departmentId || department._id || department.id,
            departmentName: department.department_name || department.name || department.departmentName,
            employeeId: employee?._id || employee?.id || employee?.employeeId,
            employeeName: employee?.full_name || employee?.name || employee?.employeeName
          },
          eventName: 'employee_removed_from_department',
          saveToDatabase: false,
          sendWebSocket: true
        })
      );

      await Promise.allSettled(notifications);

      logger.info('Employee removed from department notifications sent', {
        departmentId: department.departmentId || department._id || department.id,
        employeeId: employee?._id || employee?.id || employee?.employeeId,
        tenantId
      });
    } catch (error) {
      logger.error('Error sending employee removed notifications:', error);
      throw error;
    }
  }
}

module.exports = DepartmentNotificationService;

