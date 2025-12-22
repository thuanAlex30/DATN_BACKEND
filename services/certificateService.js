const certificateRepository = require('../repository/CertificateRepository');
const mongoose = require('mongoose');
const User = require('../models/user');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');
const CertificateEvents = require('../events/certificateEvents');

class CertificateService {
  // Helper method to check if user has department_header/manager role
  _hasAdminOrManagerRole(userRole) {
    if (!userRole) return false;
    
    const roleStr = typeof userRole === 'string' ? userRole.toLowerCase() : '';
    const roleCode = userRole?.role_code?.toLowerCase() || '';
    const roleName = userRole?.role_name?.toLowerCase() || '';
    const roleLevel = userRole?.role_level || 0;
    
    // Check role_code, role_name, or role_level
    return roleCode === 'department_header' || roleCode === 'manager' ||
           roleName === 'department header' || roleName === 'manager' ||
           roleStr === 'department_header' || roleStr === 'manager' ||
           roleLevel >= 70; // Manager level (70) or Department Header level (80) or above
  }

  // Helper method to check if user has department_header role (for delete operations)
  _hasAdminRole(userRole) {
    if (!userRole) return false;
    
    const roleStr = typeof userRole === 'string' ? userRole.toLowerCase() : '';
    const roleCode = userRole?.role_code?.toLowerCase() || '';
    const roleName = userRole?.role_name?.toLowerCase() || '';
    const roleLevel = userRole?.role_level || 0;
    
    return roleCode === 'department_header' ||
           roleName === 'department header' ||
           roleStr === 'department_header' ||
           roleLevel >= 80; // Department Header level (80) or above
  }

  // Get all certificates with pagination (role-based and tenant-based filtering)
  async getAllCertificates(filters = {}, options = {}, userRole = null, tenantId = null) {
    try {
      // Extract search query from filters if present
      const searchQuery = filters.q || filters.search;
      
      // Clean filters: remove non-DB fields and undefined/null/empty values
      const dbFilters = {};
      Object.keys(filters).forEach(key => {
        // Skip search query fields
        if (key === 'q' || key === 'search') return;
        
        // Only include valid values
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          dbFilters[key] = value;
        }
      });
      
      // Apply tenant filtering (always apply if tenantId exists)
      if (tenantId) {
        dbFilters.tenant_id = tenantId;
      }
      
      // Apply role-based filtering
      let roleFilters = {};
      const isAdminOrManager = userRole && this._hasAdminOrManagerRole(userRole);
      
      // Non-admin/manager users can only see active certificates
      if (userRole && !isAdminOrManager) {
        // Only apply ACTIVE filter if user didn't explicitly filter by status
        // This allows users to see all their active certificates
        if (!dbFilters.status) {
          roleFilters.status = 'ACTIVE';
        }
        // If user filtered by status, respect their filter (for their own data)
      }
      
      // Merge role filters with existing filters
      // If status is specified in dbFilters, it takes precedence
      const finalFilters = { ...dbFilters };
      if (roleFilters.status && !finalFilters.status) {
        finalFilters.status = roleFilters.status;
      }
      
      console.log('🔍 CertificateService.getAllCertificates:', {
        searchQuery,
        dbFilters,
        roleFilters,
        finalFilters,
        options,
        tenantId,
        userRole: userRole?.role_name || userRole?.role_code,
        isAdminOrManager
      });
      
      // If search query exists, use search method; otherwise use getAll
      let result;
      if (searchQuery && searchQuery.trim()) {
        result = await certificateRepository.search(searchQuery.trim(), finalFilters, options);
      } else {
        result = await certificateRepository.getAll(finalFilters, options);
      }
      
      console.log('✅ CertificateService result:', {
        dataCount: result?.data?.length || 0,
        pagination: result?.pagination,
        total: result?.pagination?.total || 0
      });
      
      return createResponse(200, 'Lấy danh sách chứng chỉ thành công', result);
    } catch (error) {
      console.error('Error getting certificates:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách chứng chỉ', null, error.message);
    }
  }

  // Get certificate by ID (with tenant check)
  async getCertificateById(id, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }
      
      // Check tenant access if tenantId is provided
      if (tenantId && certificate.tenant_id && certificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền truy cập chứng chỉ này');
      }
      
      return createResponse(200, 'Lấy thông tin chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error getting certificate by ID:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin chứng chỉ', null, error.message);
    }
  }

  // Create new certificate (role validation)
  async createCertificate(certificateData, userId, userRole, tenantId = null) {
    try {
      // Role validation - only admin and manager can create certificates
      if (!this._hasAdminOrManagerRole(userRole)) {
        return createResponse(403, 'Bạn không có quyền tạo chứng chỉ');
      }
      
      // Set tenant_id from parameter or certificateData
      if (tenantId) {
        certificateData.tenant_id = tenantId;
      } else if (!certificateData.tenant_id) {
        // Try to get from user if available
        try {
          const user = await User.findById(userId).select('tenant_id');
          if (user && user.tenant_id) {
            certificateData.tenant_id = user.tenant_id;
          }
        } catch (err) {
          console.warn('Could not get tenant_id from user:', err.message);
        }
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

      // Check if certificate name already exists (within same tenant)
      const nameFilter = { certificateName: certificateData.certificateName };
      if (certificateData.tenant_id) {
        nameFilter.tenant_id = certificateData.tenant_id;
      }
      const existingByName = await certificateRepository.findByName(certificateData.certificateName, certificateData.tenant_id);
      if (existingByName) {
        return createResponse(400, 'Tên chứng chỉ đã tồn tại');
      }

      // Check if certificate code already exists (within same tenant)
      if (certificateData.certificateCode) {
        const existingByCode = await certificateRepository.findByCode(certificateData.certificateCode, certificateData.tenant_id);
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
      
      // Note: Event emission is handled in controller to avoid duplication
      
      return createResponse(201, 'Tạo chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      return createResponse(500, 'Lỗi khi tạo chứng chỉ', null, error.message);
    }
  }

  // Update certificate (with tenant check)
  async updateCertificate(id, updateData, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      // Check if certificate exists
      const existingCertificate = await certificateRepository.getById(id);
      if (!existingCertificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      // Check tenant access if tenantId is provided
      if (tenantId && existingCertificate.tenant_id && existingCertificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền cập nhật chứng chỉ này');
      }

      // Check for duplicate name (excluding current certificate, within same tenant)
      if (updateData.certificateName) {
        const checkTenantId = tenantId || existingCertificate.tenant_id;
        const existingByName = await certificateRepository.findByName(updateData.certificateName, checkTenantId);
        if (existingByName && existingByName._id.toString() !== id.toString()) {
          return createResponse(400, 'Tên chứng chỉ đã tồn tại');
        }
      }

      // Check for duplicate code (excluding current certificate, within same tenant)
      if (updateData.certificateCode) {
        const checkTenantId = tenantId || existingCertificate.tenant_id;
        const existingByCode = await certificateRepository.findByCode(updateData.certificateCode, checkTenantId);
        if (existingByCode && existingByCode._id.toString() !== id.toString()) {
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
      
      // Note: Event emission is handled in controller to avoid duplication
      
      return createResponse(200, 'Cập nhật chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error updating certificate:', error);
      return createResponse(500, 'Lỗi khi cập nhật chứng chỉ', null, error.message);
    }
  }

  // Delete certificate (with tenant check)
  async deleteCertificate(id, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      // Check tenant access if tenantId is provided
      if (tenantId && certificate.tenant_id && certificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền xóa chứng chỉ này');
      }

      const result = await certificateRepository.deleteById(id);
      if (!result) {
        return createResponse(500, 'Lỗi khi xóa chứng chỉ');
      }

      // Note: Event emission is handled in controller to avoid duplication
      // Return certificate data for event emission in controller
      return createResponse(200, 'Xóa chứng chỉ thành công', certificate);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      return createResponse(500, 'Lỗi khi xóa chứng chỉ', null, error.message);
    }
  }

  // Get certificates by category (with tenant filter)
  async getCertificatesByCategory(category, subCategory = null, tenantId = null) {
    try {
      const certificates = await certificateRepository.getByCategory(category, subCategory, tenantId);
      return createResponse(200, 'Lấy chứng chỉ theo danh mục thành công', certificates);
    } catch (error) {
      console.error('Error getting certificates by category:', error);
      return createResponse(500, 'Lỗi khi lấy chứng chỉ theo danh mục', null, error.message);
    }
  }

  // Get expiring certificates (with tenant filter)
  async getExpiringCertificates(days = 30, tenantId = null) {
    try {
      const certificates = await certificateRepository.getExpiring(days, tenantId);
      return createResponse(200, 'Lấy chứng chỉ sắp hết hạn thành công', certificates);
    } catch (error) {
      console.error('Error getting expiring certificates:', error);
      return createResponse(500, 'Lỗi khi lấy chứng chỉ sắp hết hạn', null, error.message);
    }
  }

  // Get certificate statistics (scoped theo tenant nếu có tenantId)
  async getCertificateStats(tenantId = null) {
    try {
      const stats = await certificateRepository.getStats(tenantId ? { tenant_id: tenantId } : {});
      return createResponse(200, 'Lấy thống kê chứng chỉ thành công', stats);
    } catch (error) {
      console.error('Error getting certificate statistics:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê chứng chỉ', null, error.message);
    }
  }

  // Search certificates (with tenant filter)
  async searchCertificates(query, filters = {}, options = {}, tenantId = null) {
    try {
      if (!query || query.trim() === '') {
        return createResponse(400, 'Từ khóa tìm kiếm là bắt buộc');
      }

      // Add tenant filter if provided
      if (tenantId) {
        filters.tenant_id = tenantId;
      }

      const result = await certificateRepository.search(query, filters, options);
      return createResponse(200, 'Tìm kiếm chứng chỉ thành công', result);
    } catch (error) {
      console.error('Error searching certificates:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm chứng chỉ', null, error.message);
    }
  }

  // Renew certificate (with tenant check)
  async renewCertificate(id, renewalData = {}, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      // Check tenant access if tenantId is provided
      if (tenantId && certificate.tenant_id && certificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền gia hạn chứng chỉ này');
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
      
      // Note: Event emission is handled in controller to avoid duplication
      
      return createResponse(200, 'Gia hạn chứng chỉ thành công', renewedCertificate);
    } catch (error) {
      console.error('Error renewing certificate:', error);
      return createResponse(500, 'Lỗi khi gia hạn chứng chỉ', null, error.message);
    }
  }

  // Update reminder settings (with tenant check)
  async updateReminderSettings(id, reminderSettings, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ không hợp lệ');
      }

      const certificate = await certificateRepository.getById(id);
      if (!certificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ');
      }

      // Check tenant access if tenantId is provided
      if (tenantId && certificate.tenant_id && certificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền cập nhật cài đặt nhắc nhở cho chứng chỉ này');
      }

      const updateData = { reminderSettings };
      const updatedCertificate = await certificateRepository.updateById(id, updateData);
      
      // Note: Event emission is handled in controller to avoid duplication
      
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

  // Find certificate by name (for duplicate checking)
  async findByName(name, tenantId = null) {
    try {
      return await certificateRepository.findByName(name, tenantId);
    } catch (error) {
      console.error('Error finding certificate by name:', error);
      return null;
    }
  }

  // Find certificate by code (for duplicate checking)
  async findByCode(code, tenantId = null) {
    try {
      return await certificateRepository.findByCode(code, tenantId);
    } catch (error) {
      console.error('Error finding certificate by code:', error);
      return null;
    }
  }
}

module.exports = new CertificateService();
