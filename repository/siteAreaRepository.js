const SiteArea = require('../models/siteArea');
const AreaAccessControl = require('../models/areaAccessControl');
const AreaSafetyChecklist = require('../models/areaSafetyChecklist');
const AreaInspection = require('../models/areaInspection');
const WorkLocation = require('../models/workLocation');

class SiteAreaRepository {
  // ========== BASIC CRUD ==========
  async getAllAreas(filters = {}) {
    try {
      const query = {};
      
      if (filters.site_id) {
        query.site_id = filters.site_id;
      }
      if (filters.area_name) {
        query.area_name = { $regex: filters.area_name, $options: 'i' };
      }
      if (filters.area_code) {
        query.area_code = { $regex: filters.area_code, $options: 'i' };
      }
      if (filters.area_type) {
        query.area_type = filters.area_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.supervisor_id) {
        query.supervisor_id = filters.supervisor_id;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting areas:', error);
      throw error;
    }
  }

  async getAreaById(id) {
    try {
      const area = await SiteArea.findById(id)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return area;
    } catch (error) {
      console.error('Error getting area by id:', error);
      throw error;
    }
  }

  async createArea(areaData) {
    try {
      const area = new SiteArea(areaData);
      await area.save();
      
      return await this.getAreaById(area._id);
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    }
  }

  async updateArea(id, updateData) {
    try {
      const area = await SiteArea.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return area;
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  }

  async deleteArea(id) {
    try {
      const area = await SiteArea.findByIdAndDelete(id);
      return area;
    } catch (error) {
      console.error('Error deleting area:', error);
      throw error;
    }
  }

  // ========== SITE AREA QUERIES ==========
  async getSiteAreas(siteId) {
    try {
      const areas = await SiteArea.find({ site_id: siteId })
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting site areas:', error);
      throw error;
    }
  }

  async getAreasByType(areaType, siteId = null) {
    try {
      const query = { area_type: areaType };
      if (siteId) {
        query.site_id = siteId;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting areas by type:', error);
      throw error;
    }
  }

  async getAreasByStatus(status, siteId = null) {
    try {
      const query = { status };
      if (siteId) {
        query.site_id = siteId;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting areas by status:', error);
      throw error;
    }
  }

  async getActiveAreas(siteId = null) {
    try {
      const query = { status: 'ACTIVE' };
      if (siteId) {
        query.site_id = siteId;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting active areas:', error);
      throw error;
    }
  }

  async getAreasBySupervisor(supervisorId, siteId = null) {
    try {
      const query = { supervisor_id: supervisorId };
      if (siteId) {
        query.site_id = siteId;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error getting areas by supervisor:', error);
      throw error;
    }
  }

  // ========== AREA VALIDATION ==========
  async validateArea(areaData) {
    try {
      const errors = [];

      // Check required fields
      if (!areaData.site_id) {
        errors.push('Site ID is required');
      }
      if (!areaData.area_name) {
        errors.push('Area name is required');
      }
      if (!areaData.area_code) {
        errors.push('Area code is required');
      }
      if (!areaData.area_type) {
        errors.push('Area type is required');
      }

      // Check if area type is valid
      const validAreaTypes = ['CONSTRUCTION', 'STORAGE', 'OFFICE', 'WORKSHOP', 'SAFETY', 'OTHER'];
      if (areaData.area_type && !validAreaTypes.includes(areaData.area_type)) {
        errors.push('Invalid area type');
      }

      // Check if status is valid
      const validStatuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'];
      if (areaData.status && !validStatuses.includes(areaData.status)) {
        errors.push('Invalid status');
      }

      // Check for duplicate area code in same site
      if (areaData.site_id && areaData.area_code) {
        const existingArea = await SiteArea.findOne({
          site_id: areaData.site_id,
          area_code: areaData.area_code,
          _id: { $ne: areaData._id }
        });
        if (existingArea) {
          errors.push('Area code already exists in this site');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating area:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== AREA ANALYTICS ==========
  async getAreaAnalytics(siteId) {
    try {
      const areas = await SiteArea.find({ site_id: siteId });
      
      const analytics = {
        total_areas: areas.length,
        active_areas: areas.filter(a => a.status === 'ACTIVE').length,
        inactive_areas: areas.filter(a => a.status === 'INACTIVE').length,
        maintenance_areas: areas.filter(a => a.status === 'MAINTENANCE').length,
        closed_areas: areas.filter(a => a.status === 'CLOSED').length,
        areas_by_type: areas.reduce((acc, area) => {
          acc[area.area_type] = (acc[area.area_type] || 0) + 1;
          return acc;
        }, {}),
        areas_by_status: areas.reduce((acc, area) => {
          acc[area.status] = (acc[area.status] || 0) + 1;
          return acc;
        }, {}),
        total_capacity: areas.reduce((sum, area) => sum + (area.capacity || 0), 0),
        total_current_occupancy: areas.reduce((sum, area) => sum + (area.current_occupancy || 0), 0),
        average_occupancy_rate: areas.length > 0 ? 
          (areas.reduce((sum, area) => {
            if (area.capacity && area.current_occupancy) {
              return sum + (area.current_occupancy / area.capacity);
            }
            return sum;
          }, 0) / areas.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting area analytics:', error);
      throw error;
    }
  }

  async getAreaStats(filters = {}) {
    try {
      const query = {};
      if (filters.site_id) {
        query.site_id = filters.site_id;
      }

      const areas = await SiteArea.find(query);
      
      const stats = {
        total_areas: areas.length,
        areas_by_type: areas.reduce((acc, area) => {
          acc[area.area_type] = (acc[area.area_type] || 0) + 1;
          return acc;
        }, {}),
        areas_by_status: areas.reduce((acc, area) => {
          acc[area.status] = (acc[area.status] || 0) + 1;
          return acc;
        }, {}),
        areas_by_site: areas.reduce((acc, area) => {
          const siteId = area.site_id.toString();
          acc[siteId] = (acc[siteId] || 0) + 1;
          return acc;
        }, {}),
        active_areas: areas.filter(a => a.status === 'ACTIVE').length,
        maintenance_areas: areas.filter(a => a.status === 'MAINTENANCE').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting area stats:', error);
      throw error;
    }
  }

  // ========== AREA ACCESS CONTROL ==========
  async getAreaAccessControls(areaId) {
    try {
      const accessControls = await AreaAccessControl.find({ area_id: areaId })
        .populate('area_id', 'area_name area_code')
        .populate('user_id', 'full_name email')
        .populate('granted_by', 'full_name email')
        .sort({ granted_at: -1 });

      return accessControls;
    } catch (error) {
      console.error('Error getting area access controls:', error);
      throw error;
    }
  }

  async grantAreaAccess(areaId, userId, accessLevel, grantedBy, notes = '') {
    try {
      const accessControl = new AreaAccessControl({
        area_id: areaId,
        user_id: userId,
        access_level: accessLevel,
        granted_by: grantedBy,
        granted_at: new Date(),
        status: 'ACTIVE',
        notes: notes
      });

      await accessControl.save();
      return accessControl;
    } catch (error) {
      console.error('Error granting area access:', error);
      throw error;
    }
  }

  async revokeAreaAccess(accessControlId, revokedBy, reason = '') {
    try {
      const accessControl = await AreaAccessControl.findByIdAndUpdate(
        accessControlId,
        {
          status: 'REVOKED',
          revoked_at: new Date(),
          revoked_by: revokedBy,
          revocation_reason: reason
        },
        { new: true }
      );

      return accessControl;
    } catch (error) {
      console.error('Error revoking area access:', error);
      throw error;
    }
  }

  // ========== AREA SAFETY ==========
  async getAreaSafetyChecklists(areaId) {
    try {
      const checklists = await AreaSafetyChecklist.find({ area_id: areaId })
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ created_at: -1 });

      return checklists;
    } catch (error) {
      console.error('Error getting area safety checklists:', error);
      throw error;
    }
  }

  async getAreaInspections(areaId) {
    try {
      const inspections = await AreaInspection.find({ area_id: areaId })
        .populate('area_id', 'area_name area_code')
        .populate('inspector_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ inspection_date: -1 });

      return inspections;
    } catch (error) {
      console.error('Error getting area inspections:', error);
      throw error;
    }
  }

  // ========== AREA WORK LOCATIONS ==========
  async getAreaWorkLocations(areaId) {
    try {
      const locations = await WorkLocation.find({ area_id: areaId })
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting area work locations:', error);
      throw error;
    }
  }

  // ========== AREA MANAGEMENT ==========
  async updateAreaStatus(id, status) {
    try {
      return await this.updateArea(id, { status });
    } catch (error) {
      console.error('Error updating area status:', error);
      throw error;
    }
  }

  async updateAreaCapacity(id, capacity) {
    try {
      return await this.updateArea(id, { capacity });
    } catch (error) {
      console.error('Error updating area capacity:', error);
      throw error;
    }
  }

  async updateAreaOccupancy(id, occupancy) {
    try {
      return await this.updateArea(id, { current_occupancy: occupancy });
    } catch (error) {
      console.error('Error updating area occupancy:', error);
      throw error;
    }
  }

  async getAreaUtilization(areaId) {
    try {
      const area = await this.getAreaById(areaId);
      const workLocations = await this.getAreaWorkLocations(areaId);
      const accessControls = await this.getAreaAccessControls(areaId);

      const utilization = {
        area: area,
        work_locations: workLocations.length,
        active_access_controls: accessControls.filter(ac => ac.status === 'ACTIVE').length,
        current_occupancy: area.current_occupancy || 0,
        capacity: area.capacity || 0,
        utilization_rate: area.capacity > 0 ? 
          ((area.current_occupancy || 0) / area.capacity * 100).toFixed(2) : 0
      };

      return utilization;
    } catch (error) {
      console.error('Error getting area utilization:', error);
      throw error;
    }
  }

  // ========== AREA SEARCH ==========
  async searchAreas(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { area_name: { $regex: searchTerm, $options: 'i' } },
          { area_code: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.site_id) {
        query.site_id = filters.site_id;
      }
      if (filters.area_type) {
        query.area_type = filters.area_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.supervisor_id) {
        query.supervisor_id = filters.supervisor_id;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name site_code')
        .populate('supervisor_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ area_code: 1 });

      return areas;
    } catch (error) {
      console.error('Error searching areas:', error);
      throw error;
    }
  }

  // ========== AREA REPORTS ==========
  async generateAreaReport(siteId) {
    try {
      const areas = await this.getSiteAreas(siteId);
      const analytics = await this.getAreaAnalytics(siteId);
      
      const report = {
        site_id: siteId,
        generated_at: new Date(),
        areas: areas,
        analytics: analytics,
        summary: {
          total_areas: analytics.total_areas,
          active_areas: analytics.active_areas,
          average_occupancy_rate: analytics.average_occupancy_rate
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating area report:', error);
      throw error;
    }
  }
}

module.exports = new SiteAreaRepository();
