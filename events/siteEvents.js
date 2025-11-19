const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class SiteEvents {
  /**
   * Emit site created event
   * @param {Object} site - Site data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteCreated(site, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        address: site.address,
        contactPerson: site.contact_person,
        contactPhone: site.contact_phone,
        contactEmail: site.contact_email,
        projectId: site.project_id,
        isActive: site.is_active,
        createdAt: new Date().toISOString(),
        createdBy: site.created_by,
        description: site.description,
        coordinates: site.coordinates,
        area: site.area,
        capacity: site.capacity,
        siteType: site.site_type,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        budget: site.budget,
        priority: site.priority,
        tags: site.tags || [],
        metadata: site.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Site created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site created event:', error);
      throw error;
    }
  }

  /**
   * Emit site updated event
   * @param {Object} site - Updated site data
   * @param {Object} oldSite - Old site data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteUpdated(site, oldSite, changes, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        address: site.address,
        contactPerson: site.contact_person,
        contactPhone: site.contact_phone,
        contactEmail: site.contact_email,
        projectId: site.project_id,
        isActive: site.is_active,
        updatedAt: new Date().toISOString(),
        updatedBy: site.updated_by,
        changes: changes,
        oldData: oldSite,
        description: site.description,
        coordinates: site.coordinates,
        area: site.area,
        capacity: site.capacity,
        siteType: site.site_type,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        budget: site.budget,
        priority: site.priority,
        tags: site.tags || [],
        metadata: site.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Site updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site updated event:', error);
      throw error;
    }
  }

  /**
   * Emit site deleted event
   * @param {Object} site - Site data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteDeleted(site, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        address: site.address,
        contactPerson: site.contact_person,
        contactPhone: site.contact_phone,
        contactEmail: site.contact_email,
        projectId: site.project_id,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        description: site.description,
        coordinates: site.coordinates,
        area: site.area,
        capacity: site.capacity,
        siteType: site.site_type,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        budget: site.budget,
        priority: site.priority,
        tags: site.tags || [],
        metadata: site.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Site deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit site status changed event
   * @param {Object} site - Site data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteStatusChanged(site, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        projectId: site.project_id,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: metadata.userId,
        isActive: site.is_active,
        status: site.status,
        reason: metadata.reason,
        notes: metadata.notes
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Site status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit site assigned event
   * @param {Object} site - Site data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteAssigned(site, assignee, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        projectId: site.project_id,
        assignedAt: new Date().toISOString(),
        assignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'manager',
        startDate: assignee.startDate,
        endDate: assignee.endDate,
        notes: assignee.notes,
        isActive: site.is_active,
        status: site.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Site assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit site unassigned event
   * @param {Object} site - Site data
   * @param {Object} assignee - Assignee data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteUnassigned(site, assignee, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        projectId: site.project_id,
        unassignedAt: new Date().toISOString(),
        unassignedBy: metadata.userId,
        assigneeId: assignee._id || assignee.id,
        assigneeName: assignee.full_name || assignee.username,
        assigneeEmail: assignee.email,
        assigneeRole: assignee.role,
        assignmentType: assignee.assignmentType || 'manager',
        reason: metadata.reason,
        notes: metadata.notes,
        isActive: site.is_active,
        status: site.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_UNASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Site unassigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site unassigned event:', error);
      throw error;
    }
  }

  /**
   * Emit site inspection completed event
   * @param {Object} site - Site data
   * @param {Object} inspection - Inspection data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteInspectionCompleted(site, inspection, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        projectId: site.project_id,
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
        isActive: site.is_active,
        siteStatus: site.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_INSPECTION_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ Site inspection completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site inspection completed event:', error);
      throw error;
    }
  }

  /**
   * Emit site maintenance scheduled event
   * @param {Object} site - Site data
   * @param {Object} maintenance - Maintenance data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitSiteMaintenanceScheduled(site, maintenance, metadata) {
    try {
      const eventData = {
        siteId: site._id,
        siteName: site.site_name,
        projectId: site.project_id,
        maintenanceId: maintenance._id,
        maintenanceType: maintenance.type,
        scheduledAt: new Date().toISOString(),
        scheduledBy: metadata.userId,
        scheduledFor: maintenance.scheduled_for,
        assignedTo: maintenance.assigned_to,
        priority: maintenance.priority,
        description: maintenance.description,
        estimatedDuration: maintenance.estimated_duration,
        estimatedCost: maintenance.estimated_cost,
        isActive: site.is_active,
        siteStatus: site.status
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.SITE_MAINTENANCE_SCHEDULED,
        eventData,
        metadata
      );

      console.log(`✅ Site maintenance scheduled event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting site maintenance scheduled event:', error);
      throw error;
    }
  }
}

module.exports = SiteEvents;
