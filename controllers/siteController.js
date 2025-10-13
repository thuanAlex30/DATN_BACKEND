const Site = require('../models/site');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const SiteEvents = require('../events/siteEvents');

class SiteController {
  // ========== SITE MANAGEMENT ==========
  
  // Get all sites
  static getAllSites = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10, search, is_active, project_id } = req.query;
      const query = {};
      
      // Add project filter - REQUIRED for project-scoped data
      if (project_id) {
        query.project_id = project_id;
      } else {
        return ApiResponse.error(res, 'Project ID is required to retrieve sites', 400);
      }
      
      // Add search filter
      if (search) {
        query.$or = [
          { site_name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { contact_person: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Add active filter
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
      
      const sites = await Site.find(query)
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      
      const total = await Site.countDocuments(query);
      
      return ApiResponse.success(res, {
        sites,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }, 'Sites retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve sites', 500, error.message);
    }
  });

  // Get site by ID
  static getSiteById = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const site = await Site.findById(id).lean();
      
      if (!site) {
        return ApiResponse.error(res, 'Site not found', 404);
      }
      
      return ApiResponse.success(res, site, 'Site retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve site', 500, error.message);
    }
  });

  // Create new site
  static createSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const siteData = req.body;
      const userId = req.user._id || req.user.id;
      
      // Check if site with same name already exists in the same project
      const existingSite = await Site.findOne({ 
        site_name: siteData.site_name,
        project_id: siteData.project_id
      });
      
      if (existingSite) {
        return ApiResponse.error(res, 'Site with this name already exists', 400);
      }
      
      const site = new Site({
        ...siteData,
        created_by: userId
      });
      
      await site.save();
      
      // Emit site created event
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await SiteEvents.emitSiteCreated(site, metadata);
      } catch (error) {
        console.error('❌ Error emitting site created event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, site, 'Site created successfully', 201);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return ApiResponse.error(res, 'Validation failed', 400, errors);
      }
      return ApiResponse.error(res, 'Failed to create site', 500, error.message);
    }
  });

  // Update site
  static updateSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id || req.user.id;
      
      // Check if site exists
      const site = await Site.findById(id);
      if (!site) {
        return ApiResponse.error(res, 'Site not found', 404);
      }
      
      // Check if site name is being changed and if new name already exists in the same project
      if (updateData.site_name && updateData.site_name !== site.site_name) {
        const existingSite = await Site.findOne({ 
          site_name: updateData.site_name,
          project_id: site.project_id,
          _id: { $ne: id }
        });
        
        if (existingSite) {
          return ApiResponse.error(res, 'Site with this name already exists', 400);
        }
      }
      
      const updatedSite = await Site.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          updated_by: userId,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      );
      
      // Emit site updated event
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        const changes = Object.keys(updateData);
        await SiteEvents.emitSiteUpdated(updatedSite, site, changes, metadata);
      } catch (error) {
        console.error('❌ Error emitting site updated event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, updatedSite, 'Site updated successfully');
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return ApiResponse.error(res, 'Validation failed', 400, errors);
      }
      return ApiResponse.error(res, 'Failed to update site', 500, error.message);
    }
  });

  // Delete site
  static deleteSite = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      
      const site = await Site.findById(id);
      if (!site) {
        return ApiResponse.error(res, 'Site not found', 404);
      }
      
      // Check if site has areas
      const Area = require('../models/siteArea');
      const areaCount = await Area.countDocuments({ site_id: id });
      
      if (areaCount > 0) {
        return ApiResponse.error(res, 'Cannot delete site with existing areas', 400);
      }
      
      await Site.findByIdAndDelete(id);
      
      // Emit site deleted event
      try {
        const metadata = {
          userId: req.user?._id || req.user?.id,
          userRole: req.user?.role,
          userFullName: req.user?.full_name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        await SiteEvents.emitSiteDeleted(site, metadata);
      } catch (error) {
        console.error('❌ Error emitting site deleted event:', error);
        // Don't fail the request if event emission fails
      }
      
      return ApiResponse.success(res, null, 'Site deleted successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete site', 500, error.message);
    }
  });

  // Toggle site status
  static toggleSiteStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      const site = await Site.findById(id);
      if (!site) {
        return ApiResponse.error(res, 'Site not found', 404);
      }
      
      site.is_active = is_active;
      site.updated_at = new Date();
      await site.save();
      
      return ApiResponse.success(res, site, `Site ${is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to toggle site status', 500, error.message);
    }
  });

  // Get site statistics
  static getSiteStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      
      const site = await Site.findById(id);
      if (!site) {
        return ApiResponse.error(res, 'Site not found', 404);
      }
      
      const Area = require('../models/siteArea');
      const areaCount = await Area.countDocuments({ site_id: id });
      const activeAreaCount = await Area.countDocuments({ site_id: id, is_active: true });
      
      const stats = {
        site_id: id,
        site_name: site.site_name,
        total_areas: areaCount,
        active_areas: activeAreaCount,
        inactive_areas: areaCount - activeAreaCount,
        created_at: site.created_at,
        last_updated: site.updated_at
      };
      
      return ApiResponse.success(res, stats, 'Site statistics retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve site statistics', 500, error.message);
    }
  });
}

module.exports = SiteController;




