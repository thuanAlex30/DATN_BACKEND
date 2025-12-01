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

      // Get recent system logs for activities
      const recentLogs = await SystemLog.find({})
        .sort({ created_at: -1 })
        .limit(10)
        .select('action module details ip_address created_at user_id tenant_id')
        .populate('user_id', 'username full_name')
        .populate('tenant_id', 'name tenant_name')
        .lean();

      // Get role count
      const Role = require('../models/role');
      const totalRoles = await Role.countDocuments({});

      // Format recent activities
      const recentActivities = recentLogs.map(log => ({
        id: log._id?.toString(),
        tenant_name: log.tenant_id?.name || log.tenant_id?.tenant_name,
        user_name: log.user_id?.username || log.user_id?.full_name,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        created_at: log.created_at
      }));

      // Format dashboard data for frontend
      const dashboard = {
        totalTenants: tenantsStats.totals.tenants,
        activeTenants: tenantsStats.totals.active_tenants,
        totalUsers: tenantsStats.totals.total_users,
        activeUsers: tenantsStats.totals.total_active_users,
        totalRoles: totalRoles,
        systemLogs: await SystemLog.countDocuments({}),
        recentActivities: recentActivities
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

