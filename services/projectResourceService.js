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
      // Map frontend fields to backend fields
      const mappedData = {
        ...resourceData,
        planned_quantity: resourceData.planned_quantity || resourceData.quantity,
        unit_measure: resourceData.unit_measure || resourceData.unit,
        required_date: resourceData.required_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now
      };

      const requiredFields = ['project_id', 'resource_type', 'resource_name', 'planned_quantity', 'unit_measure'];
      for (const field of requiredFields) {
        if (!mappedData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      // Set default values for optional fields
      const resourceDataWithDefaults = {
        ...mappedData,
        actual_quantity: mappedData.actual_quantity || 0,
        status: mappedData.status || 'PLANNED'
      };

      const resource = new ProjectResource(resourceDataWithDefaults);
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

  async getAllResources(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.resource_type) {
        query.resource_type = filters.resource_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.search) {
        query.$or = [
          { resource_name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name')
        .sort({ created_at: -1 });

      return {
        success: true,
        data: resources,
        message: 'Lấy danh sách tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting all resources:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách tài nguyên',
        error: error.message
      };
    }
  }

  async getResourceStats(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId });
      const allocations = await ResourceAllocation.find({ 
        resource_id: { $in: resources.map(r => r._id) } 
      });

      const stats = {
        total_resources: resources.length,
        total_allocations: allocations.length,
        resources_by_type: {},
        resources_by_status: {},
        total_planned_quantity: 0,
        total_allocated_quantity: 0
      };

      resources.forEach(resource => {
        // Count by type
        stats.resources_by_type[resource.resource_type] = 
          (stats.resources_by_type[resource.resource_type] || 0) + 1;
        
        // Count by status
        stats.resources_by_status[resource.status] = 
          (stats.resources_by_status[resource.status] || 0) + 1;
        
        // Sum quantities
        stats.total_planned_quantity += resource.planned_quantity;
      });

      allocations.forEach(allocation => {
        stats.total_allocated_quantity += allocation.allocated_quantity;
      });

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

  async searchResources(query, filters = {}) {
    try {
      const searchQuery = {
        ...filters,
        $or: [
          { resource_name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      const resources = await ProjectResource.find(searchQuery)
        .populate('project_id', 'project_name')
        .sort({ created_at: -1 });

      return {
        success: true,
        data: resources,
        message: 'Tìm kiếm tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error searching resources:', error);
      return {
        success: false,
        message: 'Lỗi khi tìm kiếm tài nguyên',
        error: error.message
      };
    }
  }

  async getResourceOptions(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId })
        .select('resource_type resource_name status')
        .sort({ resource_name: 1 });

      const options = {
        resource_types: [...new Set(resources.map(r => r.resource_type))],
        resource_names: resources.map(r => ({
          id: r._id,
          name: r.resource_name,
          type: r.resource_type,
          status: r.status
        })),
        statuses: [...new Set(resources.map(r => r.status))]
      };

      return {
        success: true,
        data: options,
        message: 'Lấy tùy chọn tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource options:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy tùy chọn tài nguyên',
        error: error.message
      };
    }
  }

  async bulkCreateResources(resourcesData, userId) {
    try {
      const resources = await ProjectResource.insertMany(
        resourcesData.map(data => ({
          ...data,
          actual_quantity: data.actual_quantity || 0,
          status: data.status || 'PLANNED'
        }))
      );

      return {
        success: true,
        data: resources,
        message: 'Tạo hàng loạt tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error bulk creating resources:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo hàng loạt tài nguyên',
        error: error.message
      };
    }
  }

  async bulkUpdateResources(updates, userId) {
    try {
      const results = [];
      for (const update of updates) {
        const { id, ...updateData } = update;
        const resource = await ProjectResource.findByIdAndUpdate(
          id,
          { ...updateData, updated_at: new Date() },
          { new: true }
        );
        results.push(resource);
      }

      return {
        success: true,
        data: results,
        message: 'Cập nhật hàng loạt tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error bulk updating resources:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật hàng loạt tài nguyên',
        error: error.message
      };
    }
  }

  async bulkDeleteResources(ids, userId) {
    try {
      const result = await ProjectResource.deleteMany({ _id: { $in: ids } });

      return {
        success: true,
        data: { deletedCount: result.deletedCount },
        message: 'Xóa hàng loạt tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error bulk deleting resources:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa hàng loạt tài nguyên',
        error: error.message
      };
    }
  }

  async getResourceAllocation(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId });
      const resourceIds = resources.map(r => r._id);
      
      const allocations = await ResourceAllocation.find({ 
        resource_id: { $in: resourceIds } 
      })
        .populate('resource_id', 'resource_name resource_type')
        .populate('task_id', 'task_name task_code')
        .sort({ allocation_date: -1 });

      return {
        success: true,
        data: allocations,
        message: 'Lấy danh sách phân bổ tài nguyên thành công'
      };
    } catch (error) {
      console.error('Error getting resource allocation:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách phân bổ tài nguyên',
        error: error.message
      };
    }
  }
}

module.exports = new ProjectResourceService();
