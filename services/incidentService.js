const IncidentRepository = require('../repository/IncidentRepository');
const User = require('../models/user');
const { sendEmail, sendSMS, sendNotification } = require('../utils/notifications');
const websocketService = require('./websocketService');

// Helper function to safely emit websocket events
const safeEmit = (eventName, ...args) => {
  try {
    console.log(`Attempting to emit ${eventName}...`);
    console.log('WebSocketService available:', !!websocketService);
    console.log('WebSocketService type:', typeof websocketService);
    console.log('Function exists:', typeof websocketService[eventName]);
    
    if (websocketService && typeof websocketService[eventName] === 'function') {
      websocketService[eventName](...args);
      console.log(`✅ Successfully emitted ${eventName}`);
    } else {
      console.warn(`❌ Function ${eventName} not available on websocketService`);
    }
  } catch (error) {
    console.warn(`WebSocket event ${eventName} failed:`, error.message);
  }
};
const { ApiResponse } = require('../utils/response');
const incidentUtils = require('../utils/incidentUtils');

class IncidentService {
  // Tạo sự cố mới
  static async createIncident(incidentData, userId) {
    try {
      // Tạo incidentId tự động
      const incidentId = incidentUtils.generateIncidentId();
      
      const incident = {
        ...incidentData,
        incidentId,
        createdBy: userId,
        description: incidentData.description || '',
        location: incidentData.location || '',
        progress: 10, // 10% khi gửi báo cáo
        histories: [{
          action: 'Ghi nhận',
          performedBy: userId,
          note: 'Ghi nhận sự cố mới',
          timestamp: new Date()
        }]
      };

      const createdIncident = await IncidentRepository.createIncident(incident);
      
      // Lấy thông tin người tạo để gửi thông báo
      const creator = await User.findById(userId);
      
      // Emit WebSocket event
      websocketService.emitToAll('incident_created', {
        incident: createdIncident,
        timestamp: new Date()
      });
      
      return {
        success: true,
        data: createdIncident,
        message: 'Tạo sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi tạo sự cố: ${error.message}`);
    }
  }

  // Phân loại sự cố
  static async classifyIncident(incidentId, classificationData, userId) {
    try {
      const { severity, category, priority } = classificationData;
      
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Cập nhật thông tin phân loại
      const updateData = {
        severity,
        category,
        priority,
        status: 'Đang xử lý',
        progress: 25 // 25% khi phân loại
      };

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);
      
      // Thêm lịch sử phân loại
      await IncidentRepository.addHistory(incidentId, {
        action: 'Phân loại',
        performedBy: userId,
        note: `Phân loại: ${severity} - ${category}`,
        timestamp: new Date()
      });

      // Gửi thông báo theo mức độ nghiêm trọng
      await this.sendClassificationNotifications(updatedIncident, severity);

      // Emit WebSocket event
      websocketService.emitToAll('incident_classified', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Phân loại sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi phân loại sự cố: ${error.message}`);
    }
  }

  // Phân công sự cố
  static async assignIncident(incidentId, assignmentData, userId) {
    try {
      const { assignedTo, dueDate, notes } = assignmentData;
      
      // Kiểm tra người được phân công có tồn tại không
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        throw new Error('Người được phân công không tồn tại');
      }

      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Cập nhật thông tin phân công
      const updateData = {
        assignedTo,
        dueDate,
        status: 'Đang xử lý',
        progress: 40 // 40% khi phân công
      };

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);
      
      // Thêm lịch sử phân công
      await IncidentRepository.addHistory(incidentId, {
        action: 'Phân công',
        performedBy: userId,
        note: `Phân công cho ${assignee.name}${notes ? ` - ${notes}` : ''}`,
        timestamp: new Date()
      });

      // Gửi thông báo cho người được phân công
      await this.sendAssignmentNotification(updatedIncident, assignee);

      // Emit WebSocket event
      websocketService.emitToAll('incident_assigned', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Phân công sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi phân công sự cố: ${error.message}`);
    }
  }

  // Điều tra sự cố
  static async investigateIncident(incidentId, investigationData, userId) {
    try {
      const { findings, recommendations } = investigationData;
      
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Thêm lịch sử điều tra
      await IncidentRepository.addHistory(incidentId, {
        action: 'Điều tra',
        performedBy: userId,
        note: `Kết quả điều tra: ${findings}`,
        timestamp: new Date()
      });

      // Cập nhật thông tin điều tra
      const updateData = {
        investigation: {
          findings,
          recommendations,
          investigatedBy: userId,
          investigatedAt: new Date()
        },
        progress: 70 // 70% khi có kết quả điều tra và khuyến nghị
      };

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);

      // Emit WebSocket event
      websocketService.emitToAll('incident_investigated', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Điều tra sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi điều tra sự cố: ${error.message}`);
    }
  }

  // Cập nhật tiến độ
  static async updateProgress(incidentId, progressData, userId) {
    try {
      const { progress, note, attachments } = progressData;
      
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Thêm lịch sử cập nhật tiến độ
      await IncidentRepository.addHistory(incidentId, {
        action: 'Cập nhật tiến độ',
        performedBy: userId,
        note: `${progress}% - ${note}`,
        timestamp: new Date()
      });

      // Cập nhật tiến độ (chỉ khi admin cập nhật thủ công)
      const updateData = {
        progress,
        lastUpdated: new Date(),
        lastUpdatedBy: userId
      };

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);

      // Emit WebSocket event
      websocketService.emitToAll('incident_progress_updated', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Cập nhật tiến độ thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi cập nhật tiến độ: ${error.message}`);
    }
  }

  // Đóng sự cố
  static async closeIncident(incidentId, closeData, userId) {
    try {
      const { resolution = 'Sự cố đã được xử lý và đóng', lessonsLearned, preventiveMeasures } = closeData;
      
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Cập nhật thông tin đóng sự cố
      const updateData = {
        status: 'Đã đóng',
        progress: 100, // 100% khi đóng sự cố
        resolution: {
          description: resolution,
          lessonsLearned,
          preventiveMeasures,
          closedBy: userId,
          closedAt: new Date()
        }
      };

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);
      
      // Thêm lịch sử đóng sự cố
      await IncidentRepository.addHistory(incidentId, {
        action: 'Đóng sự cố',
        performedBy: userId,
        note: `Đã đóng sự cố: ${resolution}`,
        timestamp: new Date()
      });

      // Gửi thông báo đóng sự cố
      await this.sendClosureNotification(updatedIncident);

      // Emit WebSocket event
      websocketService.emitToAll('incident_closed', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Đóng sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi đóng sự cố: ${error.message}`);
    }
  }

  // Lấy danh sách sự cố
  static async getIncidents(filters = {}, options = {}) {
    try {
      const result = await IncidentRepository.findAll(filters, options);
      return {
        success: true,
        data: result.incidents,
        pagination: result.pagination,
        message: 'Lấy danh sách sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách sự cố: ${error.message}`);
    }
  }

  // Lấy chi tiết sự cố
  static async getIncidentById(incidentId) {
    try {
      const incident = await IncidentRepository.findById(incidentId);
      return {
        success: true,
        data: incident,
        message: 'Lấy chi tiết sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi lấy chi tiết sự cố: ${error.message}`);
    }
  }

  // Lấy thống kê sự cố
  static async getIncidentStatistics(filters = {}) {
    try {
      const stats = await IncidentRepository.getStatistics(filters);
      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê sự cố: ${error.message}`);
    }
  }

  // Gửi thông báo phân loại
  static async sendClassificationNotifications(incident, severity) {
    try {
      const message = `Sự cố ${incident.incidentId} đã được phân loại: ${severity}`;
      
      if (severity === 'rất nghiêm trọng') {
        // Gửi SMS cho giám đốc, ATVS, Y tế
        await sendSMS('Giám đốc, ATVS, Y tế', `URGENT: ${message}`);
        await sendEmail('Giám đốc, ATVS, Y tế', message);
      } else if (severity === 'nặng') {
        // Gửi email cho trưởng ca, quản lý dự án
        await sendEmail('Trưởng ca, Quản lý dự án', message);
        await sendNotification('Trưởng ca, Quản lý dự án', message);
      } else {
        // Gửi thông báo cho trưởng ca
        await sendEmail('Trưởng ca', message);
        await IncidentRepository.updateById(incident._id, { notified: true });
      }
    } catch (error) {
      console.error('Lỗi gửi thông báo phân loại:', error);
    }
  }

  // Gửi thông báo phân công
  static async sendAssignmentNotification(incident, assignee) {
    try {
      const message = `Bạn đã được phân công xử lý sự cố ${incident.incidentId}`;
      await sendNotification(assignee.email, message);
      await sendEmail(assignee.email, message);
    } catch (error) {
      console.error('Lỗi gửi thông báo phân công:', error);
    }
  }

  // Gửi thông báo đóng sự cố
  static async sendClosureNotification(incident) {
    try {
      const message = `Sự cố ${incident.incidentId} đã được đóng`;
      
      // Gửi thông báo cho người tạo và người được phân công
      const recipients = [incident.createdBy.email];
      if (incident.assignedTo && incident.assignedTo.email) {
        recipients.push(incident.assignedTo.email);
      }
      
      for (const email of recipients) {
        await sendEmail(email, message);
        await sendNotification(email, message);
      }
    } catch (error) {
      console.error('Lỗi gửi thông báo đóng sự cố:', error);
    }
  }

  // Tìm kiếm sự cố
  static async searchIncidents(searchTerm, filters = {}, options = {}) {
    try {
      const searchQuery = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { incidentId: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } }
        ],
        ...filters
      };

      const result = await IncidentRepository.findAll(searchQuery, options);
      return {
        success: true,
        data: result.incidents,
        pagination: result.pagination,
        message: 'Tìm kiếm sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm sự cố: ${error.message}`);
    }
  }

  // Xuất báo cáo sự cố
  static async exportIncidents(filters = {}, format = 'excel') {
    try {
      const result = await IncidentRepository.findAll(filters, { limit: 10000 });
      
      if (format === 'excel') {
        return await incidentUtils.exportToExcel(result.incidents);
      } else if (format === 'pdf') {
        return await incidentUtils.exportToPDF(result.incidents);
      } else {
        throw new Error('Định dạng xuất không được hỗ trợ');
      }
    } catch (error) {
      throw new Error(`Lỗi xuất báo cáo: ${error.message}`);
    }
  }

  // Cập nhật sự cố
  static async updateIncident(incidentId, updateData, userId) {
    try {
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Kiểm tra quyền chỉnh sửa
      if (incident.createdBy._id.toString() !== userId.toString() && 
          incident.assignedTo?._id.toString() !== userId.toString()) {
        throw new Error('Không có quyền chỉnh sửa sự cố này');
      }

      // Kiểm tra trạng thái có thể chỉnh sửa không
      if (incident.status === 'Đã đóng') {
        throw new Error('Không thể chỉnh sửa sự cố đã đóng');
      }

      const updatedIncident = await IncidentRepository.updateById(incidentId, updateData);
      
      // Thêm lịch sử cập nhật
      await IncidentRepository.addHistory(incidentId, {
        action: 'Cập nhật',
        performedBy: userId,
        note: 'Cập nhật thông tin sự cố',
        timestamp: new Date()
      });

      // Emit WebSocket event
      websocketService.emitToAll('incident_updated', {
        incident: updatedIncident,
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedIncident,
        message: 'Cập nhật sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi cập nhật sự cố: ${error.message}`);
    }
  }

  // Xóa sự cố
  static async deleteIncident(incidentId, userId) {
    try {
      const incident = await IncidentRepository.findById(incidentId);
      if (!incident) {
        throw new Error('Không tìm thấy sự cố');
      }

      // Kiểm tra quyền xóa
      if (incident.createdBy._id.toString() !== userId.toString()) {
        throw new Error('Không có quyền xóa sự cố này');
      }

      // Kiểm tra trạng thái có thể xóa không
      if (incident.status === 'Đang xử lý') {
        throw new Error('Không thể xóa sự cố đang xử lý');
      }

      const deletedIncident = await IncidentRepository.deleteById(incidentId);

      // Emit WebSocket event
      websocketService.emitToAll('incident_deleted', {
        incidentId: incidentId,
        timestamp: new Date()
      });

      return {
        success: true,
        data: deletedIncident,
        message: 'Xóa sự cố thành công'
      };
    } catch (error) {
      throw new Error(`Lỗi xóa sự cố: ${error.message}`);
    }
  }
}

module.exports = IncidentService;
