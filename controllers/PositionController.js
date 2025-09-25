const PositionRepository = require('../repository/PositionRepository');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class PositionController {
  static getAllPositions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      is_active: req.query.is_active,
      level: req.query.level,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await PositionRepository.findAll(options);

    return ApiResponse.success(res, result, 'Positions retrieved successfully');
  });

  static getPositionById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const position = await PositionRepository.findById(id);
    
    if (!position) {
      return ApiResponse.notFound(res, 'Position not found');
    }

    return ApiResponse.success(res, position, 'Position retrieved successfully');
  });

  static createPosition = ErrorMiddleware.asyncHandler(async (req, res) => {
    const positionData = req.body;

    const nameExists = await PositionRepository.existsByName(positionData.position_name);
    if (nameExists) {
      return ApiResponse.error(res, 'Position name already exists', 409);
    }

    const position = await PositionRepository.create(positionData);

    return ApiResponse.success(res, position, 'Position created successfully', 201);
  });

  static updatePosition = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingPosition = await PositionRepository.findById(id);
    if (!existingPosition) {
      return ApiResponse.notFound(res, 'Position not found');
    }

    if (updateData.position_name) {
      const nameExists = await PositionRepository.existsByName(
        updateData.position_name,
        id
      );
      if (nameExists) {
        return ApiResponse.error(res, 'Position name already exists', 409);
      }
    }

    const position = await PositionRepository.updateById(id, updateData);

    return ApiResponse.success(res, position, 'Position updated successfully');
  });

  static deletePosition = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const position = await PositionRepository.findById(id);
    if (!position) {
      return ApiResponse.notFound(res, 'Position not found');
    }

    if (position.employees_count && position.employees_count > 0) {
      return ApiResponse.error(res, 
        `Cannot delete position with ${position.employees_count} active employees`, 
        400
      );
    }

    await PositionRepository.deleteById(id);

    return ApiResponse.success(res, null, 'Position deleted successfully');
  });


  static getPositionsByLevel = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { minLevel = 1, maxLevel = 10 } = req.query;
    
    const positions = await PositionRepository.findByLevelRange(
      parseInt(minLevel), 
      parseInt(maxLevel)
    );

    return ApiResponse.success(res, positions, 'Positions retrieved successfully');
  });

  static getPositionsGroupedByLevel = ErrorMiddleware.asyncHandler(async (req, res) => {
    const positionsByLevel = await PositionRepository.getPositionsByLevel();

    return ApiResponse.success(res, positionsByLevel, 'Positions grouped by level retrieved successfully');
  });

  static getPositionStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const stats = await PositionRepository.getStats();

    return ApiResponse.success(res, stats, 'Position statistics retrieved successfully');
  });

  static getManagementPositions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { minLevel = 7 } = req.query;
    
    const positions = await PositionRepository.getManagementPositions(parseInt(minLevel));

    return ApiResponse.success(res, positions, 'Management positions retrieved successfully');
  });

  static bulkDeletePositions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;

    const existingPositions = await Promise.all(
      ids.map(id => PositionRepository.findById(id))
    );

    const notFoundIds = [];
    const hasEmployees = [];

    for (let i = 0; i < existingPositions.length; i++) {
      if (!existingPositions[i]) {
        notFoundIds.push(ids[i]);
      } else if (existingPositions[i].employees_count && existingPositions[i].employees_count > 0) {
        hasEmployees.push({
          id: ids[i],
          name: existingPositions[i].position_name,
          count: existingPositions[i].employees_count
        });
      }
    }

    if (notFoundIds.length > 0) {
      return ApiResponse.error(res, 
        `Positions not found: ${notFoundIds.join(', ')}`, 
        404
      );
    }

    if (hasEmployees.length > 0) {
      const errorMessage = hasEmployees
        .map(pos => `${pos.name} (${pos.count} employees)`)
        .join(', ');
      
      return ApiResponse.error(res, 
        `Cannot delete positions with active employees: ${errorMessage}`, 
        400
      );
    }

    const result = await PositionRepository.bulkDelete(ids);

    return ApiResponse.success(res, 
      { affected_count: result.modifiedCount }, 
      `${result.modifiedCount} positions deleted successfully`
    );
  });

  static getPositionOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const positions = await PositionRepository.getActivePositions();

    const options = positions.map(pos => ({
      id: pos._id,
      name: pos.position_name,
      level: pos.level
    }));

    return ApiResponse.success(res, options, 'Position options retrieved successfully');
  });

  static searchPositions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const {
      search = '',
      levels = [],
      is_active = true,
      has_employees = null,
      sort_by = 'position_name',
      sort_order = 'asc',
      limit = 50
    } = req.query;

    const levelArray = levels ? 
      (Array.isArray(levels) ? levels : [levels]).map(l => parseInt(l)) : 
      [];

    const options = {
      search,
      levels: levelArray,
      is_active: is_active === 'true',
      has_employees: has_employees === 'true' ? true : has_employees === 'false' ? false : null,
      sort_by,
      sort_order,
      limit: parseInt(limit)
    };

    const positions = await PositionRepository.advancedSearch(options);

    return ApiResponse.success(res, 
      {
        positions,
        total: positions.length
      }, 
      'Position search completed successfully'
    );
  });

  static getPositionHierarchy = ErrorMiddleware.asyncHandler(async (req, res) => {
    const hierarchy = await PositionRepository.getHierarchySuggestions();

    return ApiResponse.success(res, hierarchy, 'Position hierarchy retrieved successfully');
  });
  static getPromotionOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { currentLevel } = req.query;
    
    if (!currentLevel) {
      return ApiResponse.error(res, 'Current level is required', 400);
    }

    const level = parseInt(currentLevel);
    const promotionPositions = await PositionRepository.findByLevelRange(level + 1, level + 1);
    const demotionPositions = level > 1 ? 
      await PositionRepository.findByLevelRange(level - 1, level - 1) : 
      [];

    const result = {
      promotion: promotionPositions.map(pos => ({
        id: pos._id,
        name: pos.position_name,
        level: pos.level
      })),
      demotion: demotionPositions.map(pos => ({
        id: pos._id,
        name: pos.position_name,
        level: pos.level
      })),
      current_level: level
    };

    return ApiResponse.success(res, result, 'Promotion/demotion options retrieved successfully');
  });

  static getPositionsByMultipleLevels = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { levels } = req.body;
    
    if (!levels || !Array.isArray(levels) || levels.length === 0) {
      return ApiResponse.error(res, 'Levels array is required', 400);
    }

    const levelNumbers = levels.map(l => parseInt(l)).filter(l => l >= 1 && l <= 10);
    
    if (levelNumbers.length === 0) {
      return ApiResponse.error(res, 'Valid levels (1-10) are required', 400);
    }

    const positions = await PositionRepository.advancedSearch({
      levels: levelNumbers,
      is_active: true,
      sort_by: 'level',
      sort_order: 'asc',
      limit: 0
    });
    const positionsByLevel = {};
    positions.forEach(pos => {
      if (!positionsByLevel[pos.level]) {
        positionsByLevel[pos.level] = [];
      }
      positionsByLevel[pos.level].push({
        id: pos._id,
        name: pos.position_name,
        description: pos.description,
        employees_count: pos.employees_count
      });
    });

    return ApiResponse.success(res, positionsByLevel, 'Positions by levels retrieved successfully');
  });
  static clonePosition = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { position_name, level } = req.body;

    const originalPosition = await PositionRepository.findById(id);
    if (!originalPosition) {
      return ApiResponse.notFound(res, 'Position not found');
    }

    const nameExists = await PositionRepository.existsByName(position_name);
    if (nameExists) {
      return ApiResponse.error(res, 'Position name already exists', 409);
    }

    const newPositionData = {
      position_name,
      description: originalPosition.description,
      level: level || originalPosition.level,
      is_active: true
    };

    const newPosition = await PositionRepository.create(newPositionData);

    return ApiResponse.success(res, newPosition, 'Position cloned successfully', 201);
  });
}

module.exports = PositionController;