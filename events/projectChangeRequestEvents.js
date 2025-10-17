const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class ProjectChangeRequestEvents {
  /**
   * Emit project change request created event
   * @param {Object} changeRequest - Change request data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestCreated(changeRequest, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        createdAt: new Date().toISOString(),
        createdBy: changeRequest.created_by,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request created event:', error);
      throw error;
    }
  }

  /**
   * Emit project change request updated event
   * @param {Object} changeRequest - Updated change request data
   * @param {Object} oldChangeRequest - Old change request data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestUpdated(changeRequest, oldChangeRequest, changes, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        updatedAt: new Date().toISOString(),
        updatedBy: changeRequest.updated_by,
        changes: changes,
        oldData: oldChangeRequest,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project change request deleted event
   * @param {Object} changeRequest - Change request data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestDeleted(changeRequest, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        deletedAt: new Date().toISOString(),
        deletedBy: metadata.userId,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project change request approved event
   * @param {Object} changeRequest - Change request data
   * @param {Object} approvalData - Approval data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestApproved(changeRequest, approvalData, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        approvedAt: new Date().toISOString(),
        approvedBy: metadata.userId,
        approverName: approvalData.approver_name,
        approverEmail: approvalData.approver_email,
        approverRole: approvalData.approver_role,
        approvalNotes: approvalData.approval_notes,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_APPROVED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request approved event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request approved event:', error);
      throw error;
    }
  }

  /**
   * Emit project change request rejected event
   * @param {Object} changeRequest - Change request data
   * @param {Object} rejectionData - Rejection data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestRejected(changeRequest, rejectionData, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        rejectedAt: new Date().toISOString(),
        rejectedBy: metadata.userId,
        rejectorName: rejectionData.rejector_name,
        rejectorEmail: rejectionData.rejector_email,
        rejectorRole: rejectionData.rejector_role,
        rejectionReason: rejectionData.rejection_reason,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_REJECTED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request rejected event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request rejected event:', error);
      throw error;
    }
  }

  /**
   * Emit project change request status changed event
   * @param {Object} changeRequest - Change request data
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProjectChangeRequestStatusChanged(changeRequest, oldStatus, newStatus, metadata) {
    try {
      const eventData = {
        changeRequestId: changeRequest._id,
        projectId: changeRequest.project_id,
        title: changeRequest.title,
        description: changeRequest.description,
        type: changeRequest.type,
        priority: changeRequest.priority,
        oldStatus: oldStatus,
        newStatus: newStatus,
        status: changeRequest.status,
        requestedBy: changeRequest.requested_by,
        requestedByName: changeRequest.requested_by_name,
        requestedByEmail: changeRequest.requested_by_email,
        requestedByRole: changeRequest.requested_by_role,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: metadata.userId,
        reason: metadata.reason,
        notes: metadata.notes,
        impact: changeRequest.impact,
        effort: changeRequest.effort,
        timeline: changeRequest.timeline,
        justification: changeRequest.justification,
        alternatives: changeRequest.alternatives || [],
        attachments: changeRequest.attachments || [],
        metadata: changeRequest.metadata || {}
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CHANGE_REQUEST_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Project change request status changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting project change request status changed event:', error);
      throw error;
    }
  }
}

module.exports = ProjectChangeRequestEvents;
