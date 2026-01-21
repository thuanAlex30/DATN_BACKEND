const userCertificateRepository = require('../repository/UserCertificateRepository');
const certificateRepository = require('../repository/CertificateRepository');
const User = require('../models/user');
const mongoose = require('mongoose');
const { createResponse } = require('../utils/response');

class UserCertificateService {
  // Get all user certificates with filters
  async getAllUserCertificates(filters = {}, options = {}, tenantId = null) {
    try {
      // Apply tenant filter
      if (tenantId) {
        filters.tenant_id = tenantId;
      }

      const result = await userCertificateRepository.getAll(filters, options);
      
      return createResponse(200, 'Lấy danh sách chứng chỉ cá nhân thành công', result);
    } catch (error) {
      console.error('Error getting all user certificates:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách chứng chỉ cá nhân', null, error.message);
    }
  }

  // Get user certificates by department
  async getByDepartment(departmentId, filters = {}, options = {}, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return createResponse(400, 'ID phòng ban không hợp lệ');
      }

      // Apply tenant filter
      if (tenantId) {
        filters.tenant_id = tenantId;
      }

      const result = await userCertificateRepository.getByDepartment(departmentId, filters, options);
      
      return createResponse(200, 'Lấy danh sách chứng chỉ theo phòng ban thành công', result);
    } catch (error) {
      console.error('Error getting user certificates by department:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách chứng chỉ theo phòng ban', null, error.message);
    }
  }

  // Assign certificate to user(s) - Personal certificates are independent
  async assignCertificate(assignmentData, assignedBy, tenantId = null) {
    try {
      const { userIds, certificateInfo } = assignmentData;
      
      // CRITICAL LOGGING: Log exactly what we received
      console.log('🔍 ========== ASSIGN CERTIFICATE REQUEST ==========');
      console.log('🔍 Received assignmentData:', JSON.stringify(assignmentData, null, 2));
      console.log('🔍 userIds type:', typeof userIds);
      console.log('🔍 userIds is array?', Array.isArray(userIds));
      console.log('🔍 userIds length:', userIds ? (Array.isArray(userIds) ? userIds.length : 1) : 0);
      console.log('🔍 userIds value:', userIds);
      console.log('🔍 certificateInfo:', certificateInfo);
      console.log('🔍 assignedBy:', assignedBy);
      console.log('🔍 tenantId:', tenantId);
      console.log('🔍 ================================================');

      // Validate certificate info is provided
      if (!certificateInfo || !certificateInfo.certificateName) {
        return createResponse(400, 'Thông tin chứng chỉ không đầy đủ. Vui lòng nhập tên chứng chỉ');
      }

      if (!certificateInfo.issuingAuthority) {
        return createResponse(400, 'Vui lòng nhập cơ quan cấp chứng chỉ');
      }

      // Validate users exist
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return createResponse(400, 'Danh sách người dùng không hợp lệ');
      }

      // Validate all user IDs are valid ObjectIds
      const invalidUserIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidUserIds.length > 0) {
        return createResponse(400, 'Một số ID người dùng không hợp lệ');
      }

      // Get users with tenant validation (similar to incident pattern)
      // First, get the user who is assigning (assignedBy) to get their department
      const assigner = await User.findById(assignedBy)
        .populate('department_id', 'department_name')
        .select('_id full_name email department_id tenant_id')
        .lean();
      
      if (!assigner) {
        return createResponse(404, 'Không tìm thấy thông tin người assign');
      }

      // Get assigner's department ID
      const assignerDepartmentId = assigner.department_id?._id || assigner.department_id;
      
      // Build user query with tenant and department validation
      const userQuery = { _id: { $in: userIds } };
      if (tenantId) {
        userQuery.tenant_id = tenantId;
      }
      // Only allow assigning to users in the same department as assigner
      if (assignerDepartmentId) {
        userQuery.department_id = assignerDepartmentId;
      }
      
      const users = await User.find(userQuery)
        .populate('role_id', 'role_name role_code role_level')
        .populate('department_id', 'department_name')
        .select('_id full_name email department_id role_id tenant_id')
        .lean();

      // Validate all users were found
      if (users.length !== userIds.length) {
        const foundUserIds = users.map(u => u._id.toString());
        const missingUserIds = userIds.filter(id => !foundUserIds.includes(id.toString()));
        
        let errorMessage = `Một số người dùng không tồn tại hoặc không thuộc tenant/phòng ban của bạn`;
        if (tenantId) {
          errorMessage += ` (tenant: ${tenantId})`;
        }
        if (assignerDepartmentId) {
          errorMessage += ` (phòng ban: ${assignerDepartmentId})`;
        }
        errorMessage += `. User IDs không hợp lệ: ${missingUserIds.join(', ')}`;
        
        return createResponse(400, errorMessage);
      }

      // Additional tenant validation (double check)
      if (tenantId) {
        const invalidUsers = users.filter(u => 
          !u.tenant_id || u.tenant_id.toString() !== tenantId.toString()
        );
        if (invalidUsers.length > 0) {
          return createResponse(403, 'Một số người dùng không thuộc tenant này');
        }
      }

      // Validate all users are in the same department as assigner
      if (assignerDepartmentId) {
        const invalidDepartmentUsers = users.filter(u => {
          const userDeptId = u.department_id?._id || u.department_id;
          return !userDeptId || userDeptId.toString() !== assignerDepartmentId.toString();
        });
        if (invalidDepartmentUsers.length > 0) {
          const invalidNames = invalidDepartmentUsers.map(u => u.full_name).join(', ');
          return createResponse(403, `Một số người dùng không thuộc phòng ban của bạn: ${invalidNames}`);
        }
      }

      // Validate users are managers or employees only
      const invalidRoleUsers = users.filter(user => {
        if (!user.role_id) return true;
        
        const roleCode = user.role_id?.role_code?.toLowerCase() || '';
        const roleName = user.role_id?.role_name?.toLowerCase() || '';
        const roleLevel = user.role_id?.role_level || 0;

        // Check if manager (including department manager, but excluding department_header)
        const isManager = roleLevel === 70 || 
                         roleCode === 'manager' || 
                         roleCode.includes('manager') ||
                         (roleName === 'manager' || (roleName.includes('manager') && !roleName.includes('department header')));
        
        const isEmployee = roleLevel === 60 || 
                          roleCode === 'employee' || 
                          roleName === 'employee';
        
        const isDepartmentHeader = roleLevel >= 80 || 
                                  roleCode === 'department_header' || 
                                  roleCode === 'header_department' ||
                                  roleCode === 'header' ||
                                  roleName === 'department header' ||
                                  roleName === 'department_header' ||
                                  roleName === 'header department' ||
                                  roleName === 'header';

        return !(isManager || isEmployee) || isDepartmentHeader;
      });

      if (invalidRoleUsers.length > 0) {
        const invalidNames = invalidRoleUsers.map(u => u.full_name).join(', ');
        return createResponse(400, `Chỉ có thể assign cho manager và employee. Các user sau không hợp lệ: ${invalidNames}`);
      }

      const assignedCertificates = [];
      const errors = [];

      // Assign certificate to each user
      // IMPORTANT: Create a separate object for each user to avoid shared references
      for (const userId of userIds) {
        try {
          const user = users.find(u => u._id.toString() === userId.toString());
          if (!user) {
            console.error(`❌ User not found: ${userId}`);
            errors.push({
              userId,
              message: 'Không tìm thấy thông tin người dùng'
            });
            continue;
          }

          // CRITICAL: Create a completely new object for each user
          // This ensures each certificate is independent and won't be affected by operations on others
          const userCertificateData = {
            tenant_id: tenantId || (user.tenant_id ? user.tenant_id.toString() : null),
            // certificate_id is optional now - personal certificates are independent
            certificate_id: null,
            user_id: userId.toString(), // Ensure it's a string/ObjectId, not a reference
            assignedBy: assignedBy ? assignedBy.toString() : null,
            assignedAt: new Date(), // Each certificate gets its own timestamp
            assignmentType: 'PERSONAL',
            status: certificateInfo.status || 'ACTIVE',
            verified: false,
            // Personal certificate information - create new strings/objects for each
            certificateName: String(certificateInfo.certificateName || ''),
            certificateCode: certificateInfo.certificateCode ? String(certificateInfo.certificateCode) : '',
            description: certificateInfo.description ? String(certificateInfo.description) : '',
            category: certificateInfo.category || 'OTHER',
            issuingAuthority: String(certificateInfo.issuingAuthority || ''),
            certificateNumber: certificateInfo.certificateNumber ? String(certificateInfo.certificateNumber) : '',
            issueDate: certificateInfo.issueDate ? new Date(certificateInfo.issueDate) : null,
            expiryDate: certificateInfo.expiryDate ? new Date(certificateInfo.expiryDate) : null,
            level: certificateInfo.level ? String(certificateInfo.level) : '',
            duration: certificateInfo.duration ? Number(certificateInfo.duration) : null,
            // Ensure each certificate has its own timestamps
            createdAt: new Date(),
            updatedAt: new Date()
          };

          console.log(`📝 Creating INDEPENDENT certificate for user ${user.full_name} (${userId}):`, {
            certificateName: userCertificateData.certificateName,
            user_id: userCertificateData.user_id,
            issueDate: userCertificateData.issueDate,
            expiryDate: userCertificateData.expiryDate,
            createdAt: userCertificateData.createdAt
          });

          // Create user certificate - each one là một document độc lập trong database.
          // Nếu có lỗi ghi DB, repository sẽ throw; không cần tự ném lỗi bổ sung ở đây.
          const userCertificate = await userCertificateRepository.create(userCertificateData);
          
          // Verify the certificate was created with correct user_id
          if (userCertificate && userCertificate.user_id) {
            const createdUserId = userCertificate.user_id._id || userCertificate.user_id.id || userCertificate.user_id;
            if (createdUserId.toString() !== userId.toString()) {
              console.error(`❌ ERROR: Certificate created with wrong user_id! Expected: ${userId}, Got: ${createdUserId}`);
              throw new Error(`Certificate created with incorrect user_id`);
            }
          }
          
          // Log certificate details to verify independence
          console.log(`✅ Created INDEPENDENT certificate:`, {
            certificateId: userCertificate._id || userCertificate.id,
            userId: userId,
            userName: user.full_name,
            certificateName: userCertificate.certificateName,
            createdAt: userCertificate.createdAt || userCertificateData.createdAt,
            hasUniqueId: !!userCertificate._id
          });
          
          assignedCertificates.push(userCertificate);
          
          // Final verification: ensure this certificate has a unique _id
          const certificateId = userCertificate._id || userCertificate.id;
          const existingIds = assignedCertificates
            .filter(c => c._id || c.id)
            .map(c => (c._id || c.id).toString());
          const duplicateCount = existingIds.filter(id => id === certificateId.toString()).length;
          
          if (duplicateCount > 1) {
            console.error(`❌ CRITICAL ERROR: Duplicate certificate ID detected! ID: ${certificateId}`);
            throw new Error(`Duplicate certificate ID: ${certificateId}`);
          }
          
          console.log(`✅ Successfully created INDEPENDENT certificate for user ${user.full_name} (Certificate ID: ${certificateId}, User ID: ${userId})`);
        } catch (error) {
          console.error(`❌ Error assigning certificate to user ${userId}:`, error);
          const user = users.find(u => u._id.toString() === userId.toString());
          const userName = user ? user.full_name : userId;
          errors.push({
            userId,
            userName,
            message: error.message || 'Lỗi khi ghi nhận chứng chỉ cá nhân',
            error: error.toString()
          });
        }
      }

      if (assignedCertificates.length === 0) {
        const errorDetails = errors.map(e => 
          `${e.userName || e.userId}: ${e.message}`
        ).join('; ');
        return createResponse(400, `Không thể ghi nhận chứng chỉ cá nhân cho bất kỳ user nào. Chi tiết: ${errorDetails}`, { errors });
      }

      // FINAL VERIFICATION: Ensure all certificates have unique IDs
      const certificateIds = assignedCertificates
        .map(c => (c._id || c.id)?.toString())
        .filter(id => id);
      
      const uniqueIds = new Set(certificateIds);
      if (certificateIds.length !== uniqueIds.size) {
        console.error(`❌ CRITICAL ERROR: Duplicate certificate IDs detected!`);
        console.error(`Total certificates: ${certificateIds.length}, Unique IDs: ${uniqueIds.size}`);
        console.error(`Certificate IDs:`, certificateIds);
        return createResponse(500, 'Lỗi: Phát hiện trùng lặp ID chứng chỉ. Vui lòng thử lại.');
      }

      console.log(`✅ Successfully created ${assignedCertificates.length} INDEPENDENT certificates with unique IDs`);
      console.log(`✅ Certificate IDs:`, certificateIds);
      console.log(`✅ Each certificate is a separate document in the database`);

      return createResponse(
        201, 
        `Ghi nhận chứng chỉ cá nhân thành công cho ${assignedCertificates.length} người dùng`,
        {
          assigned: assignedCertificates,
          errors: errors.length > 0 ? errors : undefined
        }
      );
    } catch (error) {
      console.error('Error assigning certificate:', error);
      return createResponse(500, 'Lỗi khi ghi nhận chứng chỉ cá nhân', null, error.message);
    }
  }

  // Get user certificate by ID
  async getUserCertificateById(id, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ cá nhân không hợp lệ');
      }

      const userCertificate = await userCertificateRepository.getById(id);
      if (!userCertificate) {
        return createResponse(404, 'Không tìm thấy chứng chỉ cá nhân');
      }

      // Check tenant access
      if (tenantId && userCertificate.tenant_id && 
          userCertificate.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền truy cập chứng chỉ này');
      }

      return createResponse(200, 'Lấy thông tin chứng chỉ cá nhân thành công', userCertificate);
    } catch (error) {
      console.error('Error getting user certificate by ID:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin chứng chỉ cá nhân', null, error.message);
    }
  }

  // Update user certificate
  async updateUserCertificate(id, updateData, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ cá nhân không hợp lệ');
      }

      const existing = await userCertificateRepository.getById(id);
      if (!existing) {
        return createResponse(404, 'Không tìm thấy chứng chỉ cá nhân');
      }

      // Check tenant access
      if (tenantId && existing.tenant_id && 
          existing.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền cập nhật chứng chỉ này');
      }

      // Convert date strings to Date objects if present
      if (updateData.personalIssueDate) {
        updateData.personalIssueDate = new Date(updateData.personalIssueDate);
      }
      if (updateData.personalExpiryDate) {
        updateData.personalExpiryDate = new Date(updateData.personalExpiryDate);
      }

      const updated = await userCertificateRepository.updateById(id, updateData);
      
      return createResponse(200, 'Cập nhật chứng chỉ cá nhân thành công', updated);
    } catch (error) {
      console.error('Error updating user certificate:', error);
      return createResponse(500, 'Lỗi khi cập nhật chứng chỉ cá nhân', null, error.message);
    }
  }

  // Delete user certificate (unassign)
  async deleteUserCertificate(id, tenantId = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return createResponse(400, 'ID chứng chỉ cá nhân không hợp lệ');
      }

      const existing = await userCertificateRepository.getById(id);
      if (!existing) {
        return createResponse(404, 'Không tìm thấy chứng chỉ cá nhân');
      }

      // Check tenant access
      if (tenantId && existing.tenant_id && 
          existing.tenant_id.toString() !== tenantId.toString()) {
        return createResponse(403, 'Bạn không có quyền xóa chứng chỉ này');
      }

      const deleted = await userCertificateRepository.deleteById(id);
      if (!deleted) {
        return createResponse(500, 'Không thể xóa chứng chỉ cá nhân');
      }

      return createResponse(200, 'Xóa chứng chỉ cá nhân thành công');
    } catch (error) {
      console.error('Error deleting user certificate:', error);
      return createResponse(500, 'Lỗi khi xóa chứng chỉ cá nhân', null, error.message);
    }
  }

  // Get users by department for assignment
  async getUsersByDepartment(departmentId, tenantId = null) {
    try {
      console.log('🔍 Service: getUsersByDepartment', { departmentId, tenantId, departmentIdType: typeof departmentId });
      
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        console.error('❌ Invalid departmentId:', departmentId);
        return createResponse(400, 'ID phòng ban không hợp lệ');
      }

      // Convert to ObjectId for query
      const deptObjectId = new mongoose.Types.ObjectId(departmentId);
      const query = { department_id: deptObjectId };
      
      if (tenantId) {
        const tenantObjectId = mongoose.Types.ObjectId.isValid(tenantId) 
          ? new mongoose.Types.ObjectId(tenantId) 
          : tenantId;
        query.tenant_id = tenantObjectId;
      }

      console.log('🔍 Query:', JSON.stringify(query, null, 2));

      // Get users in department (managers and employees only, exclude department_header)
      const users = await User.find(query)
        .populate('role_id', 'role_name role_code role_level')
        .populate('department_id', 'department_name')
        .select('_id full_name email department_id role_id tenant_id')
        .lean();

      console.log(`🔍 Found ${users.length} total users in department ${departmentId} (tenant: ${tenantId || 'all'})`);
      
      // Log all users for debugging
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          _id: user._id,
          full_name: user.full_name,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_id?.role_name,
          role_code: user.role_id?.role_code,
          role_level: user.role_id?.role_level
        });
      });

      // Filter to only include managers and employees (exclude department_header)
      const filteredUsers = users.filter(user => {
        if (!user.role_id) {
          console.log(`❌ User ${user.full_name} has no role_id`);
          return false;
        }
        
        const roleCode = user.role_id?.role_code?.toLowerCase() || '';
        const roleName = user.role_id?.role_name?.toLowerCase() || '';
        const roleLevel = user.role_id?.role_level || 0;

        // Explicitly exclude department_header and any header roles
        const isDepartmentHeader = roleLevel >= 80 || 
                                  roleCode === 'department_header' || 
                                  roleCode === 'header_department' ||
                                  roleCode === 'header' ||
                                  roleName === 'department header' ||
                                  roleName === 'department_header' ||
                                  roleName === 'header department' ||
                                  roleName === 'header';
        
        if (isDepartmentHeader) {
          console.log(`❌ Filtered out department_header: ${user.full_name}`, {
            roleCode,
            roleName,
            roleLevel
          });
          return false;
        }

        // Include manager: role_level 70 OR role_code/role_name contains "manager" (but not "department manager")
        const isManager = roleLevel === 70 || 
                         (roleCode.includes('manager') && !roleCode.includes('department')) ||
                         (roleName.includes('manager') && !roleName.includes('department') && roleName !== 'department manager');
        
        // Include employee: role_level 60 OR role_code/role_name is "employee"
        const isEmployee = roleLevel === 60 || 
                          roleCode === 'employee' ||
                          roleName === 'employee';
        
        const isValid = isManager || isEmployee;
        
        if (!isValid) {
          console.log(`❌ Filtered out user (not manager/employee): ${user.full_name}`, {
            roleCode,
            roleName,
            roleLevel,
            isManager,
            isEmployee
          });
        }
        
        return isValid;
      });
      
      console.log(`✅ Found ${filteredUsers.length} managers/employees in department ${departmentId} (out of ${users.length} total users)`);

      return createResponse(200, 'Lấy danh sách người dùng theo phòng ban thành công', filteredUsers);
    } catch (error) {
      console.error('Error getting users by department:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách người dùng', null, error.message);
    }
  }
}

module.exports = new UserCertificateService();

