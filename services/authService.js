const UserRepository = require('../repository/UserRepository');
const RoleRepository = require('../repository/RoleRepository');
const JWTConfig = require('../config/jwt');
const HashUtils = require('../utils/hash');
const { transformDocumentId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class AuthService {
  // User registration
  static async register(userData) {
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

      // Prepare user creation data
      const userCreateData = {
        ...userData,
        password_hash
      };
      delete userCreateData.password;
      delete userCreateData.confirmPassword;

      // Create user
      const user = await UserRepository.create(userCreateData);

      // Populate role
      await user.populate('role_id');

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role_id.role_name
      };
      const tokens = JWTConfig.generateTokens(tokenPayload);

      // Update last login
      await UserRepository.updateLastLogin(user._id);

      return createResponse(201, 'Đăng ký thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: {
            _id: user.role_id._id,
            role_name: user.role_id.role_name,
            permissions: user.role_id.permissions || {}
          },
          is_active: user.is_active,
          created_at: user.created_at
        },
        tokens
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return createResponse(500, 'Lỗi khi đăng ký', null, error.message);
    }
  }

  // User login
  static async login(identifier, password) {
    try {
      const user = await UserRepository.findByUsernameOrEmail(identifier, ['role_id', 'department_id']);
      
      // Ensure role_id and department_id are fully populated
      if (user && user.role_id && typeof user.role_id === 'object' && !user.role_id.role_name) {
        await user.populate('role_id');
      }
      
      if (user && user.department_id && typeof user.department_id === 'object' && !user.department_id.department_name) {
        await user.populate('department_id');
      }
      
      // Debug logging for role and department structure
      if (user) {
        console.log('🔍 Backend login - User debug:', {
          role_id: user.role_id,
          role_name: user.role_id?.role_name,
          role_type: typeof user.role_id,
          role_keys: user.role_id ? Object.keys(user.role_id) : null,
          department_id: user.department_id,
          department_name: user.department_id?.department_name,
          department_type: typeof user.department_id,
          department_keys: user.department_id ? Object.keys(user.department_id) : null
        });
      }
      
      if (!user) {
        return createResponse(401, 'Thông tin đăng nhập không hợp lệ');
      }

      if (!user.is_active) {
        return createResponse(403, 'Tài khoản đã bị vô hiệu hóa');
      }

      if (!user.role_id || !user.role_id.is_active) {
        return createResponse(403, 'Vai trò không hợp lệ hoặc đã bị vô hiệu hóa');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return createResponse(401, 'Thông tin đăng nhập không hợp lệ');
      }

      // Get role name for token
      let roleName = null;
      if (user.role_id && typeof user.role_id === 'object' && user.role_id.role_name) {
        roleName = user.role_id.role_name;
      } else if (user.role_id) {
        const RoleRepository = require('../repository/RoleRepository');
        const roleData = await RoleRepository.findById(user.role_id);
        roleName = roleData ? roleData.role_name : null;
      }

      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: roleName
      };
      const tokens = JWTConfig.generateTokens(tokenPayload);

      await UserRepository.updateLastLogin(user._id);

      // Ensure role is populated
      let roleData = null;
      if (user.role_id && typeof user.role_id === 'object' && user.role_id.role_name) {
        // Role is already populated
        roleData = user.role_id;
      } else if (user.role_id) {
        // Role is not populated, fetch it
        const RoleRepository = require('../repository/RoleRepository');
        roleData = await RoleRepository.findById(user.role_id);
      }

      // Get department data
      let departmentData = null;
      if (user.department_id && typeof user.department_id === 'object' && user.department_id.department_name) {
        // Department is already populated
        departmentData = user.department_id;
      } else if (user.department_id) {
        // Department is not populated, fetch it
        const DepartmentRepository = require('../repository/DepartmentRepository');
        departmentData = await DepartmentRepository.findById(user.department_id);
      }

      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        tenant_id: user.tenant_id,
        role: roleData ? {
          _id: roleData._id,
          role_name: roleData.role_name,
          role_code: roleData.role_code || null,
          role_level: roleData.role_level || null,
          permissions: roleData.permissions || {},
          scope_rules: roleData.scope_rules || {}
        } : null,
        department: departmentData ? {
          id: departmentData._id,
          department_name: departmentData.department_name
        } : null,
        department_id: departmentData ? {
          id: departmentData._id,
          department_name: departmentData.department_name
        } : null,
        is_active: user.is_active,
        last_login: new Date()
      };
      
      console.log('🔍 Backend login - Final user response:', {
        role: userResponse.role,
        role_name: userResponse.role?.role_name,
        role_code: userResponse.role?.role_code,
        role_level: userResponse.role?.role_level,
        department: userResponse.department,
        department_id: userResponse.department_id,
        tenant_id: userResponse.tenant_id
      });
      
      return createResponse(200, 'Đăng nhập thành công', {
        user: userResponse,
        tokens
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      return createResponse(500, 'Lỗi khi đăng nhập', null, error.message);
    }
  }

  // Logout
  static async logout(userId) {
    try {
      // Just returning success for now
      return createResponse(200, 'Đăng xuất thành công');
    } catch (error) {
      console.error('Error logging out user:', error);
      return createResponse(500, 'Lỗi khi đăng xuất', null, error.message);
    }
  }

  // Refresh token
  static async refreshToken(refreshToken) {
    try {
      const decoded = JWTConfig.verifyRefreshToken(refreshToken);
      const user = await UserRepository.findById(decoded.userId, ['role_id']);

      if (!user || !user.is_active) {
        return createResponse(401, 'User not found or inactive');
      }

      if (!user.role_id || !user.role_id.is_active) {
        return createResponse(403, 'Invalid or inactive role');
      }

      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role_id.role_name
      };
      const tokens = JWTConfig.generateTokens(tokenPayload);

      return createResponse(200, 'Refresh token thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: {
            _id: user.role_id._id,
            role_name: user.role_id.role_name,
            permissions: user.role_id.permissions || {}
          }
        },
        tokens
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      return createResponse(401, 'Invalid refresh token');
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        return createResponse(404, 'User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return createResponse(400, 'Current password is incorrect');
      }

      const password_hash = await HashUtils.hashPassword(newPassword);
      await UserRepository.updateById(userId, { password_hash });

      return createResponse(200, 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      return createResponse(500, 'Lỗi khi đổi mật khẩu', null, error.message);
    }
  }

  // Get profile
  static async getProfile(userId) {
    try {
      const user = await UserRepository.findById(userId, ['role_id', 'department_id']);
      if (!user) {
        return createResponse(404, 'User not found');
      }

      // Populate role data
      let roleData = null;
      if (user.role_id) {
        const RoleRepository = require('../repository/RoleRepository');
        roleData = await RoleRepository.findById(user.role_id);
      }

      // Populate department data
      let departmentData = null;
      if (user.department_id) {
        const DepartmentRepository = require('../repository/DepartmentRepository');
        departmentData = await DepartmentRepository.findById(user.department_id);
      }

      return createResponse(200, 'Lấy thông tin profile thành công', {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        birth_date: user.birth_date,
        address: user.address,
        role: roleData ? {
          _id: roleData._id,
          role_name: roleData.role_name,
          description: roleData.description,
          permissions: roleData.permissions,
          is_active: roleData.is_active,
          created_at: roleData.created_at,
          updated_at: roleData.updated_at
        } : null,
        department: departmentData ? {
          id: departmentData._id,
          _id: departmentData._id,
          department_name: departmentData.department_name,
          name: departmentData.department_name,
          description: departmentData.description,
          is_active: departmentData.is_active,
          created_at: departmentData.created_at,
          updated_at: departmentData.updated_at
        } : null,
        department_id: user.department_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin profile', null, error.message);
    }
  }

  // Update profile
  static async updateProfile(userId, updateData) {
    try {
      // Check if username already exists (excluding self)
      if (updateData.username) {
        const usernameExists = await UserRepository.usernameExists(updateData.username, userId);
        if (usernameExists) {
          return createResponse(400, 'Username already exists');
        }
      }

      // Check if email already exists (excluding self)
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email, userId);
        if (emailExists) {
          return createResponse(400, 'Email already exists');
        }
      }

      const updatedUser = await UserRepository.updateById(userId, updateData);
      if (!updatedUser) {
        return createResponse(404, 'User not found');
      }

      await updatedUser.populate(['role_id', 'department_id']);

      return createResponse(200, 'Cập nhật profile thành công', {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        birth_date: updatedUser.birth_date,
        address: updatedUser.address,
        role: updatedUser.role_id,
        department: updatedUser.department_id,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return createResponse(500, 'Lỗi khi cập nhật profile', null, error.message);
    }
  }
}

module.exports = AuthService;