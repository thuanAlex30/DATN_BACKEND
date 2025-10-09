const workLocationRepository = require('../repository/workLocationRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class WorkLocationService {
  // ========== WORK LOCATION MANAGEMENT ==========
  async getAllWorkLocations(filters = {}) {
    try {
      const locations = await workLocationRepository.getAllLocations(filters);
      return createResponse(200, 'Lấy danh sách địa điểm làm việc thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm làm việc', null, error.message);
    }
  }

  async getWorkLocationById(id) {
    try {
      const location = await workLocationRepository.getWorkLocationById(id);

      if (!location) {
        return createResponse(404, 'Không tìm thấy địa điểm làm việc');
      }

      return createResponse(200, 'Lấy thông tin địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work location:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin địa điểm làm việc', null, error.message);
    }
  }

  async createWorkLocation(locationData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['area_id', 'project_id', 'location_name', 'location_code'];
      for (const field of requiredFields) {
        if (!locationData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Check for duplicate location code
      const existingLocation = await workLocationRepository.getLocationByCode(locationData.location_code);
      if (existingLocation) {
        return createResponse(409, `Mã địa điểm "${locationData.location_code}" đã tồn tại. Vui lòng chọn mã khác.`);
      }

      // Safety equipment is already in correct format from frontend
      const transformedData = {
        ...locationData
      };

      const location = await workLocationRepository.createLocation({
        ...transformedData,
        created_by: userId
      });

      return createResponse(201, 'Tạo địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error creating work location:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        return createResponse(409, `Mã địa điểm "${value}" đã tồn tại. Vui lòng chọn mã khác.`);
      }
      
      return createResponse(500, 'Lỗi khi tạo địa điểm làm việc', null, error.message);
    }
  }

  async updateLocation(id, updateData, userId) {
    try {
      // Safety equipment is already in correct format from frontend
      const transformedData = {
        ...updateData
      };

      const location = await workLocationRepository.updateLocation(id, {
        ...transformedData,
        updated_by: userId
      });

      if (!location) {
        return createResponse(404, 'Không tìm thấy địa điểm làm việc');
      }

      return createResponse(200, 'Cập nhật địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error updating work location:', error);
      return createResponse(500, 'Lỗi khi cập nhật địa điểm làm việc', null, error.message);
    }
  }

  async deleteWorkLocation(id, userId) {
    try {
      const location = await workLocationRepository.deleteWorkLocation(id);

      if (!location) {
        return createResponse(404, 'Không tìm thấy địa điểm làm việc');
      }

      return createResponse(200, 'Xóa địa điểm làm việc thành công');
    } catch (error) {
      console.error('Error deleting work location:', error);
      return createResponse(500, 'Lỗi khi xóa địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION QUERIES ==========
  async getAreaLocations(areaId, projectId = null) {
    try {
      const locations = await workLocationRepository.getAreaLocations(areaId, projectId);
      return createResponse(200, 'Lấy danh sách địa điểm làm việc theo khu vực thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting area locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm làm việc theo khu vực', null, error.message);
    }
  }

  async getActiveWorkLocations() {
    try {
      const locations = await workLocationRepository.getActiveLocations();
      return createResponse(200, 'Lấy danh sách địa điểm làm việc đang hoạt động thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting active work locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm làm việc đang hoạt động', null, error.message);
    }
  }

  async getProjectLocations(projectId) {
    try {
      const locations = await workLocationRepository.getProjectLocations(projectId);
      return createResponse(200, 'Lấy danh sách địa điểm làm việc theo dự án thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting project locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm làm việc theo dự án', null, error.message);
    }
  }

  async getWorkLocationsByType(locationType) {
    try {
      const locations = await workLocationRepository.getLocationsByType(locationType);
      return createResponse(200, `Lấy danh sách địa điểm ${locationType.toLowerCase()} thành công`,
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations by type:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm theo loại', null, error.message);
    }
  }

  async getWorkLocationsByRegion(region) {
    try {
      const locations = await workLocationRepository.getAllLocations({ region });
      return createResponse(200, `Lấy danh sách địa điểm khu vực ${region} thành công`,
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations by region:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm theo khu vực', null, error.message);
    }
  }

  async getWorkLocationsByStatus(status) {
    try {
      const locations = await workLocationRepository.getLocationsByStatus(status);
      return createResponse(200, `Lấy danh sách địa điểm ${status.toLowerCase()} thành công`,
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations by status:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm theo trạng thái', null, error.message);
    }
  }

  // ========== WORK LOCATION VALIDATION ==========
  async validateWorkLocation(locationData) {
    try {
      // Simple validation - check if location_name and location_code are provided
      if (!locationData.location_name || !locationData.location_code) {
        return createResponse(400, 'Tên địa điểm và mã địa điểm là bắt buộc');
      }
      return createResponse(200, 'Kiểm tra địa điểm làm việc thành công', { valid: true });
    } catch (error) {
      console.error('Error validating work location:', error);
      return createResponse(500, 'Lỗi khi kiểm tra địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION ANALYTICS ==========
  async getWorkLocationAnalytics() {
    try {
      const locations = await workLocationRepository.getAllLocations();
      const analytics = {
        total: locations.length,
        active: locations.filter(l => l.status === 'ACTIVE').length,
        inactive: locations.filter(l => l.status === 'INACTIVE').length
      };
      return createResponse(200, 'Lấy phân tích địa điểm làm việc thành công', analytics);
    } catch (error) {
      console.error('Error getting work location analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích địa điểm làm việc', null, error.message);
    }
  }

  async getWorkLocationStats(filters = {}) {
    try {
      const locations = await workLocationRepository.getAllLocations(filters);
      const stats = {
        total: locations.length,
        by_type: {},
        by_status: {}
      };
      
      locations.forEach(location => {
        stats.by_type[location.location_type] = (stats.by_type[location.location_type] || 0) + 1;
        stats.by_status[location.status] = (stats.by_status[location.status] || 0) + 1;
      });
      
      return createResponse(200, 'Lấy thống kê địa điểm làm việc thành công', stats);
    } catch (error) {
      console.error('Error getting work location stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION SEARCH ==========
  async searchWorkLocations(searchTerm, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        location_name: searchTerm
      };
      const locations = await workLocationRepository.getAllLocations(searchFilters);
      return createResponse(200, 'Tìm kiếm địa điểm làm việc thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error searching work locations:', error);
      return createResponse(500, 'Lỗi khi tìm kiếm địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION MANAGEMENT ==========
  async activateWorkLocation(id, userId) {
    try {
      const location = await workLocationRepository.updateWorkLocation(id, { 
        status: 'ACTIVE',
        updated_by: userId 
      });
      return createResponse(200, 'Kích hoạt địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error activating work location:', error);
      return createResponse(500, 'Lỗi khi kích hoạt địa điểm làm việc', null, error.message);
    }
  }

  async deactivateWorkLocation(id, userId) {
    try {
      const location = await workLocationRepository.updateWorkLocation(id, { 
        status: 'INACTIVE',
        updated_by: userId 
      });
      return createResponse(200, 'Vô hiệu hóa địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error deactivating work location:', error);
      return createResponse(500, 'Lỗi khi vô hiệu hóa địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION REPORTS ==========
  async generateWorkLocationReport() {
    try {
      const locations = await workLocationRepository.getAllLocations();
      const report = {
        generated_at: new Date(),
        total_locations: locations.length,
        locations: locations.map(location => ({
          id: location._id,
          name: location.location_name,
          code: location.location_code,
          type: location.location_type,
          status: location.status
        }))
      };
      return createResponse(200, 'Tạo báo cáo địa điểm làm việc thành công', report);
    } catch (error) {
      console.error('Error generating work location report:', error);
      return createResponse(500, 'Lỗi khi tạo báo cáo địa điểm làm việc', null, error.message);
    }
  }

  // ========== LOCATION ASSIGNMENTS ==========
  async getLocationAssignments(locationId) {
    try {
      const assignments = await workLocationRepository.getLocationAssignments(locationId);
      return createResponse(200, 'Lấy danh sách phân công địa điểm thành công', assignments);
    } catch (error) {
      console.error('Error getting location assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công địa điểm', null, error.message);
    }
  }

  async addLocationAssignment(locationId, assignmentData, assignedBy) {
    try {
      const assignment = await workLocationRepository.addLocationAssignment(locationId, assignmentData, assignedBy);
      return createResponse(201, 'Thêm phân công địa điểm thành công', assignment);
    } catch (error) {
      console.error('Error adding location assignment:', error);
      return createResponse(500, 'Lỗi khi thêm phân công địa điểm', null, error.message);
    }
  }

  async updateLocationAssignment(assignmentId, updateData, updatedBy) {
    try {
      const assignment = await workLocationRepository.updateLocationAssignment(assignmentId, updateData, updatedBy);
      return createResponse(200, 'Cập nhật phân công địa điểm thành công', assignment);
    } catch (error) {
      console.error('Error updating location assignment:', error);
      return createResponse(500, 'Lỗi khi cập nhật phân công địa điểm', null, error.message);
    }
  }

  async removeLocationAssignment(assignmentId, removedBy) {
    try {
      const assignment = await workLocationRepository.removeLocationAssignment(assignmentId, removedBy);
      return createResponse(200, 'Xóa phân công địa điểm thành công', assignment);
    } catch (error) {
      console.error('Error removing location assignment:', error);
      return createResponse(500, 'Lỗi khi xóa phân công địa điểm', null, error.message);
    }
  }

  // ========== LOCATION AVAILABILITY ==========
  async getLocationAvailability(locationId, startDate, endDate) {
    try {
      const availability = await workLocationRepository.getLocationAvailability(locationId, startDate, endDate);
      return createResponse(200, 'Lấy thông tin khả dụng địa điểm thành công', availability);
    } catch (error) {
      console.error('Error getting location availability:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin khả dụng địa điểm', null, error.message);
    }
  }
}

module.exports = new WorkLocationService();