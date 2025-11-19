const DepartmentRepository = require('../repository/DepartmentRepository');
const UserRepository = require('../repository/UserRepository');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const DepartmentEvents = require('../events/departmentEvents');

class DepartmentController {
  
  static getAllDepartments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      is_active: req.query.is_active,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await DepartmentRepository.findAll(options);

    return ApiResponse.success(res, result, 'Departments retrieved successfully');
  });

  static getDepartmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const department = await DepartmentRepository.findById(id);
    
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, department, 'Department retrieved successfully');
  });

  static createDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const departmentData = req.body;

    // Check if department name already exists
    const nameExists = await DepartmentRepository.existsByName(departmentData.department_name);
    if (nameExists) {
      return ApiResponse.error(res, 'Department name already exists', 409);
    }

    // Validate manager if provided
    if (departmentData.manager_id) {
      const manager = await UserRepository.findById(departmentData.manager_id);
      if (!manager) {
        return ApiResponse.error(res, 'Manager not found', 404);
      }
      if (!manager.is_active) {
        return ApiResponse.error(res, 'Manager account is not active', 400);
      }

      // Check if manager is already managing another department
      const existingManagement = await DepartmentRepository.findAll({
        manager_id: departmentData.manager_id,
        is_active: true,
        limit: 1
      });
      
      if (existingManagement.departments.length > 0) {
        return ApiResponse.error(res, 'User is already managing another department', 409);
      }
    }

    const department = await DepartmentRepository.create(departmentData);

    // Emit department created event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await DepartmentEvents.emitDepartmentCreated(department, metadata);
    } catch (error) {
      console.error('❌ Error emitting department created event:', error);
      // Don't fail the request if event emission fails
    }

    return ApiResponse.success(res, department, 'Department created successfully', 201);
  });

  static updateDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingDepartment = await DepartmentRepository.findById(id);
    if (!existingDepartment) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    // Check if new department name already exists (excluding current department)
    if (updateData.department_name) {
      const nameExists = await DepartmentRepository.existsByName(
        updateData.department_name,
        id
      );
      if (nameExists) {
        return ApiResponse.error(res, 'Department name already exists', 409);
      }
    }

    // Validate manager if being updated
    if (updateData.manager_id) {
      const manager = await UserRepository.findById(updateData.manager_id);
      if (!manager) {
        return ApiResponse.error(res, 'Manager not found', 404);
      }
      if (!manager.is_active) {
        return ApiResponse.error(res, 'Manager account is not active', 400);
      }

      // Check if manager is already managing another department (excluding current)
      const existingManagement = await DepartmentRepository.findAll({
        manager_id: updateData.manager_id,
        is_active: true,
        limit: 10
      });
      
      const otherManagement = existingManagement.departments.filter(
        dept => dept._id.toString() !== id
      );
      
      if (otherManagement.length > 0) {
        return ApiResponse.error(res, 'User is already managing another department', 409);
      }
    }

    const department = await DepartmentRepository.updateById(id, updateData);

    // Emit department updated event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await DepartmentEvents.emitDepartmentUpdated(department, existingDepartment, metadata);
    } catch (error) {
      console.error('❌ Error emitting department updated event:', error);
      // Don't fail the request if event emission fails
    }

    return ApiResponse.success(res, department, 'Department updated successfully');
  });

  static deleteDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const department = await DepartmentRepository.findById(id);
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    // Check if department has active employees
    const employeeCount = department.employees_count || 0;
    if (employeeCount > 0) {
      return ApiResponse.error(res, 
        `Cannot delete department with ${employeeCount} active employees`, 
        400
      );
    }

    await DepartmentRepository.deleteById(id);

    // Emit department deleted event
    try {
      const metadata = {
        userId: req.user?.id,
        userRole: req.user?.role,
        userFullName: req.user?.full_name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      await DepartmentEvents.emitDepartmentDeleted(department, metadata);
    } catch (error) {
      console.error('❌ Error emitting department deleted event:', error);
      // Don't fail the request if event emission fails
    }

    return ApiResponse.success(res, null, 'Department deleted successfully');
  });

  // Get department statistics
  static getDepartmentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const stats = await DepartmentRepository.getStats();

    return ApiResponse.success(res, stats, 'Department statistics retrieved successfully');
  });

  static bulkDeleteDepartments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    // Check if all departments exist and can be deleted
    const existingDepartments = await Promise.all(
      ids.map(id => DepartmentRepository.findById(id))
    );

    const notFoundIds = [];
    const hasEmployees = [];

    for (let i = 0; i < existingDepartments.length; i++) {
      if (!existingDepartments[i]) {
        notFoundIds.push(ids[i]);
      } else {
        const employeeCount = existingDepartments[i].employees_count || 0;
        if (employeeCount > 0) {
          hasEmployees.push({
            id: ids[i],
            name: existingDepartments[i].department_name,
            count: employeeCount
          });
        }
      }
    }

    if (notFoundIds.length > 0) {
      return ApiResponse.error(res, 
        `Departments not found: ${notFoundIds.join(', ')}`, 
        404
      );
    }

    if (hasEmployees.length > 0) {
      const errorMessage = hasEmployees
        .map(dept => `${dept.name} (${dept.count} employees)`)
        .join(', ');
      
      return ApiResponse.error(res, 
        `Cannot delete departments with active employees: ${errorMessage}`, 
        400
      );
    }

    const result = await DepartmentRepository.bulkDelete(ids);

    return ApiResponse.success(res, 
      { affected_count: result.modifiedCount }, 
      `${result.modifiedCount} departments deleted successfully`
    );
  });

  static getDepartmentOptions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const departments = await DepartmentRepository.findAll({
      is_active: true,
      limit: 1000,
      sort_by: 'department_name',
      sort_order: 'asc'
    });

    const options = departments.departments.map(dept => ({
      id: dept.id,
      name: dept.department_name,
      manager: dept.manager_id ? {
        id: dept.manager_id._id || dept.manager_id.id,
        name: dept.manager_id.full_name || dept.manager_id.username
      } : null
    }));

    return ApiResponse.success(res, options, 'Department options retrieved successfully');
  });

  static searchDepartments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const {
      q: search = '',
      has_manager = null,
      has_employees = null,
      limit = 20
    } = req.query;

    const options = {
      search,
      is_active: true,
      limit: parseInt(limit),
      sort_by: 'department_name',
      sort_order: 'asc'
    };

    const result = await DepartmentRepository.findAll(options);
    let filteredDepartments = result.departments;

    // Filter by manager presence
    if (has_manager !== null) {
      const hasManagerBool = has_manager === 'true';
      filteredDepartments = filteredDepartments.filter(dept => 
        hasManagerBool ? dept.manager_id : !dept.manager_id
      );
    }

    // Filter by employee presence
    if (has_employees !== null) {
      const hasEmployeesBool = has_employees === 'true';
      filteredDepartments = filteredDepartments.filter(dept => {
        const employeeCount = dept.employees_count || 0;
        return hasEmployeesBool ? employeeCount > 0 : employeeCount === 0;
      });
    }

    return ApiResponse.success(res, 
      {
        departments: filteredDepartments,
        total: filteredDepartments.length
      }, 
      'Departments search completed successfully'
    );
  });

  // Get all active departments (simple list)
  static getActiveDepartments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const departments = await DepartmentRepository.getAllActive();

    return ApiResponse.success(res, departments, 'Active departments retrieved successfully');
  });

  // Transfer employees between departments
  static transferEmployees = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { fromDepartmentId, toDepartmentId } = req.body;

    if (fromDepartmentId === toDepartmentId) {
      return ApiResponse.error(res, 'Source and target departments cannot be the same', 400);
    }

    const [fromDept, toDept] = await Promise.all([
      DepartmentRepository.findById(fromDepartmentId),
      DepartmentRepository.findById(toDepartmentId)
    ]);

    if (!fromDept) {
      return ApiResponse.error(res, 'Source department not found', 404);
    }

    if (!toDept) {
      return ApiResponse.error(res, 'Target department not found', 404);
    }

    if (!fromDept.is_active || !toDept.is_active) {
      return ApiResponse.error(res, 'Both departments must be active', 400);
    }

    // This would require Employee model integration
    // For now, return success with mock data
    const result = {
      from_department: {
        id: fromDept.id,
        name: fromDept.department_name
      },
      to_department: {
        id: toDept.id,
        name: toDept.department_name
      },
      transferred_count: 0 // Would be actual count from Employee model
    };

    return ApiResponse.success(res, result, 'Employee transfer completed successfully');
  });

  // Get department summary
  static getDepartmentSummary = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    // Get employee count using aggregation
    const User = require('../models/user');
    const employeeCount = await User.countDocuments({ 
      department_id: department._id,
      is_active: true 
    });

    // Convert to JSON to include virtual fields
    const departmentJson = department.toJSON();

    const summary = {
      id: departmentJson.id,
      name: departmentJson.department_name,
      description: departmentJson.description,
      manager: departmentJson.manager_id ? {
        id: departmentJson.manager_id.id || departmentJson.manager_id._id,
        name: departmentJson.manager_id.full_name || departmentJson.manager_id.username,
        email: departmentJson.manager_id.email
      } : null,
      employee_count: employeeCount,
      is_active: departmentJson.is_active,
      created_at: departmentJson.created_at,
      updated_at: departmentJson.updated_at
    };

    return ApiResponse.success(res, summary, 'Department summary retrieved successfully');
  });

  // Get all employees in a department
  static getDepartmentEmployees = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      is_active = 'true', 
      sort_by = 'full_name', 
      sort_order = 'asc',
      include_inactive = 'false'
    } = req.query;

    console.log('getDepartmentEmployees called with:', { id, is_active, sort_by, sort_order, include_inactive });

    // Check if department exists
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      console.log('Department not found:', id);
      return ApiResponse.notFound(res, 'Department not found');
    }

    console.log('Department found:', department.department_name);

    // Prepare options for UserRepository
    const options = {
      is_active: include_inactive === 'true' ? undefined : (is_active === 'true'),
      sort_by,
      sort_order
    };

    console.log('UserRepository options:', options);

    // Get all users from the department
    const allUsers = await UserRepository.findByDepartment(id, options);
    console.log('Found all users:', allUsers.length);

    // Filter out managers, only keep employees
    const employees = allUsers.filter(user => {
      const roleName = user.role_id?.role_name;
      const isEmployee = roleName === 'employee';
      
      if (!isEmployee) {
        console.log('Filtered out non-employee:', {
          name: user.full_name,
          role: roleName
        });
      }
      
      return isEmployee;
    });
    
    console.log('Found employees after filtering:', employees.length);

    // Format employee data
    const formattedEmployees = employees.map(employee => ({
      id: employee._id,
      username: employee.username,
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position_id ? {
        id: employee.position_id._id,
        name: employee.position_id.position_name,
        level: employee.position_id.level
      } : null,
      role: employee.role_id ? {
        id: employee.role_id._id,
        name: employee.role_id.role_name
      } : null,
      department: employee.department_id ? {
        id: employee.department_id._id,
        name: employee.department_id.department_name,
        department_name: employee.department_id.department_name
      } : null,
      is_active: employee.is_active,
      created_at: employee.created_at,
      updated_at: employee.updated_at
    }));

    return ApiResponse.success(res, {
      department: {
        id: department._id,
        name: department.department_name
      },
      employees: formattedEmployees,
      total: formattedEmployees.length
    }, 'Department employees retrieved successfully');
  });
}

module.exports = DepartmentController;