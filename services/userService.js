const UserRepository = require('../repository/UserRepository');
const RoleRepository = require('../repository/RoleRepository');
const DepartmentRepository = require('../repository/DepartmentRepository');
const PositionRepository = require('../repository/PositionRepository');
const HashUtils = require('../utils/hash');
const XLSX = require('xlsx');

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
      const result = await UserRepository.findAll(options);
      
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
      const result = await UserRepository.findAll({ 
        limit: 1000,
        is_active: true // Only get active users
      });
      
      // Check if result has users array
      if (!result || !result.users || !Array.isArray(result.users)) {
        return [];
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
      const [totalResult, activeResult, inactiveResult] = await Promise.all([
        UserRepository.findAll({ limit: 10000 }), // Get all users without pagination
        UserRepository.findAll({ limit: 10000, is_active: true }),
        UserRepository.findAll({ limit: 10000, is_active: false })
      ]);

      return {
        total: totalResult.users ? totalResult.users.length : 0,
        active: activeResult.users ? activeResult.users.length : 0,
        inactive: inactiveResult.users ? inactiveResult.users.length : 0
      };
    } catch (error) {
      throw error;
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
        throw new Error('Excel file is empty or invalid');
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

      return results;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;