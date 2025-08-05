const User = require('../models/user');

class UserRepository {
  // Create new user
  static async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id, populate = []) {
    try {
      let query = User.findById(id);
      
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Find user by username or email
  static async findByUsernameOrEmail(identifier, populate = []) {
    try {
      let query = User.findByUsernameOrEmail(identifier);
      
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username, populate = []) {
    try {
      let query = User.findOne({ username });
      
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email, populate = []) {
    try {
      let query = User.findOne({ email });
      
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Update user by ID
  static async updateById(id, updateData) {
    try {
      return await User.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete user by ID (soft delete)
  static async deleteById(id) {
    try {
      return await User.findByIdAndUpdate(
        id, 
        { is_active: false }, 
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Hard delete user by ID
  static async hardDeleteById(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Get users with pagination and filters
  static async findWithPagination(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role_id,
        department_id,
        is_active,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      // Build filter object
      const filter = {};
      
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } }
        ];
      }

      if (role_id) {
        filter.role_id = role_id;
      }

      if (department_id) {
        filter.department_id = department_id;
      }

      if (typeof is_active === 'boolean') {
        filter.is_active = is_active;
      }

      // Build sort object
      const sort = {};
      sort[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [users, total] = await Promise.all([
        User.find(filter)
          .populate('role_id')
          .populate('department_id')
          .populate('position_id')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        User.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async findAll(populate = []) {
    try {
      let query = User.find({ is_active: true });
      
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Check if username exists
  static async usernameExists(username, excludeId = null) {
    try {
      const filter = { username };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      const user = await User.findOne(filter);
      return !!user;
    } catch (error) {
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    try {
      const filter = { email };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      const user = await User.findOne(filter);
      return !!user;
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { last_login: new Date() },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Count users by role
  static async countByRole(role_id) {
    try {
      return await User.countDocuments({ role_id, is_active: true });
    } catch (error) {
      throw error;
    }
  }

  // Count users by department
  static async countByDepartment(department_id) {
    try {
      return await User.countDocuments({ department_id, is_active: true });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserRepository;