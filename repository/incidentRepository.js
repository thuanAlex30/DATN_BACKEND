const Incident = require('../models/incident');
const mongoose = require('mongoose');
const { ApiResponse } = require('../utils/response');

class IncidentRepository {
  // Tạo sự cố mới
  static async createIncident(incidentData) {
    try {
      const incident = new Incident(incidentData);
      const savedIncident = await incident.save();
      return await this.findById(savedIncident._id);
    } catch (error) {
      throw new Error(`Lỗi tạo sự cố: ${error.message}`);
    }
  }

  // Tìm sự cố theo ID
  static async findById(id) {
    try {
      const incident = await Incident.findById(id)
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role');

      
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố: ${error.message}`);
    }
  }

  // Tìm sự cố theo incidentId
  static async findByIncidentId(incidentId) {
    try {
      const incident = await Incident.findOne({ incidentId })
        .populate('createdBy', 'full_name email role')
        .populate('assignedTo', 'full_name email role')
        .populate('histories.performedBy', 'full_name email role');
      
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố: ${error.message}`);
    }
  }

  // Lấy tất cả sự cố (không phân trang)
  static async getAllIncidents(filters = {}) {
    try {
      const query = {};
      
      // Apply filters (Note: Incident model doesn't have department_id field)
      if (filters.tenant_id) {
        query.tenant_id = mongoose.Types.ObjectId.isValid(filters.tenant_id)
          ? (typeof filters.tenant_id === 'string' ? new mongoose.Types.ObjectId(filters.tenant_id) : filters.tenant_id)
          : filters.tenant_id;
      }
      // Skip department_id as it's not in the model
      if (filters.status) query.status = filters.status;
      if (filters.severity) query.severity = filters.severity;
      if (filters.assignedTo) {
        query.assignedTo = mongoose.Types.ObjectId.isValid(filters.assignedTo)
          ? (typeof filters.assignedTo === 'string' ? new mongoose.Types.ObjectId(filters.assignedTo) : filters.assignedTo)
          : filters.assignedTo;
      }
      if (filters.createdBy) {
        query.createdBy = mongoose.Types.ObjectId.isValid(filters.createdBy)
          ? (typeof filters.createdBy === 'string' ? new mongoose.Types.ObjectId(filters.createdBy) : filters.createdBy)
          : filters.createdBy;
      }
      
      const incidents = await Incident.find(query)
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });
      
      return incidents;
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách sự cố: ${error.message}`);
    }
  }

  // Lấy danh sách sự cố với phân trang và lọc
  static async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        severity,
        assignedTo,
        createdBy,
        dateFrom,
        dateTo
      } = options;

      // Xây dựng query
      const query = {};
      
      // Apply filters from filters parameter (tenant_id, etc.)
      // Note: Incident model doesn't have department_id field, so we skip it
      if (filters.tenant_id) {
        query.tenant_id = mongoose.Types.ObjectId.isValid(filters.tenant_id)
          ? (typeof filters.tenant_id === 'string' ? new mongoose.Types.ObjectId(filters.tenant_id) : filters.tenant_id)
          : filters.tenant_id;
      }
      if (filters.status) query.status = filters.status;
      if (filters.severity) query.severity = filters.severity;
      if (filters.assignedTo) {
        query.assignedTo = mongoose.Types.ObjectId.isValid(filters.assignedTo)
          ? (typeof filters.assignedTo === 'string' ? new mongoose.Types.ObjectId(filters.assignedTo) : filters.assignedTo)
          : filters.assignedTo;
      }
      if (filters.createdBy) {
        query.createdBy = mongoose.Types.ObjectId.isValid(filters.createdBy)
          ? (typeof filters.createdBy === 'string' ? new mongoose.Types.ObjectId(filters.createdBy) : filters.createdBy)
          : filters.createdBy;
      }
      
      // Override with options if provided
      if (status) query.status = status;
      if (severity) query.severity = severity;
      if (assignedTo) {
        query.assignedTo = mongoose.Types.ObjectId.isValid(assignedTo)
          ? (typeof assignedTo === 'string' ? new mongoose.Types.ObjectId(assignedTo) : assignedTo)
          : assignedTo;
      }
      if (createdBy) {
        query.createdBy = mongoose.Types.ObjectId.isValid(createdBy)
          ? (typeof createdBy === 'string' ? new mongoose.Types.ObjectId(createdBy) : createdBy)
          : createdBy;
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Thực hiện query với phân trang
      const skip = (page - 1) * limit;
      const incidents = await Incident.find(query)
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await Incident.countDocuments(query);

      return {
        incidents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách sự cố: ${error.message}`);
    }
  }

  // Cập nhật sự cố
  static async updateById(id, updateData) {
    try {
      const incident = await Incident.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('createdBy', 'full_name email role')
       .populate('assignedTo', 'full_name email role')
       .populate('histories.performedBy', 'full_name email role');

      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi cập nhật sự cố: ${error.message}`);
    }
  }

  // Thêm lịch sử sự cố
  static async addHistory(id, historyData) {
    try {
      const incident = await Incident.findByIdAndUpdate(
        id,
        { $push: { histories: historyData } },
        { new: true, runValidators: true }
      ).populate('createdBy', 'full_name email role')
       .populate('assignedTo', 'full_name email role')
       .populate('histories.performedBy', 'full_name email role');

      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi thêm lịch sử sự cố: ${error.message}`);
    }
  }

  // Xóa sự cố
  static async deleteById(id) {
    try {
      const incident = await Incident.findByIdAndDelete(id);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi xóa sự cố: ${error.message}`);
    }
  }

  // Thống kê sự cố (alias cho getStatistics)
  static async getIncidentStats(filters = {}) {
    return await this.getStatistics(filters);
  }

  // Thống kê sự cố
  static async getStatistics(filters = {}) {
    try {
      const query = {};
      
      // Apply tenant filter (Note: Incident model doesn't have department_id field)
      if (filters.tenant_id) {
        // Ensure tenant_id is ObjectId if it's a string
        if (mongoose.Types.ObjectId.isValid(filters.tenant_id)) {
          query.tenant_id = typeof filters.tenant_id === 'string' 
            ? new mongoose.Types.ObjectId(filters.tenant_id) 
            : filters.tenant_id;
        } else {
          // If invalid ObjectId, still try to use it (might be a string identifier)
          query.tenant_id = filters.tenant_id;
        }
      }
      // Skip department_id filter as Incident model doesn't have this field
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          const dateFrom = new Date(filters.dateFrom);
          if (!isNaN(dateFrom.getTime())) {
            query.createdAt.$gte = dateFrom;
          }
        }
        if (filters.dateTo) {
          const dateTo = new Date(filters.dateTo);
          if (!isNaN(dateTo.getTime())) {
            query.createdAt.$lte = dateTo;
          }
        }
      }

      console.log('📊 getStatistics query:', JSON.stringify(query, null, 2));

      // Simplified aggregation - similar to project stats
      const statusStats = await Incident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const severityStats = await Incident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalResult = await Incident.countDocuments(query);

      // Build status breakdown object
      const statusBreakdown = {};
      statusStats.forEach(stat => {
        statusBreakdown[stat._id] = stat.count;
      });

      // Build severity breakdown object
      const severityBreakdown = {};
      severityStats.forEach(stat => {
        severityBreakdown[stat._id] = stat.count;
      });

      // Transform to match frontend expected format
      const inProgress = (statusBreakdown['Đang xử lý'] || 0) + 
                        (statusBreakdown['in_progress'] || 0) + 
                        (statusBreakdown['investigating'] || 0);
      const resolved = (statusBreakdown['Đã đóng'] || 0) + 
                      (statusBreakdown['resolved'] || 0) + 
                      (statusBreakdown['closed'] || 0);
      
      const critical = (severityBreakdown['rất nghiêm trọng'] || 0) + 
                     (severityBreakdown['critical'] || 0) + 
                     (severityBreakdown['nặng'] || 0);

      return {
        total: totalResult || 0,
        inProgress,
        resolved,
        critical,
        statusBreakdown,
        severityBreakdown
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw new Error(`Lỗi thống kê sự cố: ${error.message}`);
    }
  }

  // Tìm sự cố theo người dùng
  static async findByUser(userId, userRole) {
    try {
      let query = {};
      
      if (userRole === 'employee') {
        query = { createdBy: userId };
      } else if (userRole === 'admin') {
        query = {}; // Admin có thể xem tất cả
      } else {
        query = { $or: [{ createdBy: userId }, { assignedTo: userId }] };
      }

      const incidents = await Incident.find(query)
        .populate('createdBy', 'full_name email role')
        .populate('assignedTo', 'full_name email role')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố theo người dùng: ${error.message}`);
    }
  }

  // Tìm sự cố chưa được phân công
  static async findUnassigned() {
    try {
      const incidents = await Incident.find({ assignedTo: { $exists: false } })
        .populate('createdBy', 'full_name email role')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố chưa phân công: ${error.message}`);
    }
  }

  // Tìm sự cố theo trạng thái
  static async findByStatus(status) {
    try {
      const incidents = await Incident.find({ status })
        .populate('createdBy', 'full_name email role')
        .populate('assignedTo', 'full_name email role')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố theo trạng thái: ${error.message}`);
    }
  }

  // ========== ALIAS METHODS FOR SERVICE COMPATIBILITY ==========
  
  // Alias for findById
  static async getIncidentById(id) {
    return await this.findById(id);
  }

  // Alias for addHistory
  static async addHistoryEntry(id, historyData) {
    return await this.addHistory(id, historyData);
  }

  // Alias for deleteById
  static async deleteIncident(id) {
    return await this.deleteById(id);
  }

  // Alias for updateById
  static async updateIncident(id, updateData) {
    return await this.updateById(id, updateData);
  }

  // Alias for findByStatus
  static async getIncidentsByStatus(status) {
    return await this.findByStatus(status);
  }

  // Get incidents by user (simplified version)
  static async getIncidentsByUser(userId) {
    try {
      const incidents = await Incident.find({
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      })
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo user: ${error.message}`);
    }
  }

  // Get incidents by project
  // Note: Incident model doesn't have project_id field
  // This method returns empty array as incidents are not linked to projects in the current model
  static async getIncidentsByProject(projectId) {
    try {
      // Since Incident model doesn't have project_id field, return empty array
      // If project linking is needed, the model should be updated first
      console.warn('⚠️ Incident model does not have project_id field. Returning empty array.');
      return [];
      
      // Uncomment below if project_id field is added to Incident model:
      // const incidents = await Incident.find({ project_id: projectId })
      //   .populate('createdBy', 'full_name email role department_id')
      //   .populate('assignedTo', 'full_name email role department_id')
      //   .populate('histories.performedBy', 'full_name email role')
      //   .sort({ createdAt: -1 });
      // return incidents;
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo project: ${error.message}`);
    }
  }

  // Get incidents by severity
  static async getIncidentsBySeverity(severity) {
    try {
      const incidents = await Incident.find({ severity })
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo severity: ${error.message}`);
    }
  }

  // Search incidents
  static async searchIncidents(searchTerm) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      const incidents = await Incident.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { incidentId: searchRegex },
          { location: searchRegex }
        ]
      })
        .populate('createdBy', 'full_name email role department_id')
        .populate('assignedTo', 'full_name email role department_id')
        .populate('histories.performedBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm incidents: ${error.message}`);
    }
  }
}

module.exports = IncidentRepository;
