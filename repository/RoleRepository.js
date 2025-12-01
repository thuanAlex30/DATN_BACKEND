const Role = require('../models/role');

class RoleRepository {
  // Create new role
  static async create(roleData) {
    try {
      const role = new Role(roleData);
      return await role.save();
    } catch (error) {
      throw error;
    }
  }

  // Find role by ID
  static async findById(id) {
    try {
      return await Role.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Find role by name
  static async findByName(role_name) {
    try {
      return await Role.findOne({ role_name });
    } catch (error) {
      throw error;
    }
  }

  // Find role by code
  static async findByCode(role_code) {
    try {
      return await Role.findOne({ role_code });
    } catch (error) {
      throw error;
    }
  }

  // Update role by ID
  static async updateById(id, updateData) {
    try {
      return await Role.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete role by ID (soft delete)
  static async deleteById(id) {
    try {
      return await Role.findByIdAndUpdate(
        id, 
        { is_active: false }, 
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Hard delete role by ID
  static async hardDeleteById(id) {
    try {
      return await Role.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Get all active roles
  static async findAllActive() {
    try {
      return await Role.find({ is_active: true }).sort({ role_name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Get all roles
  static async findAll() {
    try {
      return await Role.find().sort({ role_name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Check if role name exists
  static async nameExists(role_name, excludeId = null) {
    try {
      const filter = { role_name };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      const role = await Role.findOne(filter);
      return !!role;
    } catch (error) {
      throw error;
    }
  }

  // Get roles with pagination
  static async findWithPagination(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        is_active,
        sort_by = 'role_name',
        sort_order = 'asc'
      } = options;

      // Build filter object
      const filter = {};
      
      if (search) {
        filter.$or = [
          { role_name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
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
      const [roles, total] = await Promise.all([
        Role.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Role.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        roles,
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
}

module.exports = RoleRepository;