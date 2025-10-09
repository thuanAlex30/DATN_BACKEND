const siteRepository = require('../repository/siteRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class SiteService {
  // ========== SITE MANAGEMENT ==========
  async getAllSites(filters = {}) {
    try {
      const sites = await siteRepository.getAllSites(filters);
      return createResponse(200, 'Lấy danh sách công trường thành công', 
        transformDocumentsId(sites, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error getting sites:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách công trường', null, error.message);
    }
  }

  async getSiteById(id) {
    try {
      const site = await siteRepository.getSiteById(id);

      if (!site) {
        return createResponse(404, 'Không tìm thấy công trường');
      }

      return createResponse(200, 'Lấy thông tin công trường thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error getting site:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin công trường', null, error.message);
    }
  }

  async createSite(siteData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['site_name', 'address'];
      for (const field of requiredFields) {
        if (!siteData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Check if site name already exists
      const existingSites = await siteRepository.getAllSites({ site_name: siteData.site_name });
      if (existingSites.length > 0) {
        return createResponse(400, 'Tên công trường đã tồn tại');
      }

      const site = await siteRepository.createSite(siteData);
      return createResponse(201, 'Tạo công trường thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error creating site:', error);
      return createResponse(500, 'Lỗi khi tạo công trường', null, error.message);
    }
  }

  async updateSite(id, updateData, userId) {
    try {
      const site = await siteRepository.updateSite(id, updateData);

      if (!site) {
        return createResponse(404, 'Không tìm thấy công trường');
      }

      return createResponse(200, 'Cập nhật công trường thành công',
        transformDocumentId(site, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error updating site:', error);
      return createResponse(500, 'Lỗi khi cập nhật công trường', null, error.message);
    }
  }

  async deleteSite(id, userId) {
    try {
      const site = await siteRepository.deleteSite(id);

      if (!site) {
        return createResponse(404, 'Không tìm thấy công trường');
      }

      return createResponse(200, 'Xóa công trường thành công');
    } catch (error) {
      console.error('Error deleting site:', error);
      return createResponse(500, 'Lỗi khi xóa công trường', null, error.message);
    }
  }

  // ========== SITE AREA MANAGEMENT ==========
  async getAreasBySite(siteId) {
    try {
      const areas = await siteRepository.getAreasBySite(siteId);
      return createResponse(200, 'Lấy danh sách khu vực thành công',
        transformDocumentsId(areas, POPULATED_FIELDS.SITE_AREA));
    } catch (error) {
      console.error('Error getting areas:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách khu vực', null, error.message);
    }
  }

  async getAreaById(id) {
    try {
      const area = await siteRepository.getAreaById(id);

      if (!area) {
        return createResponse(404, 'Không tìm thấy khu vực');
      }

      return createResponse(200, 'Lấy thông tin khu vực thành công',
        transformDocumentId(area, POPULATED_FIELDS.SITE_AREA));
    } catch (error) {
      console.error('Error getting area:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin khu vực', null, error.message);
    }
  }

  async createArea(areaData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_name', 'area_type', 'site_id'];
      for (const field of requiredFields) {
        if (!areaData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      const area = await siteRepository.createArea(areaData);
      return createResponse(201, 'Tạo khu vực thành công',
        transformDocumentId(area, POPULATED_FIELDS.SITE_AREA));
    } catch (error) {
      console.error('Error creating area:', error);
      return createResponse(500, 'Lỗi khi tạo khu vực', null, error.message);
    }
  }

  async updateArea(id, updateData, userId) {
    try {
      const area = await siteRepository.updateArea(id, updateData);

      if (!area) {
        return createResponse(404, 'Không tìm thấy khu vực');
      }

      return createResponse(200, 'Cập nhật khu vực thành công',
        transformDocumentId(area, POPULATED_FIELDS.SITE_AREA));
    } catch (error) {
      console.error('Error updating area:', error);
      return createResponse(500, 'Lỗi khi cập nhật khu vực', null, error.message);
    }
  }

  async deleteArea(id, userId) {
    try {
      const area = await siteRepository.deleteArea(id);

      if (!area) {
        return createResponse(404, 'Không tìm thấy khu vực');
      }

      return createResponse(200, 'Xóa khu vực thành công');
    } catch (error) {
      console.error('Error deleting area:', error);
      return createResponse(500, 'Lỗi khi xóa khu vực', null, error.message);
    }
  }

  // ========== WORK LOCATION MANAGEMENT ==========
  async getWorkLocationsByArea(areaId) {
    try {
      const locations = await siteRepository.getWorkLocationsByArea(areaId);
      return createResponse(200, 'Lấy danh sách vị trí làm việc thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách vị trí làm việc', null, error.message);
    }
  }

  async getWorkLocationById(id) {
    try {
      const location = await siteRepository.getWorkLocationById(id);

      if (!location) {
        return createResponse(404, 'Không tìm thấy vị trí làm việc');
      }

      return createResponse(200, 'Lấy thông tin vị trí làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work location:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin vị trí làm việc', null, error.message);
    }
  }

  async createWorkLocation(locationData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['location_name', 'area_id'];
      for (const field of requiredFields) {
        if (!locationData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      const location = await siteRepository.createWorkLocation(locationData);
      return createResponse(201, 'Tạo vị trí làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error creating work location:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        return createResponse(409, `Mã địa điểm "${value}" đã tồn tại. Vui lòng chọn mã khác.`);
      }
      
      return createResponse(500, 'Lỗi khi tạo vị trí làm việc', null, error.message);
    }
  }

  async updateWorkLocation(id, updateData, userId) {
    try {
      const location = await siteRepository.updateWorkLocation(id, updateData);

      if (!location) {
        return createResponse(404, 'Không tìm thấy vị trí làm việc');
      }

      return createResponse(200, 'Cập nhật vị trí làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error updating work location:', error);
      return createResponse(500, 'Lỗi khi cập nhật vị trí làm việc', null, error.message);
    }
  }

  async deleteWorkLocation(id, userId) {
    try {
      const location = await siteRepository.deleteWorkLocation(id);

      if (!location) {
        return createResponse(404, 'Không tìm thấy vị trí làm việc');
      }

      return createResponse(200, 'Xóa vị trí làm việc thành công');
    } catch (error) {
      console.error('Error deleting work location:', error);
      return createResponse(500, 'Lỗi khi xóa vị trí làm việc', null, error.message);
    }
  }

  // ========== SITE ANALYTICS ==========
  async getSiteAnalytics(siteId) {
    try {
      const analytics = await siteRepository.getSiteAnalytics(siteId);
      
      if (!analytics) {
        return createResponse(404, 'Không tìm thấy công trường');
      }

      return createResponse(200, 'Lấy phân tích công trường thành công', analytics);
    } catch (error) {
      console.error('Error getting site analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích công trường', null, error.message);
    }
  }

  async getSiteStats(filters = {}) {
    try {
      const stats = await siteRepository.getSiteStats(filters);
      return createResponse(200, 'Lấy thống kê công trường thành công', stats);
    } catch (error) {
      console.error('Error getting site stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê công trường', null, error.message);
    }
  }

  // ========== SEARCH AND FILTER ==========
  async searchSites(searchTerm, filters = {}) {
    try {
      const sites = await siteRepository.searchSites(searchTerm, filters);
      return createResponse(200, 'Tìm kiếm công trường thành công',
        transformDocumentsId(sites, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error searching sites:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm công trường', null, error.message);
    }
  }

  async getSitesByLocation(location) {
    try {
      const sites = await siteRepository.getSitesByLocation(location);
      return createResponse(200, 'Lấy công trường theo vị trí thành công',
        transformDocumentsId(sites, POPULATED_FIELDS.SITE));
    } catch (error) {
      console.error('Error getting sites by location:', error);
      return createResponse(500, 'Lỗi khi lấy công trường theo vị trí', null, error.message);
    }
  }
}

module.exports = new SiteService();