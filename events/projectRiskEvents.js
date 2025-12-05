const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEventData } = require('./eventSchemas');

class ProjectRiskEvents {
  // ========== PROJECT RISK EVENTS ==========
  
  /**
   * Emit project risk created event
   */
  static async emitProjectRiskCreated(riskData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_created',
        event_id: `risk_created_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          risk_status: riskData.status,
          created_by: riskData.created_by,
          created_at: riskData.created_at
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_created');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_created',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk created event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk created event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk updated event
   */
  static async emitProjectRiskUpdated(riskData, oldRiskData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_updated',
        event_id: `risk_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          old_risk: oldRiskData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          risk_status: riskData.status,
          updated_by: riskData.updated_by,
          updated_at: riskData.updated_at,
          changes: this._getRiskChanges(oldRiskData, riskData)
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_updated');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_updated',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk updated event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk deleted event
   */
  static async emitProjectRiskDeleted(riskData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_deleted',
        event_id: `risk_deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          risk_status: riskData.status,
          deleted_by: metadata.userId,
          deleted_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_deleted');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_deleted',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk deleted event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk status updated event
   */
  static async emitProjectRiskStatusUpdated(riskData, oldStatus, newStatus, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_status_updated',
        event_id: `risk_status_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          old_status: oldStatus,
          new_status: newStatus,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          updated_by: metadata.userId,
          updated_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_status_updated');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_status_updated',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk status updated event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk status updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk mitigation updated event
   */
  static async emitProjectRiskMitigationUpdated(riskData, mitigationData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_mitigation_updated',
        event_id: `risk_mitigation_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          mitigation: mitigationData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          updated_by: metadata.userId,
          updated_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_mitigation_updated');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_mitigation_updated',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk mitigation updated event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk mitigation updated event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk assigned event
   */
  static async emitProjectRiskAssigned(riskData, assigneeData, metadata = {}) {
    try {
      const eventData = {
        event_type: 'project_risk_assigned',
        event_id: `risk_assigned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          risk: riskData,
          assignee: assigneeData,
          project_id: riskData.project_id,
          risk_id: riskData._id || riskData.id,
          risk_title: riskData.title,
          risk_level: riskData.risk_level,
          risk_category: riskData.category,
          assigned_by: metadata.userId,
          assigned_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, 'project_risk_assigned');
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `risk_${riskData._id || riskData.id}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: 'project_risk_assigned',
            projectId: riskData.project_id?.toString(),
            riskId: (riskData._id || riskData.id)?.toString()
          }
        }]
      });

      console.log(`✅ Project risk assigned event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error('❌ Error emitting project risk assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit project risk bulk operations event
   */
  static async emitProjectRiskBulkOperation(operationType, risksData, metadata = {}) {
    try {
      const eventData = {
        event_type: `project_risk_bulk_${operationType}`,
        event_id: `risk_bulk_${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        data: {
          operation_type: operationType,
          risks: risksData,
          risks_count: risksData.length,
          project_ids: [...new Set(risksData.map(risk => risk.project_id))],
          risk_ids: risksData.map(risk => risk._id || risk.id),
          performed_by: metadata.userId,
          performed_at: new Date().toISOString()
        },
        metadata: {
          ...metadata,
          source: 'project_risk_controller',
          version: '1.0.0'
        }
      };

      // Validate event data
      const validation = validateEventData(eventData, `project_risk_bulk_${operationType}`);
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Emit to Kafka
      await kafka.producer.send({
        topic: 'project-risk-events',
        messages: [{
          key: `bulk_${operationType}_${Date.now()}`,
          value: JSON.stringify(eventData),
          headers: {
            eventType: `project_risk_bulk_${operationType}`,
            operationType: operationType,
            risksCount: risksData.length.toString()
          }
        }]
      });

      console.log(`✅ Project risk bulk ${operationType} event emitted: ${eventData.event_id}`);
      return { success: true, event_id: eventData.event_id };
    } catch (error) {
      console.error(`❌ Error emitting project risk bulk ${operationType} event:`, error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Get changes between old and new risk data
   */
  static _getRiskChanges(oldRisk, newRisk) {
    const changes = {};
    
    const fieldsToCompare = [
      'title', 'description', 'risk_level', 'category', 'status', 
      'probability', 'impact', 'mitigation_plan', 'assigned_to'
    ];
    
    fieldsToCompare.forEach(field => {
      if (oldRisk[field] !== newRisk[field]) {
        changes[field] = {
          old_value: oldRisk[field],
          new_value: newRisk[field]
        };
      }
    });
    
    return changes;
  }
}

module.exports = ProjectRiskEvents;
