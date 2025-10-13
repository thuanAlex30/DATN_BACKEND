const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class SystemEvents {
  /**
   * Emit system startup event
   * @param {Object} systemInfo - System information
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemStartup(systemInfo) {
    try {
      const eventData = {
        systemId: systemInfo.id,
        systemName: systemInfo.name,
        systemVersion: systemInfo.version,
        systemEnvironment: systemInfo.environment,
        systemHost: systemInfo.host,
        systemPort: systemInfo.port,
        systemPid: systemInfo.pid,
        systemUptime: systemInfo.uptime,
        systemMemory: systemInfo.memory,
        systemCpu: systemInfo.cpu,
        systemDisk: systemInfo.disk,
        systemNetwork: systemInfo.network,
        systemServices: systemInfo.services || [],
        systemDependencies: systemInfo.dependencies || [],
        systemConfiguration: systemInfo.configuration || {},
        startedAt: new Date().toISOString(),
        startupDuration: systemInfo.startupDuration,
        startupErrors: systemInfo.startupErrors || [],
        startupWarnings: systemInfo.startupWarnings || []
      };

      const metadata = {
        userId: 'system',
        userRole: 'system',
        userFullName: 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_STARTUP,
        eventData,
        metadata
      );

      console.log(`✅ System startup event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system startup event:', error);
      throw error;
    }
  }

  /**
   * Emit system shutdown event
   * @param {Object} systemInfo - System information
   * @param {string} reason - Shutdown reason
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemShutdown(systemInfo, reason) {
    try {
      const eventData = {
        systemId: systemInfo.id,
        systemName: systemInfo.name,
        systemVersion: systemInfo.version,
        systemEnvironment: systemInfo.environment,
        systemHost: systemInfo.host,
        systemPort: systemInfo.port,
        systemPid: systemInfo.pid,
        systemUptime: systemInfo.uptime,
        systemMemory: systemInfo.memory,
        systemCpu: systemInfo.cpu,
        systemDisk: systemInfo.disk,
        systemNetwork: systemInfo.network,
        systemServices: systemInfo.services || [],
        systemDependencies: systemInfo.dependencies || [],
        systemConfiguration: systemInfo.configuration || {},
        shutdownAt: new Date().toISOString(),
        shutdownReason: reason,
        shutdownDuration: systemInfo.shutdownDuration,
        shutdownErrors: systemInfo.shutdownErrors || [],
        shutdownWarnings: systemInfo.shutdownWarnings || []
      };

      const metadata = {
        userId: 'system',
        userRole: 'system',
        userFullName: 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_SHUTDOWN,
        eventData,
        metadata
      );

      console.log(`✅ System shutdown event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system shutdown event:', error);
      throw error;
    }
  }

  /**
   * Emit system health check event
   * @param {Object} healthData - Health check data
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemHealthCheck(healthData) {
    try {
      const eventData = {
        systemId: healthData.id,
        systemName: healthData.name,
        systemVersion: healthData.version,
        systemEnvironment: healthData.environment,
        systemHost: healthData.host,
        systemPort: healthData.port,
        systemPid: healthData.pid,
        systemUptime: healthData.uptime,
        systemMemory: healthData.memory,
        systemCpu: healthData.cpu,
        systemDisk: healthData.disk,
        systemNetwork: healthData.network,
        systemServices: healthData.services || [],
        systemDependencies: healthData.dependencies || [],
        systemConfiguration: healthData.configuration || {},
        healthCheckAt: new Date().toISOString(),
        healthStatus: healthData.status,
        healthScore: healthData.score,
        healthMetrics: healthData.metrics || {},
        healthAlerts: healthData.alerts || [],
        healthWarnings: healthData.warnings || [],
        healthErrors: healthData.errors || [],
        responseTime: healthData.responseTime,
        throughput: healthData.throughput,
        errorRate: healthData.errorRate
      };

      const metadata = {
        userId: 'system',
        userRole: 'system',
        userFullName: 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_HEALTH_CHECK,
        eventData,
        metadata
      );

      console.log(`✅ System health check event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system health check event:', error);
      throw error;
    }
  }

  /**
   * Emit system error event
   * @param {Object} errorData - Error data
   * @param {Object} context - Error context
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemError(errorData, context) {
    try {
      const eventData = {
        systemId: errorData.id,
        systemName: errorData.name,
        systemVersion: errorData.version,
        systemEnvironment: errorData.environment,
        systemHost: errorData.host,
        systemPort: errorData.port,
        systemPid: errorData.pid,
        systemUptime: errorData.uptime,
        systemMemory: errorData.memory,
        systemCpu: errorData.cpu,
        systemDisk: errorData.disk,
        systemNetwork: errorData.network,
        systemServices: errorData.services || [],
        systemDependencies: errorData.dependencies || [],
        systemConfiguration: errorData.configuration || {},
        errorAt: new Date().toISOString(),
        errorType: errorData.type,
        errorCode: errorData.code,
        errorMessage: errorData.message,
        errorStack: errorData.stack,
        errorSeverity: errorData.severity,
        errorCategory: errorData.category,
        errorSource: errorData.source,
        errorContext: context,
        errorUserId: errorData.userId,
        errorSessionId: errorData.sessionId,
        errorRequestId: errorData.requestId,
        errorEndpoint: errorData.endpoint,
        errorMethod: errorData.method,
        errorStatus: errorData.status,
        errorResponseTime: errorData.responseTime,
        errorRetryable: errorData.retryable,
        errorRecoverable: errorData.recoverable
      };

      const metadata = {
        userId: errorData.userId || 'system',
        userRole: errorData.userRole || 'system',
        userFullName: errorData.userFullName || 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_ERROR,
        eventData,
        metadata
      );

      console.log(`✅ System error event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system error event:', error);
      throw error;
    }
  }

  /**
   * Emit system performance event
   * @param {Object} performanceData - Performance data
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemPerformance(performanceData) {
    try {
      const eventData = {
        systemId: performanceData.id,
        systemName: performanceData.name,
        systemVersion: performanceData.version,
        systemEnvironment: performanceData.environment,
        systemHost: performanceData.host,
        systemPort: performanceData.port,
        systemPid: performanceData.pid,
        systemUptime: performanceData.uptime,
        systemMemory: performanceData.memory,
        systemCpu: performanceData.cpu,
        systemDisk: performanceData.disk,
        systemNetwork: performanceData.network,
        systemServices: performanceData.services || [],
        systemDependencies: performanceData.dependencies || [],
        systemConfiguration: performanceData.configuration || {},
        performanceAt: new Date().toISOString(),
        performanceMetrics: performanceData.metrics || {},
        responseTime: performanceData.responseTime,
        throughput: performanceData.throughput,
        errorRate: performanceData.errorRate,
        cpuUsage: performanceData.cpuUsage,
        memoryUsage: performanceData.memoryUsage,
        diskUsage: performanceData.diskUsage,
        networkUsage: performanceData.networkUsage,
        activeConnections: performanceData.activeConnections,
        queueLength: performanceData.queueLength,
        cacheHitRate: performanceData.cacheHitRate,
        databaseConnections: performanceData.databaseConnections,
        apiCalls: performanceData.apiCalls,
        backgroundJobs: performanceData.backgroundJobs
      };

      const metadata = {
        userId: 'system',
        userRole: 'system',
        userFullName: 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_PERFORMANCE,
        eventData,
        metadata
      );

      console.log(`✅ System performance event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system performance event:', error);
      throw error;
    }
  }

  /**
   * Emit system configuration updated event
   * @param {Object} configData - Configuration data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemConfigurationUpdated(configData, updater, changes) {
    try {
      const eventData = {
        systemId: configData.id,
        systemName: configData.name,
        systemVersion: configData.version,
        systemEnvironment: configData.environment,
        systemHost: configData.host,
        systemPort: configData.port,
        systemPid: configData.pid,
        systemUptime: configData.uptime,
        systemMemory: configData.memory,
        systemCpu: configData.cpu,
        systemDisk: configData.disk,
        systemNetwork: configData.network,
        systemServices: configData.services || [],
        systemDependencies: configData.dependencies || [],
        systemConfiguration: configData.configuration || {},
        configurationUpdatedAt: new Date().toISOString(),
        configurationChanges: changes,
        configurationVersion: configData.configVersion,
        configurationBackup: configData.backup,
        configurationRestore: configData.restore,
        configurationValidation: configData.validation,
        configurationErrors: configData.errors || [],
        configurationWarnings: configData.warnings || []
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_CONFIGURATION_UPDATED,
        eventData,
        metadata
      );

      console.log(`✅ System configuration updated event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system configuration updated event:', error);
      throw error;
    }
  }

  /**
   * Emit system backup event
   * @param {Object} backupData - Backup data
   * @param {Object} operator - Operator information
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemBackup(backupData, operator) {
    try {
      const eventData = {
        systemId: backupData.id,
        systemName: backupData.name,
        systemVersion: backupData.version,
        systemEnvironment: backupData.environment,
        systemHost: backupData.host,
        systemPort: backupData.port,
        systemPid: backupData.pid,
        systemUptime: backupData.uptime,
        systemMemory: backupData.memory,
        systemCpu: backupData.cpu,
        systemDisk: backupData.disk,
        systemNetwork: backupData.network,
        systemServices: backupData.services || [],
        systemDependencies: backupData.dependencies || [],
        systemConfiguration: backupData.configuration || {},
        backupAt: new Date().toISOString(),
        backupType: backupData.type,
        backupName: backupData.name,
        backupSize: backupData.size,
        backupLocation: backupData.location,
        backupStatus: backupData.status,
        backupDuration: backupData.duration,
        backupErrors: backupData.errors || [],
        backupWarnings: backupData.warnings || [],
        backupCompression: backupData.compression,
        backupEncryption: backupData.encryption,
        backupRetention: backupData.retention,
        backupSchedule: backupData.schedule
      };

      const metadata = {
        userId: operator._id,
        userRole: operator.role,
        userFullName: operator.full_name,
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_BACKUP,
        eventData,
        metadata
      );

      console.log(`✅ System backup event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system backup event:', error);
      throw error;
    }
  }

  /**
   * Emit system restore event
   * @param {Object} restoreData - Restore data
   * @param {Object} operator - Operator information
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemRestore(restoreData, operator) {
    try {
      const eventData = {
        systemId: restoreData.id,
        systemName: restoreData.name,
        systemVersion: restoreData.version,
        systemEnvironment: restoreData.environment,
        systemHost: restoreData.host,
        systemPort: restoreData.port,
        systemPid: restoreData.pid,
        systemUptime: restoreData.uptime,
        systemMemory: restoreData.memory,
        systemCpu: restoreData.cpu,
        systemDisk: restoreData.disk,
        systemNetwork: restoreData.network,
        systemServices: restoreData.services || [],
        systemDependencies: restoreData.dependencies || [],
        systemConfiguration: restoreData.configuration || {},
        restoreAt: new Date().toISOString(),
        restoreType: restoreData.type,
        restoreName: restoreData.name,
        restoreSize: restoreData.size,
        restoreLocation: restoreData.location,
        restoreStatus: restoreData.status,
        restoreDuration: restoreData.duration,
        restoreErrors: restoreData.errors || [],
        restoreWarnings: restoreData.warnings || [],
        restoreCompression: restoreData.compression,
        restoreEncryption: restoreData.encryption,
        restoreValidation: restoreData.validation,
        restoreBackup: restoreData.backup
      };

      const metadata = {
        userId: operator._id,
        userRole: operator.role,
        userFullName: operator.full_name,
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_RESTORE,
        eventData,
        metadata
      );

      console.log(`✅ System restore event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system restore event:', error);
      throw error;
    }
  }

  /**
   * Emit system maintenance event
   * @param {Object} maintenanceData - Maintenance data
   * @param {Object} operator - Operator information
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemMaintenance(maintenanceData, operator) {
    try {
      const eventData = {
        systemId: maintenanceData.id,
        systemName: maintenanceData.name,
        systemVersion: maintenanceData.version,
        systemEnvironment: maintenanceData.environment,
        systemHost: maintenanceData.host,
        systemPort: maintenanceData.port,
        systemPid: maintenanceData.pid,
        systemUptime: maintenanceData.uptime,
        systemMemory: maintenanceData.memory,
        systemCpu: maintenanceData.cpu,
        systemDisk: maintenanceData.disk,
        systemNetwork: maintenanceData.network,
        systemServices: maintenanceData.services || [],
        systemDependencies: maintenanceData.dependencies || [],
        systemConfiguration: maintenanceData.configuration || {},
        maintenanceAt: new Date().toISOString(),
        maintenanceType: maintenanceData.type,
        maintenanceName: maintenanceData.name,
        maintenanceDescription: maintenanceData.description,
        maintenanceStatus: maintenanceData.status,
        maintenanceDuration: maintenanceData.duration,
        maintenanceErrors: maintenanceData.errors || [],
        maintenanceWarnings: maintenanceData.warnings || [],
        maintenanceSchedule: maintenanceData.schedule,
        maintenancePriority: maintenanceData.priority,
        maintenanceImpact: maintenanceData.impact,
        maintenanceDowntime: maintenanceData.downtime,
        maintenanceRollback: maintenanceData.rollback
      };

      const metadata = {
        userId: operator._id,
        userRole: operator.role,
        userFullName: operator.full_name,
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_MAINTENANCE,
        eventData,
        metadata
      );

      console.log(`✅ System maintenance event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system maintenance event:', error);
      throw error;
    }
  }

  /**
   * Emit system security event
   * @param {Object} securityData - Security data
   * @param {Object} context - Security context
   * @returns {Promise<Object>} Event result
   */
  static async emitSystemSecurity(securityData, context) {
    try {
      const eventData = {
        systemId: securityData.id,
        systemName: securityData.name,
        systemVersion: securityData.version,
        systemEnvironment: securityData.environment,
        systemHost: securityData.host,
        systemPort: securityData.port,
        systemPid: securityData.pid,
        systemUptime: securityData.uptime,
        systemMemory: securityData.memory,
        systemCpu: securityData.cpu,
        systemDisk: securityData.disk,
        systemNetwork: securityData.network,
        systemServices: securityData.services || [],
        systemDependencies: securityData.dependencies || [],
        systemConfiguration: securityData.configuration || {},
        securityAt: new Date().toISOString(),
        securityType: securityData.type,
        securityLevel: securityData.level,
        securityCategory: securityData.category,
        securitySource: securityData.source,
        securityTarget: securityData.target,
        securityAction: securityData.action,
        securityResult: securityData.result,
        securityContext: context,
        securityUserId: securityData.userId,
        securitySessionId: securityData.sessionId,
        securityRequestId: securityData.requestId,
        securityEndpoint: securityData.endpoint,
        securityMethod: securityData.method,
        securityStatus: securityData.status,
        securityResponseTime: securityData.responseTime,
        securityRetryable: securityData.retryable,
        securityRecoverable: securityData.recoverable
      };

      const metadata = {
        userId: securityData.userId || 'system',
        userRole: securityData.userRole || 'system',
        userFullName: securityData.userFullName || 'System',
        timestamp: new Date().toISOString(),
        source: 'system-service'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_SECURITY,
        eventData,
        metadata
      );

      console.log(`✅ System security event emitted: ${result.eventId}`);
      return result;
    } catch (error) {
      console.error('❌ Error emitting system security event:', error);
      throw error;
    }
  }
}

module.exports = SystemEvents;
