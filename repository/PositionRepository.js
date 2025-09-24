const Position = require('../models/position');

class PositionRepository {
  // Create new position
  static async create(positionData) {
    const position = new Position(positionData);
    return await position.save();
  }

  static async findById(id) {
    return await Position.findById(id)
      .populate('employees_count');
  }
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      is_active,
      level,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = options;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { position_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof is_active === 'boolean') {
      filter.is_active = is_active;
    }

    if (level) {
      filter.level = level;
    }

    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortObj = { [sort_by]: sortOrder };

    const skip = (page - 1) * limit;

    const [positions, total] = await Promise.all([
      Position.find(filter)
        .populate('employees_count')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Position.countDocuments(filter)
    ]);

    return {
      positions,
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
    return await Position.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    );
  }

  static async deleteById(id) {
    return await Position.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true }
    );
  }

  static async hardDeleteById(id) {
    const position = await Position.findById(id);
    if (position) {
      return await position.deleteOne();
    }
    return null;
  }

  static async findByLevelRange(minLevel = 1, maxLevel = 10) {
    return await Position.find({
      level: { $gte: minLevel, $lte: maxLevel },
      is_active: true
    })
      .populate('employees_count')
      .sort({ level: 1, position_name: 1 });
  }

  static async getPositionsByLevel() {
    return await Position.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$level',
          positions: {
            $push: {
              id: '$_id',
              position_name: '$position_name',
              description: '$description',
              created_at: '$created_at'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  static async exists(id) {
    const count = await Position.countDocuments({ _id: id, is_active: true });
    return count > 0;
  }

  static async existsByName(name, excludeId = null) {
    const filter = { 
      position_name: { $regex: new RegExp(`^${name}$`, 'i') },
      is_active: true 
    };
    
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    
    const count = await Position.countDocuments(filter);
    return count > 0;
  }

  static async getActivePositions() {
    return await Position.find({ is_active: true })
      .select('position_name level')
      .sort({ level: 1, position_name: 1 });
  }

  static async getStats() {
    const [
      total,
      active,
      inactive,
      byLevel
    ] = await Promise.all([
      Position.countDocuments({}),
      Position.countDocuments({ is_active: true }),
      Position.countDocuments({ is_active: false }),
      Position.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    return {
      total,
      active,
      inactive,
      by_level: byLevel
    };
  }

  static async getManagementPositions(minLevel = 7) {
    return await Position.find({
      level: { $gte: minLevel },
      is_active: true
    })
      .populate('employees_count')
      .sort({ level: -1, position_name: 1 });
  }

  static async advancedSearch(options = {}) {
    const {
      search = '',
      levels = [],
      is_active = true,
      has_employees = null,
      sort_by = 'position_name',
      sort_order = 'asc',
      limit = 50
    } = options;

    const pipeline = [];
    const matchStage = { is_active };
    
    if (search) {
      matchStage.$or = [
        { position_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (levels.length > 0) {
      matchStage.level = { $in: levels };
    }

    pipeline.push({ $match: matchStage });

    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: 'position_id',
        as: 'employees'
      }
    });

    pipeline.push({
      $addFields: {
        employees_count: { $size: '$employees' }
      }
    });

    if (has_employees !== null) {
      if (has_employees) {
        pipeline.push({ $match: { employees_count: { $gt: 0 } } });
      } else {
        pipeline.push({ $match: { employees_count: 0 } });
      }
    }

    const sortOrder = sort_order === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sort_by]: sortOrder } });

    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    pipeline.push({
      $project: {
        position_name: 1,
        description: 1,
        level: 1,
        is_active: 1,
        employees_count: 1,
        created_at: 1,
        updated_at: 1
      }
    });

    return await Position.aggregate(pipeline);
  }

  // Bulk operations
  static async bulkCreate(positionsData) {
    return await Position.insertMany(positionsData, { runValidators: true });
  }

  static async bulkUpdate(updates) {
    const bulkOps = updates.map(({ id, data }) => ({
      updateOne: {
        filter: { _id: id },
        update: { ...data, updated_at: new Date() }
      }
    }));

    return await Position.bulkWrite(bulkOps);
  }

  static async bulkDelete(ids) {
    return await Position.updateMany(
      { _id: { $in: ids } },
      { is_active: false, updated_at: new Date() }
    );
  }

  // Get position hierarchy suggestions based on level
  static async getHierarchySuggestions() {
    return await Position.find({ is_active: true })
      .select('position_name level')
      .sort({ level: 1 })
      .then(positions => {
        const hierarchy = {};
        positions.forEach(pos => {
          if (!hierarchy[pos.level]) {
            hierarchy[pos.level] = [];
          }
          hierarchy[pos.level].push({
            id: pos._id,
            name: pos.position_name
          });
        });
        return hierarchy;
      });
  }
}

module.exports = PositionRepository;