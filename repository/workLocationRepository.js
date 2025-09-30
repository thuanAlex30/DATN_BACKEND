const WorkLocation = require('../models/workLocation');
const LocationAssignment = require('../models/locationAssignment');

class WorkLocationRepository {
  // ========== BASIC CRUD ==========
  async getAllLocations(filters = {}) {
    try {
      const query = {};
      
      if (filters.area_id) {
        query.area_id = filters.area_id;
      }
      if (filters.location_name) {
        query.location_name = { $regex: filters.location_name, $options: 'i' };
      }
      if (filters.location_code) {
        query.location_code = { $regex: filters.location_code, $options: 'i' };
      }
      if (filters.location_type) {
        query.location_type = filters.location_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const locations = await WorkLocation.find(query)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  async getLocationById(id) {
    try {
      const location = await WorkLocation.findById(id)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return location;
    } catch (error) {
      console.error('Error getting location by id:', error);
      throw error;
    }
  }

  async createLocation(locationData) {
    try {
      const location = new WorkLocation(locationData);
      await location.save();
      
      return await this.getLocationById(location._id);
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async updateLocation(id, updateData) {
    try {
      const location = await WorkLocation.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return location;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(id) {
    try {
      const location = await WorkLocation.findByIdAndDelete(id);
      return location;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  // ========== AREA LOCATION QUERIES ==========
  async getAreaLocations(areaId) {
    try {
      const locations = await WorkLocation.find({ area_id: areaId })
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting area locations:', error);
      throw error;
    }
  }

  async getLocationsByType(locationType, areaId = null) {
    try {
      const query = { location_type: locationType };
      if (areaId) {
        query.area_id = areaId;
      }

      const locations = await WorkLocation.find(query)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting locations by type:', error);
      throw error;
    }
  }

  async getLocationsByStatus(status, areaId = null) {
    try {
      const query = { status };
      if (areaId) {
        query.area_id = areaId;
      }

      const locations = await WorkLocation.find(query)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting locations by status:', error);
      throw error;
    }
  }

  async getActiveLocations(areaId = null) {
    try {
      const query = { status: 'ACTIVE' };
      if (areaId) {
        query.area_id = areaId;
      }

      const locations = await WorkLocation.find(query)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error getting active locations:', error);
      throw error;
    }
  }

  // ========== LOCATION VALIDATION ==========
  async validateLocation(locationData) {
    try {
      const errors = [];

      // Check required fields
      if (!locationData.area_id) {
        errors.push('Area ID is required');
      }
      if (!locationData.location_name) {
        errors.push('Location name is required');
      }
      if (!locationData.location_code) {
        errors.push('Location code is required');
      }
      if (!locationData.location_type) {
        errors.push('Location type is required');
      }

      // Check if location type is valid
      const validLocationTypes = ['WORK_AREA', 'STORAGE', 'OFFICE', 'MEETING_ROOM', 'EQUIPMENT_ROOM', 'OTHER'];
      if (locationData.location_type && !validLocationTypes.includes(locationData.location_type)) {
        errors.push('Invalid location type');
      }

      // Check if status is valid
      const validStatuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'];
      if (locationData.status && !validStatuses.includes(locationData.status)) {
        errors.push('Invalid status');
      }

      // Check for duplicate location code in same area
      if (locationData.area_id && locationData.location_code) {
        const existingLocation = await WorkLocation.findOne({
          area_id: locationData.area_id,
          location_code: locationData.location_code,
          _id: { $ne: locationData._id }
        });
        if (existingLocation) {
          errors.push('Location code already exists in this area');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating location:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== LOCATION ANALYTICS ==========
  async getLocationAnalytics(areaId) {
    try {
      const locations = await WorkLocation.find({ area_id: areaId });
      
      const analytics = {
        total_locations: locations.length,
        active_locations: locations.filter(l => l.status === 'ACTIVE').length,
        inactive_locations: locations.filter(l => l.status === 'INACTIVE').length,
        maintenance_locations: locations.filter(l => l.status === 'MAINTENANCE').length,
        closed_locations: locations.filter(l => l.status === 'CLOSED').length,
        locations_by_type: locations.reduce((acc, location) => {
          acc[location.location_type] = (acc[location.location_type] || 0) + 1;
          return acc;
        }, {}),
        locations_by_status: locations.reduce((acc, location) => {
          acc[location.status] = (acc[location.status] || 0) + 1;
          return acc;
        }, {}),
        capacity_utilization: locations.reduce((sum, location) => {
          if (location.capacity && location.current_occupancy) {
            return sum + (location.current_occupancy / location.capacity);
          }
          return sum;
        }, 0) / locations.length || 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting location analytics:', error);
      throw error;
    }
  }

  async getLocationStats(filters = {}) {
    try {
      const query = {};
      if (filters.area_id) {
        query.area_id = filters.area_id;
      }

      const locations = await WorkLocation.find(query);
      
      const stats = {
        total_locations: locations.length,
        locations_by_type: locations.reduce((acc, location) => {
          acc[location.location_type] = (acc[location.location_type] || 0) + 1;
          return acc;
        }, {}),
        locations_by_status: locations.reduce((acc, location) => {
          acc[location.status] = (acc[location.status] || 0) + 1;
          return acc;
        }, {}),
        locations_by_area: locations.reduce((acc, location) => {
          const areaId = location.area_id.toString();
          acc[areaId] = (acc[areaId] || 0) + 1;
          return acc;
        }, {}),
        active_locations: locations.filter(l => l.status === 'ACTIVE').length,
        maintenance_locations: locations.filter(l => l.status === 'MAINTENANCE').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting location stats:', error);
      throw error;
    }
  }

  // ========== LOCATION ASSIGNMENTS ==========
  async getLocationAssignments(locationId) {
    try {
      const assignments = await LocationAssignment.find({ location_id: locationId })
        .populate('location_id', 'location_name location_code')
        .populate('user_id', 'full_name email')
        .populate('assigned_by', 'full_name email')
        .sort({ assigned_at: -1 });

      return assignments;
    } catch (error) {
      console.error('Error getting location assignments:', error);
      throw error;
    }
  }

  async assignUserToLocation(locationId, userId, assignedBy, notes = '') {
    try {
      const assignment = new LocationAssignment({
        location_id: locationId,
        user_id: userId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        status: 'ACTIVE',
        notes: notes
      });

      await assignment.save();

      // Update location occupancy
      await this.updateLocationOccupancy(locationId);

      return assignment;
    } catch (error) {
      console.error('Error assigning user to location:', error);
      throw error;
    }
  }

  async unassignUserFromLocation(assignmentId, unassignedBy) {
    try {
      const assignment = await LocationAssignment.findByIdAndUpdate(
        assignmentId,
        {
          status: 'INACTIVE',
          unassigned_at: new Date(),
          unassigned_by: unassignedBy
        },
        { new: true }
      );

      if (assignment) {
        // Update location occupancy
        await this.updateLocationOccupancy(assignment.location_id);
      }

      return assignment;
    } catch (error) {
      console.error('Error unassigning user from location:', error);
      throw error;
    }
  }

  async updateLocationOccupancy(locationId) {
    try {
      const activeAssignments = await LocationAssignment.find({
        location_id: locationId,
        status: 'ACTIVE'
      });

      const currentOccupancy = activeAssignments.length;

      await this.updateLocation(locationId, { current_occupancy: currentOccupancy });
    } catch (error) {
      console.error('Error updating location occupancy:', error);
      throw error;
    }
  }

  // ========== LOCATION MANAGEMENT ==========
  async updateLocationStatus(id, status) {
    try {
      return await this.updateLocation(id, { status });
    } catch (error) {
      console.error('Error updating location status:', error);
      throw error;
    }
  }

  async updateLocationCapacity(id, capacity) {
    try {
      return await this.updateLocation(id, { capacity });
    } catch (error) {
      console.error('Error updating location capacity:', error);
      throw error;
    }
  }

  async getLocationUtilization(locationId) {
    try {
      const location = await this.getLocationById(locationId);
      const assignments = await this.getLocationAssignments(locationId);

      const utilization = {
        location: location,
        total_assignments: assignments.length,
        active_assignments: assignments.filter(a => a.status === 'ACTIVE').length,
        current_occupancy: location.current_occupancy || 0,
        capacity: location.capacity || 0,
        utilization_rate: location.capacity > 0 ? 
          ((location.current_occupancy || 0) / location.capacity * 100).toFixed(2) : 0,
        assignments: assignments
      };

      return utilization;
    } catch (error) {
      console.error('Error getting location utilization:', error);
      throw error;
    }
  }

  // ========== LOCATION SEARCH ==========
  async searchLocations(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { location_name: { $regex: searchTerm, $options: 'i' } },
          { location_code: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.area_id) {
        query.area_id = filters.area_id;
      }
      if (filters.location_type) {
        query.location_type = filters.location_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const locations = await WorkLocation.find(query)
        .populate('area_id', 'area_name area_code')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ location_code: 1 });

      return locations;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  // ========== LOCATION REPORTS ==========
  async generateLocationReport(areaId) {
    try {
      const locations = await this.getAreaLocations(areaId);
      const analytics = await this.getLocationAnalytics(areaId);
      
      const report = {
        area_id: areaId,
        generated_at: new Date(),
        locations: locations,
        analytics: analytics,
        summary: {
          total_locations: analytics.total_locations,
          active_locations: analytics.active_locations,
          capacity_utilization: analytics.capacity_utilization
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating location report:', error);
      throw error;
    }
  }

  // ========== LOCATION ASSIGNMENTS ==========
  async getLocationAssignments(locationId) {
    try {
      const assignments = await LocationAssignment.find({ location_id: locationId })
        .populate('location_id', 'location_name location_code')
        .populate('user_id', 'full_name email')
        .populate('assigned_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ assigned_at: -1 });

      return assignments;
    } catch (error) {
      console.error('Error getting location assignments:', error);
      throw error;
    }
  }

  async addLocationAssignment(locationId, assignmentData, assignedBy) {
    try {
      const assignment = new LocationAssignment({
        location_id: locationId,
        ...assignmentData,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        status: 'ACTIVE'
      });

      await assignment.save();
      return assignment;
    } catch (error) {
      console.error('Error adding location assignment:', error);
      throw error;
    }
  }

  async updateLocationAssignment(assignmentId, updateData, updatedBy) {
    try {
      const assignment = await LocationAssignment.findByIdAndUpdate(
        assignmentId,
        {
          ...updateData,
          updated_by: updatedBy,
          updated_at: new Date()
        },
        { new: true }
      ).populate('location_id', 'location_name location_code')
       .populate('user_id', 'full_name email')
       .populate('assigned_by', 'full_name email')
       .populate('updated_by', 'full_name email');

      if (!assignment) {
        throw new Error('Location assignment not found');
      }

      return assignment;
    } catch (error) {
      console.error('Error updating location assignment:', error);
      throw error;
    }
  }

  async removeLocationAssignment(assignmentId, removedBy) {
    try {
      const assignment = await LocationAssignment.findByIdAndUpdate(
        assignmentId,
        {
          status: 'INACTIVE',
          removed_by: removedBy,
          removed_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      ).populate('location_id', 'location_name location_code')
       .populate('user_id', 'full_name email')
       .populate('assigned_by', 'full_name email')
       .populate('removed_by', 'full_name email');

      if (!assignment) {
        throw new Error('Location assignment not found');
      }

      return assignment;
    } catch (error) {
      console.error('Error removing location assignment:', error);
      throw error;
    }
  }

  // ========== LOCATION AVAILABILITY ==========
  async getLocationAvailability(locationId, startDate, endDate) {
    try {
      const query = { location_id: locationId };
      
      if (startDate && endDate) {
        query.assigned_at = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const assignments = await LocationAssignment.find(query)
        .populate('user_id', 'full_name email')
        .sort({ assigned_at: 1 });

      const availability = {
        location_id: locationId,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        assignments: assignments,
        total_assignments: assignments.length,
        active_assignments: assignments.filter(a => a.status === 'ACTIVE').length
      };

      return availability;
    } catch (error) {
      console.error('Error getting location availability:', error);
      throw error;
    }
  }
}

module.exports = new WorkLocationRepository();
