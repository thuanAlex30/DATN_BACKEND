const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');

/**
 * Department Events Handler
 * Handles all department-related events and publishes them to Kafka
 */
class DepartmentEvents {
  /**
   * Emit department created event
   * @param {Object} departmentData - Department data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitDepartmentCreated(departmentData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentCreatedAt: departmentData.created_at || new Date().toISOString(),
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentCreatedBy: departmentData.created_by,
        departmentUpdatedBy: departmentData.updated_by,
        manager: departmentData.manager_id ? {
          managerId: departmentData.manager_id._id || departmentData.manager_id.id,
          managerName: departmentData.manager_id.full_name,
          managerEmail: departmentData.manager_id.email,
          managerPhone: departmentData.manager_id.phone
        } : null,
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {}
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.DEPARTMENT_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Department created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting department created event:', error);
      throw error;
    }
  }

  /**
   * Emit department updated event
   * @param {Object} departmentData - Department data
   * @param {Object} oldDepartmentData - Old department data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitDepartmentUpdated(departmentData, oldDepartmentData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentUpdatedBy: departmentData.updated_by,
        manager: departmentData.manager_id ? {
          managerId: departmentData.manager_id._id || departmentData.manager_id.id,
          managerName: departmentData.manager_id.full_name,
          managerEmail: departmentData.manager_id.email,
          managerPhone: departmentData.manager_id.phone
        } : null,
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        changes: {
          name: oldDepartmentData.department_name !== departmentData.department_name ? { old: oldDepartmentData.department_name, new: departmentData.department_name } : null,
          description: oldDepartmentData.description !== departmentData.description ? { old: oldDepartmentData.description, new: departmentData.description } : null,
          code: oldDepartmentData.department_code !== departmentData.department_code ? { old: oldDepartmentData.department_code, new: departmentData.department_code } : null,
          status: oldDepartmentData.is_active !== departmentData.is_active ? { old: oldDepartmentData.is_active, new: departmentData.is_active } : null,
          manager: JSON.stringify(oldDepartmentData.manager_id) !== JSON.stringify(departmentData.manager_id) ? { old: oldDepartmentData.manager_id, new: departmentData.manager_id } : null,
          location: oldDepartmentData.location !== departmentData.location ? { old: oldDepartmentData.location, new: departmentData.location } : null,
          budget: oldDepartmentData.budget !== departmentData.budget ? { old: oldDepartmentData.budget, new: departmentData.budget } : null,
          costCenter: oldDepartmentData.cost_center !== departmentData.cost_center ? { old: oldDepartmentData.cost_center, new: departmentData.cost_center } : null
        }
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.DEPARTMENT_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Department updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting department updated event:', error);
      throw error;
    }
  }

  /**
   * Emit department deleted event
   * @param {Object} departmentData - Department data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitDepartmentDeleted(departmentData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentDeletedAt: new Date().toISOString(),
        departmentDeletedBy: metadata.userId,
        manager: departmentData.manager_id ? {
          managerId: departmentData.manager_id._id || departmentData.manager_id.id,
          managerName: departmentData.manager_id.full_name,
          managerEmail: departmentData.manager_id.email,
          managerPhone: departmentData.manager_id.phone
        } : null,
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        employeeCount: departmentData.employees_count || 0
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.DEPARTMENT_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Department deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting department deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit department manager assigned event
   * @param {Object} departmentData - Department data
   * @param {Object} managerData - Manager data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitDepartmentManagerAssigned(departmentData, managerData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentUpdatedBy: departmentData.updated_by,
        manager: {
          managerId: managerData._id || managerData.id,
          managerName: managerData.full_name,
          managerEmail: managerData.email,
          managerPhone: managerData.phone,
          managerPosition: managerData.position_id ? {
            positionId: managerData.position_id._id || managerData.position_id.id,
            positionName: managerData.position_id.position_name,
            positionLevel: managerData.position_id.level
          } : null,
          managerRole: managerData.role_id ? {
            roleId: managerData.role_id._id || managerData.role_id.id,
            roleName: managerData.role_id.role_name
          } : null
        },
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        assignedAt: new Date().toISOString(),
        assignedBy: metadata.userId
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.DEPARTMENT_MANAGER_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Department manager assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting department manager assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit department manager removed event
   * @param {Object} departmentData - Department data
   * @param {Object} managerData - Manager data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitDepartmentManagerRemoved(departmentData, managerData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentUpdatedBy: departmentData.updated_by,
        manager: {
          managerId: managerData._id || managerData.id,
          managerName: managerData.full_name,
          managerEmail: managerData.email,
          managerPhone: managerData.phone,
          managerPosition: managerData.position_id ? {
            positionId: managerData.position_id._id || managerData.position_id.id,
            positionName: managerData.position_id.position_name,
            positionLevel: managerData.position_id.level
          } : null,
          managerRole: managerData.role_id ? {
            roleId: managerData.role_id._id || managerData.role_id.id,
            roleName: managerData.role_id.role_name
          } : null
        },
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        removedAt: new Date().toISOString(),
        removedBy: metadata.userId
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.DEPARTMENT_MANAGER_REMOVED,
        eventData,
        metadata
      );

      console.log(`✅ Department manager removed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting department manager removed event:', error);
      throw error;
    }
  }

  /**
   * Emit employee transferred to department event
   * @param {Object} departmentData - Department data
   * @param {Object} employeeData - Employee data
   * @param {Object} fromDepartmentData - From department data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitEmployeeTransferredToDepartment(departmentData, employeeData, fromDepartmentData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentUpdatedBy: departmentData.updated_by,
        manager: departmentData.manager_id ? {
          managerId: departmentData.manager_id._id || departmentData.manager_id.id,
          managerName: departmentData.manager_id.full_name,
          managerEmail: departmentData.manager_id.email,
          managerPhone: departmentData.manager_id.phone
        } : null,
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        employee: {
          employeeId: employeeData._id || employeeData.id,
          employeeName: employeeData.full_name,
          employeeEmail: employeeData.email,
          employeePhone: employeeData.phone,
          employeePosition: employeeData.position_id ? {
            positionId: employeeData.position_id._id || employeeData.position_id.id,
            positionName: employeeData.position_id.position_name,
            positionLevel: employeeData.position_id.level
          } : null,
          employeeRole: employeeData.role_id ? {
            roleId: employeeData.role_id._id || employeeData.role_id.id,
            roleName: employeeData.role_id.role_name
          } : null
        },
        fromDepartment: fromDepartmentData ? {
          fromDepartmentId: fromDepartmentData._id || fromDepartmentData.id,
          fromDepartmentName: fromDepartmentData.department_name
        } : null,
        transferredAt: new Date().toISOString(),
        transferredBy: metadata.userId
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.EMPLOYEE_TRANSFERRED_TO_DEPARTMENT,
        eventData,
        metadata
      );

      console.log(`✅ Employee transferred to department event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting employee transferred to department event:', error);
      throw error;
    }
  }

  /**
   * Emit employee removed from department event
   * @param {Object} departmentData - Department data
   * @param {Object} employeeData - Employee data
   * @param {Object} toDepartmentData - To department data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitEmployeeRemovedFromDepartment(departmentData, employeeData, toDepartmentData, metadata) {
    try {
      const eventData = {
        departmentId: departmentData._id || departmentData.id,
        departmentName: departmentData.department_name,
        departmentDescription: departmentData.description,
        departmentCode: departmentData.department_code,
        departmentStatus: departmentData.is_active,
        departmentUpdatedAt: departmentData.updated_at || new Date().toISOString(),
        departmentUpdatedBy: departmentData.updated_by,
        manager: departmentData.manager_id ? {
          managerId: departmentData.manager_id._id || departmentData.manager_id.id,
          managerName: departmentData.manager_id.full_name,
          managerEmail: departmentData.manager_id.email,
          managerPhone: departmentData.manager_id.phone
        } : null,
        parentDepartment: departmentData.parent_department_id ? {
          parentDepartmentId: departmentData.parent_department_id._id || departmentData.parent_department_id.id,
          parentDepartmentName: departmentData.parent_department_id.department_name
        } : null,
        departmentLocation: departmentData.location,
        departmentBudget: departmentData.budget,
        departmentCostCenter: departmentData.cost_center,
        departmentMetadata: departmentData.metadata || {},
        employee: {
          employeeId: employeeData._id || employeeData.id,
          employeeName: employeeData.full_name,
          employeeEmail: employeeData.email,
          employeePhone: employeeData.phone,
          employeePosition: employeeData.position_id ? {
            positionId: employeeData.position_id._id || employeeData.position_id.id,
            positionName: employeeData.position_id.position_name,
            positionLevel: employeeData.position_id.level
          } : null,
          employeeRole: employeeData.role_id ? {
            roleId: employeeData.role_id._id || employeeData.role_id.id,
            roleName: employeeData.role_id.role_name
          } : null
        },
        toDepartment: toDepartmentData ? {
          toDepartmentId: toDepartmentData._id || toDepartmentData.id,
          toDepartmentName: toDepartmentData.department_name
        } : null,
        removedAt: new Date().toISOString(),
        removedBy: metadata.userId
      };

      const result = await kafkaProducer.sendDepartmentEvent(
        eventTypes.EMPLOYEE_REMOVED_FROM_DEPARTMENT,
        eventData,
        metadata
      );

      console.log(`✅ Employee removed from department event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting employee removed from department event:', error);
      throw error;
    }
  }
}

module.exports = DepartmentEvents;
