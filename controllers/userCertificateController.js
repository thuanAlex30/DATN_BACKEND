const userCertificateService = require('../services/userCertificateService');
const { validationResult } = require('express-validator');

class UserCertificateController {
  // Get all user certificates
  static async getUserCertificates(req, res) {
    try {
      const tenantId = req.user?.tenant_id;
      const { page, limit, status, userId, certificateId, ...otherFilters } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.user_id = userId;
      if (certificateId) filters.certificate_id = certificateId;
      Object.keys(otherFilters).forEach(key => {
        if (otherFilters[key] !== undefined && otherFilters[key] !== null && otherFilters[key] !== '') {
          filters[key] = otherFilters[key];
        }
      });

      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        sort: { createdAt: -1 }
      };

      if (isNaN(options.page) || options.page < 1) options.page = 1;
      if (isNaN(options.limit) || options.limit < 1) options.limit = 10;

      const result = await userCertificateService.getAllUserCertificates(filters, options, tenantId);
      
      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting user certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chứng chỉ cá nhân'
      });
    }
  }

  // Get user certificates by department
  static async getUserCertificatesByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const tenantId = req.user?.tenant_id;
      const { page, limit, status, userId, ...otherFilters } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.user_id = userId;
      Object.keys(otherFilters).forEach(key => {
        if (otherFilters[key] !== undefined && otherFilters[key] !== null && otherFilters[key] !== '') {
          filters[key] = otherFilters[key];
        }
      });

      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        sort: { createdAt: -1 }
      };

      if (isNaN(options.page) || options.page < 1) options.page = 1;
      if (isNaN(options.limit) || options.limit < 1) options.limit = 10;

      const result = await userCertificateService.getByDepartment(departmentId, filters, options, tenantId);
      
      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting user certificates by department:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chứng chỉ theo phòng ban'
      });
    }
  }

  // Get user certificate by ID
  static async getUserCertificateById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id;

      const result = await userCertificateService.getUserCertificateById(id, tenantId);
      
      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting user certificate by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin chứng chỉ cá nhân'
      });
    }
  }

  // Assign certificate to user(s)
  static async assignCertificate(req, res) {
    try {
      // CRITICAL LOGGING: Log request body in detail
      console.log('🔍 ========== CONTROLLER: ASSIGN CERTIFICATE ==========');
      console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));
      console.log('📥 req.body.userIds:', req.body.userIds);
      console.log('📥 req.body.userIds type:', typeof req.body.userIds);
      console.log('📥 req.body.userIds is array?', Array.isArray(req.body.userIds));
      console.log('📥 req.body.userIds length:', req.body.userIds ? (Array.isArray(req.body.userIds) ? req.body.userIds.length : 1) : 0);
      console.log('📥 req.body.certificateInfo:', req.body.certificateInfo);
      console.log('🔍 ===================================================');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const tenantId = req.user?.tenant_id;
      const assignedBy = req.user.id;
      
      console.log('🔍 Controller calling service with:', {
        userIds: req.body.userIds,
        userIdsCount: Array.isArray(req.body.userIds) ? req.body.userIds.length : 1,
        assignedBy,
        tenantId
      });

      const result = await userCertificateService.assignCertificate(
        req.body,
        assignedBy,
        tenantId
      );

      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error assigning certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi ghi nhận chứng chỉ cá nhân',
        error: error.message
      });
    }
  }

  // Update user certificate
  static async updateUserCertificate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const tenantId = req.user?.tenant_id;

      const result = await userCertificateService.updateUserCertificate(
        id,
        req.body,
        tenantId
      );

      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error updating user certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật chứng chỉ cá nhân',
        error: error.message
      });
    }
  }

  // Delete user certificate (unassign)
  static async deleteUserCertificate(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id;

      const result = await userCertificateService.deleteUserCertificate(id, tenantId);

      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting user certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa chứng chỉ cá nhân'
      });
    }
  }

  // Get users by department for assignment
  static async getUsersByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const tenantId = req.user?.tenant_id;
      const userId = req.user?._id || req.user?.id;

      console.log('🔍 Controller: getUsersByDepartment', {
        departmentId,
        tenantId,
        userId,
        userRole: req.user?.role?.role_code || req.user?.role_id
      });

      const result = await userCertificateService.getUsersByDepartment(departmentId, tenantId);

      console.log('📦 Service result:', {
        statusCode: result.statusCode,
        message: result.message,
        dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
        dataType: typeof result.data
      });

      res.status(result.statusCode).json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('❌ Error getting users by department:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách người dùng',
        error: error.message
      });
    }
  }
}

module.exports = UserCertificateController;

