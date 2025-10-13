const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');

/**
 * Role Events Handler
 * Handles all role-related events and publishes them to Kafka
 */
class RoleEvents {
  /**
   * Emit role created event
   * @param {Object} roleData - Role data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleCreated(roleData, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleCreatedAt: roleData.created_at || new Date().toISOString(),
        roleUpdatedAt: roleData.updated_at || new Date().toISOString(),
        roleCreatedBy: roleData.created_by,
        roleUpdatedBy: roleData.updated_by,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {}
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Role created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role created event:', error);
      throw error;
    }
  }

  /**
   * Emit role updated event
   * @param {Object} roleData - Role data
   * @param {Object} oldRoleData - Old role data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleUpdated(roleData, oldRoleData, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleUpdatedAt: roleData.updated_at || new Date().toISOString(),
        roleUpdatedBy: roleData.updated_by,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {},
        changes: {
          name: oldRoleData.name !== roleData.name ? { old: oldRoleData.name, new: roleData.name } : null,
          code: oldRoleData.code !== roleData.code ? { old: oldRoleData.code, new: roleData.code } : null,
          description: oldRoleData.description !== roleData.description ? { old: oldRoleData.description, new: roleData.description } : null,
          permissions: JSON.stringify(oldRoleData.permissions) !== JSON.stringify(roleData.permissions) ? { old: oldRoleData.permissions, new: roleData.permissions } : null,
          status: oldRoleData.status !== roleData.status ? { old: oldRoleData.status, new: roleData.status } : null,
          level: oldRoleData.level !== roleData.level ? { old: oldRoleData.level, new: roleData.level } : null,
          priority: oldRoleData.priority !== roleData.priority ? { old: oldRoleData.priority, new: roleData.priority } : null,
          color: oldRoleData.color !== roleData.color ? { old: oldRoleData.color, new: roleData.color } : null,
          icon: oldRoleData.icon !== roleData.icon ? { old: oldRoleData.icon, new: roleData.icon } : null
        }
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Role updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role updated event:', error);
      throw error;
    }
  }

  /**
   * Emit role deleted event
   * @param {Object} roleData - Role data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleDeleted(roleData, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleDeletedAt: new Date().toISOString(),
        roleDeletedBy: metadata.userId,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {}
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Role deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit role status toggled event
   * @param {Object} roleData - Role data
   * @param {string} oldStatus - Old status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleStatusToggled(roleData, oldStatus, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleUpdatedAt: roleData.updated_at || new Date().toISOString(),
        roleUpdatedBy: roleData.updated_by,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {},
        statusChange: {
          oldStatus: oldStatus,
          newStatus: roleData.status,
          changedAt: new Date().toISOString(),
          changedBy: metadata.userId
        }
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_STATUS_TOGGLED,
        eventData,
        metadata
      );

      console.log(`✅ Role status toggled event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role status toggled event:', error);
      throw error;
    }
  }

  /**
   * Emit role permissions updated event
   * @param {Object} roleData - Role data
   * @param {Array} oldPermissions - Old permissions
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRolePermissionsUpdated(roleData, oldPermissions, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleUpdatedAt: roleData.updated_at || new Date().toISOString(),
        roleUpdatedBy: roleData.updated_by,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {},
        permissionChanges: {
          oldPermissions: oldPermissions,
          newPermissions: roleData.permissions || [],
          addedPermissions: (roleData.permissions || []).filter(p => !oldPermissions.includes(p)),
          removedPermissions: oldPermissions.filter(p => !(roleData.permissions || []).includes(p)),
          changedAt: new Date().toISOString(),
          changedBy: metadata.userId
        }
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_PERMISSIONS_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Role permissions updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role permissions updated event:', error);
      throw error;
    }
  }

  /**
   * Emit role assigned to user event
   * @param {Object} roleData - Role data
   * @param {Object} userData - User data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleAssignedToUser(roleData, userData, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {},
        user: {
          userId: userData._id || userData.id,
          userName: userData.full_name,
          userEmail: userData.email,
          userDepartmentId: userData.department_id,
          userPositionId: userData.position_id
        },
        assignedAt: new Date().toISOString(),
        assignedBy: metadata.userId
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_ASSIGNED_TO_USER,
        eventData,
        metadata
      );

      console.log(`✅ Role assigned to user event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role assigned to user event:', error);
      throw error;
    }
  }

  /**
   * Emit role removed from user event
   * @param {Object} roleData - Role data
   * @param {Object} userData - User data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitRoleRemovedFromUser(roleData, userData, metadata) {
    try {
      const eventData = {
        roleId: roleData._id || roleData.id,
        roleName: roleData.name,
        roleCode: roleData.code,
        roleDescription: roleData.description,
        rolePermissions: roleData.permissions || [],
        roleStatus: roleData.status,
        roleDepartmentId: roleData.department_id,
        roleLevel: roleData.level,
        roleIsSystem: roleData.is_system || false,
        rolePriority: roleData.priority || 0,
        roleColor: roleData.color,
        roleIcon: roleData.icon,
        roleTags: roleData.tags || [],
        roleMetadata: roleData.metadata || {},
        user: {
          userId: userData._id || userData.id,
          userName: userData.full_name,
          userEmail: userData.email,
          userDepartmentId: userData.department_id,
          userPositionId: userData.position_id
        },
        removedAt: new Date().toISOString(),
        removedBy: metadata.userId
      };

      const result = await kafkaProducer.sendRoleEvent(
        eventTypes.ROLE_REMOVED_FROM_USER,
        eventData,
        metadata
      );

      console.log(`✅ Role removed from user event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting role removed from user event:', error);
      throw error;
    }
  }
}

module.exports = RoleEvents;
