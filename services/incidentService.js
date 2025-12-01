const IncidentRepository = require('../repository/incidentRepository');
const IncidentUtils = require('../utils/incidentUtils');
const websocketService = require('./websocketService');
const IncidentEvents = require('../events/incidentEvents');

class IncidentService {
  /**
   * Tạo incident mới
   */
  static async createIncident(incidentData, userId) {
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
      const incident = await IncidentRepository.createIncident(newIncidentData);
      
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
  static async getAllIncidents(userId = null, filters = {}, user = null) {
    try {
      // Build query filters - extract pagination options
      const { page, limit, sortBy, sortOrder, department_id, ...queryFilters } = filters;
      
      // Remove department_id from queryFilters since Incident model doesn't have this field
      // If user is department_header, we'll need to filter differently (through user lookup)
      // For now, just use tenant_id and other available filters
      
      // Use findAll for paginated results, or getAllIncidents for all results
      if (page || limit) {
        const result = await IncidentRepository.findAll(queryFilters, {
          page: page || 1,
          limit: limit || 100,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          status: filters.status,
          severity: filters.severity,
          assignedTo: filters.assignedTo,
          createdBy: filters.createdBy,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        });
        
        // If department_header, filter results by department after query
        let incidents = result.incidents || [];
        if (user?.department_id && user?.role?.role_code === 'department_header' && department_id) {
          // This would require additional filtering logic if needed
          // For now, we'll return all incidents filtered by tenant
        }
        
        return {
          success: true,
          data: incidents,
          pagination: result.pagination,
          message: 'Lấy danh sách incidents thành công',
          statusCode: 200
        };
      } else {
        const incidents = await IncidentRepository.getAllIncidents(queryFilters);
        
        return {
          success: true,
          data: incidents,
          message: 'Lấy danh sách incidents thành công',
          statusCode: 200
        };
      }
    } catch (error) {
      console.error('Error in getAllIncidents:', error);
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
  static async getIncidentById(id) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
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
  static async classifyIncident(id, severity, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const oldSeverity = incident.severity;
      
      // Update severity using repository
      const updatedIncident = await IncidentRepository.updateById(id, { severity });
      
      // Thêm history entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Phân loại',
        performedBy: userId,
        note: `Thay đổi mức độ từ "${oldSeverity}" thành "${severity}"`
      });

      // Emit events
      await IncidentService.emitIncidentEvents('classified', updatedIncident, userId);

      return {
        success: true,
        data: updatedIncident,
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
  static async assignIncident(id, assignedTo, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      // Update assignedTo and status using repository
      const updatedIncident = await IncidentRepository.updateById(id, {
        assignedTo,
        status: 'Đang xử lý'
      });
      
      // Thêm history entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Phân công',
        performedBy: userId,
        note: `Phân công xử lý cho user ID: ${assignedTo}`
      });

      // Emit events
      await IncidentService.emitIncidentEvents('assigned', updatedIncident, userId);

      return {
        success: true,
        data: updatedIncident,
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
  static async investigateIncident(id, investigationData, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { investigation, solution, findingsImages, rootCauseImages } = investigationData;

      // Thêm investigation entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Điều tra',
        performedBy: userId,
        note: investigation,
        timestamp: new Date()
      });

      // Thêm solution entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Khắc phục',
        performedBy: userId,
        note: solution,
        timestamp: new Date()
      });

      // Get updated incident with history
      const updatedIncident = await IncidentRepository.getIncidentById(id);

      // Emit events
      await IncidentService.emitIncidentEvents('investigated', updatedIncident, userId);

      return {
        success: true,
        data: updatedIncident,
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
  static async updateIncidentProgress(id, progressData, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      // Support both 'note' and 'progress' field names from frontend
      const note = progressData.note || progressData.progress;

      if (!note || note.trim() === '') {
        return {
          success: false,
          message: 'Ghi chú tiến độ không được để trống',
          statusCode: 400
        };
      }

      // Thêm progress entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Cập nhật tiến độ',
        performedBy: userId,
        note: note.trim(),
        timestamp: new Date()
      });

      // Get updated incident with history
      const updatedIncident = await IncidentRepository.getIncidentById(id);

      // Emit events
      await IncidentService.emitIncidentEvents('progress_updated', updatedIncident, userId);

      return {
        success: true,
        data: updatedIncident,
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
  static async closeIncident(id, closeData, userId) {
    try {
      const incident = await IncidentRepository.getIncidentById(id);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { note, images } = closeData || {};

      // Update status using repository
      const updatedIncident = await IncidentRepository.updateById(id, {
        status: 'Đã đóng'
      });

      // Thêm close entry
      await IncidentRepository.addHistoryEntry(id, {
        action: 'Đóng',
        performedBy: userId,
        note: note || 'Đóng incident',
        timestamp: new Date()
      });

      // Get updated incident with history
      const finalIncident = await IncidentRepository.getIncidentById(id);

      // Emit events
      await IncidentService.emitIncidentEvents('closed', finalIncident, userId);

      return {
        success: true,
        data: finalIncident,
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
  static async getIncidentStats(filters = {}) {
    try {
      const stats = await IncidentRepository.getIncidentStats(filters);
      
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
  static async searchIncidents(searchTerm) {
    try {
      const incidents = await IncidentRepository.searchIncidents(searchTerm);
      
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
  static async getIncidentsByProject(projectId) {
    try {
      const incidents = await IncidentRepository.getIncidentsByProject(projectId);
      
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

      // Validate dữ liệu cập nhật (only validate if required fields are present)
      // For partial updates, we don't require all fields
      if (updateData.title !== undefined && (!updateData.title || updateData.title.trim() === '')) {
        return {
          success: false,
          message: 'Tiêu đề không được để trống',
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
