const Incident = require('../models/incident');
const User = require('../models/user');

class IncidentRepository {
  /**
   * Tạo incident mới
   */
  static async createIncident(incidentData) {
    try {
      const incident = new Incident(incidentData);
      return await incident.save();
    } catch (error) {
      throw new Error(`Lỗi tạo incident: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả incidents
   */
  static async getAllIncidents() {
    try {
      return await Incident.find()
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách incidents: ${error.message}`);
    }
  }

  /**
   * Lấy incident theo ID
   */
  static async getIncidentById(id) {
    try {
      const incident = await Incident.findById(id)
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .populate('histories.performedBy', 'full_name username email');
      
      if (!incident) {
        throw new Error('Không tìm thấy incident');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi lấy incident: ${error.message}`);
    }
  }

  /**
   * Cập nhật incident
   */
  static async updateIncident(id, updateData) {
    try {
      const incident = await Incident.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name');
      
      if (!incident) {
        throw new Error('Không tìm thấy incident');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi cập nhật incident: ${error.message}`);
    }
  }

  /**
   * Thêm history entry vào incident
   */
  static async addHistoryEntry(id, historyEntry) {
    try {
      const incident = await Incident.findById(id);
      if (!incident) {
        throw new Error('Không tìm thấy incident');
      }

      incident.histories.push({
        ...historyEntry,
        timestamp: new Date()
      });
      
      return await incident.save();
    } catch (error) {
      throw new Error(`Lỗi thêm history entry: ${error.message}`);
    }
  }

  /**
   * Xóa incident
   */
  static async deleteIncident(id) {
    try {
      const incident = await Incident.findByIdAndDelete(id);
      if (!incident) {
        throw new Error('Không tìm thấy incident');
      }
      return incident;
    } catch (error) {
      throw new Error(`Lỗi xóa incident: ${error.message}`);
    }
  }

  /**
   * Lấy incidents theo user
   */
  static async getIncidentsByUser(userId) {
    try {
      return await Incident.find({
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      })
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo user: ${error.message}`);
    }
  }

  /**
   * Lấy incidents theo project
   */
  static async getIncidentsByProject(projectId) {
    try {
      return await Incident.find({ project_id: projectId })
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo project: ${error.message}`);
    }
  }

  /**
   * Lấy incidents theo status
   */
  static async getIncidentsByStatus(status) {
    try {
      return await Incident.find({ status })
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo status: ${error.message}`);
    }
  }

  /**
   * Lấy incidents theo severity
   */
  static async getIncidentsBySeverity(severity) {
    try {
      return await Incident.find({ severity })
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi lấy incidents theo severity: ${error.message}`);
    }
  }

  /**
   * Tìm kiếm incidents
   */
  static async searchIncidents(searchTerm) {
    try {
      const regex = new RegExp(searchTerm, 'i');
      return await Incident.find({
        $or: [
          { title: regex },
          { description: regex },
          { location: regex },
          { incidentId: regex }
        ]
      })
        .populate('createdBy', 'full_name username email')
        .populate('assignedTo', 'full_name username email')
        .populate('project_id', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm incidents: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê incidents
   */
  static async getIncidentStats() {
    try {
      const stats = await Incident.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'Mới ghi nhận'] }, 1, 0] } },
            processing: { $sum: { $cond: [{ $eq: ['$status', 'Đang xử lý'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'Đã đóng'] }, 1, 0] } },
            light: { $sum: { $cond: [{ $eq: ['$severity', 'nhẹ'] }, 1, 0] } },
            heavy: { $sum: { $cond: [{ $eq: ['$severity', 'nặng'] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'rất nghiêm trọng'] }, 1, 0] } }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        new: 0,
        processing: 0,
        closed: 0,
        light: 0,
        heavy: 0,
        critical: 0
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê incidents: ${error.message}`);
    }
  }
}

module.exports = IncidentRepository;
