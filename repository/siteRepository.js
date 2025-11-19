const Site = require('../models/site');
const SiteArea = require('../models/siteArea');
const WorkLocation = require('../models/workLocation');

class SiteRepository {
  // ========== SITE CRUD ==========
  async getAllSites(filters = {}) {
    const query = {};
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    if (filters.site_name) {
      query.site_name = { $regex: filters.site_name, $options: 'i' };
    }

    return await Site.find(query)
      .populate('site_id', 'site_name site_code')
      .sort({ created_at: -1 });
  }

  async getSiteById(id) {
    return await Site.findById(id)
      .populate('site_id', 'site_name site_code');
  }

  async createSite(siteData) {
    const site = new Site(siteData);
    return await site.save();
  }

  async updateSite(id, updateData) {
    return await Site.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteSite(id) {
    return await Site.findByIdAndDelete(id);
  }

  // ========== SITE AREA MANAGEMENT ==========
  async getAreasBySite(siteId) {
    return await SiteArea.find({ site_id: siteId })
      .populate('site_id', 'site_name site_code')
      .populate('supervisor_id', 'full_name email')
      .sort({ created_at: -1 });
  }

  async getAreaById(id) {
    return await SiteArea.findById(id)
      .populate('site_id', 'site_name site_code')
      .populate('supervisor_id', 'full_name email');
  }

  async createArea(areaData) {
    const area = new SiteArea(areaData);
    return await area.save();
  }

  async updateArea(id, updateData) {
    return await SiteArea.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteArea(id) {
    return await SiteArea.findByIdAndDelete(id);
  }

  // ========== WORK LOCATION MANAGEMENT ==========
  async getWorkLocationsByArea(areaId) {
    return await WorkLocation.find({ area_id: areaId })
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  async getWorkLocationById(id) {
    return await WorkLocation.findById(id)
      .populate('area_id', 'area_name area_code');
  }

  async createWorkLocation(locationData) {
    const location = new WorkLocation(locationData);
    return await location.save();
  }

  async updateWorkLocation(id, updateData) {
    return await WorkLocation.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteWorkLocation(id) {
    return await WorkLocation.findByIdAndDelete(id);
  }

  // ========== SITE ANALYTICS ==========
  async getSiteAnalytics(siteId) {
    const site = await Site.findById(siteId);
    if (!site) return null;

    const areas = await SiteArea.find({ site_id: siteId });
    const totalAreas = areas.length;
    const activeAreas = areas.filter(area => area.is_active).length;

    const workLocations = await WorkLocation.find({ 
      area_id: { $in: areas.map(area => area._id) } 
    });
    const totalWorkLocations = workLocations.length;

    return {
      site_id: siteId,
      site_name: site.site_name,
      total_areas: totalAreas,
      active_areas: activeAreas,
      inactive_areas: totalAreas - activeAreas,
      total_work_locations: totalWorkLocations,
      area_distribution: areas.reduce((acc, area) => {
        acc[area.area_type] = (acc[area.area_type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  async getSiteStats(filters = {}) {
    const query = {};
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    const totalSites = await Site.countDocuments(query);
    
    const sitesByType = await Site.aggregate([
      { $match: query },
      { $group: { _id: '$site_type', count: { $sum: 1 } } }
    ]);

    const sitesByStatus = await Site.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
      total_sites: totalSites,
      sites_by_type: sitesByType,
      sites_by_status: sitesByStatus
    };
  }

  // ========== SEARCH AND FILTER ==========
  async searchSites(searchTerm, filters = {}) {
    const query = {
      $or: [
        { site_name: { $regex: searchTerm, $options: 'i' } },
        { site_code: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    return await Site.find(query)
      .populate('site_id', 'site_name site_code')
      .sort({ created_at: -1 });
  }

  async getSitesByLocation(location) {
    return await Site.find({
      $or: [
        { address: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { province: { $regex: location, $options: 'i' } }
      ]
    })
    .populate('site_id', 'site_name site_code')
    .sort({ created_at: -1 });
  }
}

module.exports = new SiteRepository();
