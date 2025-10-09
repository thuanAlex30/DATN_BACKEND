const SiteArea = require('../models/siteArea');
const AreaAccessControl = require('../models/areaAccessControl');
const AreaSafetyChecklist = require('../models/areaSafetyChecklist');
const AreaInspection = require('../models/areaInspection');
const WorkLocation = require('../models/workLocation');

class SiteAreaService {
  // ========== SITE AREA MANAGEMENT ==========
  async getAllAreas(filters = {}) {
    try {
      let query = {};
      
      // Apply filters
      if (filters.site_id) {
        query.site_id = filters.site_id;
      }
      
      if (filters.search) {
        query.$or = [
          { area_name: { $regex: filters.search, $options: 'i' } },
          { area_code: { $regex: filters.search, $options: 'i' } },
          { area_type: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active === 'true' || filters.is_active === true;
      }

      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name address')
        .populate('supervisor_id', 'full_name email phone')
        .sort({ area_code: 1 });

      return {
        success: true,
        data: areas,
        message: 'Lấy danh sách khu vực thành công'
      };
    } catch (error) {
      console.error('Error getting all areas:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách khu vực',
        error: error.message
      };
    }
  }

  async getSiteAreas(siteId, projectId = null) {
    try {
      let query = { site_id: siteId };
      
      // Add project filter if provided
      if (projectId) {
        query.project_id = projectId;
      }
      
      const areas = await SiteArea.find(query)
        .populate('site_id', 'site_name')
        .populate('project_id', 'project_name')
        .populate('supervisor_id', 'full_name email')
        .sort({ area_code: 1 });

      return {
        success: true,
        data: areas,
        message: 'Lấy danh sách khu vực thành công'
      };
    } catch (error) {
      console.error('Error getting site areas:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách khu vực',
        error: error.message
      };
    }
  }

  async getAreaById(id) {
    try {
      const area = await SiteArea.findById(id)
        .populate('site_id', 'site_name address')
        .populate('supervisor_id', 'full_name email phone');

      if (!area) {
        return {
          success: false,
          message: 'Không tìm thấy khu vực'
        };
      }

      return {
        success: true,
        data: area,
        message: 'Lấy thông tin khu vực thành công'
      };
    } catch (error) {
      console.error('Error getting area:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin khu vực',
        error: error.message
      };
    }
  }

  async createArea(areaData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['site_id', 'project_id', 'area_name', 'area_type', 'area_size_sqm', 'safety_level', 'supervisor_id'];
      for (const field of requiredFields) {
        if (!areaData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      // Generate unique area code per project
      const projectAreaCount = await SiteArea.countDocuments({ project_id: areaData.project_id });
      const areaCode = `KVA${String(projectAreaCount + 1).padStart(3, '0')}`;

      const area = new SiteArea({
        ...areaData,
        area_code: areaCode
      });

      await area.save();

      return {
        success: true,
        data: area,
        message: 'Tạo khu vực thành công'
      };
    } catch (error) {
      console.error('Error creating area:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo khu vực',
        error: error.message
      };
    }
  }

  async updateArea(id, updateData, userId) {
    try {
      const area = await SiteArea.findById(id);
      if (!area) {
        return {
          success: false,
          message: 'Không tìm thấy khu vực'
        };
      }

      const updatedArea = await SiteArea.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      return {
        success: true,
        data: updatedArea,
        message: 'Cập nhật khu vực thành công'
      };
    } catch (error) {
      console.error('Error updating area:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật khu vực',
        error: error.message
      };
    }
  }

  async deleteArea(id, userId) {
    try {
      const area = await SiteArea.findById(id);
      if (!area) {
        return {
          success: false,
          message: 'Không tìm thấy khu vực'
        };
      }

      // Check if area has locations
      const locations = await WorkLocation.find({ area_id: id });
      if (locations.length > 0) {
        return {
          success: false,
          message: 'Không thể xóa khu vực có vị trí làm việc'
        };
      }

      await SiteArea.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Xóa khu vực thành công'
      };
    } catch (error) {
      console.error('Error deleting area:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa khu vực',
        error: error.message
      };
    }
  }

  // ========== AREA ACCESS CONTROLS ==========
  async getAreaAccessControls(areaId) {
    try {
      const accessControls = await AreaAccessControl.find({ area_id: areaId })
        .populate('user_id', 'full_name email')
        .populate('authorized_by', 'full_name email')
        .sort({ granted_at: -1 });

      return {
        success: true,
        data: accessControls,
        message: 'Lấy danh sách kiểm soát truy cập thành công'
      };
    } catch (error) {
      console.error('Error getting area access controls:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách kiểm soát truy cập',
        error: error.message
      };
    }
  }

  async addAreaAccessControl(accessData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'user_id', 'access_level', 'valid_to'];
      for (const field of requiredFields) {
        if (!accessData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const accessControl = new AreaAccessControl({
        ...accessData,
        authorized_by: userId
      });

      await accessControl.save();

      return {
        success: true,
        data: accessControl,
        message: 'Thêm kiểm soát truy cập thành công'
      };
    } catch (error) {
      console.error('Error adding area access control:', error);
      return {
        success: false,
        message: 'Lỗi khi thêm kiểm soát truy cập',
        error: error.message
      };
    }
  }

  async updateAreaAccessControl(id, updateData, userId) {
    try {
      const accessControl = await AreaAccessControl.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!accessControl) {
        return {
          success: false,
          message: 'Không tìm thấy kiểm soát truy cập'
        };
      }

      return {
        success: true,
        data: accessControl,
        message: 'Cập nhật kiểm soát truy cập thành công'
      };
    } catch (error) {
      console.error('Error updating area access control:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật kiểm soát truy cập',
        error: error.message
      };
    }
  }

  async removeAreaAccessControl(id, userId) {
    try {
      const accessControl = await AreaAccessControl.findByIdAndDelete(id);

      if (!accessControl) {
        return {
          success: false,
          message: 'Không tìm thấy kiểm soát truy cập'
        };
      }

      return {
        success: true,
        message: 'Xóa kiểm soát truy cập thành công'
      };
    } catch (error) {
      console.error('Error removing area access control:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa kiểm soát truy cập',
        error: error.message
      };
    }
  }

  // ========== AREA SAFETY CHECKLISTS ==========
  async getAreaSafetyChecklists(areaId) {
    try {
      const checklists = await AreaSafetyChecklist.find({ area_id: areaId })
        .sort({ created_at: -1 });

      return {
        success: true,
        data: checklists,
        message: 'Lấy danh sách checklist an toàn thành công'
      };
    } catch (error) {
      console.error('Error getting area safety checklists:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách checklist an toàn',
        error: error.message
      };
    }
  }

  async createAreaSafetyChecklist(checklistData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'checklist_name', 'safety_items', 'frequency'];
      for (const field of requiredFields) {
        if (!checklistData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const checklist = new AreaSafetyChecklist(checklistData);
      await checklist.save();

      return {
        success: true,
        data: checklist,
        message: 'Tạo checklist an toàn thành công'
      };
    } catch (error) {
      console.error('Error creating area safety checklist:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo checklist an toàn',
        error: error.message
      };
    }
  }

  // ========== AREA INSPECTIONS ==========
  async getAreaInspections(areaId) {
    try {
      const inspections = await AreaInspection.find({ area_id: areaId })
        .populate('checklist_id', 'checklist_name')
        .populate('inspector_id', 'full_name email')
        .sort({ inspection_date: -1 });

      return {
        success: true,
        data: inspections,
        message: 'Lấy danh sách kiểm tra thành công'
      };
    } catch (error) {
      console.error('Error getting area inspections:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách kiểm tra',
        error: error.message
      };
    }
  }

  async createAreaInspection(inspectionData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'checklist_id', 'inspector_id', 'inspection_results', 'overall_status'];
      for (const field of requiredFields) {
        if (!inspectionData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const inspection = new AreaInspection({
        ...inspectionData,
        inspector_id: userId
      });

      await inspection.save();

      return {
        success: true,
        data: inspection,
        message: 'Tạo kiểm tra khu vực thành công'
      };
    } catch (error) {
      console.error('Error creating area inspection:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo kiểm tra khu vực',
        error: error.message
      };
    }
  }

  async updateAreaInspection(id, updateData, userId) {
    try {
      const inspection = await AreaInspection.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!inspection) {
        return {
          success: false,
          message: 'Không tìm thấy kiểm tra'
        };
      }

      return {
        success: true,
        data: inspection,
        message: 'Cập nhật kiểm tra thành công'
      };
    } catch (error) {
      console.error('Error updating area inspection:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật kiểm tra',
        error: error.message
      };
    }
  }

  async getAreaStats(id) {
    try {
      const area = await SiteArea.findById(id);
      if (!area) {
        return {
          success: false,
          message: 'Không tìm thấy khu vực'
        };
      }

      const locations = await WorkLocation.find({ area_id: id });
      const accessControls = await AreaAccessControl.find({ area_id: id, is_active: true });
      const inspections = await AreaInspection.find({ area_id: id });
      const recentInspections = await AreaInspection.find({ area_id: id })
        .sort({ inspection_date: -1 })
        .limit(5);

      const stats = {
        area: area,
        total_locations: locations.length,
        total_access_controls: accessControls.length,
        total_inspections: inspections.length,
        recent_inspections: recentInspections,
        safety_level: area.safety_level,
        area_size_sqm: area.area_size_sqm
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê khu vực thành công'
      };
    } catch (error) {
      console.error('Error getting area stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê khu vực',
        error: error.message
      };
    }
  }
}

module.exports = new SiteAreaService();
