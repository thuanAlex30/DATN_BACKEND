const Tenant = require('../models/tenant');
const User = require('../models/user');
const Department = require('../models/department');
const Project = require('../models/project');
const ProjectTask = require('../models/projectTask');

class TenantRepository {
  // Create new tenant
  static async create(tenantData) {
    try {
      const tenant = new Tenant(tenantData);
      return await tenant.save();
    } catch (error) {
      throw error;
    }
  }

  // Find tenant by ID
  static async findById(id) {
    try {
      return await Tenant.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Find tenant by code
  static async findByCode(tenantCode) {
    try {
      return await Tenant.findOne({ tenant_code: tenantCode });
    } catch (error) {
      throw error;
    }
  }

  // Find all tenants with pagination and filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      const filter = {};

      if (search) {
        filter.$or = [
          { tenant_code: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { 'contact.name': { $regex: search, $options: 'i' } },
          { 'contact.email': { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      const skip = (page - 1) * limit;

      const [tenants, total] = await Promise.all([
        Tenant.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
        Tenant.countDocuments(filter)
      ]);

      return {
        tenants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update tenant by ID
  static async updateById(id, updateData) {
    try {
      return await Tenant.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(tenantId, subscriptionData) {
    try {
      return await Tenant.findByIdAndUpdate(
        tenantId,
        { 
          subscription: subscriptionData,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Update tenant status
  static async updateStatus(tenantId, status) {
    try {
      return await Tenant.findByIdAndUpdate(
        tenantId,
        { 
          status,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Reset tenant (deactivate all users, suspend tenant)
  static async resetTenant(tenantId) {
    try {
      // Suspend tenant
      await Tenant.findByIdAndUpdate(
        tenantId,
        { 
          status: 'suspended',
          updated_at: new Date()
        }
      );

      // Deactivate all users in tenant
      await User.updateMany(
        { tenant_id: tenantId },
        { 
          is_active: false,
          updated_at: new Date()
        }
      );

      return await Tenant.findById(tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Assign Company Admin to tenant
  static async assignCompanyAdmin(tenantId, userId) {
    try {
      // Verify user exists and belongs to tenant
      const user = await User.findOne({ 
        _id: userId, 
        tenant_id: tenantId 
      }).populate('role_id');

      if (!user) {
        throw new Error('User not found or does not belong to tenant');
      }

      // Get Company Admin role
      const Role = require('../models/role');
      const companyAdminRole = await Role.findOne({ role_code: 'company_admin' });

      if (!companyAdminRole) {
        throw new Error('Company Admin role not found');
      }

      // Update user role
      user.role_id = companyAdminRole._id;
      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get tenant statistics
  static async getTenantStats(tenantId) {
    try {
      const [userCount, activeUserCount, departmentCount, projectCount, taskCount] = await Promise.all([
        User.countDocuments({ tenant_id: tenantId }),
        User.countDocuments({ tenant_id: tenantId, is_active: true }),
        Department.countDocuments({ tenant_id: tenantId }),
        Project.countDocuments({ tenant_id: tenantId }),
        ProjectTask.countDocuments({ 
          project_id: { $in: await Project.find({ tenant_id: tenantId }).distinct('_id') }
        })
      ]);

      return {
        users: {
          total: userCount,
          active: activeUserCount,
          inactive: userCount - activeUserCount
        },
        departments: departmentCount,
        projects: projectCount,
        tasks: taskCount
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all tenant statistics (for System Admin dashboard)
  static async getAllTenantsStats() {
    try {
      const tenants = await Tenant.find({});
      
      const stats = await Promise.all(
        tenants.map(async (tenant) => {
          const tenantStats = await this.getTenantStats(tenant._id);
          return {
            tenant_id: tenant._id,
            tenant_code: tenant.tenant_code,
            tenant_name: tenant.name,
            status: tenant.status,
            subscription: tenant.subscription,
            ...tenantStats
          };
        })
      );

      // Aggregate totals
      const totals = {
        tenants: tenants.length,
        active_tenants: tenants.filter(t => t.status === 'active').length,
        suspended_tenants: tenants.filter(t => t.status === 'suspended').length,
        inactive_tenants: tenants.filter(t => t.status === 'inactive').length,
        total_users: stats.reduce((sum, s) => sum + s.users.total, 0),
        total_active_users: stats.reduce((sum, s) => sum + s.users.active, 0),
        total_departments: stats.reduce((sum, s) => sum + s.departments, 0),
        total_projects: stats.reduce((sum, s) => sum + s.projects, 0),
        total_tasks: stats.reduce((sum, s) => sum + s.tasks, 0)
      };

      return {
        totals,
        by_tenant: stats
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if tenant code exists
  static async existsByCode(tenantCode, excludeId = null) {
    try {
      const filter = { tenant_code: tenantCode };
      if (excludeId) filter._id = { $ne: excludeId };
      
      const count = await Tenant.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete tenant (soft delete - set to inactive)
  static async deleteById(id) {
    try {
      return await Tenant.findByIdAndUpdate(
        id,
        { 
          status: 'inactive',
          updated_at: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Hard delete tenant (use with caution)
  static async hardDeleteById(id) {
    try {
      return await Tenant.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TenantRepository;

