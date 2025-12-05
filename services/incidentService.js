const IncidentRepository = require('../repository/incidentRepository');
const IncidentUtils = require('../utils/incidentUtils');
const websocketService = require('./websocketService');
const IncidentEvents = require('../events/incidentEvents');

class IncidentService {
  /**
   * Tạo incident mới
   */
  static async createIncident(incidentData, userId, tenantId = null) {
    try {
      // Validate dữ liệu
      const validation = IncidentUtils.validateIncidentData(incidentData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          statusCode: 400
        };
      }

      // Tạo incidentId tự động
      const incidentId = IncidentUtils.generateIncidentId();
      
      // Chuẩn bị dữ liệu
      const newIncidentData = {
        ...incidentData,
        incidentId,
        createdBy: userId,
        histories: [{
          action: 'Ghi nhận',
          performedBy: userId,
          note: 'Ghi nhận sự cố',
          timestamp: new Date()
        }]
      };

      // Tạo incident
      const incident = await IncidentRepository.createIncident({
        ...newIncidentData,
        ...(tenantId ? { tenant_id: tenantId } : {})
      });
      
      // Emit events
      await IncidentService.emitIncidentEvents('created', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Tạo incident thành công',
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy tất cả incidents
   */
  static async getAllIncidents(tenantId = null, projectId = null) {
    try {
      const filters = {};
      if (tenantId) {
        filters.tenant_id = tenantId;
      }
      if (projectId) {
        filters.project_id = projectId;
      }
      
      const incidents = await IncidentRepository.getAllIncidents(filters);
      
      return {
        success: true,
        data: incidents,
        message: 'Lấy danh sách incidents thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy incident theo ID
   */
  static async getIncidentById(id, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      return {
        success: true,
        data: incident,
        message: 'Lấy incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 404
      };
    }
  }

  /**
   * Phân loại incident
   */
  static async classifyIncident(id, severity, userId, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const oldSeverity = incident.severity;
      incident.severity = severity;
      
      // Thêm history entry
      await IncidentRepository.addHistory(id, {
        action: 'Phân loại',
        performedBy: userId,
        note: `Thay đổi mức độ từ "${oldSeverity}" thành "${severity}"`
      });

      // Emit events
      await IncidentService.emitIncidentEvents('classified', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Phân loại incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Phân công incident
   */
  static async assignIncident(id, assignedTo, userId, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      incident.assignedTo = assignedTo;
      incident.status = 'Đang xử lý';
      
      // Thêm history entry
      await IncidentRepository.addHistory(id, {
        action: 'Phân công',
        performedBy: userId,
        note: `Phân công xử lý cho user ID: ${assignedTo}`
      });

      // Emit events
      await IncidentService.emitIncidentEvents('assigned', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Phân công incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Điều tra incident
   */
  static async investigateIncident(id, investigationData, userId, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { investigation, solution, findingsImages, rootCauseImages } = investigationData;

      // Thêm investigation entry
      await IncidentRepository.addHistory(id, {
        action: 'Điều tra',
        performedBy: userId,
        note: investigation,
        images: findingsImages || []
      });

      // Thêm solution entry
      await IncidentRepository.addHistory(id, {
        action: 'Khắc phục',
        performedBy: userId,
        note: solution,
        images: rootCauseImages || []
      });

      // Emit events
      await IncidentService.emitIncidentEvents('investigated', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Điều tra incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Cập nhật tiến độ incident
   */
  static async updateIncidentProgress(id, progressData, userId, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { note, images } = progressData;

      // Thêm progress entry
      await IncidentRepository.addHistory(id, {
        action: 'Cập nhật tiến độ',
        performedBy: userId,
        note: note,
        images: images || []
      });

      // Emit events
      await IncidentService.emitIncidentEvents('progress_updated', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Cập nhật tiến độ thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Đóng incident
   */
  static async closeIncident(id, closeData, userId, tenantId = null) {
    try {
      const incident = await IncidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      incident.status = 'Đã đóng';
      
      const { note, images } = closeData;

      // Thêm close entry
      await IncidentRepository.addHistory(id, {
        action: 'Đóng',
        performedBy: userId,
        note: note || 'Đóng incident',
        images: images || []
      });

      // Emit events
      await IncidentService.emitIncidentEvents('closed', incident, userId);

      return {
        success: true,
        data: incident,
        message: 'Đóng incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy thống kê incidents
   */
  static async getIncidentStats() {
    try {
      const stats = await IncidentRepository.getIncidentStats();
      
      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Tìm kiếm incidents
   */
  static async searchIncidents(searchTerm, tenantId = null) {
    try {
      const incidents = await IncidentRepository.searchIncidents(searchTerm, tenantId);
      
      return {
        success: true,
        data: incidents,
        message: 'Tìm kiếm thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy incidents theo user
   */
  static async getIncidentsByUser(userId) {
    try {
      const incidents = await IncidentRepository.getIncidentsByUser(userId);
      
      return {
        success: true,
        data: incidents,
        message: 'Lấy incidents theo user thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy incidents theo project
   */
  static async getIncidentsByProject(projectId, tenantId = null) {
    try {
      const incidents = await IncidentRepository.getIncidentsByProject(projectId, tenantId);
      
      return {
        success: true,
        data: incidents,
        message: 'Lấy incidents theo project thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy incidents theo status
   */
  static async getIncidentsByStatus(status) {
    try {
      const incidents = await IncidentRepository.getIncidentsByStatus(status);
      
      return {
        success: true,
        data: incidents,
        message: 'Lấy incidents theo status thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Lấy incidents theo severity
   */
  static async getIncidentsBySeverity(severity) {
    try {
      const incidents = await IncidentRepository.getIncidentsBySeverity(severity);
      
      return {
        success: true,
        data: incidents,
        message: 'Lấy incidents theo severity thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Xóa incident
   */
  static async deleteIncident(id, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      // Kiểm tra quyền xóa (chỉ người tạo hoặc admin)
      if (incident.createdBy.toString() !== userId.toString()) {
        return {
          success: false,
          message: 'Không có quyền xóa incident này',
          statusCode: 403
        };
      }

      const deletedIncident = await IncidentRepository.deleteIncident(id);

      // Emit events
      await IncidentService.emitIncidentEvents('deleted', deletedIncident, userId);

      return {
        success: true,
        data: deletedIncident,
        message: 'Xóa incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Cập nhật incident
   */
  static async updateIncident(id, updateData, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      // Validate dữ liệu cập nhật
      const validation = IncidentUtils.validateIncidentData(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          statusCode: 400
        };
      }

      const updatedIncident = await IncidentRepository.updateIncident(id, updateData);

      // Emit events
      await IncidentService.emitIncidentEvents('updated', updatedIncident, userId);

      return {
        success: true,
        data: updatedIncident,
        message: 'Cập nhật incident thành công',
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Emit incident events
   */
  static async emitIncidentEvents(eventType, incident, userId) {
    try {
      // Emit WebSocket event
      websocketService.emitIncidentEvent(eventType, incident, userId);
      
      // Emit Kafka event based on event type
      switch (eventType) {
        case 'created':
        case 'reported':
          await IncidentEvents.emitIncidentReported(incident, { _id: userId });
          break;
        case 'updated':
          await IncidentEvents.emitIncidentUpdated(incident, { _id: userId }, {});
          break;
        case 'assigned':
          await IncidentEvents.emitIncidentAssigned(incident, { _id: incident.assignedTo }, { _id: userId });
          break;
        case 'investigated':
          await IncidentEvents.emitIncidentInvestigationCompleted(incident, { _id: userId }, {});
          break;
        case 'closed':
          await IncidentEvents.emitIncidentClosed(incident, { _id: userId });
          break;
        case 'deleted':
          await IncidentEvents.emitIncidentDeleted(incident, { _id: userId });
          break;
        default:
          console.log(`Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Failed to emit incident events:', error);
    }
  }
}

module.exports = IncidentService;
