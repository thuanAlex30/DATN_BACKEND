const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class UserEvents {
  /**
   * Emit user registered event
   * @param {Object} user - User data
   * @param {Object} registrar - Registrar information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserRegistered(user, registrar) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        hireDate: user.hire_date,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        managerId: user.manager_id,
        emergencyContact: user.emergency_contact || {},
        skills: user.skills || [],
        certifications: user.certifications || [],
        trainingRecords: user.training_records || [],
        performanceRating: user.performance_rating,
        lastLoginDate: user.last_login_date,
        registeredAt: user.created_at
      };

      const metadata = {
        userId: registrar._id,
        userRole: registrar.role,
        userFullName: registrar.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_REGISTERED,
        eventData,
        metadata
      );

      console.log(`✅ User registered event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user registered event:', error);
      throw error;
    }
  }

  /**
   * Emit user profile updated event
   * @param {Object} user - Updated user data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitUserProfileUpdated(user, updater, changes) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        hireDate: user.hire_date,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        managerId: user.manager_id,
        emergencyContact: user.emergency_contact || {},
        skills: user.skills || [],
        certifications: user.certifications || [],
        trainingRecords: user.training_records || [],
        performanceRating: user.performance_rating,
        lastLoginDate: user.last_login_date,
        updatedAt: user.updated_at,
        changes: changes
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_PROFILE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ User profile updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user profile updated event:', error);
      throw error;
    }
  }

  /**
   * Emit user role changed event
   * @param {Object} user - User data
   * @param {Object} changer - Changer information
   * @param {string} previousRole - Previous role
   * @param {string} newRole - New role
   * @returns {Promise<Object>} Event result
   */
  static async emitUserRoleChanged(user, changer, previousRole, newRole) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: newRole,
        previousRole: previousRole,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        hireDate: user.hire_date,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        managerId: user.manager_id,
        roleChangedAt: new Date().toISOString(),
        roleChangeReason: user.role_change_reason,
        permissions: user.permissions || [],
        accessLevel: user.access_level
      };

      const metadata = {
        userId: changer._id,
        userRole: changer.role,
        userFullName: changer.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_ROLE_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ User role changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user role changed event:', error);
      throw error;
    }
  }

  /**
   * Emit user status updated event
   * @param {Object} user - User data
   * @param {Object} updater - Updater information
   * @param {string} previousStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Event result
   */
  static async emitUserStatusUpdated(user, updater, previousStatus, newStatus) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        hireDate: user.hire_date,
        status: newStatus,
        previousStatus: previousStatus,
        siteId: user.site_id,
        projectId: user.project_id,
        managerId: user.manager_id,
        statusChangedAt: new Date().toISOString(),
        statusChangeReason: user.status_change_reason,
        effectiveDate: user.effective_date,
        endDate: user.end_date
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_STATUS_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ User status updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user status updated event:', error);
      throw error;
    }
  }

  /**
   * Emit user assigned to project event
   * @param {Object} user - User data
   * @param {Object} project - Project data
   * @param {Object} assigner - Assigner information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserAssignedToProject(user, project, assigner) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: project._id,
        projectName: project.name,
        projectDescription: project.description,
        projectStatus: project.status,
        assignedAt: new Date().toISOString(),
        assignmentRole: user.assignment_role,
        responsibilities: user.responsibilities || [],
        startDate: user.start_date,
        endDate: user.end_date,
        workload: user.workload
      };

      const metadata = {
        userId: assigner._id,
        userRole: assigner.role,
        userFullName: assigner.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_ASSIGNED_TO_PROJECT,
        eventData,
        metadata
      );

      console.log(`✅ User assigned to project event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user assigned to project event:', error);
      throw error;
    }
  }

  /**
   * Emit user removed from project event
   * @param {Object} user - User data
   * @param {Object} project - Project data
   * @param {Object} remover - Remover information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserRemovedFromProject(user, project, remover) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: project._id,
        projectName: project.name,
        projectDescription: project.description,
        projectStatus: project.status,
        removedAt: new Date().toISOString(),
        removalReason: user.removal_reason,
        previousRole: user.previous_role,
        previousResponsibilities: user.previous_responsibilities || [],
        startDate: user.start_date,
        endDate: user.end_date
      };

      const metadata = {
        userId: remover._id,
        userRole: remover.role,
        userFullName: remover.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_REMOVED_FROM_PROJECT,
        eventData,
        metadata
      );

      console.log(`✅ User removed from project event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user removed from project event:', error);
      throw error;
    }
  }

  /**
   * Emit user training completed event
   * @param {Object} user - User data
   * @param {Object} training - Training data
   * @param {Object} trainer - Trainer information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserTrainingCompleted(user, training, trainer) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        trainingId: training._id,
        trainingName: training.name,
        trainingType: training.type,
        trainingDescription: training.description,
        trainingDuration: training.duration,
        trainingScore: training.score,
        trainingResult: training.result,
        completedAt: new Date().toISOString(),
        trainerId: trainer._id,
        trainerName: trainer.full_name,
        certification: training.certification,
        validityPeriod: training.validity_period,
        nextTrainingDate: training.next_training_date
      };

      const metadata = {
        userId: trainer._id,
        userRole: trainer.role,
        userFullName: trainer.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_TRAINING_COMPLETED,
        eventData,
        metadata
      );

      console.log(`✅ User training completed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user training completed event:', error);
      throw error;
    }
  }

  /**
   * Emit user certification updated event
   * @param {Object} user - User data
   * @param {Object} certification - Certification data
   * @param {Object} updater - Updater information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserCertificationUpdated(user, certification, updater) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        certificationId: certification._id,
        certificationName: certification.name,
        certificationType: certification.type,
        certificationNumber: certification.number,
        issuingAuthority: certification.issuing_authority,
        issueDate: certification.issue_date,
        expiryDate: certification.expiry_date,
        status: certification.status,
        updatedAt: new Date().toISOString(),
        renewalRequired: certification.renewal_required,
        nextRenewalDate: certification.next_renewal_date
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_CERTIFICATION_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ User certification updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user certification updated event:', error);
      throw error;
    }
  }

  /**
   * Emit user performance updated event
   * @param {Object} user - User data
   * @param {Object} evaluator - Evaluator information
   * @param {Object} performance - Performance data
   * @returns {Promise<Object>} Event result
   */
  static async emitUserPerformanceUpdated(user, evaluator, performance) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        performanceId: performance._id,
        performancePeriod: performance.period,
        performanceScore: performance.score,
        performanceRating: performance.rating,
        performanceGoals: performance.goals || [],
        performanceAchievements: performance.achievements || [],
        performanceAreas: performance.areas || [],
        performanceFeedback: performance.feedback,
        evaluatedAt: new Date().toISOString(),
        evaluatorId: evaluator._id,
        evaluatorName: evaluator.full_name,
        nextReviewDate: performance.next_review_date,
        improvementPlan: performance.improvement_plan || []
      };

      const metadata = {
        userId: evaluator._id,
        userRole: evaluator.role,
        userFullName: evaluator.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_PERFORMANCE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ User performance updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user performance updated event:', error);
      throw error;
    }
  }

  /**
   * Emit user login event
   * @param {Object} user - User data
   * @param {Object} loginData - Login data
   * @returns {Promise<Object>} Event result
   */
  static async emitUserLogin(user, loginData) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        loginAt: new Date().toISOString(),
        loginIP: loginData.ip,
        loginUserAgent: loginData.userAgent,
        loginLocation: loginData.location,
        loginDevice: loginData.device,
        loginMethod: loginData.method,
        sessionId: loginData.sessionId,
        previousLoginDate: user.last_login_date
      };

      const metadata = {
        userId: user._id,
        userRole: user.role,
        userFullName: user.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_LOGIN,
        eventData,
        metadata
      );

      console.log(`✅ User login event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user login event:', error);
      throw error;
    }
  }

  /**
   * Emit user logout event
   * @param {Object} user - User data
   * @param {Object} logoutData - Logout data
   * @returns {Promise<Object>} Event result
   */
  static async emitUserLogout(user, logoutData) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        logoutAt: new Date().toISOString(),
        logoutIP: logoutData.ip,
        logoutUserAgent: logoutData.userAgent,
        logoutLocation: logoutData.location,
        logoutDevice: logoutData.device,
        sessionId: logoutData.sessionId,
        sessionDuration: logoutData.sessionDuration,
        logoutReason: logoutData.reason
      };

      const metadata = {
        userId: user._id,
        userRole: user.role,
        userFullName: user.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_LOGOUT,
        eventData,
        metadata
      );

      console.log(`✅ User logout event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user logout event:', error);
      throw error;
    }
  }

  /**
   * Emit user deleted event
   * @param {Object} user - User data
   * @param {Object} deleter - Deleter information
   * @returns {Promise<Object>} Event result
   */
  static async emitUserDeleted(user, deleter) {
    try {
      const eventData = {
        userId: user._id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        phoneNumber: user.phone_number,
        status: user.status,
        siteId: user.site_id,
        projectId: user.project_id,
        managerId: user.manager_id,
        deletedAt: new Date().toISOString(),
        deletionReason: user.deletion_reason,
        dataRetentionPeriod: user.data_retention_period,
        lastLoginDate: user.last_login_date
      };

      const metadata = {
        userId: deleter._id,
        userRole: deleter.role,
        userFullName: deleter.full_name,
        timestamp: new Date().toISOString(),
        source: 'user-service'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_DELETED,
        eventData,
        metadata
      );

      console.log(`✅ User deleted event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting user deleted event:', error);
      throw error;
    }
  }
}

module.exports = UserEvents;
