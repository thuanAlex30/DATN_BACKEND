const mongoose = require('mongoose');

class CertificateUtils {
  // Validate certificate data
  static validateCertificateData(data) {
    const errors = [];

    // Required fields validation
    if (!data.certificateName || data.certificateName.trim() === '') {
      errors.push('Tên chứng chỉ là bắt buộc');
    }

    if (!data.category) {
      errors.push('Danh mục chứng chỉ là bắt buộc');
    }

    if (!data.issuingAuthority || data.issuingAuthority.trim() === '') {
      errors.push('Cơ quan cấp phát là bắt buộc');
    }

    if (!data.validityPeriod || data.validityPeriod <= 0) {
      errors.push('Thời gian hiệu lực phải lớn hơn 0');
    }

    // Category validation
    const validCategories = ['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'];
    if (data.category && !validCategories.includes(data.category)) {
      errors.push('Danh mục chứng chỉ không hợp lệ');
    }

    // Priority validation
    if (data.priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(data.priority)) {
        errors.push('Mức độ ưu tiên không hợp lệ');
      }
    }

    // Status validation
    if (data.status) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Trạng thái chứng chỉ không hợp lệ');
      }
    }

    // Validity period unit validation
    if (data.validityPeriodUnit) {
      const validUnits = ['MONTHS', 'YEARS'];
      if (!validUnits.includes(data.validityPeriodUnit)) {
        errors.push('Đơn vị thời gian hiệu lực không hợp lệ');
      }
    }

    // Email validation
    if (data.contactInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contactInfo.email)) {
        errors.push('Email không hợp lệ');
      }
    }

    // Phone validation
    if (data.contactInfo?.phone) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(data.contactInfo.phone)) {
        errors.push('Số điện thoại không hợp lệ');
      }
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join(', ') : null
    };
  }

  // Generate certificate code
  static generateCertificateCode(certificateName, category = '') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const namePrefix = certificateName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
  }

  // Calculate expiry date
  static calculateExpiryDate(issueDate, validityPeriod, validityPeriodUnit) {
    const issue = new Date(issueDate);
    const expiry = new Date(issue);

    if (validityPeriodUnit === 'MONTHS') {
      expiry.setMonth(expiry.getMonth() + validityPeriod);
    } else if (validityPeriodUnit === 'YEARS') {
      expiry.setFullYear(expiry.getFullYear() + validityPeriod);
    }

    return expiry;
  }

  // Check if certificate is expiring soon
  static isExpiringSoon(expiryDate, days = 30) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= days && daysUntilExpiry >= 0;
  }

  // Check if certificate is expired
  static isExpired(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    return expiry < now;
  }

  // Get days until expiry
  static getDaysUntilExpiry(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry;
  }

  // Format certificate for display
  static formatCertificate(certificate) {
    return {
      ...certificate,
      validityPeriodInMonths: this.getValidityPeriodInMonths(
        certificate.validityPeriod,
        certificate.validityPeriodUnit
      ),
      isExpiringSoon: this.isExpiringSoon(certificate.expiryDate),
      isExpired: this.isExpired(certificate.expiryDate),
      daysUntilExpiry: this.getDaysUntilExpiry(certificate.expiryDate)
    };
  }

  // Get validity period in months
  static getValidityPeriodInMonths(validityPeriod, validityPeriodUnit) {
    if (validityPeriodUnit === 'MONTHS') {
      return validityPeriod;
    } else if (validityPeriodUnit === 'YEARS') {
      return validityPeriod * 12;
    }
    return validityPeriod;
  }

  // Generate certificate report data
  static generateReportData(certificates, filters = {}) {
    const report = {
      summary: {
        total: certificates.length,
        active: certificates.filter(c => c.status === 'ACTIVE').length,
        inactive: certificates.filter(c => c.status === 'INACTIVE').length,
        expired: certificates.filter(c => c.status === 'EXPIRED').length,
        expiringSoon: certificates.filter(c => this.isExpiringSoon(c.expiryDate)).length
      },
      byCategory: {},
      byStatus: {},
      expiringCertificates: certificates.filter(c => this.isExpiringSoon(c.expiryDate)),
      expiredCertificates: certificates.filter(c => this.isExpired(c.expiryDate))
    };

    // Group by category
    certificates.forEach(cert => {
      if (!report.byCategory[cert.category]) {
        report.byCategory[cert.category] = 0;
      }
      report.byCategory[cert.category]++;
    });

    // Group by status
    certificates.forEach(cert => {
      if (!report.byStatus[cert.status]) {
        report.byStatus[cert.status] = 0;
      }
      report.byStatus[cert.status]++;
    });

    return report;
  }

  // Generate certificate summary
  static generateSummary(certificate) {
    return {
      id: certificate._id,
      name: certificate.certificateName,
      code: certificate.certificateCode,
      category: certificate.category,
      status: certificate.status,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      daysUntilExpiry: this.getDaysUntilExpiry(certificate.expiryDate),
      isExpiringSoon: this.isExpiringSoon(certificate.expiryDate),
      isExpired: this.isExpired(certificate.expiryDate),
      priority: certificate.priority,
      issuingAuthority: certificate.issuingAuthority
    };
  }
}

module.exports = CertificateUtils;
