const Incident = require('../models/incident');
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
  static async findById(id, tenantId = null) {
    try {
      const filter = { _id: id };
      if (tenantId) {
        filter.tenant_id = tenantId;
      }

      const incident = await Incident.findOne(filter)
        .populate('createdBy', 'full_name email role')
        .populate('assignedTo', 'full_name email role')
        .populate('histories.performedBy', 'full_name email role')
        .populate('investigation.investigatedBy', 'full_name email role')
        .populate('resolution.closedBy', 'full_name email role');
      
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố: ${error.message}`);
    }
  }

  // Tìm sự cố theo incidentId
  static async findByIncidentId(incidentId, tenantId = null) {
    try {
      const filter = { incidentId };
      if (tenantId) {
        filter.tenant_id = tenantId;
      }

      const incident = await Incident.findOne(filter)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('histories.performedBy', 'name email role');
      
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố: ${error.message}`);
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

      // ⭐ Tenant filter nếu có
      if (filters.tenant_id) {
        query.tenant_id = filters.tenant_id;
      }
      
      if (status) query.status = status;
      if (severity) query.severity = severity;
      if (assignedTo) query.assignedTo = assignedTo;
      if (createdBy) query.createdBy = createdBy;
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Thực hiện query với phân trang
      const skip = (page - 1) * limit;
      const incidents = await Incident.find(query)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('histories.performedBy', 'name email role')
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
  static async updateById(id, updateData, tenantId = null) {
    try {
      const filter = { _id: id };
      if (tenantId) {
        filter.tenant_id = tenantId;
      }

      const incident = await Incident.findOneAndUpdate(
        filter,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email role')
       .populate('assignedTo', 'name email role')
       .populate('histories.performedBy', 'name email role');

      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi cập nhật sự cố: ${error.message}`);
    }
  }

  // Thêm lịch sử sự cố
  static async addHistory(id, historyData, tenantId = null) {
    try {
      const filter = { _id: id };
      if (tenantId) {
        filter.tenant_id = tenantId;
      }

      const incident = await Incident.findOneAndUpdate(
        filter,
        { $push: { histories: historyData } },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email role')
       .populate('assignedTo', 'name email role')
       .populate('histories.performedBy', 'name email role');

      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi thêm lịch sử sự cố: ${error.message}`);
    }
  }

  // Xóa sự cố
  static async deleteById(id, tenantId = null) {
    try {
      const filter = { _id: id };
      if (tenantId) {
        filter.tenant_id = tenantId;
      }

      const incident = await Incident.findOneAndDelete(filter);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi xóa sự cố: ${error.message}`);
    }
  }

  // Thống kê sự cố
  static async getStatistics(filters = {}) {
    try {
      const query = {};
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const stats = await Incident.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            },
            bySeverity: {
              $push: {
                severity: '$severity',
                count: 1
              }
            },
            byMonth: {
              $push: {
                month: { $month: '$createdAt' },
                year: { $year: '$createdAt' },
                count: 1
              }
            }
          }
        },
        {
          $project: {
            total: 1,
            statusBreakdown: {
              $reduce: {
                input: '$byStatus',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{ k: '$$this.status', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.status', input: '$$value' } }, 0] }, 1] } }]
                      ]
                    }
                  ]
                }
              }
            },
            severityBreakdown: {
              $reduce: {
                input: '$bySeverity',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{ k: '$$this.severity', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.severity', input: '$$value' } }, 0] }, 1] } }]
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        statusBreakdown: {},
        severityBreakdown: {}
      };
    } catch (error) {
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
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('histories.performedBy', 'name email role')
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
        .populate('createdBy', 'name email role')
        .populate('histories.performedBy', 'name email role')
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
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('histories.performedBy', 'name email role')
        .sort({ createdAt: -1 });

      return incidents;
    } catch (error) {
      throw new Error(`Lỗi tìm sự cố theo trạng thái: ${error.message}`);
    }
  }
}

module.exports = IncidentRepository;
