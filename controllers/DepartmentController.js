const DepartmentRepository = require('../repository/DepartmentRepository');
const UserRepository = require('../repository/UserRepository');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const DepartmentEvents = require('../events/departmentEvents');

class DepartmentController {
  
  static getAllDepartments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id || null;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      is_active: req.query.is_active,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc',
      tenant_id: tenantId || undefined
    };

    const result = await DepartmentRepository.findAll(options);

    // Calculate employees_count for each department

    const User = require('../models/user');
    const departmentsWithCounts = await Promise.all(
      result.departments.map(async (dept) => {
        const deptJson = dept.toJSON ? dept.toJSON({ virtuals: true }) : dept;
        

        const allUsers = await User.find({ 
          department_id: dept._id,
          is_active: true
        }).populate('role_id', 'role_name role_code role_level');
        
        // Count from Department Head (role_level 80) down to all lower roles
        // Exclude only System Admin (100) and Company Admin (90)
        const employees = allUsers.filter(user => {
          const roleLevel = user.role_id?.role_level || 0;
          const roleCode = user.role_id?.role_code?.toLowerCase() || '';
          const roleName = user.role_id?.role_name?.toLowerCase() || '';
          
          // Exclude only System Admin and Company Admin
          const isSystemOrCompanyAdmin = roleLevel >= 90 || 
                                         roleCode === 'company_admin' ||
                                         roleCode === 'system_admin' ||
                                         roleName === 'company admin' ||
                                         roleName === 'system admin';
          
          return !isSystemOrCompanyAdmin;
        });
        
        const employeeCount = employees.length;
        
        return {
          ...deptJson,
          id: deptJson._id || deptJson.id || dept._id?.toString(),
          employees_count: employeeCount
        };
      })
    );

    return ApiResponse.success(res, {
      departments: departmentsWithCounts,
      pagination: result.pagination
    }, 'Departments retrieved successfully');
  });

  static getDepartmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id || null;
    
    const department = await DepartmentRepository.findById(id, tenantId);
    
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, department, 'Department retrieved successfully');
  });

  static createDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id || null;
    const departmentData = {
      ...req.body,
      tenant_id: tenantId || req.body.tenant_id
    };

    // Check if department name already exists
    const nameExists = await DepartmentRepository.existsByName(
      departmentData.department_name,
      null,
      tenantId || null
    );
    if (nameExists) {
      return ApiResponse.error(res, 'Department name already exists', 409);
    }

    // Validate manager_ids if provided
    if (departmentData.manager_ids && Array.isArray(departmentData.manager_ids)) {
      // Remove duplicates
      departmentData.manager_ids = [...new Set(departmentData.manager_ids)];
      
      // Validate max 5 managers
      if (departmentData.manager_ids.length > 5) {
        return ApiResponse.error(res, 'Một phòng ban chỉ có thể có tối đa 5 quản lý', 400);
      }

      // Validate each manager
      for (const managerId of departmentData.manager_ids) {
        const manager = await UserRepository.findById(managerId);
        if (!manager) {
          return ApiResponse.error(res, `Manager với ID ${managerId} không tồn tại`, 404);
        }
        if (!manager.is_active) {
          return ApiResponse.error(res, `Tài khoản manager ${manager.full_name || manager.username} không hoạt động`, 400);
        }
      }
    }

    // Validate manager_id (legacy support) if provided
    if (departmentData.manager_id) {
      const manager = await UserRepository.findById(departmentData.manager_id);
      if (!manager) {
        return ApiResponse.error(res, 'Manager not found', 404);
      }
      if (!manager.is_active) {
        return ApiResponse.error(res, 'Manager account is not active', 400);
      }

      // If manager_ids is not provided, convert manager_id to manager_ids array
      if (!departmentData.manager_ids || !Array.isArray(departmentData.manager_ids)) {
        departmentData.manager_ids = [departmentData.manager_id];
      } else if (!departmentData.manager_ids.includes(departmentData.manager_id)) {
        // Add manager_id to manager_ids if not already present
        departmentData.manager_ids.push(departmentData.manager_id);
        departmentData.manager_ids = [...new Set(departmentData.manager_ids)];
        if (departmentData.manager_ids.length > 5) {
          return ApiResponse.error(res, 'Một phòng ban chỉ có thể có tối đa 5 quản lý', 400);
        }
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
    const tenantId = req.user?.tenant_id || null;
    const updateData = { ...req.body };
    // Không cho phép đổi tenant_id qua API
    if (updateData.tenant_id) {
      delete updateData.tenant_id;
    }

    const existingDepartment = await DepartmentRepository.findById(id, tenantId);
    if (!existingDepartment) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    // Check department scope: Department Header can only update their own department
    const userRoleCode = req.user?.role?.role_code || req.user?.role_code;
    if (userRoleCode === 'department_header' || userRoleCode === 'DEPARTMENT_HEADER') {
      const userDepartmentId = req.user?.department_id || req.user?.departmentId;
      if (userDepartmentId && existingDepartment._id.toString() !== userDepartmentId.toString()) {
        return ApiResponse.forbidden(res, 'Can only update your own department');
      }
    }

    // Check if new department name already exists (excluding current department)
    if (updateData.department_name) {
      const nameExists = await DepartmentRepository.existsByName(
        updateData.department_name,
        id,
        tenantId || null
      );
      if (nameExists) {
        return ApiResponse.error(res, 'Department name already exists', 409);
      }
    }

    // Validate manager_ids if being updated
    if (updateData.manager_ids && Array.isArray(updateData.manager_ids)) {
      // Remove duplicates
      updateData.manager_ids = [...new Set(updateData.manager_ids)];
      
      // Validate max 5 managers
      if (updateData.manager_ids.length > 5) {
        return ApiResponse.error(res, 'Một phòng ban chỉ có thể có tối đa 5 quản lý', 400);
      }

      // Validate each manager
      for (const managerId of updateData.manager_ids) {
        const manager = await UserRepository.findById(managerId);
        if (!manager) {
          return ApiResponse.error(res, `Manager với ID ${managerId} không tồn tại`, 404);
        }
        if (!manager.is_active) {
          return ApiResponse.error(res, `Tài khoản manager ${manager.full_name || manager.username} không hoạt động`, 400);
        }
      }
    }

    // Validate manager_id (legacy support) if being updated
    if (updateData.manager_id) {
      const manager = await UserRepository.findById(updateData.manager_id);
      if (!manager) {
        return ApiResponse.error(res, 'Manager not found', 404);
      }
      if (!manager.is_active) {
        return ApiResponse.error(res, 'Manager account is not active', 400);
      }

      // If manager_ids is not provided, convert manager_id to manager_ids array
      if (!updateData.manager_ids || !Array.isArray(updateData.manager_ids)) {
        updateData.manager_ids = [updateData.manager_id];
      } else if (!updateData.manager_ids.includes(updateData.manager_id)) {
        // Add manager_id to manager_ids if not already present
        updateData.manager_ids.push(updateData.manager_id);
        updateData.manager_ids = [...new Set(updateData.manager_ids)];
        if (updateData.manager_ids.length > 5) {
          return ApiResponse.error(res, 'Một phòng ban chỉ có thể có tối đa 5 quản lý', 400);
        }
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
    const { password } = req.body; // Password for verification when department has employees
    const tenantId = req.user?.tenant_id || null;
    const currentUser = req.user;

    const department = await DepartmentRepository.findById(id, tenantId);
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    const User = require('../models/user');
    
    // Check if department has any employees (active or inactive)
    const totalEmployeeCount = await User.countDocuments({ 
      department_id: department._id
    });

    // For active departments, check if there are active employees
    if (department.is_active) {
      const activeEmployeeCount = await User.countDocuments({ 
        department_id: department._id,
        is_active: true 
      });
      
      if (activeEmployeeCount > 0) {
        return ApiResponse.error(res, 
          `Không thể xóa phòng ban đang hoạt động có ${activeEmployeeCount} nhân viên đang hoạt động. Vui lòng chuyển nhân viên sang phòng ban khác trước.`, 
          400
        );
      }
    }

    // For inactive departments with employees, require password verification
    if (!department.is_active && totalEmployeeCount > 0) {
      if (!password) {
      return ApiResponse.error(res, 
          `Phòng ban này còn ${totalEmployeeCount} nhân viên. Vui lòng nhập mật khẩu để xác nhận xóa.`, 
          400
        );
      }

      // Verify password of current user
      const user = await UserRepository.findById(currentUser.id || currentUser._id);
      if (!user) {
        return ApiResponse.unauthorized(res, 'User not found');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ApiResponse.error(res, 'Mật khẩu không đúng. Vui lòng thử lại.', 401);
      }
    }

    // If department had employees, remove department_id from all users BEFORE deleting
    if (totalEmployeeCount > 0) {
      await User.updateMany(
        { department_id: department._id },
        { $unset: { department_id: 1 } }
      );
    }

    // Hard delete - actually remove from database
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
    const tenantId = req.user?.tenant_id || null;
    const stats = await DepartmentRepository.getStats(tenantId || null);

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
    const tenantId = req.user?.tenant_id || null;
    const departments = await DepartmentRepository.findAll({
      is_active: true,
      limit: 1000,
      sort_by: 'department_name',
      sort_order: 'asc',
      tenant_id: tenantId || undefined
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

    const tenantId = req.user?.tenant_id || null;
    const options = {
      search,
      is_active: true,
      limit: parseInt(limit),
      sort_by: 'department_name',
      sort_order: 'asc',
      tenant_id: tenantId || undefined
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
    const tenantId = req.user?.tenant_id || null;
    const departments = await DepartmentRepository.getAllActive(tenantId || null);

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
    const tenantId = req.user?.tenant_id || null;
    
    const department = await DepartmentRepository.findById(id, tenantId);
    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    // Get employee count - count from Department Head (role_level 80) down
    // Exclude only System Admin (100) and Company Admin (90)
    const User = require('../models/user');
    const allUsers = await User.find({ 
      department_id: department._id,
      is_active: true 
    }).populate('role_id', 'role_name role_code role_level');
    
    // Filter: Include Department Head (80) and below, exclude System Admin (100) and Company Admin (90)
    const employees = allUsers.filter(user => {
      const roleLevel = user.role_id?.role_level || 0;
      const roleCode = user.role_id?.role_code?.toLowerCase() || '';
      const roleName = user.role_id?.role_name?.toLowerCase() || '';
      
      // Exclude only System Admin and Company Admin
      const isSystemOrCompanyAdmin = roleLevel >= 90 || 
                                     roleCode === 'company_admin' ||
                                     roleCode === 'system_admin' ||
                                     roleName === 'company admin' ||
                                     roleName === 'system admin';
      
      return !isSystemOrCompanyAdmin;
    });
    
    const employeeCount = employees.length;

    // Convert to JSON to include virtual fields
    const departmentJson = department.toJSON();

    // Get managers from manager_ids array or fallback to manager_id
    let managers = [];
    if (departmentJson.manager_ids && Array.isArray(departmentJson.manager_ids) && departmentJson.manager_ids.length > 0) {
      managers = departmentJson.manager_ids.map((m) => ({
        id: m.id || m._id,
        name: m.full_name || m.username,
        email: m.email
      })).filter((m) => m.id);
    } else if (departmentJson.manager_id) {
      managers = [{
        id: departmentJson.manager_id.id || departmentJson.manager_id._id,
        name: departmentJson.manager_id.full_name || departmentJson.manager_id.username,
        email: departmentJson.manager_id.email
      }];
    }

    const summary = {
      id: departmentJson.id,
      name: departmentJson.department_name,
      description: departmentJson.description,
      manager: managers.length > 0 ? managers[0] : null, // Keep for backward compatibility
      managers: managers.length > 0 ? managers : [], // New field for multiple managers
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

    const currentUser = req.user;
    const isManager = currentUser?.role?.role_level >= 70;
    
    // Check if department exists
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      console.log('Department not found:', id);
      return ApiResponse.notFound(res, 'Department not found');
    }

    // For Manager, ensure they can only access their own department
    if (isManager && currentUser.department_id) {
      const currentDeptId = currentUser.department_id?.toString() || currentUser.department_id;
      const targetDeptId = department._id?.toString() || department.id?.toString() || id;
      
      console.log('🔍 getDepartmentEmployees - Manager department check:', {
        currentDeptId,
        targetDeptId,
        isManager
      });
      
      if (currentDeptId !== targetDeptId) {
        console.log('❌ getDepartmentEmployees - Department mismatch');
        return ApiResponse.forbidden(
          res,
          'Bạn chỉ có thể xem nhân viên trong phòng ban của mình'
        );
      }
    }

    console.log('Department found:', department.department_name);

    // Prepare options for UserRepository
    // Nếu include_inactive là 'true' hoặc true, thì lấy tất cả (is_active = undefined)
    // Nếu không, chỉ lấy nhân viên đang hoạt động (is_active = true)
    const shouldIncludeInactive = include_inactive === 'true' || include_inactive === true;
    const options = {
      is_active: shouldIncludeInactive ? undefined : true, // Lấy tất cả nếu include inactive
      sort_by,
      sort_order
    };

    console.log('UserRepository options:', options);
    console.log('include_inactive value:', include_inactive, 'type:', typeof include_inactive);

    // Get all users from the department
    const allUsers = await UserRepository.findByDepartment(id, options);
    console.log('Found all users:', allUsers.length);

    // Count from Department Head (role_level 80) down to all lower roles
    // Exclude only System Admin (100) and Company Admin (90)
    // Không filter theo is_active ở đây, để hiển thị cả nhân viên đã ngừng hoạt động
    const employees = allUsers.filter(user => {
      const roleName = user.role_id?.role_name?.toLowerCase() || '';
      const roleCode = user.role_id?.role_code?.toLowerCase() || '';
      const roleLevel = user.role_id?.role_level || 0;
      
      // Exclude only System Admin and Company Admin
      const isSystemOrCompanyAdmin = roleLevel >= 90 || 
                                     roleCode === 'company_admin' ||
                                     roleCode === 'system_admin' ||
                                     roleName === 'company admin' ||
                                     roleName === 'system admin';
      
      if (isSystemOrCompanyAdmin) {
        console.log('Filtered out system/company admin:', {
          name: user.full_name,
          role_name: user.role_id?.role_name,
          role_code: user.role_id?.role_code,
          role_level: roleLevel
        });
        return false;
      }
      
      // Keep all users from Department Head (80) down (including Department Header, Manager, Employee, Trainer, Safety Officer, Warehouse Staff, Maintenance Staff)
      return true;
    });
    
    console.log('Found employees after filtering:', employees.length);

    // Format employee data
    const formattedEmployees = employees.map(employee => {
      // Handle department - use populated department_id or fallback to department from request
      let departmentData = null;
      if (employee.department_id) {
        // If department_id is populated (object)
        if (typeof employee.department_id === 'object' && employee.department_id.department_name) {
          departmentData = {
            id: employee.department_id._id || employee.department_id.id,
            name: employee.department_id.department_name,
            department_name: employee.department_id.department_name
          };
        } else {
          // If department_id is just an ObjectId, use department from request
          departmentData = {
            id: department._id,
            name: department.department_name,
            department_name: department.department_name
          };
        }
      } else {
        // Fallback: use department from request if employee has no department_id
        departmentData = {
          id: department._id,
          name: department.department_name,
          department_name: department.department_name
        };
      }
      
      return {
        id: employee._id,
        username: employee.username,
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role_id ? {
          id: employee.role_id._id,
          name: employee.role_id.role_name
        } : null,
        department: departmentData,
        is_active: employee.is_active,
        created_at: employee.created_at,
        updated_at: employee.updated_at
      };
    });

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