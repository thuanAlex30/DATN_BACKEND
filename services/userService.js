const UserRepository = require('../repository/UserRepository');
const RoleRepository = require('../repository/RoleRepository');
const DepartmentRepository = require('../repository/DepartmentRepository');
const PositionRepository = require('../repository/PositionRepository');
const HashUtils = require('../utils/hash');
const XLSX = require('xlsx');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class UserService {
  // Create new user
  static async createUser(userData) {
    try {
      // Check if username already exists
      const existingUsername = await UserRepository.usernameExists(userData.username);
      if (existingUsername) {
        return createResponse(400, 'Username already exists');
      }

      // Check if email already exists
      const existingEmail = await UserRepository.emailExists(userData.email);
      if (existingEmail) {
        return createResponse(400, 'Email already exists');
      }

      // Verify role exists and is active
      const role = await RoleRepository.findById(userData.role_id);
      if (!role || !role.is_active) {
        return createResponse(400, 'Invalid or inactive role');
      }

      // Hash password
      const password_hash = await HashUtils.hashPassword(userData.password);
      
      // Create user data
      const userCreateData = {
        ...userData,
        password_hash
      };
      delete userCreateData.password;

      // Create user
      const user = await UserRepository.create(userCreateData);
      
      // Populate related data
      await user.populate(['role_id', 'department_id', 'position_id']);

      return createResponse(201, 'Tạo người dùng thành công', {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        birth_date: user.birth_date,
        address: user.address,
        role: user.role_id,
        department: user.department_id,
        position: user.position_id,
        is_active: user.is_active,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return createResponse(500, 'Lỗi khi tạo người dùng', null, error.message);
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const user = await UserRepository.findById(id, ['role_id', 'department_id', 'position_id']);
      
      if (!user) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      return createResponse(200, 'Lấy thông tin người dùng thành công', {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        birth_date: user.birth_date,
        address: user.address,
        role: user.role_id,
        department: user.department_id,
        position: user.position_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin người dùng', null, error.message);
    }
  }

  // Update user
  static async updateUser(id, updateData) {
    try {
      // Check if username exists (excluding current user)
      if (updateData.username) {
        const usernameExists = await UserRepository.usernameExists(updateData.username, id);
        if (usernameExists) {
          return createResponse(400, 'Username already exists');
        }
      }

      // Check if email exists (excluding current user)
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email, id);
        if (emailExists) {
          return createResponse(400, 'Email already exists');
        }
      }

      // If role is being updated, verify it exists and is active
      if (updateData.role_id) {
        const role = await RoleRepository.findById(updateData.role_id);
        if (!role || !role.is_active) {
          return createResponse(400, 'Invalid or inactive role');
        }
      }

      // Update user
      const updatedUser = await UserRepository.updateById(id, updateData);
      
      if (!updatedUser) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      // Populate related data
      await updatedUser.populate(['role_id', 'department_id', 'position_id']);

      return createResponse(200, 'Cập nhật người dùng thành công', {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        birth_date: updatedUser.birth_date,
        address: updatedUser.address,
        role: updatedUser.role_id,
        department: updatedUser.department_id,
        position: updatedUser.position_id,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return createResponse(500, 'Lỗi khi cập nhật người dùng', null, error.message);
    }
  }

  // Delete user (soft delete)
  static async deleteUser(id) {
    try {
      const deletedUser = await UserRepository.deleteById(id);
      
      if (!deletedUser) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      return createResponse(200, 'Người dùng đã được vô hiệu hóa thành công');
    } catch (error) {
      console.error('Error deleting user:', error);
      return createResponse(500, 'Lỗi khi xóa người dùng', null, error.message);
    }
  }

  // Get users with pagination and filters
  static async getUsers(options = {}) {
    try {
      const result = await UserRepository.findAll(options);
      
      return createResponse(200, 'Lấy danh sách người dùng thành công', {
        users: result.users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role_id,
          department: user.department_id,
          position: user.position_id,
          is_active: user.is_active,
          last_login: user.last_login,
          created_at: user.created_at
        })),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách người dùng', null, error.message);
    }
  }

  // Get all active users
  static async getAllUsers() {
    try {
      const result = await UserRepository.findAll({ 
        limit: 1000,
        is_active: true // Only get active users
      });
      
      // Check if result has users array
      if (!result || !result.users || !Array.isArray(result.users)) {
        return result.users || [];
      }
      
      return result.users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role_id,
        department: user.department_id,
        position: user.position_id,
        is_active: user.is_active,
        created_at: user.created_at
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Reset user password
  static async resetPassword(id, newPassword) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      // Hash new password
      const password_hash = await HashUtils.hashPassword(newPassword);

      // Update password
      await UserRepository.updateById(id, { password_hash });

      return createResponse(200, 'Đặt lại mật khẩu thành công');
    } catch (error) {
      console.error('Error resetting password:', error);
      return createResponse(500, 'Lỗi khi đặt lại mật khẩu', null, error.message);
    }
  }

  // Activate/Deactivate user
  static async toggleUserStatus(id) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        return createResponse(404, 'Không tìm thấy người dùng');
      }

      const updatedUser = await UserRepository.updateById(id, { is_active: !user.is_active });

      return createResponse(200, `Người dùng đã được ${updatedUser.is_active ? 'kích hoạt' : 'vô hiệu hóa'} thành công`, {
        id: updatedUser._id,
        username: updatedUser.username,
        is_active: updatedUser.is_active
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      return createResponse(500, 'Lỗi khi thay đổi trạng thái người dùng', null, error.message);
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const [totalResult, activeResult, inactiveResult] = await Promise.all([
        UserRepository.findAll({ limit: 10000 }), // Get all users without pagination
        UserRepository.findAll({ limit: 10000, is_active: true }),
        UserRepository.findAll({ limit: 10000, is_active: false })
      ]);

      return createResponse(200, 'Lấy thống kê người dùng thành công', {
        total: totalResult.users ? totalResult.users.length : 0,
        active: activeResult.users ? activeResult.users.length : 0,
        inactive: inactiveResult.users ? inactiveResult.users.length : 0
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê người dùng', null, error.message);
    }
  }

  // Import users from Excel
  static async importUsersFromExcel(file) {
    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        return createResponse(400, 'Excel file is empty or invalid');
      }

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      // Get all roles, departments, and positions for validation
      const roles = await RoleRepository.findAll();
      const departmentsResult = await DepartmentRepository.findAll({ limit: 1000 }); // Get all departments
      const positionsResult = await PositionRepository.findAll({ limit: 1000 }); // Get all positions

      // Extract arrays from paginated results
      const departments = departmentsResult.departments || [];
      const positions = positionsResult.positions || [];

      // Create lookup maps
      const roleMap = new Map(roles.map(role => [role.role_name.toLowerCase(), role._id]));
      const departmentMap = new Map(departments.map(dept => [dept.department_name.toLowerCase(), dept._id]));
      const positionMap = new Map(positions.map(pos => [pos.position_name.toLowerCase(), pos._id]));

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

        try {
          // Validate required fields
          const requiredFields = ['username', 'email', 'full_name', 'password'];
          const missingFields = requiredFields.filter(field => !row[field]);
          
          if (missingFields.length > 0) {
            results.errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`
            });
            continue;
          }

          // Check if username already exists
          const existingUsername = await UserRepository.usernameExists(row.username);
          if (existingUsername) {
            results.errors.push({
              row: rowNumber,
              error: `Username '${row.username}' already exists`
            });
            continue;
          }

          // Check if email already exists
          const existingEmail = await UserRepository.emailExists(row.email);
          if (existingEmail) {
            results.errors.push({
              row: rowNumber,
              error: `Email '${row.email}' already exists`
            });
            continue;
          }

          // Validate department_name (if provided)
          let departmentId = null;
          if (row.department_name) {
            departmentId = departmentMap.get(row.department_name.toLowerCase());
            if (!departmentId) {
              results.errors.push({
                row: rowNumber,
                error: `Invalid department_name '${row.department_name}'`
              });
              continue;
            }
          }

          // Validate position_name (if provided)
          let positionId = null;
          let roleId = null;
          if (row.position_name) {
            positionId = positionMap.get(row.position_name.toLowerCase());
            if (!positionId) {
              results.errors.push({
                row: rowNumber,
                error: `Invalid position_name '${row.position_name}'`
              });
              continue;
            }
            
            // Auto-assign role based on position
            const position = positions.find(pos => pos._id.toString() === positionId.toString());
            if (position) {
              if (position.position_name.toLowerCase() === 'manager') {
                roleId = roleMap.get('leader');
              } else {
                roleId = roleMap.get('employee');
              }
            }
          } else {
            // Default to employee role if no position specified
            roleId = roleMap.get('employee');
          }

          // Prepare user data
          const userData = {
            username: row.username.trim(),
            email: row.email.trim(),
            full_name: row.full_name.trim(),
            phone: row.phone ? row.phone.trim() : '',
            birth_date: row.birth_date ? new Date(row.birth_date) : null,
            address: row.address ? row.address.trim() : '',
            role_id: roleId,
            department_id: departmentId,
            position_id: positionId,
            password: row.password || 'Password123', // Default password
            is_active: row.is_active !== undefined ? Boolean(row.is_active) : true
          };

          // Hash password
          const password_hash = await HashUtils.hashPassword(userData.password);
          userData.password_hash = password_hash;
          delete userData.password;

          // Create user
          const user = await UserRepository.create(userData);
          await user.populate(['role_id', 'department_id', 'position_id']);

          results.success.push({
            row: rowNumber,
            username: user.username,
            email: user.email,
            full_name: user.full_name
          });

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error occurred'
          });
        }
      }

      return createResponse(200, 'Import người dùng thành công', results);
    } catch (error) {
      console.error('Error importing users:', error);
      return createResponse(500, 'Lỗi khi import người dùng', null, error.message);
    }
  }
}

module.exports = UserService;