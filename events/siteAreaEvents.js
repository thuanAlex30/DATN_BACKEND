const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class SiteAreaEvents {
  /**
   * Emit site area created event
   * @param {Object} area - Area data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaCreated(area, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        description: area.description,
        siteId: area.site_id,
        projectId: area.project_id,
        isActive: area.is_active,
        createdAt: new Date().toISOString(),
        createdBy: area.created_by,
        areaType: area.area_type,
        coordinates: area.coordinates,
        dimensions: area.dimensions,
        capacity: area.capacity,
        status: area.status,
        safetyLevel: area.safety_level,
        accessLevel: area.access_level,
        tags: area.tags || [],
        metadata: area.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Site area created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area created event:', error);
      throw error;
    }
  }

  /**
   * Emit site area updated event
   * @param {Object} area - Updated area data
   * @param {Object} oldArea - Old area data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaUpdated(area, oldArea, changes, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        description: area.description,
        siteId: area.site_id,
        projectId: area.project_id,
        isActive: area.is_active,
        updatedAt: new Date().toISOString(),
        updatedBy: area.updated_by,
        changes: changes,
        oldData: oldArea,
        areaType: area.area_type,
        coordinates: area.coordinates,
        dimensions: area.dimensions,
        capacity: area.capacity,
        status: area.status,
        safetyLevel: area.safety_level,
        accessLevel: area.access_level,
        tags: area.tags || [],
        metadata: area.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Site area updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area updated event:', error);
      throw error;
    }
  }

  /**
   * Emit site area deleted event
   * @param {Object} area - Area data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaDeleted(area, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        description: area.description,
        siteId: area.site_id,
        projectId: area.project_id,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        areaType: area.area_type,
        coordinates: area.coordinates,
        dimensions: area.dimensions,
        capacity: area.capacity,
        status: area.status,
        safetyLevel: area.safety_level,
        accessLevel: area.access_level,
        tags: area.tags || [],
        metadata: area.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Site area deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit site area status changed event
   * @param {Object} area - Area data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaStatusChanged(area, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        siteId: area.site_id,
        projectId: area.project_id,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: metadata.userId,
        isActive: area.is_active,
        status: area.status,
        reason: metadata.reason,
        notes: metadata.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Site area status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit site area access control added event
   * @param {Object} area - Area data
   * @param {Object} accessControl - Access control data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaAccessControlAdded(area, accessControl, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        siteId: area.site_id,
        projectId: area.project_id,
        accessControlId: accessControl._id,
        addedAt: new Date().toISOString(),
        addedBy: metadata.userId,
        accessType: accessControl.access_type,
        userId: accessControl.user_id,
        userName: accessControl.user_name,
        userRole: accessControl.user_role,
        permissions: accessControl.permissions || [],
        startDate: accessControl.start_date,
        endDate: accessControl.end_date,
        isActive: accessControl.is_active,
        notes: accessControl.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_ACCESS_CONTROL_ADDED,
        eventData,
        metadata
      );

      console.log(`✅ Site area access control added event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area access control added event:', error);
      throw error;
    }
  }

  /**
   * Emit site area access control removed event
   * @param {Object} area - Area data
   * @param {Object} accessControl - Access control data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaAccessControlRemoved(area, accessControl, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        siteId: area.site_id,
        projectId: area.project_id,
        accessControlId: accessControl._id,
        removedAt: new Date().toISOString(),
        removedBy: metadata.userId,
        accessType: accessControl.access_type,
        userId: accessControl.user_id,
        userName: accessControl.user_name,
        userRole: accessControl.user_role,
        permissions: accessControl.permissions || [],
        reason: metadata.reason,
        notes: metadata.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_ACCESS_CONTROL_REMOVED,
        eventData,
        metadata
      );

      console.log(`✅ Site area access control removed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area access control removed event:', error);
      throw error;
    }
  }

  /**
   * Emit site area inspection completed event
   * @param {Object} area - Area data
   * @param {Object} inspection - Inspection data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaInspectionCompleted(area, inspection, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        siteId: area.site_id,
        projectId: area.project_id,
        inspectionId: inspection._id,
        inspectionType: inspection.type,
        completedAt: new Date().toISOString(),
        completedBy: metadata.userId,
        inspectorName: inspection.inspector_name,
        inspectorEmail: inspection.inspector_email,
        score: inspection.score,
        status: inspection.status,
        findings: inspection.findings || [],
        recommendations: inspection.recommendations || [],
        nextInspectionDate: inspection.next_inspection_date,
        isActive: area.is_active,
        areaStatus: area.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_INSPECTION_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ Site area inspection completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area inspection completed event:', error);
      throw error;
    }
  }

  /**
   * Emit site area safety checklist created event
   * @param {Object} area - Area data
   * @param {Object} checklist - Checklist data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAreaSafetyChecklistCreated(area, checklist, metadata) {
    try {
      const eventData = {
        areaId: area._id,
        areaName: area.area_name,
        siteId: area.site_id,
        projectId: area.project_id,
        checklistId: checklist._id,
        checklistName: checklist.name,
        checklistType: checklist.type,
        createdAt: new Date().toISOString(),
        createdBy: metadata.userId,
        items: checklist.items || [],
        isActive: checklist.is_active,
        status: checklist.status,
        notes: checklist.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_AREA_SAFETY_CHECKLIST_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Site area safety checklist created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site area safety checklist created event:', error);
      throw error;
    }
  }
}

module.exports = SiteAreaEvents;
