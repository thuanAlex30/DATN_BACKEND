const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEventData } = require('./eventSchemas');

class ProjectStatusReportEvents {
  // ========== PROJECT STATUS REPORT EVENTS ==========
  
  /**
   * Emit project status report created event
   */
  static async emitProjectStatusReportCreated(reportData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_created',
        event_id: `status_report_created_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_status: reportData.status,
          report_period: reportData.report_period,
          created_by: reportData.created_by,
          created_at: reportData.created_at
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_created');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_created',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report created event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report created event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report updated event
   */
  static async emitProjectStatusReportUpdated(reportData, oldReportData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_updated',
        event_id: `status_report_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          old_report: oldReportData,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_status: reportData.status,
          report_period: reportData.report_period,
          updated_by: reportData.updated_by,
          updated_at: reportData.updated_at,
          changes: this._getReportChanges(oldReportData, reportData)
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_updated');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_updated',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report updated event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report deleted event
   */
  static async emitProjectStatusReportDeleted(reportData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_deleted',
        event_id: `status_report_deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_status: reportData.status,
          report_period: reportData.report_period,
          deleted_by: metadata.userId,
          deleted_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_deleted');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_deleted',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report deleted event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report status updated event
   */
  static async emitProjectStatusReportStatusUpdated(reportData, oldStatus, newStatus, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_status_updated',
        event_id: `status_report_status_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          old_status: oldStatus,
          new_status: newStatus,
          report_period: reportData.report_period,
          updated_by: metadata.userId,
          updated_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_status_updated');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_status_updated',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report status updated event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report status updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report approved event
   */
  static async emitProjectStatusReportApproved(reportData, approverData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_approved',
        event_id: `status_report_approved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          approver: approverData,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_status: reportData.status,
          report_period: reportData.report_period,
          approved_by: metadata.userId,
          approved_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_approved');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_approved',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report approved event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report approved event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report rejected event
   */
  static async emitProjectStatusReportRejected(reportData, rejectorData, rejectionReason, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_rejected',
        event_id: `status_report_rejected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          rejector: rejectorData,
          rejection_reason: rejectionReason,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_status: reportData.status,
          report_period: reportData.report_period,
          rejected_by: metadata.userId,
          rejected_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_rejected');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_rejected',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report rejected event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report rejected event:', error);
      throw error;
    }
  }

  /**
   * Emit project status report bulk operations event
   */
  static async emitProjectStatusReportBulkOperation(operationType, reportsData, metadata = {}) {
    try {
      const eventData = {
        event_type: `project_status_report_bulk_${operationType}`,
        event_id: `status_report_bulk_${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          operation_type: operationType,
          reports: reportsData,
          reports_count: reportsData.length,
          project_ids: [...new Set(reportsData.map(report => report.project_id))],
          report_ids: reportsData.map(report => report._id || report.id),
          performed_by: metadata.userId,
          performed_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, `project_status_report_bulk_${operationType}`);
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `bulk_${operationType}_${Date.now()}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: `project_status_report_bulk_${operationType}`,
            operationType: operationType,
            reportsCount: reportsData.length.toString()
          }
        }]
      });

      console.log(`✅ Project status report bulk ${operationType} event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error(`❌ Error emitting project status report bulk ${operationType} event:`, error);
      throw error;
    }
  }

  /**
   * Emit project status report exported event
   */
  static async emitProjectStatusReportExported(reportData, exportFormat, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_status_report_exported',
        event_id: `status_report_exported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          report: reportData,
          export_format: exportFormat,
          project_id: reportData.project_id,
          report_id: reportData._id || reportData.id,
          report_title: reportData.title,
          report_type: reportData.report_type,
          report_period: reportData.report_period,
          exported_by: metadata.userId,
          exported_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_status_report_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_status_report_exported');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-status-report-events',
        messages: [{
          key: `report_${reportData._id || reportData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_status_report_exported',
            projectId: reportData.project_id?.toString(),
            reportId: (reportData._id || reportData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project status report exported event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project status report exported event:', error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Get changes between old and new report data
   */
  static _getReportChanges(oldReport, newReport) {
    const changes = {};
    
    const fieldsToCompare = [
      'title', 'description', 'report_type', 'status', 'report_period',
      'progress_summary', 'achievements', 'challenges', 'next_steps'
    ];
    
    fieldsToCompare.forEach(field => {
      if (oldReport[field] !== newReport[field]) {
        changes[field] = {
          old_value: oldReport[field],
          new_value: newReport[field]
        };
      }
    });
    
    return changes;
  }
}

module.exports = ProjectStatusReportEvents;
