const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class PPEEvents {
  /**
   * Emit PPE item created event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} creator - Creator information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemCreated(ppeItem, creator) {
    try {
      // Check if event type exists
      if (!eventTypes.PPE_ITEM_CREATED) {
        console.warn('⚠️ PPE_ITEM_CREATED event type not defined, skipping event emission');
        return { success: false, error: 'Event type not defined', eventId: null };
      }

      const eventData = {
        eventType: eventTypes.PPE_ITEM_CREATED,
        data: {
          ppeItemId: ppeItem._id || ppeItem.id,
          item_name: ppeItem.item_name,
          item_code: ppeItem.item_code,
          category_id: ppeItem.category_id,
          brand: ppeItem.brand,
          model: ppeItem.model,
          reorder_level: ppeItem.reorder_level,
          quantity_available: ppeItem.quantity_available,
          quantity_allocated: ppeItem.quantity_allocated,
          manufacturing_date: ppeItem.manufacturing_date,
          expiry_date: ppeItem.expiry_date,
          batch_number: ppeItem.batch_number,
          serial_number: ppeItem.serial_number,
          condition_status: ppeItem.condition_status
        },
        metadata: {
          userId: creator._id || creator.id,
          userRole: creator.role,
          userFullName: creator.full_name,
          timestamp: new Date().toISOString(),
          source: 'ppe-service'
        }
      };

      // Try to send event with timeout, but don't fail if Kafka is unavailable
      try {
        const { topics } = require('../config/kafkaConfig');
        const result = await Promise.race([
          kafkaProducer.sendEvent(topics.PPE_EVENTS || 'ppe-events', eventData, ppeItem._id || ppeItem.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Kafka timeout')), 3000)
          )
        ]);

        console.log(`✅ PPE item created event emitted: ${result.eventId || 'N/A'}`);
        return result;
      } catch (kafkaError) {
        // Log but don't throw - allow request to succeed even if event fails
        console.warn('⚠️ Failed to emit PPE item created event (non-critical):', kafkaError.message);
        return {
          success: false,
          error: kafkaError.message,
          eventId: null
        };
      }
    } catch (error) {
      console.error('❌ Error preparing PPE item created event:', error);
      // Don't throw - allow request to succeed
      return {
        success: false,
        error: error.message,
        eventId: null
      };
    }
  }

  /**
   * Emit PPE item updated event
   * @param {Object} ppeItem - Updated PPE item data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemUpdated(ppeItem, updater, changes) {
    try {
      // Check if event type exists
      if (!eventTypes.PPE_ITEM_UPDATED) {
        console.warn('⚠️ PPE_ITEM_UPDATED event type not defined, skipping event emission');
        return { success: false, error: 'Event type not defined', eventId: null };
      }

      const eventData = {
        eventType: eventTypes.PPE_ITEM_UPDATED,
        data: {
          ppeItemId: ppeItem._id || ppeItem.id,
          item_name: ppeItem.item_name,
          item_code: ppeItem.item_code,
          category_id: ppeItem.category_id,
          brand: ppeItem.brand,
          model: ppeItem.model,
          reorder_level: ppeItem.reorder_level,
          quantity_available: ppeItem.quantity_available,
          quantity_allocated: ppeItem.quantity_allocated,
          manufacturing_date: ppeItem.manufacturing_date,
          expiry_date: ppeItem.expiry_date,
          batch_number: ppeItem.batch_number,
          serial_number: ppeItem.serial_number,
          condition_status: ppeItem.condition_status,
          changes: changes
        },
        metadata: {
          userId: updater._id || updater.id,
          userRole: updater.role,
          userFullName: updater.full_name,
          timestamp: new Date().toISOString(),
          source: 'ppe-service'
        }
      };

      // Try to send event with timeout, but don't fail if Kafka is unavailable
      try {
        const { topics } = require('../config/kafkaConfig');
        const result = await Promise.race([
          kafkaProducer.sendEvent(topics.PPE_EVENTS || 'ppe-events', eventData, ppeItem._id || ppeItem.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Kafka timeout')), 3000)
          )
        ]);

        console.log(`✅ PPE item updated event emitted: ${result.eventId || 'N/A'}`);
        return result;
      } catch (kafkaError) {
        // Log but don't throw - allow request to succeed even if event fails
        console.warn('⚠️ Failed to emit PPE item updated event (non-critical):', kafkaError.message);
        return {
          success: false,
          error: kafkaError.message,
          eventId: null
        };
      }
    } catch (error) {
      console.error('❌ Error preparing PPE item updated event:', error);
      // Don't throw - allow request to succeed
      return {
        success: false,
        error: error.message,
        eventId: null
      };
    }
  }

  /**
   * Emit PPE item assigned event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} assignee - Assignee information
   * @param {Object} assigner - Assigner information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemAssigned(ppeItem, assignee, assigner) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        assignedTo: assignee._id,
        assignedAt: new Date().toISOString(),
        assignmentReason: ppeItem.assignment_reason,
        expectedReturnDate: ppeItem.expected_return_date,
        condition: ppeItem.condition
      };

      const metadata = {
        userId: assigner._id,
        userRole: assigner.role,
        userFullName: assigner.full_name,
        assigneeId: assignee._id,
        assigneeName: assignee.full_name,
        assigneeRole: assignee.role,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_ASSIGNED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item assigned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item assigned event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item returned event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} returner - Returner information
   * @param {Object} receiver - Receiver information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemReturned(ppeItem, returner, receiver) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        returnedBy: returner._id,
        receivedBy: receiver._id,
        returnedAt: new Date().toISOString(),
        returnCondition: ppeItem.return_condition,
        returnReason: ppeItem.return_reason,
        damageReport: ppeItem.damage_report,
        maintenanceRequired: ppeItem.maintenance_required
      };

      const metadata = {
        userId: returner._id,
        userRole: returner.role,
        userFullName: returner.full_name,
        receiverId: receiver._id,
        receiverName: receiver.full_name,
        receiverRole: receiver.role,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_RETURNED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item returned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item returned event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item inspected event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} inspector - Inspector information
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemInspected(ppeItem, inspector, inspection) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        inspectorId: inspector._id,
        inspectedAt: new Date().toISOString(),
        inspectionType: inspection.type,
        inspectionResult: inspection.result,
        inspectionScore: inspection.score,
        defectsFound: inspection.defects_found || [],
        recommendations: inspection.recommendations || [],
        nextInspectionDate: inspection.next_inspection_date,
        maintenanceRequired: inspection.maintenance_required,
        inspectionReport: inspection.report
      };

      const metadata = {
        userId: inspector._id,
        userRole: inspector.role,
        userFullName: inspector.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_INSPECTED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item inspected event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item inspected event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item maintenance scheduled event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} scheduler - Scheduler information
   * @param {Object} maintenance - Maintenance data
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemMaintenanceScheduled(ppeItem, scheduler, maintenance) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        scheduledBy: scheduler._id,
        scheduledAt: new Date().toISOString(),
        maintenanceType: maintenance.type,
        maintenanceDescription: maintenance.description,
        scheduledDate: maintenance.scheduled_date,
        estimatedDuration: maintenance.estimated_duration,
        estimatedCost: maintenance.estimated_cost,
        assignedTechnician: maintenance.assigned_technician,
        priority: maintenance.priority,
        requiredParts: maintenance.required_parts || [],
        safetyRequirements: maintenance.safety_requirements || []
      };

      const metadata = {
        userId: scheduler._id,
        userRole: scheduler.role,
        userFullName: scheduler.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_MAINTENANCE_SCHEDULED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item maintenance scheduled event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item maintenance scheduled event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item maintenance completed event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} technician - Technician information
   * @param {Object} maintenance - Maintenance data
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemMaintenanceCompleted(ppeItem, technician, maintenance) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        technicianId: technician._id,
        completedAt: new Date().toISOString(),
        maintenanceType: maintenance.type,
        maintenanceDescription: maintenance.description,
        actualDuration: maintenance.actual_duration,
        actualCost: maintenance.actual_cost,
        workPerformed: maintenance.work_performed,
        partsReplaced: maintenance.parts_replaced || [],
        qualityCheck: maintenance.quality_check,
        maintenanceReport: maintenance.report,
        nextMaintenanceDate: maintenance.next_maintenance_date
      };

      const metadata = {
        userId: technician._id,
        userRole: technician.role,
        userFullName: technician.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_MAINTENANCE_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item maintenance completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item maintenance completed event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item expired event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} notifier - Notifier information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemExpired(ppeItem, notifier) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        assignedTo: ppeItem.assigned_to,
        expiryDate: ppeItem.expiry_date,
        expiredAt: new Date().toISOString(),
        actionRequired: ppeItem.action_required,
        replacementNeeded: ppeItem.replacement_needed,
        disposalRequired: ppeItem.disposal_required
      };

      const metadata = {
        userId: notifier._id,
        userRole: notifier.role,
        userFullName: notifier.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_EXPIRED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item expired event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item expired event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item damaged event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} reporter - Reporter information
   * @param {Object} damage - Damage data
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemDamaged(ppeItem, reporter, damage) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        assignedTo: ppeItem.assigned_to,
        reportedBy: reporter._id,
        reportedAt: new Date().toISOString(),
        damageType: damage.type,
        damageDescription: damage.description,
        damageSeverity: damage.severity,
        damageLocation: damage.location,
        damageCause: damage.cause,
        repairRequired: damage.repair_required,
        replacementRequired: damage.replacement_required,
        estimatedRepairCost: damage.estimated_repair_cost,
        safetyImpact: damage.safety_impact,
        photos: damage.photos || []
      };

      const metadata = {
        userId: reporter._id,
        userRole: reporter.role,
        userFullName: reporter.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_DAMAGED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item damaged event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item damaged event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item deleted event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} deleter - Deleter information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemDeleted(ppeItem, deleter) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        deletedAt: new Date().toISOString(),
        deletionReason: ppeItem.deletion_reason
      };

      const metadata = {
        userId: deleter._id,
        userRole: deleter.role,
        userFullName: deleter.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE item stock updated event
   * @param {Object} ppeItem - PPE item data
   * @param {Object} updater - Updater information
   * @param {Object} stockChange - Stock change data
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEItemStockUpdated(ppeItem, updater, stockChange) {
    try {
      const eventData = {
        ppeItemId: ppeItem._id,
        name: ppeItem.name,
        type: ppeItem.type,
        category: ppeItem.category,
        description: ppeItem.description,
        manufacturer: ppeItem.manufacturer,
        model: ppeItem.model,
        serialNumber: ppeItem.serial_number,
        status: ppeItem.status,
        location: ppeItem.location,
        siteId: ppeItem.site_id,
        projectId: ppeItem.project_id,
        updatedBy: updater._id,
        updatedAt: new Date().toISOString(),
        stockChangeType: stockChange.type,
        previousStock: stockChange.previous_stock,
        newStock: stockChange.new_stock,
        changeQuantity: stockChange.change_quantity,
        changeReason: stockChange.change_reason,
        supplier: stockChange.supplier,
        purchaseOrder: stockChange.purchase_order,
        cost: stockChange.cost
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_STOCK_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ PPE item stock updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE item stock updated event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE issuance created event
   * @param {Object} issuance - PPE issuance data
   * @param {Object} issuer - Issuer information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEIssuanceCreated(issuance, issuer) {
    try {
      const eventData = {
        issuanceId: issuance._id,
        user_id: issuance.user_id,
        item_id: issuance.item_id,
        quantity: issuance.quantity,
        issued_date: issuance.issued_date,
        expected_return_date: issuance.expected_return_date,
        issued_by: issuance.issued_by,
        status: issuance.status,
        issuance_level: issuance.issuance_level,
        manager_id: issuance.manager_id,
        notes: issuance.notes,
        createdAt: issuance.createdAt
      };

      const metadata = {
        userId: issuer._id,
        userRole: issuer.role,
        userFullName: issuer.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ISSUANCE_CREATED,
        eventData,
        metadata
      );

      console.log(`✅ PPE issuance created event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE issuance created event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE issuance returned event
   * @param {Object} issuance - PPE issuance data
   * @param {Object} returner - Returner information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEIssuanceReturned(issuance, returner) {
    try {
      const eventData = {
        issuanceId: issuance._id,
        user_id: issuance.user_id,
        item_id: issuance.item_id,
        quantity: issuance.quantity,
        actual_return_date: issuance.actual_return_date,
        return_condition: issuance.return_condition,
        return_notes: issuance.return_notes,
        status: issuance.status,
        issuance_level: issuance.issuance_level,
        updatedAt: issuance.updatedAt
      };

      const metadata = {
        userId: returner._id,
        userRole: returner.role,
        userFullName: returner.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ISSUANCE_RETURNED,
        eventData,
        metadata
      );

      console.log(`✅ PPE issuance returned event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE issuance returned event:', error);
      throw error;
    }
  }

  /**
   * Emit PPE issuance reported event
   * @param {Object} issuance - PPE issuance data
   * @param {Object} reporter - Reporter information
   * @returns {Promise<Object>} Event result
   */
  static async emitPPEIssuanceReported(issuance, reporter) {
    try {
      const eventData = {
        issuanceId: issuance._id,
        user_id: issuance.user_id,
        item_id: issuance.item_id,
        quantity: issuance.quantity,
        report_type: issuance.report_type,
        report_description: issuance.report_description,
        report_severity: issuance.report_severity,
        reported_date: issuance.reported_date,
        status: issuance.status,
        issuance_level: issuance.issuance_level,
        updatedAt: issuance.updatedAt
      };

      const metadata = {
        userId: reporter._id,
        userRole: reporter.role,
        userFullName: reporter.full_name,
        timestamp: new Date().toISOString(),
        source: 'ppe-service'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ISSUANCE_REPORTED,
        eventData,
        metadata
      );

      console.log(`✅ PPE issuance reported event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting PPE issuance reported event:', error);
      throw error;
    }
  }
}

module.exports = PPEEvents;
