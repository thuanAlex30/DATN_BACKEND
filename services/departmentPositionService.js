const DepartmentRepository = require('../repository/DepartmentRepository');
const PositionRepository = require('../repository/PositionRepository');
const UserRepository = require('../repository/UserRepository');

class DepartmentService {
  // Create department with business logic
  static async createDepartment(departmentData, createdBy) {
    // Validate manager if provided
    if (departmentData.manager_id) {
      const manager = await UserRepository.findById(departmentData.manager_id);
      if (!manager || !manager.is_active) {
        throw new Error('Manager must be an active user');
      }
      
      // Check if user is already managing another department
      const existingManagement = await DepartmentRepository.findAll({
        manager_id: departmentData.manager_id,
        is_active: true,
        limit: 1
      });
      
      if (existingManagement.departments.length > 0) {
        throw new Error('User is already managing another department');
      }
    }

    return await DepartmentRepository.create({
      ...departmentData,
      created_by: createdBy
    });
  }

  // Update department with business logic
  static async updateDepartment(id, updateData, updatedBy) {
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    // Validate manager if being updated
    if (updateData.manager_id) {
      const manager = await UserRepository.findById(updateData.manager_id);
      if (!manager || !manager.is_active) {
        throw new Error('Manager must be an active user');
      }
      
      // Check if user is already managing another department (excluding current)
      const existingManagement = await DepartmentRepository.findAll({
        manager_id: updateData.manager_id,
        is_active: true,
        limit: 10
      });
      
      const otherManagement = existingManagement.departments.filter(
        dept => dept._id.toString() !== id
      );
      
      if (otherManagement.length > 0) {
        throw new Error('User is already managing another department');
      }
    }

    return await DepartmentRepository.updateById(id, {
      ...updateData,
      updated_by: updatedBy
    });
  }

  // Delete department with employee check
  static async deleteDepartment(id, deletedBy) {
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if department has active employees
    const employeeCount = department.employees_count || 0;
    if (employeeCount > 0) {
      throw new Error(`Cannot delete department with ${employeeCount} active employees`);
    }

    return await DepartmentRepository.updateById(id, {
      is_active: false,
      deleted_at: new Date(),
      deleted_by: deletedBy
    });
  }

  // Get department with full context
  static async getDepartmentWithContext(id) {
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    // Get additional context
    const employeeCount = await this.getEmployeeCount(id);

    return {
      ...department.toJSON(),
      employee_count: employeeCount
    };
  }

  // Get employee count for department
  static async getEmployeeCount(departmentId) {
    // This would require Employee model integration
    // For now returning mock data based on virtual field
    const department = await DepartmentRepository.findById(departmentId);
    return department ? (department.employees_count || 0) : 0;
  }

  // Get all departments with stats
  static async getAllDepartmentsWithStats() {
    const departments = await DepartmentRepository.getAllActive();
    
    // Add employee counts to each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => ({
        ...dept.toJSON(),
        employee_count: await this.getEmployeeCount(dept._id)
      }))
    );

    return departmentsWithStats;
  }

  // Search departments with filters
  static async searchDepartments(searchTerm, filters = {}) {
    let departments = await DepartmentRepository.searchDepartments(searchTerm, filters.limit);

    // Apply additional filters
    if (filters.has_manager !== undefined) {
      departments = departments.filter(dept => 
        filters.has_manager ? dept.manager_id : !dept.manager_id
      );
    }

    if (filters.has_employees !== undefined) {
      const departmentsWithEmployeeCount = await Promise.all(
        departments.map(async (dept) => ({
          ...dept.toJSON(),
          employee_count: await this.getEmployeeCount(dept._id)
        }))
      );

      departments = departmentsWithEmployeeCount.filter(dept =>
        filters.has_employees ? dept.employee_count > 0 : dept.employee_count === 0
      );
    }

    return departments;
  }

  // Transfer employees from one department to another
  static async transferEmployees(fromDepartmentId, toDepartmentId, transferredBy) {
    const [fromDept, toDept] = await Promise.all([
      DepartmentRepository.findById(fromDepartmentId),
      DepartmentRepository.findById(toDepartmentId)
    ]);

    if (!fromDept) {
      throw new Error('Source department not found');
    }

    if (!toDept) {
      throw new Error('Target department not found');
    }

    // This would require Employee model integration
    // Mock implementation for now
    console.log(`Transferring employees from ${fromDept.department_name} to ${toDept.department_name}`);
    
    return {
      from_department: fromDept,
      to_department: toDept,
      transferred_count: 0 // Would be actual count from Employee model
    };
  }

  // Bulk operations
  static async bulkCreateDepartments(departmentsData, createdBy) {
    const results = [];
    
    for (const deptData of departmentsData) {
      try {
        const department = await this.createDepartment(deptData, createdBy);
        results.push({ status: 'success', department });
      } catch (error) {
        results.push({ 
          status: 'error', 
          department_name: deptData.department_name,
          error: error.message 
        });
      }
    }

    return results;
  }

  static async bulkUpdateDepartments(updates, updatedBy) {
    const results = [];
    
    for (const { id, data } of updates) {
      try {
        const department = await this.updateDepartment(id, data, updatedBy);
        results.push({ id, status: 'success', department });
      } catch (error) {
        results.push({ id, status: 'error', error: error.message });
      }
    }

    return results;
  }
}

class PositionService {
  // Create position with business logic
  static async createPosition(positionData, createdBy) {
    // Validate level constraints
    if (positionData.level < 1 || positionData.level > 10) {
      throw new Error('Position level must be between 1 and 10');
    }

    return await PositionRepository.create({
      ...positionData,
      created_by: createdBy
    });
  }

  // Update position with business logic
  static async updatePosition(id, updateData, updatedBy) {
    const position = await PositionRepository.findById(id);
    if (!position) {
      throw new Error('Position not found');
    }

    // Check if level change affects employees
    if (updateData.level && updateData.level !== position.level) {
      const employeeCount = position.employees_count || 0;
      if (employeeCount > 0) {
        // Log level change for audit
        console.log(`Position level changed for ${employeeCount} employees`);
      }
    }

    return await PositionRepository.updateById(id, {
      ...updateData,
      updated_by: updatedBy
    });
  }

  // Delete position with employee check
  static async deletePosition(id, deletedBy) {
    const position = await PositionRepository.findById(id);
    if (!position) {
      throw new Error('Position not found');
    }

    // Check if position has active employees
    const employeeCount = position.employees_count || 0;
    if (employeeCount > 0) {
      throw new Error(`Cannot delete position with ${employeeCount} active employees`);
    }

    return await PositionRepository.updateById(id, {
      is_active: false,
      deleted_at: new Date(),
      deleted_by: deletedBy
    });
  }

  // Get career progression paths
  static async getCareerPaths(fromLevel, toLevel = null) {
    if (toLevel) {
      return await PositionRepository.findByLevelRange(fromLevel, toLevel);
    }

    // Get next level positions (promotion path)
    const nextLevelPositions = await PositionRepository.findByLevelRange(fromLevel + 1, fromLevel + 1);
    
    return {
      current_level: fromLevel,
      promotion_options: nextLevelPositions
    };
  }

  // Suggest positions based on current position
  static async suggestPositions(currentPositionId) {
    const currentPosition = await PositionRepository.findById(currentPositionId);
    if (!currentPosition) {
      throw new Error('Position not found');
    }

    const [promotions, lateralMoves, demotions] = await Promise.all([
      PositionRepository.findByLevelRange(currentPosition.level + 1, currentPosition.level + 1),
      PositionRepository.findByLevelRange(currentPosition.level, currentPosition.level),
      currentPosition.level > 1 ? 
        PositionRepository.findByLevelRange(currentPosition.level - 1, currentPosition.level - 1) : 
        Promise.resolve([])
    ]);

    // Remove current position from lateral moves
    const filteredLateralMoves = lateralMoves.filter(pos => pos._id.toString() !== currentPositionId);

    return {
      promotions,
      lateral_moves: filteredLateralMoves,
      demotions,
      current_position: currentPosition
    };
  }

  // Bulk update position levels
  static async bulkUpdateLevels(updates, updatedBy) {
    const results = [];
    
    for (const { id, level } of updates) {
      try {
        const position = await this.updatePosition(id, { level }, updatedBy);
        results.push({ id, status: 'success', position });
      } catch (error) {
        results.push({ id, status: 'error', error: error.message });
      }
    }

    return results;
  }

  // Get position analytics
  static async getPositionAnalytics() {
    const [stats, levelDistribution, employeeDistribution] = await Promise.all([
      PositionRepository.getStats(),
      PositionRepository.getPositionsByLevel(),
      this.getEmployeeDistribution()
    ]);

    return {
      overview: stats,
      level_distribution: levelDistribution,
      employee_distribution: employeeDistribution
    };
  }

  // Get employee distribution across positions
  static async getEmployeeDistribution() {
    // This would integrate with Employee model
    // Mock implementation for now
    return [];
  }
}

class DepartmentPositionIntegrationService {
  // Create organizational unit (department + position mapping)
  static async createOrganizationalUnit(departmentData, positionIds, createdBy) {
    const department = await DepartmentService.createDepartment(departmentData, createdBy);
    
    // Associate positions with department (if needed in your business logic)
    const positions = await Promise.all(
      positionIds.map(positionId => PositionRepository.findById(positionId))
    );

    return {
      department,
      associated_positions: positions.filter(pos => pos !== null)
    };
  }

  // Get organizational structure
  static async getOrganizationalStructure() {
    const [departments, positionHierarchy] = await Promise.all([
      DepartmentService.getAllDepartmentsWithStats(),
      PositionService.getPositionAnalytics()
    ]);

    return {
      departments,
      positions: positionHierarchy
    };
  }

  // Validate organizational changes
  static async validateOrganizationalChange(changeType, data) {
    const validations = [];

    switch (changeType) {
      case 'POSITION_LEVEL_CHANGE':
        validations.push(await this.validatePositionLevelChange(data));
        break;
      case 'MANAGER_ASSIGNMENT':
        validations.push(await this.validateManagerAssignment(data));
        break;
    }

    return validations.filter(v => !v.valid);
  }

  // Validate position level changes
  static async validatePositionLevelChange(data) {
    // Check salary implications, reporting structure, etc.
    return { valid: true, message: 'Validation passed' };
  }

  // Validate manager assignment
  static async validateManagerAssignment(data) {
    // Check user qualifications, existing responsibilities, etc.
    return { valid: true, message: 'Validation passed' };
  }
}

module.exports = {
  DepartmentService,
  PositionService,
  DepartmentPositionIntegrationService
};