const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class ProjectResourceEvents {
  /**
   * Emit project resource created event
   * @param {Object} resource - Resource data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceCreated(resource, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        assignedTo: resource.assigned_to,
        assignedToName: resource.assigned_to_name,
        assignedToEmail: resource.assigned_to_email,
        assignedToRole: resource.assigned_to_role,
        createdAt: new Date().toISOString(),
        createdBy: resource.created_by,
        startDate: resource.start_date,
        endDate: resource.end_date,
        allocation: resource.allocation,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource created event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource updated event
   * @param {Object} resource - Updated resource data
   * @param {Object} oldResource - Old resource data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceUpdated(resource, oldResource, changes, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        assignedTo: resource.assigned_to,
        assignedToName: resource.assigned_to_name,
        assignedToEmail: resource.assigned_to_email,
        assignedToRole: resource.assigned_to_role,
        updatedAt: new Date().toISOString(),
        updatedBy: resource.updated_by,
        changes: changes,
        oldData: oldResource,
        startDate: resource.start_date,
        endDate: resource.end_date,
        allocation: resource.allocation,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource deleted event
   * @param {Object} resource - Resource data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceDeleted(resource, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        assignedTo: resource.assigned_to,
        assignedToName: resource.assigned_to_name,
        assignedToEmail: resource.assigned_to_email,
        assignedToRole: resource.assigned_to_role,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        startDate: resource.start_date,
        endDate: resource.end_date,
        allocation: resource.allocation,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource allocated event
   * @param {Object} resource - Resource data
   * @param {Object} allocation - Allocation data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceAllocated(resource, allocation, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        allocatedAt: new Date().toISOString(),
        allocatedBy: metadata.userId,
        allocationType: allocation.type,
        allocationPercentage: allocation.percentage,
        allocationHours: allocation.hours,
        startDate: allocation.start_date,
        endDate: allocation.end_date,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_ALLOCATED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource allocated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource allocated event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource deallocated event
   * @param {Object} resource - Resource data
   * @param {Object} deallocation - Deallocation data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceDeallocated(resource, deallocation, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        deallocatedAt: new Date().toISOString(),
        deallocatedBy: metadata.userId,
        deallocationType: deallocation.type,
        deallocationPercentage: deallocation.percentage,
        deallocationHours: deallocation.hours,
        startDate: deallocation.start_date,
        endDate: deallocation.end_date,
        reason: deallocation.reason,
        notes: deallocation.notes,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_DEALLOCATED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource deallocated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource deallocated event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource status changed event
   * @param {Object} resource - Resource data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceStatusChanged(resource, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        oldStatus: oldStatus,
        newStatus: newStatus,
        status: resource.status,
        assignedTo: resource.assigned_to,
        assignedToName: resource.assigned_to_name,
        assignedToEmail: resource.assigned_to_email,
        assignedToRole: resource.assigned_to_role,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: metadata.userId,
        reason: metadata.reason,
        notes: metadata.notes,
        startDate: resource.start_date,
        endDate: resource.end_date,
        allocation: resource.allocation,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit project resource utilization updated event
   * @param {Object} resource - Resource data
   * @param {Object} utilization - Utilization data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectResourceUtilizationUpdated(resource, utilization, metadata) {
    try {
      const eventData = {
        resourceId: resource._id,
        projectId: resource.project_id,
        name: resource.name,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        updatedAt: new Date().toISOString(),
        updatedBy: metadata.userId,
        utilizationType: utilization.type,
        utilizationPercentage: utilization.percentage,
        utilizationHours: utilization.hours,
        utilizationDate: utilization.date,
        utilizationPeriod: utilization.period,
        cost: resource.cost,
        budget: resource.budget,
        actualCost: resource.actual_cost,
        remainingBudget: resource.remaining_budget,
        utilization: resource.utilization,
        capacity: resource.capacity,
        availability: resource.availability,
        skills: resource.skills || [],
        certifications: resource.certifications || [],
        attachments: resource.attachments || [],
        metadata: resource.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_RESOURCE_UTILIZATION_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Project resource utilization updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project resource utilization updated event:', error);
      throw error;
    }
  }
}

module.exports = ProjectResourceEvents;
