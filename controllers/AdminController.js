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
      const tenantsStats = await TenantRepository.getAllTenantsStats().catch(err => {
        console.error('Error getting tenants stats:', err);
        return { totals: { tenants: 0, active_tenants: 0, suspended_tenants: 0, inactive_tenants: 0, total_users: 0, total_active_users: 0, total_departments: 0, total_projects: 0, total_tasks: 0 } };
      });

      const [taskStats, permissionAlerts] = await Promise.all([
        ProjectTask.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]).catch(() => []),
        SystemLog.find({
          severity: { $in: ['error', 'warning'] },
          $or: [
            { action: { $regex: /permission|authorization|access denied/i } },
            { module: 'auth' }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(100)
        .select('action module details severity timestamp user_id')
        .populate('user_id', 'username full_name')
        .lean()
        .catch(err => {
          console.error('Error getting permission alerts:', err);
          return [];
        })
      ]);

      const taskStatusMap = {};
      taskStats.forEach(stat => {
        taskStatusMap[stat._id] = stat.count;
      });

      const errors = permissionAlerts.filter(a => a.severity === 'error').slice(0, 50);
      const warnings = permissionAlerts.filter(a => a.severity === 'warning').slice(0, 50);

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
          total: taskStatusMap.total || Object.values(taskStatusMap).reduce((a, b) => a + b, 0),
          pending: taskStatusMap.pending || taskStatusMap.PENDING || 0,
          in_progress: taskStatusMap.in_progress || taskStatusMap.IN_PROGRESS || 0,
          completed: taskStatusMap.completed || taskStatusMap.COMPLETED || 0,
          on_hold: taskStatusMap.on_hold || taskStatusMap.ON_HOLD || 0,
          cancelled: taskStatusMap.cancelled || taskStatusMap.CANCELLED || 0,
          overdue: 0
        },
        permission_alerts: {
          errors: errors.map(e => ({
            _id: e._id?.toString(),
            message: e.action || e.details?.message || 'Permission error',
            created_at: e.timestamp || e.createdAt,
            user_id: e.user_id ? {
              username: e.user_id.username,
              full_name: e.user_id.full_name
            } : undefined
          })),
          warnings: warnings.map(w => ({
            _id: w._id?.toString(),
            message: w.action || w.details?.message || 'Permission warning',
            created_at: w.timestamp || w.createdAt,
            user_id: w.user_id ? {
              username: w.user_id.username,
              full_name: w.user_id.full_name
            } : undefined
          })),
          total_errors: errors.length,
          total_warnings: warnings.length
        },
        summary: {
          total_tenants: tenantsStats.totals.tenants,
          active_tenants: tenantsStats.totals.active_tenants,
          total_users: tenantsStats.totals.total_users,
          total_active_users: tenantsStats.totals.total_active_users,
          total_projects: tenantsStats.totals.total_projects,
          total_tasks: tenantsStats.totals.total_tasks,
          permission_issues: errors.length + warnings.length
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
      $or: [
        { action: { $regex: /permission|authorization|access denied/i } },
        { module: 'auth' }
      ]
    };

    if (type === 'error') {
      filter.severity = 'error';
    } else if (type === 'warning') {
      filter.severity = 'warning';
    } else {
      filter.severity = { $in: ['error', 'warning'] };
    }

    const alerts = await SystemLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'username full_name email')
      .lean();

    const stats = {
      total: alerts.length,
      errors: alerts.filter(a => a.severity === 'error').length,
      warnings: alerts.filter(a => a.severity === 'warning').length
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

