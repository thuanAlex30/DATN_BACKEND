const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class IncidentEvents {
  /**
   * Emit incident reported event
   * @param {Object} incident - Incident data
   * @param {Object} reporter - Reporter information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentReported(incident, reporter) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        reportedAt: incident.reported_at,
        attachments: incident.attachments || [],
        witnesses: incident.witnesses || [],
        immediateActions: incident.immediate_actions || [],
        estimatedCost: incident.estimated_cost,
        estimatedDelay: incident.estimated_delay
      };

      const metadata = {
        userId: reporter._id,
        userRole: reporter.role,
        userFullName: reporter.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_REPORTED,
        eventData,
        metadata
      );

      console.log(`✅ Incident reported event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident reported event:', error);
      throw error;
    }
  }

  /**
   * Emit incident updated event
   * @param {Object} incident - Updated incident data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentUpdated(incident, updater, changes) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        reportedAt: incident.reported_at,
        updatedAt: incident.updated_at,
        attachments: incident.attachments || [],
        witnesses: incident.witnesses || [],
        immediateActions: incident.immediate_actions || [],
        estimatedCost: incident.estimated_cost,
        estimatedDelay: incident.estimated_delay,
        changes: changes
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Incident updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident updated event:', error);
      throw error;
    }
  }

  /**
   * Emit incident assigned event
   * @param {Object} incident - Incident data
   * @param {Object} assignee - Assignee information
   * @param {Object} assigner - Assigner information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentAssigned(incident, assignee, assigner) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        assignedTo: assignee._id,
        assignedAt: new Date().toISOString(),
        priority: incident.priority,
        dueDate: incident.due_date
      };

      const metadata = {
        userId: assigner._id,
        userRole: assigner.role,
        userFullName: assigner.full_name,
        assigneeId: assignee._id,
        assigneeName: assignee.full_name,
        assigneeRole: assignee.role,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ Incident assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit incident status updated event
   * @param {Object} incident - Incident data
   * @param {Object} updater - Updater information
   * @param {string} previousStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentStatusUpdated(incident, updater, previousStatus, newStatus) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: newStatus,
        previousStatus: previousStatus,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        statusChangedAt: new Date().toISOString(),
        statusChangeReason: incident.status_change_reason,
        resolution: incident.resolution,
        resolvedAt: incident.resolved_at
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_STATUS_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Incident status updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident status updated event:', error);
      throw error;
    }
  }

  /**
   * Emit incident investigation started event
   * @param {Object} incident - Incident data
   * @param {Object} investigator - Investigator information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentInvestigationStarted(incident, investigator) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        investigatorId: investigator._id,
        investigationStartedAt: new Date().toISOString(),
        investigationPlan: incident.investigation_plan,
        expectedCompletionDate: incident.expected_completion_date
      };

      const metadata = {
        userId: investigator._id,
        userRole: investigator.role,
        userFullName: investigator.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_INVESTIGATION_STARTED,
        eventData,
        metadata
      );

      console.log(`✅ Incident investigation started event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident investigation started event:', error);
      throw error;
    }
  }

  /**
   * Emit incident investigation completed event
   * @param {Object} incident - Incident data
   * @param {Object} investigator - Investigator information
   * @param {Object} investigationReport - Investigation report
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentInvestigationCompleted(incident, investigator, investigationReport) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        investigatorId: investigator._id,
        investigationCompletedAt: new Date().toISOString(),
        investigationReport: investigationReport,
        rootCause: investigationReport.root_cause,
        contributingFactors: investigationReport.contributing_factors,
        recommendations: investigationReport.recommendations,
        preventiveMeasures: investigationReport.preventive_measures
      };

      const metadata = {
        userId: investigator._id,
        userRole: investigator.role,
        userFullName: investigator.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_INVESTIGATION_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ Incident investigation completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident investigation completed event:', error);
      throw error;
    }
  }

  /**
   * Emit incident resolved event
   * @param {Object} incident - Incident data
   * @param {Object} resolver - Resolver information
   * @param {Object} resolution - Resolution details
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentResolved(incident, resolver, resolution) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: 'resolved',
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        resolverId: resolver._id,
        resolvedAt: new Date().toISOString(),
        resolution: resolution,
        resolutionSummary: resolution.summary,
        actionsTaken: resolution.actions_taken,
        followUpRequired: resolution.follow_up_required,
        lessonsLearned: resolution.lessons_learned
      };

      const metadata = {
        userId: resolver._id,
        userRole: resolver.role,
        userFullName: resolver.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_RESOLVED,
        eventData,
        metadata
      );

      console.log(`✅ Incident resolved event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident resolved event:', error);
      throw error;
    }
  }

  /**
   * Emit incident closed event
   * @param {Object} incident - Incident data
   * @param {Object} closer - Closer information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentClosed(incident, closer) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: 'closed',
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        closedBy: closer._id,
        closedAt: new Date().toISOString(),
        closureReason: incident.closure_reason,
        finalCost: incident.final_cost,
        finalDelay: incident.final_delay
      };

      const metadata = {
        userId: closer._id,
        userRole: closer.role,
        userFullName: closer.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_CLOSED,
        eventData,
        metadata
      );

      console.log(`✅ Incident closed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident closed event:', error);
      throw error;
    }
  }

  /**
   * Emit incident deleted event
   * @param {Object} incident - Incident data
   * @param {Object} deleter - Deleter information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentDeleted(incident, deleter) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        deletedAt: new Date().toISOString(),
        deletionReason: incident.deletion_reason
      };

      const metadata = {
        userId: deleter._id,
        userRole: deleter.role,
        userFullName: deleter.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ Incident deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit incident comment added event
   * @param {Object} incident - Incident data
   * @param {Object} comment - Comment data
   * @param {Object} commenter - Commenter information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentCommentAdded(incident, comment, commenter) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        commentId: comment._id,
        commentText: comment.text,
        commentType: comment.type,
        commentCreatedAt: comment.created_at,
        attachments: comment.attachments || []
      };

      const metadata = {
        userId: commenter._id,
        userRole: commenter.role,
        userFullName: commenter.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_COMMENT_ADDED,
        eventData,
        metadata
      );

      console.log(`✅ Incident comment added event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident comment added event:', error);
      throw error;
    }
  }

  /**
   * Emit incident attachment added event
   * @param {Object} incident - Incident data
   * @param {Object} attachment - Attachment data
   * @param {Object} uploader - Uploader information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentAttachmentAdded(incident, attachment, uploader) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        projectId: incident.project_id,
        siteId: incident.site_id,
        reporterId: incident.reporter_id,
        attachmentId: attachment._id,
        attachmentName: attachment.name,
        attachmentType: attachment.type,
        attachmentSize: attachment.size,
        attachmentUrl: attachment.url,
        uploadedAt: attachment.uploaded_at
      };

      const metadata = {
        userId: uploader._id,
        userRole: uploader.role,
        userFullName: uploader.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_ATTACHMENT_ADDED,
        eventData,
        metadata
      );

      console.log(`✅ Incident attachment added event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident attachment added event:', error);
      throw error;
    }
  }

  /**
   * Emit incident escalated event
   * @param {Object} incident - Incident data
   * @param {Object} escalation - Escalation data
   * @param {Object} escalator - Escalator information
   * @returns {Promise<Object>} Event result
   */
  static async emitIncidentEscalated(incident, escalation, escalator) {
    try {
      const eventData = {
        incidentId: incident._id,
        incidentType: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        description: incident.description,
        escalationId: escalation._id,
        escalationLevel: escalation.escalation_level,
        reason: escalation.reason,
        departmentId: escalation.department_id,
        escalatedAt: escalation.created_at
      };

      const metadata = {
        userId: escalator._id,
        userRole: escalator.role,
        userFullName: escalator.full_name,
        timestamp: new Date().toISOString(),
        source: 'incident-service'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_ESCALATED,
        eventData,
        metadata
      );

      console.log(`✅ Incident escalated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting incident escalated event:', error);
      throw error;
    }
  }
}

module.exports = IncidentEvents;
