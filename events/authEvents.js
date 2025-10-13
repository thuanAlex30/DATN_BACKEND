const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class AuthEvents {
  /**
   * Emit user registered event
   * @param {Object} user - User data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitUserRegistered(user, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        isActive: user.is_active,
        registeredAt: new Date().toISOString(),
        registrationMethod: 'web',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
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
   * Emit user login event
   * @param {Object} user - User data
   * @param {Object} loginData - Login data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitUserLogin(user, loginData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        loginAt: new Date().toISOString(),
        loginMethod: loginData.method || 'web',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: loginData.sessionId,
        deviceInfo: loginData.deviceInfo,
        location: loginData.location
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
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitUserLogout(user, logoutData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        logoutAt: new Date().toISOString(),
        sessionDuration: logoutData.sessionDuration,
        logoutMethod: logoutData.method || 'web',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: logoutData.sessionId
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
   * Emit password changed event
   * @param {Object} user - User data
   * @param {Object} changeData - Password change data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitPasswordChanged(user, changeData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        changedAt: new Date().toISOString(),
        changeMethod: changeData.method || 'web',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: changeData.sessionId,
        passwordStrength: changeData.passwordStrength,
        isForcedChange: changeData.isForcedChange || false
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_PASSWORD_CHANGED,
        eventData,
        metadata
      );

      console.log(`✅ Password changed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting password changed event:', error);
      throw error;
    }
  }

  /**
   * Emit profile updated event
   * @param {Object} user - User data
   * @param {Object} oldData - Old user data
   * @param {Object} changes - Changes made
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitProfileUpdated(user, oldData, changes, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        updatedAt: new Date().toISOString(),
        changes: changes,
        oldData: oldData,
        updateMethod: 'web',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: metadata.sessionId
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_PROFILE_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ Profile updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting profile updated event:', error);
      throw error;
    }
  }

  /**
   * Emit token refreshed event
   * @param {Object} user - User data
   * @param {Object} tokenData - Token data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitTokenRefreshed(user, tokenData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        refreshedAt: new Date().toISOString(),
        tokenType: tokenData.tokenType,
        expiresAt: tokenData.expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: tokenData.sessionId
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_TOKEN_REFRESHED,
        eventData,
        metadata
      );

      console.log(`✅ Token refreshed event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting token refreshed event:', error);
      throw error;
    }
  }

  /**
   * Emit failed login attempt event
   * @param {Object} attemptData - Login attempt data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitFailedLoginAttempt(attemptData, metadata) {
    try {
      const eventData = {
        username: attemptData.username,
        email: attemptData.email,
        attemptedAt: new Date().toISOString(),
        failureReason: attemptData.reason,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        attemptCount: attemptData.attemptCount,
        isBlocked: attemptData.isBlocked,
        blockDuration: attemptData.blockDuration
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_LOGIN_FAILED,
        eventData,
        metadata
      );

      console.log(`✅ Failed login attempt event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting failed login attempt event:', error);
      throw error;
    }
  }

  /**
   * Emit account locked event
   * @param {Object} user - User data
   * @param {Object} lockData - Lock data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitAccountLocked(user, lockData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        lockedAt: new Date().toISOString(),
        lockReason: lockData.reason,
        lockDuration: lockData.duration,
        unlockAt: lockData.unlockAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        isPermanent: lockData.isPermanent || false
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_ACCOUNT_LOCKED,
        eventData,
        metadata
      );

      console.log(`✅ Account locked event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting account locked event:', error);
      throw error;
    }
  }

  /**
   * Emit account unlocked event
   * @param {Object} user - User data
   * @param {Object} unlockData - Unlock data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} Event result
   */
  static async emitAccountUnlocked(user, unlockData, metadata) {
    try {
      const eventData = {
        userId: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        unlockedAt: new Date().toISOString(),
        unlockReason: unlockData.reason,
        unlockMethod: unlockData.method,
        lockedDuration: unlockData.lockedDuration,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        unlockedBy: unlockData.unlockedBy
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_ACCOUNT_UNLOCKED,
        eventData,
        metadata
      );

      console.log(`✅ Account unlocked event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting account unlocked event:', error);
      throw error;
    }
  }
}

module.exports = AuthEvents;
