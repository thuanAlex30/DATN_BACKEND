const kafkaProducer = require('../services/kafkaProducer');
const WebSocketService = require('../services/websocketService');

/**
 * Quality Events Handler
 * Handles all quality checkpoint-related events and notifications
 */
class QualityEvents {
  /**
   * Emit quality checkpoint created event
   */
  static async emitQualityCheckpointCreated(checkpoint, metadata = {}) {
    try {
      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_CREATED',
        checkpoint: {
          id: checkpoint._id || checkpoint.id,
          taskId: checkpoint.taskId,
          name: checkpoint.name,
          description: checkpoint.description,
          type: checkpoint.type,
          priority: checkpoint.priority,
          status: checkpoint.status,
          dueDate: checkpoint.dueDate,
          assignedTo: checkpoint.assignedTo,
          created_at: checkpoint.created_at,
          updated_at: checkpoint.updated_at
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.created', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('quality_checkpoint_created', {
        message: `New quality checkpoint "${checkpoint.name}" has been created`,
        checkpoint: eventData.checkpoint,
        createdBy: metadata.userFullName || 'System'
      });

      // Notify assigned user if exists
      if (checkpoint.assignedTo) {
        await WebSocketService.emitToUser(checkpoint.assignedTo, 'quality_checkpoint_assigned', {
          message: `You have been assigned a new quality checkpoint: "${checkpoint.name}"`,
          checkpoint: eventData.checkpoint,
          assignedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Quality checkpoint created event emitted:', checkpoint.name);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint created event:', error);
      throw error;
    }
  }

  /**
   * Emit quality checkpoint updated event
   */
  static async emitQualityCheckpointUpdated(newCheckpoint, oldCheckpoint, metadata = {}) {
    try {
      // Detect changes
      const changes = {};
      const fieldsToCheck = ['name', 'description', 'type', 'priority', 'status', 'dueDate', 'assignedTo'];
      
      fieldsToCheck.forEach(field => {
        if (newCheckpoint[field] !== oldCheckpoint[field]) {
          changes[field] = {
            old: oldCheckpoint[field],
            new: newCheckpoint[field]
          };
        }
      });

      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_UPDATED',
        checkpoint: {
          id: newCheckpoint._id || newCheckpoint.id,
          taskId: newCheckpoint.taskId,
          name: newCheckpoint.name,
          description: newCheckpoint.description,
          type: newCheckpoint.type,
          priority: newCheckpoint.priority,
          status: newCheckpoint.status,
          dueDate: newCheckpoint.dueDate,
          assignedTo: newCheckpoint.assignedTo,
          updated_at: newCheckpoint.updated_at
        },
        changes,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.updated', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('quality_checkpoint_updated', {
        message: `Quality checkpoint "${newCheckpoint.name}" has been updated`,
        checkpoint: eventData.checkpoint,
        changes: Object.keys(changes),
        updatedBy: metadata.userFullName || 'System'
      });

      // Special notification for status changes
      if (changes.status) {
        const statusMessage = `Quality checkpoint "${newCheckpoint.name}" status changed to ${changes.status.new}`;
        await WebSocketService.broadcastToAll('quality_checkpoint_status_changed', {
          message: statusMessage,
          checkpoint: eventData.checkpoint,
          statusChange: changes.status,
          updatedBy: metadata.userFullName || 'System'
        });
      }

      // Special notification for assignment changes
      if (changes.assignedTo) {
        const assignmentMessage = `Quality checkpoint "${newCheckpoint.name}" has been reassigned`;
        await WebSocketService.broadcastToAll('quality_checkpoint_reassigned', {
          message: assignmentMessage,
          checkpoint: eventData.checkpoint,
          assignmentChange: changes.assignedTo,
          updatedBy: metadata.userFullName || 'System'
        });

        // Notify new assignee
        if (changes.assignedTo.new) {
          await WebSocketService.emitToUser(changes.assignedTo.new, 'quality_checkpoint_assigned', {
            message: `You have been assigned a quality checkpoint: "${newCheckpoint.name}"`,
            checkpoint: eventData.checkpoint,
            assignedBy: metadata.userFullName || 'System'
          });
        }

        // Notify old assignee if exists
        if (changes.assignedTo.old) {
          await WebSocketService.emitToUser(changes.assignedTo.old, 'quality_checkpoint_unassigned', {
            message: `Quality checkpoint "${newCheckpoint.name}" has been reassigned`,
            checkpoint: eventData.checkpoint,
            unassignedBy: metadata.userFullName || 'System'
          });
        }
      }

      console.log('✅ Quality checkpoint updated event emitted:', newCheckpoint.name);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint updated event:', error);
      throw error;
    }
  }

  /**
   * Emit quality checkpoint deleted event
   */
  static async emitQualityCheckpointDeleted(checkpoint, metadata = {}) {
    try {
      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_DELETED',
        checkpoint: {
          id: checkpoint._id || checkpoint.id,
          taskId: checkpoint.taskId,
          name: checkpoint.name,
          description: checkpoint.description,
          type: checkpoint.type,
          priority: checkpoint.priority,
          status: checkpoint.status,
          assignedTo: checkpoint.assignedTo,
          deleted_at: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.deleted', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('quality_checkpoint_deleted', {
        message: `Quality checkpoint "${checkpoint.name}" has been deleted`,
        checkpoint: eventData.checkpoint,
        deletedBy: metadata.userFullName || 'System'
      });

      // Notify assigned user if exists
      if (checkpoint.assignedTo) {
        await WebSocketService.emitToUser(checkpoint.assignedTo, 'quality_checkpoint_deleted_assigned', {
          message: `Your assigned quality checkpoint "${checkpoint.name}" has been deleted`,
          checkpoint: eventData.checkpoint,
          deletedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Quality checkpoint deleted event emitted:', checkpoint.name);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit quality checkpoint completed event
   */
  static async emitQualityCheckpointCompleted(checkpoint, completionData, metadata = {}) {
    try {
      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_COMPLETED',
        checkpoint: {
          id: checkpoint._id || checkpoint.id,
          taskId: checkpoint.taskId,
          name: checkpoint.name,
          type: checkpoint.type,
          priority: checkpoint.priority,
          status: 'completed',
          completedAt: new Date().toISOString(),
          completionNotes: completionData.completion_notes
        },
        completionData,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.completed', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('quality_checkpoint_completed', {
        message: `Quality checkpoint "${checkpoint.name}" has been completed`,
        checkpoint: eventData.checkpoint,
        completedBy: metadata.userFullName || 'System'
      });

      // Notify task manager/assigner if different from completer
      if (checkpoint.assignedTo && checkpoint.assignedTo !== metadata.userId) {
        await WebSocketService.emitToUser(checkpoint.assignedTo, 'quality_checkpoint_completed_assigned', {
          message: `Quality checkpoint "${checkpoint.name}" has been completed`,
          checkpoint: eventData.checkpoint,
          completedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Quality checkpoint completed event emitted:', checkpoint.name);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint completed event:', error);
      throw error;
    }
  }

  /**
   * Emit quality checkpoint status changed event
   */
  static async emitQualityCheckpointStatusChanged(checkpoint, oldStatus, newStatus, metadata = {}) {
    try {
      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_STATUS_CHANGED',
        checkpoint: {
          id: checkpoint._id || checkpoint.id,
          taskId: checkpoint.taskId,
          name: checkpoint.name,
          status: newStatus
        },
        statusChange: {
          old: oldStatus,
          new: newStatus,
          action: this.getStatusAction(newStatus)
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.status_changed', eventData);

      // Send WebSocket notification
      const action = this.getStatusAction(newStatus);
      await WebSocketService.broadcastToAll('quality_checkpoint_status_changed', {
        message: `Quality checkpoint "${checkpoint.name}" has been ${action}`,
        checkpoint: eventData.checkpoint,
        statusChange: eventData.statusChange,
        updatedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Quality checkpoint status changed event emitted:', checkpoint.name, `${oldStatus} → ${newStatus}`);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit quality checkpoint assigned event
   */
  static async emitQualityCheckpointAssigned(checkpoint, assigneeId, metadata = {}) {
    try {
      const eventData = {
        eventType: 'QUALITY_CHECKPOINT_ASSIGNED',
        checkpoint: {
          id: checkpoint._id || checkpoint.id,
          taskId: checkpoint.taskId,
          name: checkpoint.name,
          type: checkpoint.type,
          priority: checkpoint.priority,
          assignedTo: assigneeId
        },
        assigneeId,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: metadata.userId,
          userRole: metadata.userRole,
          userFullName: metadata.userFullName,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      // Send to Kafka
      await kafkaProducer.sendQualityEvent('quality_checkpoint.assigned', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('quality_checkpoint_assigned', {
        message: `Quality checkpoint "${checkpoint.name}" has been assigned`,
        checkpoint: eventData.checkpoint,
        assignedBy: metadata.userFullName || 'System'
      });

      // Notify the assigned user
      if (assigneeId) {
        await WebSocketService.emitToUser(assigneeId, 'quality_checkpoint_assigned_to_you', {
          message: `You have been assigned a quality checkpoint: "${checkpoint.name}"`,
          checkpoint: eventData.checkpoint,
          assignedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Quality checkpoint assigned event emitted:', checkpoint.name, 'to', assigneeId);
    } catch (error) {
      console.error('❌ Error emitting quality checkpoint assigned event:', error);
      throw error;
    }
  }

  /**
   * Helper method to get status action description
   */
  static getStatusAction(status) {
    const statusActions = {
      'pending': 'set to pending',
      'in_progress': 'started',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'on_hold': 'put on hold'
    };
    return statusActions[status] || 'status changed';
  }
}

module.exports = QualityEvents;
