const workLocationRepository = require('../repository/workLocationRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class WorkLocationService {
  // ========== WORK LOCATION MANAGEMENT ==========
  async getAllWorkLocations(filters = {}) {
    try {
      const locations = await workLocationRepository.getAllWorkLocations(filters);
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
      const requiredFields = ['location_name', 'location_code'];
      for (const field of requiredFields) {
        if (!locationData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      // Validate location
      const validation = await workLocationRepository.validateWorkLocation(locationData);

      if (!validation.valid) {
        return createResponse(400, validation.errors.join(', '));
      }

      const location = await workLocationRepository.createWorkLocation({
        ...locationData,
        created_by: userId
      });

      return createResponse(201, 'Tạo địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error creating work location:', error);
      return createResponse(500, 'Lỗi khi tạo địa điểm làm việc', null, error.message);
    }
  }

  async updateWorkLocation(id, updateData, userId) {
    try {
      const location = await workLocationRepository.updateWorkLocation(id, {
        ...updateData,
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
  async getActiveWorkLocations() {
    try {
      const locations = await workLocationRepository.getActiveWorkLocations();
      return createResponse(200, 'Lấy danh sách địa điểm làm việc đang hoạt động thành công',
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting active work locations:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm làm việc đang hoạt động', null, error.message);
    }
  }

  async getWorkLocationsByType(locationType) {
    try {
      const locations = await workLocationRepository.getWorkLocationsByType(locationType);
      return createResponse(200, `Lấy danh sách địa điểm ${locationType.toLowerCase()} thành công`,
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations by type:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm theo loại', null, error.message);
    }
  }

  async getWorkLocationsByRegion(region) {
    try {
      const locations = await workLocationRepository.getWorkLocationsByRegion(region);
      return createResponse(200, `Lấy danh sách địa điểm khu vực ${region} thành công`,
        transformDocumentsId(locations, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error getting work locations by region:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách địa điểm theo khu vực', null, error.message);
    }
  }

  async getWorkLocationsByStatus(status) {
    try {
      const locations = await workLocationRepository.getWorkLocationsByStatus(status);
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
      const validation = await workLocationRepository.validateWorkLocation(locationData);
      return createResponse(200, 'Kiểm tra địa điểm làm việc thành công', validation);
    } catch (error) {
      console.error('Error validating work location:', error);
      return createResponse(500, 'Lỗi khi kiểm tra địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION ANALYTICS ==========
  async getWorkLocationAnalytics() {
    try {
      const analytics = await workLocationRepository.getWorkLocationAnalytics();
      return createResponse(200, 'Lấy phân tích địa điểm làm việc thành công', analytics);
    } catch (error) {
      console.error('Error getting work location analytics:', error);
      return createResponse(500, 'Lỗi khi lấy phân tích địa điểm làm việc', null, error.message);
    }
  }

  async getWorkLocationStats(filters = {}) {
    try {
      const stats = await workLocationRepository.getWorkLocationStats(filters);
      return createResponse(200, 'Lấy thống kê địa điểm làm việc thành công', stats);
    } catch (error) {
      console.error('Error getting work location stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê địa điểm làm việc', null, error.message);
    }
  }

  // ========== WORK LOCATION SEARCH ==========
  async searchWorkLocations(searchTerm, filters = {}) {
    try {
      const locations = await workLocationRepository.searchWorkLocations(searchTerm, filters);
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
      const location = await workLocationRepository.activateWorkLocation(id);
      return createResponse(200, 'Kích hoạt địa điểm làm việc thành công',
        transformDocumentId(location, POPULATED_FIELDS.WORK_LOCATION));
    } catch (error) {
      console.error('Error activating work location:', error);
      return createResponse(500, 'Lỗi khi kích hoạt địa điểm làm việc', null, error.message);
    }
  }

  async deactivateWorkLocation(id, userId) {
    try {
      const location = await workLocationRepository.deactivateWorkLocation(id);
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
      const report = await workLocationRepository.generateWorkLocationReport();
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