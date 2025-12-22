const kafkaProducer = require('../services/kafkaProducer');
const WebSocketService = require('../services/websocketService');

/**
 * Training Events Handler
 * Handles all training-related events and notifications
 */
class TrainingEvents {
  /**
   * Emit course set created event
   */
  static async emitCourseSetCreated(courseSet, metadata = {}) {
    try {
      const eventData = {
        eventType: 'COURSE_SET_CREATED',
        courseSet: {
          id: courseSet._id || courseSet.id,
          name: courseSet.name,
          description: courseSet.description,
          category: courseSet.category,
          duration: courseSet.duration,
          is_active: courseSet.is_active,
          created_at: courseSet.created_at,
          updated_at: courseSet.updated_at
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
      await kafkaProducer.sendTrainingEvent('course_set.created', eventData);

      // Send realtime notification (WebSocket + Database)
      const TrainingNotificationService = require('../services/trainingNotificationService');
      const tenantId = courseSet.tenant_id || metadata.tenantId;
      
      if (tenantId) {
        await TrainingNotificationService.notifyCourseSetCreated({
          courseSet,
          creator: {
            _id: metadata.userId,
            full_name: metadata.userFullName
          },
          tenantId
        });
      }
      
      // Also send WebSocket for backward compatibility
      await WebSocketService.emitToAll('course_set_created', {
        message: `New course set "${courseSet.name}" has been created`,
        courseSet: eventData.courseSet,
        createdBy: metadata.userFullName || 'System'
      });

      console.log('✅ Course set created event emitted:', courseSet.name);
    } catch (error) {
      console.error('❌ Error emitting course set created event:', error);
      throw error;
    }
  }

  /**
   * Emit course set updated event
   */
  static async emitCourseSetUpdated(newCourseSet, oldCourseSet, metadata = {}) {
    try {
      // Detect changes
      const changes = {};
      const fieldsToCheck = ['name', 'description', 'category', 'duration', 'is_active'];
      
      fieldsToCheck.forEach(field => {
        if (newCourseSet[field] !== oldCourseSet[field]) {
          changes[field] = {
            old: oldCourseSet[field],
            new: newCourseSet[field]
          };
        }
      });

      const eventData = {
        eventType: 'COURSE_SET_UPDATED',
        courseSet: {
          id: newCourseSet._id || newCourseSet.id,
          name: newCourseSet.name,
          description: newCourseSet.description,
          category: newCourseSet.category,
          duration: newCourseSet.duration,
          is_active: newCourseSet.is_active,
          updated_at: newCourseSet.updated_at
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
      await kafkaProducer.sendTrainingEvent('course_set.updated', eventData);

      // Send realtime notification (WebSocket + Database)
      const TrainingNotificationService = require('../services/trainingNotificationService');
      const tenantId = newCourseSet.tenant_id || metadata.tenantId;
      
      if (tenantId) {
        await TrainingNotificationService.notifyCourseSetUpdated({
          courseSet: newCourseSet,
          updater: {
            _id: metadata.userId,
            full_name: metadata.userFullName
          },
          tenantId
        });
      }
      
      // Also send WebSocket for backward compatibility
      await WebSocketService.emitToAll('course_set_updated', {
        message: `Course set "${newCourseSet.name}" has been updated`,
        courseSet: eventData.courseSet,
        changes: Object.keys(changes),
        updatedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Course set updated event emitted:', newCourseSet.name);
    } catch (error) {
      console.error('❌ Error emitting course set updated event:', error);
      throw error;
    }
  }

  /**
   * Emit course set deleted event
   */
  static async emitCourseSetDeleted(courseSet, metadata = {}) {
    try {
      const eventData = {
        eventType: 'COURSE_SET_DELETED',
        courseSet: {
          id: courseSet._id || courseSet.id,
          name: courseSet.name,
          description: courseSet.description,
          category: courseSet.category,
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
      await kafkaProducer.sendTrainingEvent('course_set.deleted', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('course_set_deleted', {
        message: `Course set "${courseSet.name}" has been deleted`,
        courseSet: eventData.courseSet,
        deletedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Course set deleted event emitted:', courseSet.name);
    } catch (error) {
      console.error('❌ Error emitting course set deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit training session created event
   */
  static async emitTrainingSessionCreated(session, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_SESSION_CREATED',
        session: {
          id: session._id || session.id,
          name: session.name,
          courseSetId: session.courseSetId,
          instructorId: session.instructorId,
          startDate: session.startDate,
          endDate: session.endDate,
          maxParticipants: session.maxParticipants,
          status: session.status,
          created_at: session.created_at
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
      await kafkaProducer.sendTrainingEvent('training_session.created', eventData);

      // Send realtime notification (WebSocket + Database)
      const TrainingNotificationService = require('../services/trainingNotificationService');
      const tenantId = session.tenant_id || metadata.tenantId;
      
      if (tenantId) {
        await TrainingNotificationService.notifyTrainingSessionCreated({
          session,
          creator: {
            _id: metadata.userId,
            full_name: metadata.userFullName
          },
          tenantId
        });
      }
      
      // Also send WebSocket for backward compatibility
      await WebSocketService.emitToAll('training_session_created', {
        message: `New training session "${session.name}" has been created`,
        session: eventData.session,
        createdBy: metadata.userFullName || 'System'
      });

      console.log('✅ Training session created event emitted:', session.name);
    } catch (error) {
      console.error('❌ Error emitting training session created event:', error);
      throw error;
    }
  }

  /**
   * Emit training session updated event
   */
  static async emitTrainingSessionUpdated(newSession, oldSession, metadata = {}) {
    try {
      // Detect changes
      const changes = {};
      const fieldsToCheck = ['name', 'instructorId', 'startDate', 'endDate', 'maxParticipants', 'status'];
      
      fieldsToCheck.forEach(field => {
        if (newSession[field] !== oldSession[field]) {
          changes[field] = {
            old: oldSession[field],
            new: newSession[field]
          };
        }
      });

      const eventData = {
        eventType: 'TRAINING_SESSION_UPDATED',
        session: {
          id: newSession._id || newSession.id,
          name: newSession.name,
          courseSetId: newSession.courseSetId,
          instructorId: newSession.instructorId,
          startDate: newSession.startDate,
          endDate: newSession.endDate,
          maxParticipants: newSession.maxParticipants,
          status: newSession.status,
          updated_at: newSession.updated_at
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
      await kafkaProducer.sendTrainingEvent('training_session.updated', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('training_session_updated', {
        message: `Training session "${newSession.name}" has been updated`,
        session: eventData.session,
        changes: Object.keys(changes),
        updatedBy: metadata.userFullName || 'System'
      });

      // Special notification for status changes
      if (changes.status) {
        const statusMessage = `Training session "${newSession.name}" status changed to ${changes.status.new}`;
        await WebSocketService.emitToAll('training_session_status_changed', {
          message: statusMessage,
          session: eventData.session,
          statusChange: changes.status,
          updatedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Training session updated event emitted:', newSession.name);
    } catch (error) {
      console.error('❌ Error emitting training session updated event:', error);
      throw error;
    }
  }

  /**
   * Emit training session deleted event
   */
  static async emitTrainingSessionDeleted(session, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_SESSION_DELETED',
        session: {
          id: session._id || session.id,
          name: session.name,
          courseSetId: session.courseSetId,
          instructorId: session.instructorId,
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
      await kafkaProducer.sendTrainingEvent('training_session.deleted', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('training_session_deleted', {
        message: `Training session "${session.name}" has been deleted`,
        session: eventData.session,
        deletedBy: metadata.userFullName || 'System'
      });

      console.log('✅ Training session deleted event emitted:', session.name);
    } catch (error) {
      console.error('❌ Error emitting training session deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit training enrollment event
   */
  static async emitTrainingEnrollment(enrollment, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_ENROLLMENT',
        enrollment: {
          id: enrollment._id || enrollment.id,
          sessionId: enrollment.sessionId,
          userId: enrollment.userId,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
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
      await kafkaProducer.sendTrainingEvent('training.enrollment', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('training_enrollment', {
        message: `New training enrollment for session`,
        enrollment: eventData.enrollment,
        enrolledBy: metadata.userFullName || 'System'
      });

      // Notify the enrolled user
      if (enrollment.userId) {
        await WebSocketService.emitToUser(enrollment.userId, 'training_enrolled', {
          message: `You have been enrolled in a training session`,
          enrollment: eventData.enrollment,
          enrolledBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Training enrollment event emitted:', enrollment.userId);
    } catch (error) {
      console.error('❌ Error emitting training enrollment event:', error);
      throw error;
    }
  }

  /**
   * Emit training completion event
   */
  static async emitTrainingCompletion(completion, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_COMPLETION',
        completion: {
          id: completion._id || completion.id,
          sessionId: completion.sessionId,
          userId: completion.userId,
          score: completion.score,
          completionTime: completion.completionTime,
          completedAt: completion.completedAt,
          passed: completion.passed
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
      await kafkaProducer.sendTrainingEvent('training.completion', eventData);

      // Send WebSocket notification
      const resultMessage = completion.passed ? 'passed' : 'failed';
      await WebSocketService.emitToAll('training_completion', {
        message: `Training completed with score ${completion.score}% (${resultMessage})`,
        completion: eventData.completion,
        completedBy: metadata.userFullName || 'System'
      });

      // Notify the user who completed training
      if (completion.userId) {
        await WebSocketService.emitToUser(completion.userId, 'training_completed', {
          message: `You have completed training with score ${completion.score}%`,
          completion: eventData.completion,
          result: resultMessage
        });
      }

      console.log('✅ Training completion event emitted:', completion.userId, completion.score);
    } catch (error) {
      console.error('❌ Error emitting training completion event:', error);
      throw error;
    }
  }

  /**
   * Emit training retake event
   */
  static async emitTrainingRetake(retake, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_RETAKE',
        retake: {
          id: retake._id || retake.id,
          sessionId: retake.sessionId,
          userId: retake.userId,
          retakeCount: retake.retakeCount,
          retakenAt: retake.retakenAt
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
      await kafkaProducer.sendTrainingEvent('training.retake', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('training_retake', {
        message: `Training retake initiated (attempt #${retake.retakeCount})`,
        retake: eventData.retake,
        retakenBy: metadata.userFullName || 'System'
      });

      // Notify the user who retook training
      if (retake.userId) {
        await WebSocketService.emitToUser(retake.userId, 'training_retaken', {
          message: `You have retaken the training (attempt #${retake.retakeCount})`,
          retake: eventData.retake
        });
      }

      console.log('✅ Training retake event emitted:', retake.userId, retake.retakeCount);
    } catch (error) {
      console.error('❌ Error emitting training retake event:', error);
      throw error;
    }
  }

  /**
   * Emit training assignment event
   */
  static async emitTrainingAssignment(assignment, metadata = {}) {
    try {
      const eventData = {
        eventType: 'TRAINING_ASSIGNMENT',
        assignment: {
          id: assignment._id || assignment.id,
          courseId: assignment.course_id,
          departmentId: assignment.department_id,
          assignedBy: assignment.assigned_by,
          assignedAt: assignment.assigned_at,
          status: assignment.status,
          notes: assignment.notes
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
      await kafkaProducer.sendTrainingEvent('training.assignment', eventData);

      // Send WebSocket notification
      await WebSocketService.emitToAll('training_assignment', {
        message: `Course assigned to department`,
        assignment: eventData.assignment,
        assignedBy: metadata.userFullName || 'System'
      });

      // Notify department manager
      if (assignment.department_id) {
        await WebSocketService.emitToDepartment(assignment.department_id, 'course_assigned', {
          message: `New course assigned to your department`,
          assignment: eventData.assignment,
          assignedBy: metadata.userFullName || 'System'
        });
      }

      console.log('✅ Training assignment event emitted:', assignment.course_id, assignment.department_id);
    } catch (error) {
      console.error('❌ Error emitting training assignment event:', error);
      throw error;
    }
  }
}

module.exports = TrainingEvents;
