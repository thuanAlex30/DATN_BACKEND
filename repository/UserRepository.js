const User = require('../models/user');

class UserRepository {
  // Find user by ID with full population
  static async findById(id, populate = []) {
    try {
      let query;
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        // Search by user_id (integer)
        query = User.findOne({ user_id: parseInt(id) });
      } else {
        // Search by MongoDB _id
        query = User.findById(id);
      }
      if (populate.length > 0) {
        populate.forEach(field => {
          if (field === 'role_id') {
            query = query.populate('role_id', 'role_name role_code role_level scope_rules permissions is_active');
          } else if (field === 'department_id') {
            query = query.populate('department_id', 'department_name is_active');
          } else {
            query = query.populate(field);
          }
        });
      } else {
        // Default population
        query = query
          .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
          .populate('department_id', 'department_name is_active');
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Find users by user_id array (for bulk lookup)
  static async findByUserIds(userIds, populate = []) {
    try {
      // Filter out invalid values and convert to numbers
      const validUserIds = userIds
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          return isNaN(numId) ? null : numId;
        })
        .filter(id => id !== null);

      if (validUserIds.length === 0) {
        return [];
      }

      let query = User.find({ user_id: { $in: validUserIds } });
      
      if (populate.length > 0) {
        populate.forEach(field => {
          if (field === 'role_id') {
            query = query.populate('role_id', 'role_name role_code role_level scope_rules permissions is_active');
          } else if (field === 'department_id') {
            query = query.populate('department_id', 'department_name is_active');
          } else {
            query = query.populate(field);
          }
        });
      } else {
        // Default population
        query = query
          .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
          .populate('department_id', 'department_name is_active');
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }

  // Find all users with pagination and advanced filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role_id,
        department_id,
        is_active,
        sort_by = 'created_at',
        sort_order = 'desc',
        // ⭐ Thêm tenant_id để filter theo tenant
        tenant_id
      } = options;

      const filter = {};
      
      // Chỉ lấy user trong cùng tenant nếu có tenant_id
      if (tenant_id) {
        filter.tenant_id = tenant_id;
      }

      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } }
        ];
      }

      if (role_id) filter.role_id = role_id;
      if (department_id) filter.department_id = department_id;
      if (typeof is_active === 'boolean') filter.is_active = is_active;

      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
          .populate('department_id', 'department_name is_active')
          .populate('tenant_id', 'name tenant_name')
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
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
          hasPrevPage: page > 1,
          // Alternative format for compatibility
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      
      // Return populated user
      return await this.findById(savedUser._id);
    } catch (error) {
      throw error;
    }
  }

  // Update user by ID
  static async updateById(id, updateData) {
    try {
       // Check if id is a number (user_id) or ObjectId string
       let query;
       if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
         // Update by user_id (integer)
         query = User.findOneAndUpdate(
           { user_id: parseInt(id) },
           { ...updateData, updated_at: new Date() },
           { new: true, runValidators: true }
         );
       } else {
         // Update by MongoDB _id
         query = User.findByIdAndUpdate(
           id,
           { ...updateData, updated_at: new Date() },
           { new: true, runValidators: true }
         );
       }
       
       return await query
        .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
        .populate('department_id', 'department_name is_active')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  // Find user by username or email
  static async findByUsernameOrEmail(identifier, populate = []) {
    try {
      let query = User.findOne({
        $or: [
          { username: identifier },
          { email: identifier.toLowerCase() }
        ]
      });
      
      if (populate.length > 0) {
        populate.forEach(field => {
          if (field === 'role_id') {
            query = query.populate('role_id', 'role_name role_code role_level scope_rules permissions is_active');
          } else {
            query = query.populate(field);
          }
        });
      } else {
        query = query.populate('role_id', 'role_name role_code role_level scope_rules permissions is_active');
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
      let query = User.findOne({ email: email.toLowerCase() });
      
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

  // Find users by department
  static async findByDepartment(departmentId, options = {}) {
    try {
      const { is_active = true, sort_by = 'full_name', sort_order = 'asc' } = options;
      
      const filter = { department_id: departmentId };
      if (typeof is_active === 'boolean') filter.is_active = is_active;

      console.log('UserRepository.findByDepartment - filter:', filter);
      console.log('UserRepository.findByDepartment - departmentId:', departmentId);

      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      const result = await User.find(filter)
        .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
        .sort(sortObj)
        .exec();
      
      console.log('UserRepository.findByDepartment - result count:', result.length);
      return result;
    } catch (error) {
      console.error('UserRepository.findByDepartment - error:', error);
      throw error;
    }
  }

  // Find users by role
  static async findByRole(roleId, options = {}) {
    try {
      const { is_active = true, sort_by = 'full_name', sort_order = 'asc' } = options;
      
      const filter = { role_id: roleId };
      if (typeof is_active === 'boolean') filter.is_active = is_active;

      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      return await User.find(filter)
        .populate('department_id', 'department_name is_active')
        .sort(sortObj)
        .exec();
    } catch (error) {
      throw error;
    }
  }

  // Find potential managers (users who can be department managers)
  static async findPotentialManagers(excludeIds = []) {
    try {
      const filter = { is_active: true };

      if (excludeIds.length > 0) {
        filter._id = { $nin: excludeIds };
      }

      const users = await User.find(filter)
        .populate('role_id', 'role_name role_code role_level scope_rules permissions')
        .sort({ full_name: 1 })
        .exec();

      // Filter users with management permissions
      return users.filter(user => {
        const hasManagementRole = user.role_id && 
          (user.role_id.role_name === 'admin' || user.role_id.role_name === 'manager');
        
        return hasManagementRole;
      });
    } catch (error) {
      throw error;
    }
  }

  // Get all users (simplified)
  static async findAllActive(populate = []) {
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

  // Get user statistics
  static async getStats() {
    try {
      const [
        total,
        active,
        inactive,
        byRole,
        byDepartment
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ is_active: true }),
        User.countDocuments({ is_active: false }),
        User.aggregate([
          {
            $lookup: {
              from: 'roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role'
            }
          },
          { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$role.role_name',
              count: { $sum: 1 }
            }
          }
        ]),
        User.aggregate([
          {
            $lookup: {
              from: 'departments',
              localField: 'department_id',
              foreignField: '_id',
              as: 'department'
            }
          },
          { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$department.department_name',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        total,
        active,
        inactive,
        by_role: byRole,
        by_department: byDepartment
      };
    } catch (error) {
      throw error;
    }
  }

  // Existence checks
  static async exists(id) {
    try {
      const count = await User.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  static async existsByUsername(username, excludeId = null) {
    try {
      const filter = { username };
      if (excludeId) filter._id = { $ne: excludeId };
      
      const count = await User.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  static async existsByEmail(email, excludeId = null) {
    try {
      const filter = { email: email.toLowerCase() };
      if (excludeId) filter._id = { $ne: excludeId };
      
      const count = await User.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Legacy method names for compatibility
  static async usernameExists(username, excludeId = null) {
    return await this.existsByUsername(username, excludeId);
  }

  static async emailExists(email, excludeId = null) {
    return await this.existsByEmail(email, excludeId);
  }

  // Count methods
  static async countByRole(role_id, options = {}) {
    try {
      const filter = { role_id, is_active: true };
      if (options.tenant_id) {
        filter.tenant_id = options.tenant_id;
      }
      return await User.countDocuments(filter);
    } catch (error) {
      throw error;
    }
  }

  static async countByDepartment(department_id) {
    try {
      return await User.countDocuments({ department_id, is_active: true });
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      // Check if id is a number (user_id) or ObjectId string
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        // Update by user_id (integer)
        return await User.findOneAndUpdate(
          { user_id: parseInt(id) },
          { last_login: new Date() },
          { new: true }
        );
      } else {
        // Update by MongoDB _id
        return await User.findByIdAndUpdate(
          id,
          { last_login: new Date() },
          { new: true }
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Delete operations
  static async deleteById(id) {
    try {
      // Check if id is a number (user_id) or ObjectId string
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        // Update by user_id (integer)
        return await User.findOneAndUpdate(
          { user_id: parseInt(id) },
          { is_active: false, updated_at: new Date() },
          { new: true }
        );
      } else {
        // Update by MongoDB _id
        return await User.findByIdAndUpdate(
          id,
          { is_active: false, updated_at: new Date() },
          { new: true }
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Hard delete (use with caution)
  static async hardDeleteById(id) {
    try {
      // Check if id is a number (user_id) or ObjectId string
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        // Delete by user_id (integer)
        return await User.findOneAndDelete({ user_id: parseInt(id) });
      } else {
        // Delete by MongoDB _id
        return await User.findByIdAndDelete(id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  static async bulkUpdate(updates) {
    try {
      const bulkOps = updates.map(({ id, data }) => ({
        updateOne: {
          filter: { _id: id },
          update: { ...data, updated_at: new Date() }
        }
      }));

      return await User.bulkWrite(bulkOps);
    } catch (error) {
      throw error;
    }
  }

  static async bulkDelete(ids) {
    try {
      return await User.updateMany(
        { _id: { $in: ids } },
        { is_active: false, updated_at: new Date() }
      );
    } catch (error) {
      throw error;
    }
  }

  // Advanced search with multiple filters
  static async advancedSearch(options = {}) {
    try {
      const {
        search = '',
        roles = [],
        departments = [],
        is_active,
        has_login,
        sort_by = 'full_name',
        sort_order = 'asc',
        limit = 50
      } = options;

      const filter = {};

      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } }
        ];
      }

      if (roles.length > 0) filter.role_id = { $in: roles };
      if (departments.length > 0) filter.department_id = { $in: departments };
      if (typeof is_active === 'boolean') filter.is_active = is_active;
      if (typeof has_login === 'boolean') {
        filter.last_login = has_login ? { $exists: true, $ne: null } : { $exists: false };
      }

      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      return await User.find(filter)
        .populate('role_id', 'role_name role_code role_level scope_rules permissions is_active')
        .populate('department_id', 'department_name is_active')
        .sort(sortObj)
        .limit(limit)
        .exec();
    } catch (error) {
      throw error;
    }
  }

  // Get user options for dropdowns
  static async getUserOptions(filters = {}) {
    try {
      const { is_active = true, role_id, department_id } = filters;
      
      const filter = { is_active };
      if (role_id) filter.role_id = role_id;
      if (department_id) filter.department_id = department_id;

      const users = await User.find(filter)
        .select('_id username full_name email')
        .sort({ full_name: 1 })
        .exec();

      return users.map(user => ({
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserRepository;