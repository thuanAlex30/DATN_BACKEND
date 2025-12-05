const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class WorkLocationEvents {
  /**
   * Emit work location created event
   * @param {Object} location - Location data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationCreated(location, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        description: location.description,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        isActive: location.is_active,
        createdAt: new Date().toISOString(),
        createdBy: location.created_by,
        locationType: location.location_type,
        coordinates: location.coordinates,
        dimensions: location.dimensions,
        capacity: location.capacity,
        status: location.status,
        safetyLevel: location.safety_level,
        accessLevel: location.access_level,
        equipment: location.equipment || [],
        tags: location.tags || [],
        metadata: location.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Work location created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location created event:', error);
      throw error;
    }
  }

  /**
   * Emit work location updated event
   * @param {Object} location - Updated location data
   * @param {Object} oldLocation - Old location data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationUpdated(location, oldLocation, changes, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        description: location.description,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        isActive: location.is_active,
        updatedAt: new Date().toISOString(),
        updatedBy: location.updated_by,
        changes: changes,
        oldData: oldLocation,
        locationType: location.location_type,
        coordinates: location.coordinates,
        dimensions: location.dimensions,
        capacity: location.capacity,
        status: location.status,
        safetyLevel: location.safety_level,
        accessLevel: location.access_level,
        equipment: location.equipment || [],
        tags: location.tags || [],
        metadata: location.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Work location updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location updated event:', error);
      throw error;
    }
  }

  /**
   * Emit work location deleted event
   * @param {Object} location - Location data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationDeleted(location, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        description: location.description,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        locationType: location.location_type,
        coordinates: location.coordinates,
        dimensions: location.dimensions,
        capacity: location.capacity,
        status: location.status,
        safetyLevel: location.safety_level,
        accessLevel: location.access_level,
        equipment: location.equipment || [],
        tags: location.tags || [],
        metadata: location.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Work location deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit work location status changed event
   * @param {Object} location - Location data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationStatusChanged(location, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: metadata.userId,
        isActive: location.is_active,
        status: location.status,
        reason: metadata.reason,
        notes: metadata.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Work location status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit work location assigned event
   * @param {Object} location - Location data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationAssigned(location, assignee, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        assignedAt: new Date().toISOString(),
        assignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'worker',
        startDate: assignee.startDate,
        endDate: assignee.endDate,
        notes: assignee.notes,
        isActive: location.is_active,
        status: location.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Work location assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit work location unassigned event
   * @param {Object} location - Location data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationUnassigned(location, assignee, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        unassignedAt: new Date().toISOString(),
        unassignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'worker',
        reason: metadata.reason,
        notes: metadata.notes,
        isActive: location.is_active,
        status: location.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_UNASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Work location unassigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location unassigned event:', error);
      throw error;
    }
  }

  /**
   * Emit work location availability updated event
   * @param {Object} location - Location data
   * @param {Object} availability - Availability data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationAvailabilityUpdated(location, availability, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        updatedAt: new Date().toISOString(),
        updatedBy: metadata.userId,
        availabilityType: availability.type,
        startDate: availability.start_date,
        endDate: availability.end_date,
        isAvailable: availability.is_available,
        reason: availability.reason,
        notes: availability.notes,
        isActive: location.is_active,
        status: location.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_AVAILABILITY_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Work location availability updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location availability updated event:', error);
      throw error;
    }
  }

  /**
   * Emit work location equipment added event
   * @param {Object} location - Location data
   * @param {Object} equipment - Equipment data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationEquipmentAdded(location, equipment, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        equipmentId: equipment._id,
        equipmentName: equipment.name,
        equipmentType: equipment.type,
        addedAt: new Date().toISOString(),
        addedBy: metadata.userId,
        quantity: equipment.quantity,
        status: equipment.status,
        notes: equipment.notes,
        isActive: location.is_active,
        locationStatus: location.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_EQUIPMENT_ADDED,
        eventData,
        metadata
      );

      console.log(`✅ Work location equipment added event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location equipment added event:', error);
      throw error;
    }
  }

  /**
   * Emit work location equipment removed event
   * @param {Object} location - Location data
   * @param {Object} equipment - Equipment data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitWorkLocationEquipmentRemoved(location, equipment, metadata) {
    try {
      const eventData = {
        locationId: location._id,
        locationName: location.location_name,
        areaId: location.area_id,
        siteId: location.site_id,
        projectId: location.project_id,
        equipmentId: equipment._id,
        equipmentName: equipment.name,
        equipmentType: equipment.type,
        removedAt: new Date().toISOString(),
        removedBy: metadata.userId,
        quantity: equipment.quantity,
        reason: metadata.reason,
        notes: metadata.notes,
        isActive: location.is_active,
        locationStatus: location.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.WORK_LOCATION_EQUIPMENT_REMOVED,
        eventData,
        metadata
      );

      console.log(`✅ Work location equipment removed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting work location equipment removed event:', error);
      throw error;
    }
  }
}

module.exports = WorkLocationEvents;
