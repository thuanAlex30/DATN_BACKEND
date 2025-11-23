const TenantRepository = require('../repository/TenantRepository');
const UserRepository = require('../repository/UserRepository');
const ProjectTask = require('../models/projectTask');
const Project = require('../models/project');
const User = require('../models/user');
const Department = require('../models/department');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const SystemLog = require('../models/systemLog');

class AdminController {
  // System Admin Dashboard - Overall statistics
  static getSystemDashboard = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      // Get all tenants statistics
      const tenantsStats = await TenantRepository.getAllTenantsStats();

      // Get permission errors/warnings from system logs
      const permissionErrors = await SystemLog.find({
        log_type: 'error',
        message: { $regex: /permission|authorization|access denied/i }
      })
        .sort({ created_at: -1 })
        .limit(10)
        .select('message created_at user_id tenant_id')
        .populate('user_id', 'username full_name')
        .lean();

      // Get recent permission warnings
      const permissionWarnings = await SystemLog.find({
        log_type: 'warning',
        message: { $regex: /permission|authorization/i }
      })
        .sort({ created_at: -1 })
        .limit(10)
        .select('message created_at user_id tenant_id')
        .populate('user_id', 'username full_name')
        .lean();

      // Calculate task statistics across all tenants
      const allTasks = await ProjectTask.find({}).lean();
      const taskStats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'PENDING').length,
        in_progress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: allTasks.filter(t => t.status === 'COMPLETED').length,
        on_hold: allTasks.filter(t => t.status === 'ON_HOLD').length,
        cancelled: allTasks.filter(t => t.status === 'CANCELLED').length,
        overdue: allTasks.filter(t => {
          if (t.planned_end_date && t.status !== 'COMPLETED') {
            return new Date(t.planned_end_date) < new Date();
          }
          return false;
        }).length
      };

      const dashboard = {
        tenants: tenantsStats.totals,
        tasks: taskStats,
        permission_alerts: {
          errors: permissionErrors,
          warnings: permissionWarnings,
          total_errors: permissionErrors.length,
          total_warnings: permissionWarnings.length
        },
        summary: {
          total_tenants: tenantsStats.totals.tenants,
          active_tenants: tenantsStats.totals.active_tenants,
          total_users: tenantsStats.totals.total_users,
          total_active_users: tenantsStats.totals.total_active_users,
          total_projects: tenantsStats.totals.total_projects,
          total_tasks: taskStats.total,
          permission_issues: permissionErrors.length + permissionWarnings.length
        }
      };

      return ApiResponse.success(res, dashboard, 'System dashboard data retrieved successfully');
    } catch (error) {
      console.error('Error getting system dashboard:', error);
      return ApiResponse.error(res, 'Failed to retrieve system dashboard', 500);
    }
  });

  // Get all tenants with detailed information
  static getAllTenantsDetailed = ErrorMiddleware.asyncHandler(async (req, res) => {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      search: req.query.search || '',
      status: req.query.status,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await TenantRepository.findAll(options);

    // Enrich with statistics for each tenant
    const enrichedTenants = await Promise.all(
      result.tenants.map(async (tenant) => {
        const stats = await TenantRepository.getTenantStats(tenant._id);
        return {
          ...tenant.toObject(),
          statistics: stats
        };
      })
    );

    return ApiResponse.success(res, {
      tenants: enrichedTenants,
      pagination: result.pagination
    }, 'Tenants with statistics retrieved successfully');
  });

  // Get permission errors and warnings
  static getPermissionAlerts = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { 
      type = 'all', // 'all', 'error', 'warning'
      limit = 50,
      tenant_id 
    } = req.query;

    const filter = {
      message: { $regex: /permission|authorization|access denied/i }
    };

    if (type === 'error') {
      filter.log_type = 'error';
    } else if (type === 'warning') {
      filter.log_type = 'warning';
    }

    if (tenant_id) {
      filter.tenant_id = tenant_id;
    }

    const alerts = await SystemLog.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'username full_name email')
      .populate('tenant_id', 'tenant_code name')
      .lean();

    const stats = {
      total: alerts.length,
      errors: alerts.filter(a => a.log_type === 'error').length,
      warnings: alerts.filter(a => a.log_type === 'warning').length
    };

    return ApiResponse.success(res, {
      alerts,
      statistics: stats
    }, 'Permission alerts retrieved successfully');
  });

  // Get system-wide statistics
  static getSystemStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        totalDepartments,
        totalProjects,
        totalTasks
      ] = await Promise.all([
        TenantRepository.findAll({ limit: 1000 }).then(r => r.tenants.length),
        TenantRepository.findAll({ status: 'active', limit: 1000 }).then(r => r.tenants.length),
        User.countDocuments({}),
        User.countDocuments({ is_active: true }),
        Department.countDocuments({}),
        Project.countDocuments({}),
        ProjectTask.countDocuments({})
      ]);

      const stats = {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: totalTenants - activeTenants
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        departments: totalDepartments,
        projects: totalProjects,
        tasks: totalTasks
      };

      return ApiResponse.success(res, stats, 'System statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting system stats:', error);
      return ApiResponse.error(res, 'Failed to retrieve system statistics', 500);
    }
  });
}

module.exports = AdminController;

