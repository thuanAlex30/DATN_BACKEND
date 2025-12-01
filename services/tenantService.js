const TenantRepository = require('../repository/TenantRepository');
const Tenant = require('../models/tenant');
const { v4: uuidv4 } = require('uuid');

class TenantService {
  /**
   * Tạo tenant mới từ order
   */
  async createTenant(tenantData) {
    try {
      const { name, address, phone, email, planType, orderId } = tenantData;

      // Tạo tenant_code từ tên công ty
      const tenantCode = this.generateTenantCode(name);

      // Tính ngày hết hạn dựa trên planType
      const expiresAt = this.calculateExpiryDate(planType);

      const tenant = await TenantRepository.create({
        tenant_code: tenantCode,
        name: name,
        status: 'active',
        subscription: {
          plan: planType,
          seats: planType === 'yearly' ? 999999 : 50, // Unlimited for yearly, 50 for others
          expires_at: expiresAt,
          auto_renew: false
        },
        contact: {
          name: name,
          email: email,
          phone: phone
        },
        metadata: {
          orderId: orderId,
          createdAt: new Date()
        }
      });

      return tenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  /**
   * Generate tenant code từ tên công ty
   */
  generateTenantCode(companyName) {
    // Chuyển tên công ty thành code (lowercase, không dấu, thay space bằng dash)
    let code = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Thêm random string để tránh trùng
    const randomSuffix = uuidv4().substring(0, 8);
    code = `${code}-${randomSuffix}`;

    return code;
  }

  /**
   * Tính ngày hết hạn dựa trên planType
   */
  calculateExpiryDate(planType) {
    const date = new Date();
    switch (planType) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  /**
   * Cập nhật subscription cho tenant hiện có
   * @param {ObjectId} tenantId - ID của tenant
   * @param {string} planType - Loại gói mới
   * @param {Date} startDate - Ngày bắt đầu (optional, mặc định là ngày hiện tại hoặc ngày hết hạn hiện tại nếu còn hạn)
   */
  async updateTenantSubscription(tenantId, planType, startDate = null) {
    try {
      const tenant = await TenantRepository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Nếu không có startDate, dùng ngày hiện tại hoặc ngày hết hạn hiện tại (nếu còn hạn)
      let effectiveStartDate = startDate || new Date();
      
      // Nếu subscription còn hạn, gia hạn từ ngày hết hạn hiện tại
      if (tenant.subscription?.expires_at && new Date(tenant.subscription.expires_at) > new Date()) {
        effectiveStartDate = new Date(tenant.subscription.expires_at);
      }

      // Tính ngày hết hạn mới từ ngày bắt đầu
      const expiresAt = this.calculateExpiryDateFromStart(planType, effectiveStartDate);

      // Cập nhật subscription
      tenant.subscription = {
        plan: planType,
        seats: planType === 'yearly' ? 999999 : 50,
        expires_at: expiresAt,
        auto_renew: tenant.subscription?.auto_renew || false
      };

      await tenant.save();
      return tenant;
    } catch (error) {
      console.error('Error updating tenant subscription:', error);
      throw error;
    }
  }

  /**
   * Tính ngày hết hạn từ ngày bắt đầu
   */
  calculateExpiryDateFromStart(planType, startDate) {
    const date = new Date(startDate);
    switch (planType) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date;
  }
}

module.exports = new TenantService();

