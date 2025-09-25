const Department = require('../models/department');
const mongoose = require('mongoose');

class DepartmentRepository {
  static async create(departmentData) {
    const department = new Department(departmentData);
    return await department.save();
  }

  static async findById(id) {
    return await Department.findById(id)
      .populate('manager_id', 'username full_name email');
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      is_active,
      manager_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = options;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { department_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof is_active === 'boolean') {
      filter.is_active = is_active;
    }

    if (manager_id) {
      filter.manager_id = manager_id;
    }

    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortObj = { [sort_by]: sortOrder };

    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .populate('manager_id', 'username full_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Department.countDocuments(filter)
    ]);

    return {
      departments,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    };
  }

  static async updateById(id, updateData) {
    return await Department.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    )
      .populate('manager_id', 'username full_name email');
  }

  static async deleteById(id) {
    return await Department.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true }
    );
  }

  static async hardDeleteById(id) {
    const department = await Department.findById(id);
    if (department) {
      return await department.deleteOne();
    }
    return null;
  }

  static async exists(id) {
    const count = await Department.countDocuments({ _id: id, is_active: true });
    return count > 0;
  }

  static async existsByName(name, excludeId = null) {
    const filter = { 
      department_name: { $regex: new RegExp(`^${name}$`, 'i') },
      is_active: true 
    };
    
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    
    const count = await Department.countDocuments(filter);
    return count > 0;
  }

  static async getStats() {
    const [
      total,
      active,
      inactive,
      withManager,
      withoutManager
    ] = await Promise.all([
      Department.countDocuments({}),
      Department.countDocuments({ is_active: true }),
      Department.countDocuments({ is_active: false }),
      Department.countDocuments({ manager_id: { $ne: null }, is_active: true }),
      Department.countDocuments({ manager_id: null, is_active: true })
    ]);

    return {
      total,
      active,
      inactive,
      with_manager: withManager,
      without_manager: withoutManager
    };
  }

  static async bulkCreate(departmentsData) {
    return await Department.insertMany(departmentsData, { runValidators: true });
  }

  static async bulkUpdate(updates) {
    const bulkOps = updates.map(({ id, data }) => ({
      updateOne: {
        filter: { _id: id },
        update: { ...data, updated_at: new Date() }
      }
    }));

    return await Department.bulkWrite(bulkOps);
  }

  static async bulkDelete(ids) {
    return await Department.updateMany(
      { _id: { $in: ids } },
      { is_active: false, updated_at: new Date() }
    );
  }

  static async getAllActive() {
    return await Department.find({ is_active: true })
      .populate('manager_id', 'username full_name email')
      .sort({ department_name: 1 });
  }

  static async searchDepartments(searchTerm, limit = 20) {
    const filter = {
      is_active: true,
      $or: [
        { department_name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await Department.find(filter)
      .populate('manager_id', 'username full_name email')
      .limit(limit)
      .sort({ department_name: 1 });
  }
}

module.exports = DepartmentRepository;