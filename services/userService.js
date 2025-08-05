const UserRepository = require('../repository/UserRepository');
const RoleRepository = require('../repository/RoleRepository');
const HashUtils = require('../utils/hash');

class UserService {
  // Create new user
  static async createUser(userData) {
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
        created_at: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const user = await UserRepository.findById(id, ['role_id', 'department_id', 'position_id']);
      
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

  // Update user
  static async updateUser(id, updateData) {
    try {
      // Check if username exists (excluding current user)
      if (updateData.username) {
        const usernameExists = await UserRepository.usernameExists(updateData.username, id);
        if (usernameExists) {
          throw new Error('Username already exists');
        }
      }

      // Check if email exists (excluding current user)
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email, id);
        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      // If role is being updated, verify it exists and is active
      if (updateData.role_id) {
        const role = await RoleRepository.findById(updateData.role_id);
        if (!role || !role.is_active) {
          throw new Error('Invalid or inactive role');
        }
      }

      // Update user
      const updatedUser = await UserRepository.updateById(id, updateData);
      
      if (!updatedUser) {
        throw new Error('User not found');
      }

      // Populate related data
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

  // Delete user (soft delete)
  static async deleteUser(id) {
    try {
      const deletedUser = await UserRepository.deleteById(id);
      
      if (!deletedUser) {
        throw new Error('User not found');
      }

      return { message: 'User deactivated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get users with pagination and filters
  static async getUsers(options = {}) {
    try {
      const result = await UserRepository.findWithPagination(options);
      
      return {
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
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all active users
  static async getAllUsers() {
    try {
      const users = await UserRepository.findAll(['role_id', 'department_id', 'position_id']);
      
      return users.map(user => ({
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
      throw error;
    }
  }

  // Reset user password
  static async resetPassword(id, newPassword) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const password_hash = await HashUtils.hashPassword(newPassword);

      // Update password
      await UserRepository.updateById(id, { password_hash });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Activate/Deactivate user
  static async toggleUserStatus(id) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await UserRepository.updateById(id, { is_active: !user.is_active });

      return {
        id: updatedUser._id,
        username: updatedUser.username,
        is_active: updatedUser.is_active,
        message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
        UserRepository.findAll(),
        UserRepository.findAll().then(users => users.filter(u => u.is_active)),
        UserRepository.findAll().then(users => users.filter(u => !u.is_active))
      ]);

      return {
        total: totalUsers.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;