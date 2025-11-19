const kafkaProducer = require('../services/kafkaProducer');
const WebSocketService = require('../services/websocketService');

/**
 * Position Events Handler
 * Handles all position-related events and notifications
 */
class PositionEvents {
  /**
   * Emit position created event
   */
  static async emitPositionCreated(position, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_CREATED',
        position: {
          id: position._id || position.id,
          position_name: position.position_name,
          description: position.description,
          level: position.level,
          is_active: position.is_active,
          created_at: position.created_at,
          updated_at: position.updated_at
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
      await kafkaProducer.sendPositionEvent('position.created', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('position_created', {
        message: `New position "${position.position_name}" has been created`,
        position: eventData.position,
        createdBy: metadata.userFullName || 'System'
      });

      console.log('✅ Position created event emitted:', position.position_name);
    } catch (error) {
      console.error('❌ Error emitting position created event:', error);
      throw error;
    }
  }

  /**
   * Emit position updated event
   */
  static async emitPositionUpdated(newPosition, oldPosition, metadata = {}) {
    try {
      // Detect changes
      const changes = {};
      const fieldsToCheck = ['position_name', 'description', 'level', 'is_active'];
      
      fieldsToCheck.forEach(field => {
        if (newPosition[field] !== oldPosition[field]) {
          changes[field] = {
            old: oldPosition[field],
            new: newPosition[field]
          };
        }
      });

      const eventData = {
        eventType: 'POSITION_UPDATED',
        position: {
          id: newPosition._id || newPosition.id,
          position_name: newPosition.position_name,
          description: newPosition.description,
          level: newPosition.level,
          is_active: newPosition.is_active,
          updated_at: newPosition.updated_at
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
      await kafkaProducer.sendPositionEvent('position.updated', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('position_updated', {
        message: `Position "${newPosition.position_name}" has been updated`,
        position: eventData.position,
        changes: Object.keys(changes),
        updatedBy: metadata.userFullName || 'System'
      });

      // Special notification for level changes
      if (changes.level) {
        await WebSocketService.broadcastToAll('position_level_changed', {
          message: `Position "${newPosition.position_name}" level changed from ${changes.level.old} to ${changes.level.new}`,
          position: eventData.position,
          levelChange: changes.level,
          updatedBy: metadata.userFullName || 'System'
        });
      }

      // Special notification for status changes
      if (changes.is_active !== undefined) {
        const statusMessage = changes.is_active.new ? 'activated' : 'deactivated';
        await WebSocketService.broadcastToAll('position_status_changed', {
          message: `Position "${newPosition.position_name}" has been ${statusMessage}`,
          position: eventData.position,
          statusChange: changes.is_active,
          updatedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Position updated event emitted:', newPosition.position_name);
    } catch (error) {
      console.error('❌ Error emitting position updated event:', error);
      throw error;
    }
  }

  /**
   * Emit position deleted event
   */
  static async emitPositionDeleted(position, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_DELETED',
        position: {
          id: position._id || position.id,
          position_name: position.position_name,
          description: position.description,
          level: position.level,
          is_active: position.is_active,
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
      await kafkaProducer.sendPositionEvent('position.deleted', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('position_deleted', {
        message: `Position "${position.position_name}" has been deleted`,
        position: eventData.position,
        deletedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Position deleted event emitted:', position.position_name);
    } catch (error) {
      console.error('❌ Error emitting position deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit position cloned event
   */
  static async emitPositionCloned(newPosition, originalPosition, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_CLONED',
        newPosition: {
          id: newPosition._id || newPosition.id,
          position_name: newPosition.position_name,
          description: newPosition.description,
          level: newPosition.level,
          is_active: newPosition.is_active,
          created_at: newPosition.created_at
        },
        originalPosition: {
          id: originalPosition._id || originalPosition.id,
          position_name: originalPosition.position_name,
          level: originalPosition.level
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
      await kafkaProducer.sendPositionEvent('position.cloned', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('position_cloned', {
        message: `Position "${newPosition.position_name}" has been cloned from "${originalPosition.position_name}"`,
        newPosition: eventData.newPosition,
        originalPosition: eventData.originalPosition,
        clonedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Position cloned event emitted:', newPosition.position_name);
    } catch (error) {
      console.error('❌ Error emitting position cloned event:', error);
      throw error;
    }
  }

  /**
   * Emit bulk position deleted event
   */
  static async emitBulkPositionDeleted(deletedPositions, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_BULK_DELETED',
        deletedPositions: deletedPositions.map(pos => ({
          id: pos._id || pos.id,
          position_name: pos.position_name,
          level: pos.level
        })),
        count: deletedPositions.length,
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
      await kafkaProducer.sendPositionEvent('position.bulk_deleted', eventData);

      // Send WebSocket notification
      await WebSocketService.broadcastToAll('positions_bulk_deleted', {
        message: `${deletedPositions.length} positions have been deleted`,
        deletedPositions: eventData.deletedPositions,
        deletedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Bulk position deleted event emitted:', deletedPositions.length, 'positions');
    } catch (error) {
      console.error('❌ Error emitting bulk position deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit position level changed event
   */
  static async emitPositionLevelChanged(position, oldLevel, newLevel, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_LEVEL_CHANGED',
        position: {
          id: position._id || position.id,
          position_name: position.position_name,
          level: newLevel
        },
        levelChange: {
          old: oldLevel,
          new: newLevel,
          direction: newLevel > oldLevel ? 'promotion' : 'demotion'
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
      await kafkaProducer.sendPositionEvent('position.level_changed', eventData);

      // Send WebSocket notification
      const direction = newLevel > oldLevel ? 'promoted' : 'demoted';
      await WebSocketService.broadcastToAll('position_level_changed', {
        message: `Position "${position.position_name}" has been ${direction} from level ${oldLevel} to ${newLevel}`,
        position: eventData.position,
        levelChange: eventData.levelChange,
        updatedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Position level changed event emitted:', position.position_name, `${oldLevel} → ${newLevel}`);
    } catch (error) {
      console.error('❌ Error emitting position level changed event:', error);
      throw error;
    }
  }

  /**
   * Emit position status toggled event
   */
  static async emitPositionStatusToggled(position, oldStatus, newStatus, metadata = {}) {
    try {
      const eventData = {
        eventType: 'POSITION_STATUS_TOGGLED',
        position: {
          id: position._id || position.id,
          position_name: position.position_name,
          is_active: newStatus
        },
        statusChange: {
          old: oldStatus,
          new: newStatus,
          action: newStatus ? 'activated' : 'deactivated'
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
      await kafkaProducer.sendPositionEvent('position.status_toggled', eventData);

      // Send WebSocket notification
      const action = newStatus ? 'activated' : 'deactivated';
      await WebSocketService.broadcastToAll('position_status_toggled', {
        message: `Position "${position.position_name}" has been ${action}`,
        position: eventData.position,
        statusChange: eventData.statusChange,
        updatedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Position status toggled event emitted:', position.position_name, `${oldStatus} → ${newStatus}`);
    } catch (error) {
      console.error('❌ Error emitting position status toggled event:', error);
      throw error;
    }
  }
}

module.exports = PositionEvents;
