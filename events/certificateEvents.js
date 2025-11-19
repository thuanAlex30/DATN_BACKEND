const kafkaProducer = require('../services/kafkaProducer');
const { eventTypes } = require('../config/kafkaConfig');
const { validateEvent } = require('./eventSchemas');

class CertificateEvents {
  /**
   * Emit certificate created event
   * @param {Object} certificate - Certificate data
   * @param {Object} creator - Creator information
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateCreated(certificate, creator) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        subCategory: certificate.subCategory,
        description: certificate.description,
        issuingAuthority: certificate.issuingAuthority,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        validityPeriod: certificate.validityPeriod,
        validityPeriodUnit: certificate.validityPeriodUnit,
        status: certificate.status,
        priority: certificate.priority,
        renewalRequired: certificate.renewalRequired,
        cost: certificate.cost,
        currency: certificate.currency,
        contactInfo: certificate.contactInfo || {},
        tags: certificate.tags || [],
        attachments: certificate.attachments || [],
        reminderSettings: certificate.reminderSettings || {},
        complianceStandards: certificate.complianceStandards || [],
        siteId: certificate.siteId,
        projectId: certificate.projectId,
        assignedTo: certificate.assignedTo,
        notes: certificate.notes,
        lastRenewalDate: certificate.lastRenewalDate,
        renewalNotes: certificate.renewalNotes
      };

      const metadata = {
        userId: creator._id,
        userRole: creator.role,
        userFullName: creator.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_CREATED,
        eventData,
        metadata
      );

      console.log('✅ Certificate created event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate created event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate updated event
   * @param {Object} certificate - Updated certificate data
   * @param {Object} updater - Updater information
   * @param {Object} changes - Changes made
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateUpdated(certificate, updater, changes = {}) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        subCategory: certificate.subCategory,
        description: certificate.description,
        issuingAuthority: certificate.issuingAuthority,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        validityPeriod: certificate.validityPeriod,
        validityPeriodUnit: certificate.validityPeriodUnit,
        status: certificate.status,
        priority: certificate.priority,
        renewalRequired: certificate.renewalRequired,
        cost: certificate.cost,
        currency: certificate.currency,
        contactInfo: certificate.contactInfo || {},
        tags: certificate.tags || [],
        attachments: certificate.attachments || [],
        reminderSettings: certificate.reminderSettings || {},
        complianceStandards: certificate.complianceStandards || [],
        siteId: certificate.siteId,
        projectId: certificate.projectId,
        assignedTo: certificate.assignedTo,
        notes: certificate.notes,
        lastRenewalDate: certificate.lastRenewalDate,
        renewalNotes: certificate.renewalNotes,
        changes: changes
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_UPDATED,
        eventData,
        metadata
      );

      console.log('✅ Certificate updated event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate updated event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate deleted event
   * @param {Object} certificate - Deleted certificate data
   * @param {Object} deleter - Deleter information
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateDeleted(certificate, deleter) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        status: certificate.status,
        deletedAt: new Date().toISOString()
      };

      const metadata = {
        userId: deleter._id,
        userRole: deleter.role,
        userFullName: deleter.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_DELETED,
        eventData,
        metadata
      );

      console.log('✅ Certificate deleted event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate deleted event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate renewed event
   * @param {Object} certificate - Renewed certificate data
   * @param {Object} renewer - Renewer information
   * @param {Object} renewalData - Renewal information
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateRenewed(certificate, renewer, renewalData = {}) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        status: certificate.status,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        validityPeriod: certificate.validityPeriod,
        validityPeriodUnit: certificate.validityPeriodUnit,
        renewalDate: renewalData.renewalDate || new Date(),
        renewalNotes: renewalData.notes,
        lastRenewalDate: certificate.lastRenewalDate,
        previousExpiryDate: renewalData.previousExpiryDate
      };

      const metadata = {
        userId: renewer._id,
        userRole: renewer.role,
        userFullName: renewer.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_RENEWED,
        eventData,
        metadata
      );

      console.log('✅ Certificate renewed event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate renewed event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate expiring soon event
   * @param {Object} certificate - Certificate data
   * @param {number} daysUntilExpiry - Days until expiry
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateExpiringSoon(certificate, daysUntilExpiry) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        status: certificate.status,
        expiryDate: certificate.expiryDate,
        daysUntilExpiry: daysUntilExpiry,
        priority: certificate.priority,
        reminderSettings: certificate.reminderSettings || {},
        assignedTo: certificate.assignedTo
      };

      const metadata = {
        timestamp: new Date().toISOString(),
        source: 'certificate-service',
        eventType: 'expiry_warning'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_EXPIRING_SOON,
        eventData,
        metadata
      );

      console.log('✅ Certificate expiring soon event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate expiring soon event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate expired event
   * @param {Object} certificate - Certificate data
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateExpired(certificate) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        status: certificate.status,
        expiryDate: certificate.expiryDate,
        priority: certificate.priority,
        assignedTo: certificate.assignedTo,
        renewalRequired: certificate.renewalRequired
      };

      const metadata = {
        timestamp: new Date().toISOString(),
        source: 'certificate-service',
        eventType: 'expiry_alert'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_EXPIRED,
        eventData,
        metadata
      );

      console.log('✅ Certificate expired event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate expired event:', error);
      throw error;
    }
  }

  /**
   * Emit reminder settings updated event
   * @param {Object} certificate - Certificate data
   * @param {Object} updater - Updater information
   * @param {Object} reminderSettings - Updated reminder settings
   * @returns {Promise<Object>} Event result
   */
  static async emitReminderSettingsUpdated(certificate, updater, reminderSettings) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        expiryDate: certificate.expiryDate,
        reminderSettings: reminderSettings,
        previousReminderSettings: certificate.reminderSettings || {}
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_REMINDER_SETTINGS_UPDATED,
        eventData,
        metadata
      );

      console.log('✅ Certificate reminder settings updated event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting reminder settings updated event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate status changed event
   * @param {Object} certificate - Certificate data
   * @param {Object} updater - Updater information
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateStatusChanged(certificate, updater, oldStatus, newStatus) {
    try {
      const eventData = {
        certificateId: certificate._id,
        certificateName: certificate.certificateName,
        certificateCode: certificate.certificateCode,
        category: certificate.category,
        oldStatus: oldStatus,
        newStatus: newStatus,
        statusChangedAt: new Date().toISOString(),
        expiryDate: certificate.expiryDate,
        assignedTo: certificate.assignedTo
      };

      const metadata = {
        userId: updater._id,
        userRole: updater.role,
        userFullName: updater.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_STATUS_CHANGED,
        eventData,
        metadata
      );

      console.log('✅ Certificate status changed event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate status changed event:', error);
      throw error;
    }
  }

  /**
   * Emit certificate bulk operation event
   * @param {string} operation - Operation type
   * @param {Array} certificates - Affected certificates
   * @param {Object} operator - Operator information
   * @param {Object} operationData - Additional operation data
   * @returns {Promise<Object>} Event result
   */
  static async emitCertificateBulkOperation(operation, certificates, operator, operationData = {}) {
    try {
      const eventData = {
        operation: operation,
        certificateIds: certificates.map(cert => cert._id),
        certificateNames: certificates.map(cert => cert.certificateName),
        count: certificates.length,
        operationData: operationData,
        processedAt: new Date().toISOString()
      };

      const metadata = {
        userId: operator._id,
        userRole: operator.role,
        userFullName: operator.full_name,
        timestamp: new Date().toISOString(),
        source: 'certificate-service'
      };

      const result = await kafkaProducer.sendCertificateEvent(
        eventTypes.CERTIFICATE_BULK_OPERATION,
        eventData,
        metadata
      );

      console.log('✅ Certificate bulk operation event emitted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error emitting certificate bulk operation event:', error);
      throw error;
    }
  }
}

module.exports = CertificateEvents;
