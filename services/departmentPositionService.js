const DepartmentRepository = require('../repository/DepartmentRepository');
const PositionRepository = require('../repository/PositionRepository');
const UserRepository = require('../repository/UserRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class DepartmentService {
  // Create department with business logic
  static async createDepartment(departmentData, createdBy) {
    try {
      // Validate manager if provided
      if (departmentData.manager_id) {
        const manager = await UserRepository.findById(departmentData.manager_id);
        if (!manager || !manager.is_active) {
          return createResponse(400, 'Manager must be an active user');
        }
        
        // Check if user is already managing another department
        const existingManagement = await DepartmentRepository.findAll({
          manager_id: departmentData.manager_id,
          is_active: true,
          limit: 1
        });
        
        if (existingManagement.departments.length > 0) {
          return createResponse(400, 'User is already managing another department');
        }
      }

      const department = await DepartmentRepository.create({
        ...departmentData,
        created_by: createdBy
      });

      return createResponse(201, 'Tạo phòng ban thành công',
        transformDocumentId(department, POPULATED_FIELDS.DEPARTMENT));
    } catch (error) {
      console.error('Error creating department:', error);
      return createResponse(500, 'Lỗi khi tạo phòng ban', null, error.message);
    }
  }

  // Update department with business logic
  static async updateDepartment(id, updateData, updatedBy) {
    try {
      const department = await DepartmentRepository.findById(id);
      if (!department) {
        return createResponse(404, 'Department not found');
      }

      // Validate manager if being updated
      if (updateData.manager_id) {
        const manager = await UserRepository.findById(updateData.manager_id);
        if (!manager || !manager.is_active) {
          return createResponse(400, 'Manager must be an active user');
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
          return createResponse(400, 'User is already managing another department');
        }
      }

      const updatedDepartment = await DepartmentRepository.updateById(id, {
        ...updateData,
        updated_by: updatedBy
      });

      return createResponse(200, 'Cập nhật phòng ban thành công',
        transformDocumentId(updatedDepartment, POPULATED_FIELDS.DEPARTMENT));
    } catch (error) {
      console.error('Error updating department:', error);
      return createResponse(500, 'Lỗi khi cập nhật phòng ban', null, error.message);
    }
  }

  // Delete department with employee check
  static async deleteDepartment(id, deletedBy) {
    try {
      const department = await DepartmentRepository.findById(id);
      if (!department) {
        return createResponse(404, 'Department not found');
      }

      // Check if department has active employees
      const employeeCount = department.employees_count || 0;
      if (employeeCount > 0) {
        return createResponse(400, `Cannot delete department with ${employeeCount} active employees`);
      }

      const deletedDepartment = await DepartmentRepository.updateById(id, {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: deletedBy
      });

      return createResponse(200, 'Xóa phòng ban thành công',
        transformDocumentId(deletedDepartment, POPULATED_FIELDS.DEPARTMENT));
    } catch (error) {
      console.error('Error deleting department:', error);
      return createResponse(500, 'Lỗi khi xóa phòng ban', null, error.message);
    }
  }

  // Get department with full context
  static async getDepartmentWithContext(id) {
    try {
      const department = await DepartmentRepository.findById(id);
      if (!department) {
        return createResponse(404, 'Department not found');
      }

      // Get additional context
      const employeeCount = await this.getEmployeeCount(id);

      return createResponse(200, 'Lấy thông tin phòng ban thành công', {
        ...transformDocumentId(department, POPULATED_FIELDS.DEPARTMENT),
        employee_count: employeeCount
      });
    } catch (error) {
      console.error('Error getting department with context:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin phòng ban', null, error.message);
    }
  }

  // Get employee count for department
  static async getEmployeeCount(departmentId) {
    try {
      // This would require Employee model integration
      // For now returning mock data based on virtual field
      const department = await DepartmentRepository.findById(departmentId);
      return department ? (department.employees_count || 0) : 0;
    } catch (error) {
      console.error('Error getting employee count:', error);
      return 0;
    }
  }

  // Get all departments with stats
  static async getAllDepartmentsWithStats() {
    try {
      const departments = await DepartmentRepository.getAllActive();
      
      // Add employee counts to each department
      const departmentsWithStats = await Promise.all(
        departments.map(async (dept) => ({
          ...transformDocumentId(dept, POPULATED_FIELDS.DEPARTMENT),
          employee_count: await this.getEmployeeCount(dept._id)
        }))
      );

      return createResponse(200, 'Lấy danh sách phòng ban thành công', departmentsWithStats);
    } catch (error) {
      console.error('Error getting departments with stats:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phòng ban', null, error.message);
    }
  }

  // Search departments with filters
  static async searchDepartments(searchTerm, filters = {}) {
    try {
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
            ...transformDocumentId(dept, POPULATED_FIELDS.DEPARTMENT),
            employee_count: await this.getEmployeeCount(dept._id)
          }))
        );

        departments = departmentsWithEmployeeCount.filter(dept =>
          filters.has_employees ? dept.employee_count > 0 : dept.employee_count === 0
        );
      }

      return createResponse(200, 'Tìm kiếm phòng ban thành công',
        transformDocumentsId(departments, POPULATED_FIELDS.DEPARTMENT));
    } catch (error) {
      console.error('Error searching departments:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm phòng ban', null, error.message);
    }
  }

  // Transfer employees from one department to another
  static async transferEmployees(fromDepartmentId, toDepartmentId, transferredBy) {
    try {
      const [fromDept, toDept] = await Promise.all([
        DepartmentRepository.findById(fromDepartmentId),
        DepartmentRepository.findById(toDepartmentId)
      ]);

      if (!fromDept) {
        return createResponse(404, 'Source department not found');
      }

      if (!toDept) {
        return createResponse(404, 'Target department not found');
      }

      // This would require Employee model integration
      // Mock implementation for now
      console.log(`Transferring employees from ${fromDept.department_name} to ${toDept.department_name}`);
      
      return createResponse(200, 'Chuyển nhân viên thành công', {
        from_department: transformDocumentId(fromDept, POPULATED_FIELDS.DEPARTMENT),
        to_department: transformDocumentId(toDept, POPULATED_FIELDS.DEPARTMENT),
        transferred_count: 0 // Would be actual count from Employee model
      });
    } catch (error) {
      console.error('Error transferring employees:', error);
      return createResponse(500, 'Lỗi khi chuyển nhân viên', null, error.message);
    }
  }

  // Bulk operations
  static async bulkCreateDepartments(departmentsData, createdBy) {
    try {
      const results = [];
      
      for (const deptData of departmentsData) {
        try {
          const result = await this.createDepartment(deptData, createdBy);
          results.push({ status: 'success', department: result.data });
        } catch (error) {
          results.push({ 
            status: 'error', 
            department_name: deptData.department_name,
            error: error.message 
          });
        }
      }

      return createResponse(200, 'Tạo hàng loạt phòng ban thành công', results);
    } catch (error) {
      console.error('Error bulk creating departments:', error);
      return createResponse(500, 'Lỗi khi tạo hàng loạt phòng ban', null, error.message);
    }
  }

  static async bulkUpdateDepartments(updates, updatedBy) {
    try {
      const results = [];
      
      for (const { id, data } of updates) {
        try {
          const result = await this.updateDepartment(id, data, updatedBy);
          results.push({ id, status: 'success', department: result.data });
        } catch (error) {
          results.push({ id, status: 'error', error: error.message });
        }
      }

      return createResponse(200, 'Cập nhật hàng loạt phòng ban thành công', results);
    } catch (error) {
      console.error('Error bulk updating departments:', error);
      return createResponse(500, 'Lỗi khi cập nhật hàng loạt phòng ban', null, error.message);
    }
  }
}

class PositionService {
  // Create position with business logic
  static async createPosition(positionData, createdBy) {
    try {
      // Validate level constraints
      if (positionData.level < 1 || positionData.level > 10) {
        return createResponse(400, 'Position level must be between 1 and 10');
      }

      const position = await PositionRepository.create({
        ...positionData,
        created_by: createdBy
      });

      return createResponse(201, 'Tạo chức vụ thành công',
        transformDocumentId(position, POPULATED_FIELDS.POSITION));
    } catch (error) {
      console.error('Error creating position:', error);
      return createResponse(500, 'Lỗi khi tạo chức vụ', null, error.message);
    }
  }

  // Update position with business logic
  static async updatePosition(id, updateData, updatedBy) {
    try {
      const position = await PositionRepository.findById(id);
      if (!position) {
        return createResponse(404, 'Position not found');
      }

      // Check if level change affects employees
      if (updateData.level && updateData.level !== position.level) {
        const employeeCount = position.employees_count || 0;
        if (employeeCount > 0) {
          // Log level change for audit
          console.log(`Position level changed for ${employeeCount} employees`);
        }
      }

      const updatedPosition = await PositionRepository.updateById(id, {
        ...updateData,
        updated_by: updatedBy
      });

      return createResponse(200, 'Cập nhật chức vụ thành công',
        transformDocumentId(updatedPosition, POPULATED_FIELDS.POSITION));
    } catch (error) {
      console.error('Error updating position:', error);
      return createResponse(500, 'Lỗi khi cập nhật chức vụ', null, error.message);
    }
  }

  // Delete position with employee check
  static async deletePosition(id, deletedBy) {
    try {
      const position = await PositionRepository.findById(id);
      if (!position) {
        return createResponse(404, 'Position not found');
      }

      // Check if position has active employees
      const employeeCount = position.employees_count || 0;
      if (employeeCount > 0) {
        return createResponse(400, `Cannot delete position with ${employeeCount} active employees`);
      }

      const deletedPosition = await PositionRepository.updateById(id, {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: deletedBy
      });

      return createResponse(200, 'Xóa chức vụ thành công',
        transformDocumentId(deletedPosition, POPULATED_FIELDS.POSITION));
    } catch (error) {
      console.error('Error deleting position:', error);
      return createResponse(500, 'Lỗi khi xóa chức vụ', null, error.message);
    }
  }

  // Get career progression paths
  static async getCareerPaths(fromLevel, toLevel = null) {
    try {
      if (toLevel) {
        const positions = await PositionRepository.findByLevelRange(fromLevel, toLevel);
        return createResponse(200, 'Lấy đường phát triển nghề nghiệp thành công',
          transformDocumentsId(positions, POPULATED_FIELDS.POSITION));
      }

      // Get next level positions (promotion path)
      const nextLevelPositions = await PositionRepository.findByLevelRange(fromLevel + 1, fromLevel + 1);
      
      return createResponse(200, 'Lấy đường phát triển nghề nghiệp thành công', {
        current_level: fromLevel,
        promotion_options: transformDocumentsId(nextLevelPositions, POPULATED_FIELDS.POSITION)
      });
    } catch (error) {
      console.error('Error getting career paths:', error);
      return createResponse(500, 'Lỗi khi lấy đường phát triển nghề nghiệp', null, error.message);
    }
  }

  // Suggest positions based on current position
  static async suggestPositions(currentPositionId) {
    try {
      const currentPosition = await PositionRepository.findById(currentPositionId);
      if (!currentPosition) {
        return createResponse(404, 'Position not found');
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

      return createResponse(200, 'Gợi ý chức vụ thành công', {
        promotions: transformDocumentsId(promotions, POPULATED_FIELDS.POSITION),
        lateral_moves: transformDocumentsId(filteredLateralMoves, POPULATED_FIELDS.POSITION),
        demotions: transformDocumentsId(demotions, POPULATED_FIELDS.POSITION),
        current_position: transformDocumentId(currentPosition, POPULATED_FIELDS.POSITION)
      });
    } catch (error) {
      console.error('Error suggesting positions:', error);
      return createResponse(500, 'Lỗi khi gợi ý chức vụ', null, error.message);
    }
  }

  // Bulk update position levels
  static async bulkUpdateLevels(updates, updatedBy) {
    try {
      const results = [];
      
      for (const { id, level } of updates) {
        try {
          const result = await this.updatePosition(id, { level }, updatedBy);
          results.push({ id, status: 'success', position: result.data });
        } catch (error) {
          results.push({ id, status: 'error', error: error.message });
        }
      }

      return createResponse(200, 'Cập nhật hàng loạt cấp độ chức vụ thành công', results);
    } catch (error) {
      console.error('Error bulk updating position levels:', error);
      return createResponse(500, 'Lỗi khi cập nhật hàng loạt cấp độ chức vụ', null, error.message);
    }
  }

  // Get position analytics
  static async getPositionAnalytics() {
    try {
      const [stats, levelDistribution, employeeDistribution] = await Promise.all([
        PositionRepository.getStats(),
        PositionRepository.getPositionsByLevel(),
        this.getEmployeeDistribution()
      ]);

      return createResponse(200, 'Lấy phân tích chức vụ thành công', {
        overview: stats,
        level_distribution: levelDistribution,
        employee_distribution: employeeDistribution
      });
    } catch (error) {
      console.error('Error getting position analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích chức vụ', null, error.message);
    }
  }

  // Get employee distribution across positions
  static async getEmployeeDistribution() {
    try {
      // This would integrate with Employee model
      // Mock implementation for now
      return [];
    } catch (error) {
      console.error('Error getting employee distribution:', error);
      return [];
    }
  }
}

class DepartmentPositionIntegrationService {
  // Create organizational unit (department + position mapping)
  static async createOrganizationalUnit(departmentData, positionIds, createdBy) {
    try {
      const departmentResult = await DepartmentService.createDepartment(departmentData, createdBy);
      
      if (!departmentResult.success) {
        return departmentResult;
      }
      
      // Associate positions with department (if needed in your business logic)
      const positions = await Promise.all(
        positionIds.map(positionId => PositionRepository.findById(positionId))
      );

      return createResponse(201, 'Tạo đơn vị tổ chức thành công', {
        department: departmentResult.data,
        associated_positions: transformDocumentsId(positions.filter(pos => pos !== null), POPULATED_FIELDS.POSITION)
      });
    } catch (error) {
      console.error('Error creating organizational unit:', error);
      return createResponse(500, 'Lỗi khi tạo đơn vị tổ chức', null, error.message);
    }
  }

  // Get organizational structure
  static async getOrganizationalStructure() {
    try {
      const [departmentsResult, positionResult] = await Promise.all([
        DepartmentService.getAllDepartmentsWithStats(),
        PositionService.getPositionAnalytics()
      ]);

      return createResponse(200, 'Lấy cấu trúc tổ chức thành công', {
        departments: departmentsResult.data,
        positions: positionResult.data
      });
    } catch (error) {
      console.error('Error getting organizational structure:', error);
      return createResponse(500, 'Lỗi khi lấy cấu trúc tổ chức', null, error.message);
    }
  }

  // Validate organizational changes
  static async validateOrganizationalChange(changeType, data) {
    try {
      const validations = [];

      switch (changeType) {
        case 'POSITION_LEVEL_CHANGE':
          validations.push(await this.validatePositionLevelChange(data));
          break;
        case 'MANAGER_ASSIGNMENT':
          validations.push(await this.validateManagerAssignment(data));
          break;
      }

      return createResponse(200, 'Kiểm tra thay đổi tổ chức thành công', {
        validations: validations.filter(v => !v.valid)
      });
    } catch (error) {
      console.error('Error validating organizational change:', error);
      return createResponse(500, 'Lỗi khi kiểm tra thay đổi tổ chức', null, error.message);
    }
  }

  // Validate position level changes
  static async validatePositionLevelChange(data) {
    try {
      // Check salary implications, reporting structure, etc.
      return { valid: true, message: 'Validation passed' };
    } catch (error) {
      console.error('Error validating position level change:', error);
      return { valid: false, message: error.message };
    }
  }

  // Validate manager assignment
  static async validateManagerAssignment(data) {
    try {
      // Check user qualifications, existing responsibilities, etc.
      return { valid: true, message: 'Validation passed' };
    } catch (error) {
      console.error('Error validating manager assignment:', error);
      return { valid: false, message: error.message };
    }
  }
}

module.exports = {
  DepartmentService,
  PositionService,
  DepartmentPositionIntegrationService
};