const ProjectResource = require('../models/projectResource');
const ResourceAllocation = require('../models/resourceAllocation');

class ProjectResourceRepository {
  // ========== BASIC CRUD ==========
  async getAllResources(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.resource_type) {
        query.resource_type = filters.resource_type;
      }
      if (filters.resource_name) {
        query.resource_name = { $regex: filters.resource_name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.availability) {
        query.availability = filters.availability;
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_type: 1, resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error getting resources:', error);
      throw error;
    }
  }

  async getResourceById(id) {
    try {
      const resource = await ProjectResource.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return resource;
    } catch (error) {
      console.error('Error getting resource by id:', error);
      throw error;
    }
  }

  async createResource(resourceData) {
    try {
      const resource = new ProjectResource(resourceData);
      await resource.save();
      
      return await this.getResourceById(resource._id);
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  async updateResource(id, updateData) {
    try {
      const resource = await ProjectResource.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return resource;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  async deleteResource(id) {
    try {
      const resource = await ProjectResource.findByIdAndDelete(id);
      return resource;
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  // ========== PROJECT RESOURCE QUERIES ==========
  async getProjectResources(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_type: 1, resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error getting project resources:', error);
      throw error;
    }
  }

  async getResourcesByType(resourceType, projectId = null) {
    try {
      const query = { resource_type: resourceType };
      if (projectId) {
        query.project_id = projectId;
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error getting resources by type:', error);
      throw error;
    }
  }

  async getResourcesByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error getting resources by status:', error);
      throw error;
    }
  }

  async getAvailableResources(projectId = null) {
    try {
      const query = { availability: 'AVAILABLE' };
      if (projectId) {
        query.project_id = projectId;
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_type: 1, resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error getting available resources:', error);
      throw error;
    }
  }

  async getResourceUtilization(resourceId) {
    try {
      const allocations = await ResourceAllocation.find({ resource_id: resourceId })
        .populate('resource_id', 'resource_name resource_type')
        .populate('task_id', 'task_name task_code')
        .populate('allocated_by', 'full_name email')
        .sort({ start_date: 1 });

      return allocations;
    } catch (error) {
      console.error('Error getting resource utilization:', error);
      throw error;
    }
  }

  // ========== RESOURCE VALIDATION ==========
  async validateResource(resourceData) {
    try {
      const errors = [];

      // Check required fields
      if (!resourceData.project_id) {
        errors.push('Project ID is required');
      }
      if (!resourceData.resource_name) {
        errors.push('Resource name is required');
      }
      if (!resourceData.resource_type) {
        errors.push('Resource type is required');
      }
      if (!resourceData.quantity) {
        errors.push('Quantity is required');
      }

      // Check if resource type is valid
      const validResourceTypes = ['HUMAN', 'EQUIPMENT', 'MATERIAL', 'FACILITY', 'TECHNOLOGY', 'OTHER'];
      if (resourceData.resource_type && !validResourceTypes.includes(resourceData.resource_type)) {
        errors.push('Invalid resource type');
      }

      // Check if status is valid
      const validStatuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'];
      if (resourceData.status && !validStatuses.includes(resourceData.status)) {
        errors.push('Invalid status');
      }

      // Check if availability is valid
      const validAvailability = ['AVAILABLE', 'ALLOCATED', 'UNAVAILABLE', 'RESERVED'];
      if (resourceData.availability && !validAvailability.includes(resourceData.availability)) {
        errors.push('Invalid availability');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating resource:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== RESOURCE ANALYTICS ==========
  async getResourceAnalytics(projectId) {
    try {
      const resources = await ProjectResource.find({ project_id: projectId });
      
      const analytics = {
        total_resources: resources.length,
        active_resources: resources.filter(r => r.status === 'ACTIVE').length,
        available_resources: resources.filter(r => r.availability === 'AVAILABLE').length,
        allocated_resources: resources.filter(r => r.availability === 'ALLOCATED').length,
        unavailable_resources: resources.filter(r => r.availability === 'UNAVAILABLE').length,
        resources_by_type: resources.reduce((acc, resource) => {
          acc[resource.resource_type] = (acc[resource.resource_type] || 0) + 1;
          return acc;
        }, {}),
        resources_by_status: resources.reduce((acc, resource) => {
          acc[resource.status] = (acc[resource.status] || 0) + 1;
          return acc;
        }, {}),
        resources_by_availability: resources.reduce((acc, resource) => {
          acc[resource.availability] = (acc[resource.availability] || 0) + 1;
          return acc;
        }, {}),
        total_quantity: resources.reduce((sum, resource) => sum + (resource.quantity || 0), 0),
        utilization_rate: resources.length > 0 ? 
          (resources.filter(r => r.availability === 'ALLOCATED').length / resources.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting resource analytics:', error);
      throw error;
    }
  }

  async getResourceStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const resources = await ProjectResource.find(query);
      
      const stats = {
        total_resources: resources.length,
        resources_by_type: resources.reduce((acc, resource) => {
          acc[resource.resource_type] = (acc[resource.resource_type] || 0) + 1;
          return acc;
        }, {}),
        resources_by_status: resources.reduce((acc, resource) => {
          acc[resource.status] = (acc[resource.status] || 0) + 1;
          return acc;
        }, {}),
        resources_by_availability: resources.reduce((acc, resource) => {
          acc[resource.availability] = (acc[resource.availability] || 0) + 1;
          return acc;
        }, {}),
        resources_by_project: resources.reduce((acc, resource) => {
          const projectId = resource.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        available_resources: resources.filter(r => r.availability === 'AVAILABLE').length,
        allocated_resources: resources.filter(r => r.availability === 'ALLOCATED').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting resource stats:', error);
      throw error;
    }
  }

  // ========== RESOURCE ALLOCATION ==========
  async allocateResource(resourceId, taskId, startDate, endDate, quantity, allocatedBy) {
    try {
      const allocation = new ResourceAllocation({
        resource_id: resourceId,
        task_id: taskId,
        start_date: startDate,
        end_date: endDate,
        quantity: quantity,
        allocated_by: allocatedBy,
        status: 'ACTIVE'
      });

      await allocation.save();

      // Update resource availability
      await this.updateResource(resourceId, { availability: 'ALLOCATED' });

      return allocation;
    } catch (error) {
      console.error('Error allocating resource:', error);
      throw error;
    }
  }

  async deallocateResource(allocationId, deallocatedBy) {
    try {
      const allocation = await ResourceAllocation.findByIdAndUpdate(
        allocationId,
        {
          status: 'DEALLOCATED',
          deallocated_at: new Date(),
          deallocated_by: deallocatedBy
        },
        { new: true }
      );

      if (allocation) {
        // Check if resource has other active allocations
        const activeAllocations = await ResourceAllocation.find({
          resource_id: allocation.resource_id,
          status: 'ACTIVE'
        });

        if (activeAllocations.length === 0) {
          // Update resource availability to available
          await this.updateResource(allocation.resource_id, { availability: 'AVAILABLE' });
        }
      }

      return allocation;
    } catch (error) {
      console.error('Error deallocating resource:', error);
      throw error;
    }
  }

  async getResourceAllocations(resourceId) {
    try {
      const allocations = await ResourceAllocation.find({ resource_id: resourceId })
        .populate('resource_id', 'resource_name resource_type')
        .populate('task_id', 'task_name task_code')
        .populate('allocated_by', 'full_name email')
        .populate('deallocated_by', 'full_name email')
        .sort({ start_date: -1 });

      return allocations;
    } catch (error) {
      console.error('Error getting resource allocations:', error);
      throw error;
    }
  }

  async getTaskAllocations(taskId) {
    try {
      const allocations = await ResourceAllocation.find({ task_id: taskId })
        .populate('resource_id', 'resource_name resource_type')
        .populate('task_id', 'task_name task_code')
        .populate('allocated_by', 'full_name email')
        .populate('deallocated_by', 'full_name email')
        .sort({ start_date: -1 });

      return allocations;
    } catch (error) {
      console.error('Error getting task allocations:', error);
      throw error;
    }
  }

  // ========== RESOURCE MANAGEMENT ==========
  async updateResourceAvailability(id, availability) {
    try {
      return await this.updateResource(id, { availability });
    } catch (error) {
      console.error('Error updating resource availability:', error);
      throw error;
    }
  }

  async reserveResource(id, reservedBy, reservationNotes = '') {
    try {
      const updateData = {
        availability: 'RESERVED',
        reserved_by: reservedBy,
        reserved_at: new Date(),
        reservation_notes: reservationNotes
      };

      return await this.updateResource(id, updateData);
    } catch (error) {
      console.error('Error reserving resource:', error);
      throw error;
    }
  }

  async releaseResource(id, releasedBy) {
    try {
      const updateData = {
        availability: 'AVAILABLE',
        released_by: releasedBy,
        released_at: new Date()
      };

      return await this.updateResource(id, updateData);
    } catch (error) {
      console.error('Error releasing resource:', error);
      throw error;
    }
  }

  // ========== RESOURCE SEARCH ==========
  async searchResources(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { resource_name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { specifications: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.resource_type) {
        query.resource_type = filters.resource_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.availability) {
        query.availability = filters.availability;
      }

      const resources = await ProjectResource.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ resource_type: 1, resource_name: 1 });

      return resources;
    } catch (error) {
      console.error('Error searching resources:', error);
      throw error;
    }
  }

  // ========== RESOURCE REPORTS ==========
  async generateResourceReport(projectId) {
    try {
      const resources = await this.getProjectResources(projectId);
      const analytics = await this.getResourceAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        resources: resources,
        analytics: analytics,
        summary: {
          total_resources: analytics.total_resources,
          available_resources: analytics.available_resources,
          allocated_resources: analytics.allocated_resources,
          utilization_rate: analytics.utilization_rate
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating resource report:', error);
      throw error;
    }
  }
}

module.exports = new ProjectResourceRepository();
