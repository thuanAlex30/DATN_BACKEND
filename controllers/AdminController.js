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

      // Get task statistics
      const [
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        onHoldTasks,
        cancelledTasks
      ] = await Promise.all([
        ProjectTask.countDocuments({}),
        ProjectTask.countDocuments({ status: 'pending' }),
        ProjectTask.countDocuments({ status: 'in_progress' }),
        ProjectTask.countDocuments({ status: 'completed' }),
        ProjectTask.countDocuments({ status: 'on_hold' }),
        ProjectTask.countDocuments({ status: 'cancelled' })
      ]);

      // Get overdue tasks (tasks with due_date < now and status not completed/cancelled)
      const overdueTasks = await ProjectTask.countDocuments({
        due_date: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      });

      // Get permission alerts (errors and warnings)
      const permissionErrorLogs = await SystemLog.find({
        message: { $regex: /permission|authorization|access denied/i },
        log_type: 'error'
      })
        .sort({ created_at: -1 })
        .limit(50)
        .populate('user_id', 'username full_name')
        .populate('tenant_id', 'tenant_code name')
        .lean();

      const permissionWarningLogs = await SystemLog.find({
        message: { $regex: /permission|authorization|access denied/i },
        log_type: 'warning'
      })
        .sort({ created_at: -1 })
        .limit(50)
        .populate('user_id', 'username full_name')
        .populate('tenant_id', 'tenant_code name')
        .lean();

      // Format permission alerts
      const permissionAlerts = {
        errors: permissionErrorLogs.map(log => ({
          _id: log._id?.toString(),
          message: log.message,
          created_at: log.created_at,
          user_id: log.user_id ? {
            username: log.user_id.username,
            full_name: log.user_id.full_name
          } : undefined,
          tenant_id: log.tenant_id?._id?.toString()
        })),
        warnings: permissionWarningLogs.map(log => ({
          _id: log._id?.toString(),
          message: log.message,
          created_at: log.created_at,
          user_id: log.user_id ? {
            username: log.user_id.username,
            full_name: log.user_id.full_name
          } : undefined,
          tenant_id: log.tenant_id?._id?.toString()
        })),
        total_errors: permissionErrorLogs.length,
        total_warnings: permissionWarningLogs.length
      };

      // Format dashboard data for frontend (matching frontend interface)
      const dashboard = {
        tenants: {
          tenants: tenantsStats.totals.tenants,
          active_tenants: tenantsStats.totals.active_tenants,
          suspended_tenants: tenantsStats.totals.suspended_tenants,
          inactive_tenants: tenantsStats.totals.inactive_tenants,
          total_users: tenantsStats.totals.total_users,
          total_active_users: tenantsStats.totals.total_active_users,
          total_departments: tenantsStats.totals.total_departments,
          total_projects: tenantsStats.totals.total_projects,
          total_tasks: tenantsStats.totals.total_tasks
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          in_progress: inProgressTasks,
          completed: completedTasks,
          on_hold: onHoldTasks,
          cancelled: cancelledTasks,
          overdue: overdueTasks
        },
        permission_alerts: permissionAlerts,
        summary: {
          total_tenants: tenantsStats.totals.tenants,
          active_tenants: tenantsStats.totals.active_tenants,
          total_users: tenantsStats.totals.total_users,
          total_active_users: tenantsStats.totals.total_active_users,
          total_projects: tenantsStats.totals.total_projects,
          total_tasks: tenantsStats.totals.total_tasks,
          permission_issues: permissionAlerts.total_errors + permissionAlerts.total_warnings
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

