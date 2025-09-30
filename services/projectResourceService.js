const ProjectResource = require('../models/projectResource');
const ResourceAllocation = require('../models/resourceAllocation');

class ProjectResourceService {
  async getProjectResources(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId })
        .populate('project_id', 'project_name')
        .sort({ resource_type: 1, resource_name: 1 });

      return {
        success: true,
        data: resources,
        message: 'Lấy danh sách tài nguyên dự án thành công'
      };
    } catch (error) {
      console.error('Error getting project resources:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách tài nguyên dự án',
        error: error.message
      };
    }
  }

  async getResourceById(id) {
    try {
      const resource = await ProjectResource.findById(id)
        .populate('project_id', 'project_name');

      if (!resource) {
        return {
          success: false,
          message: 'Không tìm thấy tài nguyên'
        };
      }

      return {
        success: true,
        data: resource,
        message: 'Lấy thông tin tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin tài nguyên',
        error: error.message
      };
    }
  }

  async createResource(resourceData, userId) {
    try {
      const requiredFields = ['project_id', 'resource_type', 'resource_name', 'planned_quantity', 'unit_cost', 'unit_measure', 'required_date'];
      for (const field of requiredFields) {
        if (!resourceData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const resource = new ProjectResource(resourceData);
      await resource.save();

      return {
        success: true,
        data: resource,
        message: 'Tạo tài nguyên dự án thành công'
      };
    } catch (error) {
      console.error('Error creating resource:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo tài nguyên dự án',
        error: error.message
      };
    }
  }

  async updateResource(id, updateData, userId) {
    try {
      const resource = await ProjectResource.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!resource) {
        return {
          success: false,
          message: 'Không tìm thấy tài nguyên'
        };
      }

      return {
        success: true,
        data: resource,
        message: 'Cập nhật tài nguyên dự án thành công'
      };
    } catch (error) {
      console.error('Error updating resource:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật tài nguyên dự án',
        error: error.message
      };
    }
  }

  async deleteResource(id, userId) {
    try {
      const resource = await ProjectResource.findByIdAndDelete(id);

      if (!resource) {
        return {
          success: false,
          message: 'Không tìm thấy tài nguyên'
        };
      }

      return {
        success: true,
        message: 'Xóa tài nguyên dự án thành công'
      };
    } catch (error) {
      console.error('Error deleting resource:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa tài nguyên dự án',
        error: error.message
      };
    }
  }

  async getResourceAllocations(resourceId) {
    try {
      const allocations = await ResourceAllocation.find({ resource_id: resourceId })
        .populate('task_id', 'task_name task_code')
        .sort({ allocation_date: -1 });

      return {
        success: true,
        data: allocations,
        message: 'Lấy danh sách phân bổ tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource allocations:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách phân bổ tài nguyên',
        error: error.message
      };
    }
  }

  async addResourceAllocation(allocationData, userId) {
    try {
      const requiredFields = ['resource_id', 'task_id', 'allocated_quantity'];
      for (const field of requiredFields) {
        if (!allocationData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const allocation = new ResourceAllocation(allocationData);
      await allocation.save();

      return {
        success: true,
        data: allocation,
        message: 'Thêm phân bổ tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error adding resource allocation:', error);
      return {
        success: false,
        message: 'Lỗi khi thêm phân bổ tài nguyên',
        error: error.message
      };
    }
  }

  async updateResourceAllocation(id, updateData, userId) {
    try {
      const allocation = await ResourceAllocation.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!allocation) {
        return {
          success: false,
          message: 'Không tìm thấy phân bổ tài nguyên'
        };
      }

      return {
        success: true,
        data: allocation,
        message: 'Cập nhật phân bổ tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error updating resource allocation:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật phân bổ tài nguyên',
        error: error.message
      };
    }
  }

  async removeResourceAllocation(id, userId) {
    try {
      const allocation = await ResourceAllocation.findByIdAndDelete(id);

      if (!allocation) {
        return {
          success: false,
          message: 'Không tìm thấy phân bổ tài nguyên'
        };
      }

      return {
        success: true,
        message: 'Xóa phân bổ tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error removing resource allocation:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa phân bổ tài nguyên',
        error: error.message
      };
    }
  }

  async getResourceAvailability(resourceType, startDate, endDate) {
    try {
      const resources = await ProjectResource.find({
        resource_type: resourceType,
        status: { $in: ['PLANNED', 'ORDERED', 'DELIVERED'] }
      });

      return {
        success: true,
        data: resources,
        message: 'Lấy thông tin khả dụng tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource availability:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin khả dụng tài nguyên',
        error: error.message
      };
    }
  }

  async getResourceStats(id) {
    try {
      const resource = await ProjectResource.findById(id);
      if (!resource) {
        return {
          success: false,
          message: 'Không tìm thấy tài nguyên'
        };
      }

      const allocations = await ResourceAllocation.find({ resource_id: id });
      const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.allocated_quantity, 0);
      const totalUsed = allocations.reduce((sum, allocation) => sum + allocation.actual_used_quantity, 0);

      const stats = {
        resource: resource,
        total_allocations: allocations.length,
        total_allocated_quantity: totalAllocated,
        total_used_quantity: totalUsed,
        remaining_quantity: resource.planned_quantity - totalAllocated
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê tài nguyên',
        error: error.message
      };
    }
  }
}

module.exports = new ProjectResourceService();
