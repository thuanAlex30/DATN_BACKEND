const certificateRepository = require('../repository/CertificateRepository');
const mongoose = require('mongoose');
const User = require('../models/user');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');
const CertificateEvents = require('../events/certificateEvents');

class CertificateService {
  // Get all certificates with pagination (role-based filtering)
  async getAllCertificates(filters = {}, options = {}, userRole = null) {
    try {
      // Apply role-based filtering
      let roleFilters = {};
      
      // Non-admin users can only see active certificates
      if (userRole && userRole !== 'admin' && userRole !== 'manager') {
        roleFilters.status = 'ACTIVE';
      }
      
      // Merge role filters with existing filters
      const finalFilters = { ...filters, ...roleFilters };
      
      const result = await certificateRepository.getAll(finalFilters, options);
      return createResponse(200, 'Lấy danh sách chứng chỉ thành công', result);
    } catch (error) {
      console.error('Error getting certificates:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách chứng chỉ', null, error.message);
    }
  }

  // Get certificate by ID
  async getCertificateById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }
      
      return createResponse(200, 'Lấy thông tin chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error getting certificate by ID:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin chứng chỉ', null, error.message);
    }
  }

  // Create new certificate (role validation)
  async createCertificate(certificateData, userId, userRole) {
    try {
      // Role validation - only admin and manager can create certificates
      if (userRole !== 'admin' && userRole !== 'manager') {
        return createResponse(403, 'Bạn không có quyền tạo chứng chỉ');
      }
      
      // Validate required fields
      if (!certificateData.certificateName) {
        return createResponse(400, 'Tên chứng chỉ là bắt buộc');
      }

      if (!certificateData.category) {
        return createResponse(400, 'Danh mục chứng chỉ là bắt buộc');
      }

      if (!certificateData.issuingAuthority) {
        return createResponse(400, 'Cơ quan cấp phát là bắt buộc');
      }

      // Check if certificate name already exists
      const existingByName = await certificateRepository.findByName(certificateData.certificateName);
      if (existingByName) {
        return createResponse(400, 'Tên chứng chỉ đã tồn tại');
      }

      // Check if certificate code already exists (if provided)
      if (certificateData.certificateCode) {
        const existingByCode = await certificateRepository.findByCode(certificateData.certificateCode);
        if (existingByCode) {
          return createResponse(400, 'Mã chứng chỉ đã tồn tại');
        }
      }

      // Generate certificate code if not provided
      if (!certificateData.certificateCode) {
        certificateData.certificateCode = this.generateCertificateCode(certificateData.certificateName, certificateData.category);
      }

      // Set default values
      certificateData.status = certificateData.status || 'ACTIVE';
      certificateData.priority = certificateData.priority || 'MEDIUM';
      certificateData.validityPeriodUnit = certificateData.validityPeriodUnit || 'MONTHS';
      certificateData.currency = certificateData.currency || 'VND';
      certificateData.renewalRequired = certificateData.renewalRequired !== false;

      // Set issue date if not provided
      if (!certificateData.issueDate) {
        certificateData.issueDate = new Date();
      }

      // Calculate expiry date if validity period is provided
      if (certificateData.validityPeriod && certificateData.validityPeriodUnit) {
        certificateData.expiryDate = this.calculateExpiryDate(
          certificateData.issueDate,
          certificateData.validityPeriod,
          certificateData.validityPeriodUnit
        );
      }

      const certificate = await certificateRepository.create(certificateData);
      
      // Emit certificate created event
      try {
        const creator = await User.findById(certificateData.createdBy).select('_id role full_name');
        if (creator) {
          await CertificateEvents.emitCertificateCreated(certificate, creator);
        }
      } catch (eventError) {
        console.error('Error emitting certificate created event:', eventError);
        // Don't fail the operation if event emission fails
      }
      
      return createResponse(201, 'Tạo chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      return createResponse(500, 'Lỗi khi tạo chứng chỉ', null, error.message);
    }
  }

  // Update certificate
  async updateCertificate(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      // Check if certificate exists
      const existingCertificate = await certificateRepository.getById(id);
      if (!existingCertificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      // Check for duplicate name (excluding current certificate)
      if (updateData.certificateName) {
        const existingByName = await certificateRepository.findByName(updateData.certificateName);
        if (existingByName && existingByName._id !== id) {
          return createResponse(400, 'Tên chứng chỉ đã tồn tại');
        }
      }

      // Check for duplicate code (excluding current certificate)
      if (updateData.certificateCode) {
        const existingByCode = await certificateRepository.findByCode(updateData.certificateCode);
        if (existingByCode && existingByCode._id !== id) {
          return createResponse(400, 'Mã chứng chỉ đã tồn tại');
        }
      }

      // Recalculate expiry date if validity period changed
      if (updateData.validityPeriod || updateData.validityPeriodUnit) {
        const issueDate = updateData.issueDate || existingCertificate.issueDate;
        const validityPeriod = updateData.validityPeriod || existingCertificate.validityPeriod;
        const validityPeriodUnit = updateData.validityPeriodUnit || existingCertificate.validityPeriodUnit;
        
        if (issueDate && validityPeriod && validityPeriodUnit) {
          updateData.expiryDate = this.calculateExpiryDate(
            issueDate,
            validityPeriod,
            validityPeriodUnit
          );
        }
      }

      const certificate = await certificateRepository.updateById(id, updateData);
      
      // Emit certificate updated event
      try {
        const updater = await User.findById(updateData.updatedBy).select('_id role full_name');
        if (updater) {
          await CertificateEvents.emitCertificateUpdated(certificate, updater, updateData);
        }
      } catch (eventError) {
        console.error('Error emitting certificate updated event:', eventError);
        // Don't fail the operation if event emission fails
      }
      
      return createResponse(200, 'Cập nhật chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error updating certificate:', error);
      return createResponse(500, 'Lỗi khi cập nhật chứng chỉ', null, error.message);
    }
  }

  // Delete certificate
  async deleteCertificate(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      const result = await certificateRepository.deleteById(id);
      if (!result) {
        return createResponse(500, 'Lỗi khi xóa chứng chỉ');
      }

      // Emit certificate deleted event
      try {
        await CertificateEvents.emitCertificateDeleted(certificate, { _id: 'system', role: 'system', full_name: 'System' });
      } catch (eventError) {
        console.error('Error emitting certificate deleted event:', eventError);
        // Don't fail the operation if event emission fails
      }

      return createResponse(200, 'Xóa chứng chỉ thành công');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      return createResponse(500, 'Lỗi khi xóa chứng chỉ', null, error.message);
    }
  }

  // Get certificates by category
  async getCertificatesByCategory(category, subCategory = null) {
    try {
      const certificates = await certificateRepository.getByCategory(category, subCategory);
      return createResponse(200, 'Lấy chứng chỉ theo danh mục thành công', certificates);
    } catch (error) {
      console.error('Error getting certificates by category:', error);
      return createResponse(500, 'Lỗi khi lấy chứng chỉ theo danh mục', null, error.message);
    }
  }

  // Get expiring certificates
  async getExpiringCertificates(days = 30) {
    try {
      const certificates = await certificateRepository.getExpiring(days);
      return createResponse(200, 'Lấy chứng chỉ sắp hết hạn thành công', certificates);
    } catch (error) {
      console.error('Error getting expiring certificates:', error);
      return createResponse(500, 'Lỗi khi lấy chứng chỉ sắp hết hạn', null, error.message);
    }
  }

  // Get certificate statistics
  async getCertificateStats() {
    try {
      const stats = await certificateRepository.getStats();
      return createResponse(200, 'Lấy thống kê chứng chỉ thành công', stats);
    } catch (error) {
      console.error('Error getting certificate statistics:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê chứng chỉ', null, error.message);
    }
  }

  // Search certificates
  async searchCertificates(query, filters = {}, options = {}) {
    try {
      if (!query || query.trim() === '') {
        return createResponse(400, 'Từ khóa tìm kiếm là bắt buộc');
      }

      const result = await certificateRepository.search(query, filters, options);
      return createResponse(200, 'Tìm kiếm chứng chỉ thành công', result);
    } catch (error) {
      console.error('Error searching certificates:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm chứng chỉ', null, error.message);
    }
  }

  // Renew certificate
  async renewCertificate(id, renewalData = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      const updateData = {
        issueDate: renewalData.renewalDate || new Date(),
        expiryDate: this.calculateExpiryDate(
          renewalData.renewalDate || new Date(),
          certificate.validityPeriod,
          certificate.validityPeriodUnit
        ),
        status: 'ACTIVE',
        renewalNotes: renewalData.notes || '',
        lastRenewalDate: new Date()
      };

      const renewedCertificate = await certificateRepository.updateById(id, updateData);
      
      // Emit certificate renewed event
      try {
        const renewer = { _id: 'system', role: 'system', full_name: 'System' };
        await CertificateEvents.emitCertificateRenewed(renewedCertificate, renewer, renewalData);
      } catch (eventError) {
        console.error('Error emitting certificate renewed event:', eventError);
        // Don't fail the operation if event emission fails
      }
      
      return createResponse(200, 'Gia hạn chứng chỉ thành công', renewedCertificate);
    } catch (error) {
      console.error('Error renewing certificate:', error);
      return createResponse(500, 'Lỗi khi gia hạn chứng chỉ', null, error.message);
    }
  }

  // Update reminder settings
  async updateReminderSettings(id, reminderSettings) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      const updateData = { reminderSettings };
      const updatedCertificate = await certificateRepository.updateById(id, updateData);
      
      // Emit reminder settings updated event
      try {
        const updater = { _id: 'system', role: 'system', full_name: 'System' };
        await CertificateEvents.emitReminderSettingsUpdated(updatedCertificate, updater, reminderSettings);
      } catch (eventError) {
        console.error('Error emitting reminder settings updated event:', eventError);
        // Don't fail the operation if event emission fails
      }
      
      return createResponse(200, 'Cập nhật cài đặt nhắc nhở thành công', updatedCertificate);
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      return createResponse(500, 'Lỗi khi cập nhật cài đặt nhắc nhở', null, error.message);
    }
  }

  // Helper method to generate certificate code
  generateCertificateCode(certificateName, category = '') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const namePrefix = certificateName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
  }

  // Helper method to calculate expiry date
  calculateExpiryDate(issueDate, validityPeriod, validityPeriodUnit) {
    const issue = new Date(issueDate);
    const expiry = new Date(issue);

    if (validityPeriodUnit === 'MONTHS') {
      expiry.setMonth(expiry.getMonth() + validityPeriod);
    } else if (validityPeriodUnit === 'YEARS') {
      expiry.setFullYear(expiry.getFullYear() + validityPeriod);
    }

    return expiry;
  }

  // Helper method to check if certificate is expiring soon
  isExpiringSoon(expiryDate, days = 30) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= days && daysUntilExpiry >= 0;
  }

  // Helper method to check if certificate is expired
  isExpired(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    return expiry < now;
  }
}

module.exports = new CertificateService();
