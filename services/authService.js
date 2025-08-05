const UserRepository = require('../repository/UserRepository');
const RoleRepository = require('../repository/RoleRepository');
const JWTConfig = require('../config/jwt');
const HashUtils = require('../utils/hash');

class AuthService {
  // User registration
  static async register(userData) {
    try {
      // Check if username already exists
      const existingUsername = await UserRepository.usernameExists(userData.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      // Check if email already exists
      const existingEmail = await UserRepository.emailExists(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      // Verify role exists and is active
      const role = await RoleRepository.findById(userData.role_id);
      if (!role || !role.is_active) {
        throw new Error('Invalid or inactive role');
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

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role_id.role_name,
          is_active: user.is_active,
          created_at: user.created_at
        },
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // User login
  static async login(identifier, password) {
    try {
      const user = await UserRepository.findByUsernameOrEmail(identifier, ['role_id']);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      if (!user.role_id || !user.role_id.is_active) {
        throw new Error('Invalid or inactive role');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role_id.role_name
      };
      const tokens = JWTConfig.generateTokens(tokenPayload);

      await UserRepository.updateLastLogin(user._id);

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role_id.role_name,
          is_active: user.is_active,
          last_login: new Date()
        },
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout
  static async logout(userId) {
    try {
      // Just returning success for now
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Refresh token
  static async refreshToken(refreshToken) {
    try {
      const decoded = JWTConfig.verifyRefreshToken(refreshToken);
      const user = await UserRepository.findById(decoded.userId, ['role_id']);

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      if (!user.role_id || !user.role_id.is_active) {
        throw new Error('Invalid or inactive role');
      }

      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role_id.role_name
      };
      const tokens = JWTConfig.generateTokens(tokenPayload);

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role_id.role_name
        },
        tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      const password_hash = await HashUtils.hashPassword(newPassword);
      await UserRepository.updateById(userId, { password_hash });

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get profile
  static async getProfile(userId) {
    try {
      const user = await UserRepository.findById(userId, ['role_id', 'department_id', 'position_id']);
      if (!user) {
        throw new Error('User not found');
      }

      return {
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
      };
    } catch (error) {
      throw error;
    }
  }

  // Update profile
  static async updateProfile(userId, updateData) {
    try {
      // Check if username already exists (excluding self)
      if (updateData.username) {
        const usernameExists = await UserRepository.usernameExists(updateData.username, userId);
        if (usernameExists) {
          throw new Error('Username already exists');
        }
      }

      // Check if email already exists (excluding self)
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email, userId);
        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      const updatedUser = await UserRepository.updateById(userId, updateData);
      if (!updatedUser) {
        throw new Error('User not found');
      }

      await updatedUser.populate(['role_id', 'department_id', 'position_id']);

      return {
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
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthService;
