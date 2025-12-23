const incidentRepository = require('../repository/incidentRepository');
const IncidentUtils = require('../utils/incidentUtils');
const websocketService = require('./websocketService');
const IncidentEvents = require('../events/incidentEvents');
const User = require('../models/user');
const { uploadImageBuffer, CLOUDINARY_ENABLED } = require('../utils/cloudinaryHelper');
const path = require('path');

/**
 * Upload array of images (URL or data URI) to Cloudinary.
 * - Keeps items that are already URLs.
 * - Uploads data:image/... base64 to Cloudinary when configured.
 */
async function uploadImagesIfNeeded(images = [], folderEnv = 'CLOUDINARY_INCIDENT_FOLDER', defaultFolder = 'incidents') {
  if (!Array.isArray(images) || images.length === 0) return [];

  const folder = process.env[folderEnv] || defaultFolder;
  const uploaded = [];

  for (const img of images) {
    if (typeof img !== 'string') continue;

    // If already a URL, keep as-is
    if (/^https?:\/\//i.test(img)) {
      uploaded.push(img);
      continue;
    }

    // If data URI and Cloudinary enabled, upload
    if (img.startsWith('data:image/')) {
      if (!CLOUDINARY_ENABLED) {
        throw new Error('Cloudinary chưa được cấu hình để upload ảnh incident');
      }
      try {
        const match = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!match) throw new Error('Định dạng ảnh base64 không hợp lệ');
        const mime = match[1];
        const b64 = match[2];
        const buffer = Buffer.from(b64, 'base64');
        const ext = mime.split('/')[1] || 'png';
        const uploadRes = await uploadImageBuffer(buffer, `incident-${Date.now()}.${ext}`, folder);
        uploaded.push(uploadRes.secureUrl);
      } catch (err) {
        throw new Error(`Upload ảnh incident lên Cloudinary thất bại: ${err.message}`);
      }
      continue;
    }

    // Otherwise skip unrecognized string
  }

  return uploaded;
}

// Verify repository is loaded correctly
if (!incidentRepository || typeof incidentRepository !== 'object') {
  console.error('❌ incidentRepository is not an object');
}
if (!incidentRepository.findAll || typeof incidentRepository.findAll !== 'function') {
  console.error('❌ incidentRepository.findAll is not a function');
}
if (!incidentRepository.getAllIncidents || typeof incidentRepository.getAllIncidents !== 'function') {
  console.warn('⚠️ incidentRepository.getAllIncidents is not a function (this is OK, we use findAll instead)');
}

class IncidentService {
  /**
   * Tạo incident mới
   */
  static async createIncident(incidentData, userId, tenantId = null) {
    try {
      // Lấy tenant_id từ user nếu chưa có trong incidentData
      if (!incidentData.tenant_id) {
        const user = await User.findById(userId).select('tenant_id');
        if (user && user.tenant_id) {
          incidentData.tenant_id = user.tenant_id;
        }
      }

      // Validate dữ liệu
      const validation = IncidentUtils.validateIncidentData(incidentData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          statusCode: 400
        };
      }

      // Upload images to Cloudinary if provided
      if (incidentData.images && incidentData.images.length > 0) {
        incidentData.images = await uploadImagesIfNeeded(
          incidentData.images,
          'CLOUDINARY_INCIDENT_FOLDER',
          'incidents'
        );
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
      const incident = await incidentRepository.createIncident({
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
  static async getAllIncidents(tenantId = null, filters = {}, user = null) {
    try {
      // Build query filters - extract pagination options
      const { page, limit, sortBy, sortOrder, department_id, ...queryFilters } = filters;

      // If user is Manager, automatically filter by assignedTo
      // Manager chỉ xem được incidents đã được phân công cho họ
      if (user && user.role && (user.role.role_code === 'manager' || user.role.role_name?.toLowerCase() === 'manager' || user.role.role_name?.toLowerCase() === 'department manager')) {
        const managerId = user._id || user.id;
        if (managerId && !filters.assignedTo) {
          // Tự động thêm filter assignedTo nếu manager chưa chỉ định
          queryFilters.assignedTo = managerId;
        }
      }

      if (page || limit || Object.keys(queryFilters).length > 0) {
        const result = await incidentRepository.findAll(
          { ...queryFilters, tenant_id: tenantId },
          {
            page: page || 1,
            limit: Math.min(limit || 20, 50),
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
            status: filters.status,
            severity: filters.severity,
            assignedTo: queryFilters.assignedTo || filters.assignedTo,
            createdBy: filters.createdBy,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
          }
        );
        
        // If department_header, filter results by department after query
        let incidents = result.incidents || [];
        if (user?.department_id && user?.role?.role_code === 'department_header' && department_id) {
        }
        
        return {
          success: true,
          data: incidents,
          pagination: result.pagination,
          message: 'Lấy danh sách incidents thành công',
          statusCode: 200
        };
      } else {
        // If no filters and user is Manager, still filter by assignedTo
        let queryFiltersForManager = { tenant_id: tenantId };
        if (user && user.role && (user.role.role_code === 'manager' || user.role.role_name?.toLowerCase() === 'manager' || user.role.role_name?.toLowerCase() === 'department manager')) {
          const managerId = user._id || user.id;
          if (managerId) {
            queryFiltersForManager.assignedTo = managerId;
          }
        }
        
        const result = await incidentRepository.findAll(
          queryFiltersForManager,
          {
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            assignedTo: queryFiltersForManager.assignedTo
          }
        );
        
        return {
          success: true,
          data: result.incidents || [],
          pagination: result.pagination,
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
  static async getIncidentById(id, tenantId = null) {
    try {
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
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
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const oldSeverity = incident.severity;
      
      // Update severity using repository
      const updatedIncident = await incidentRepository.updateById(id, { severity }, tenantId);
      
      // Thêm history entry
      await incidentRepository.addHistory(id, {
        action: 'Phân loại',
        performedBy: userId,
        note: `Thay đổi mức độ từ "${oldSeverity}" thành "${severity}"`
      }, tenantId);

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
  static async assignIncident(id, assignedTo, userId, tenantId = null) {
    try {
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      // Update assignedTo and status using repository
      const updatedIncident = await incidentRepository.updateById(id, {
        assignedTo,
        status: 'Đang xử lý'
      }, tenantId);
      
      // Thêm history entry
      await incidentRepository.addHistory(id, {
        action: 'Phân công',
        performedBy: userId,
        note: `Phân công xử lý cho user ID: ${assignedTo}`
      }, tenantId);

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
  static async investigateIncident(id, investigationData, userId, tenantId = null) {
    try {
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { investigation, solution, findingsImages, rootCauseImages } = investigationData;

      // Upload investigation images if provided
      const uploadedFindings = await uploadImagesIfNeeded(
        findingsImages,
        'CLOUDINARY_INCIDENT_FOLDER',
        'incidents'
      );
      const uploadedRootCause = await uploadImagesIfNeeded(
        rootCauseImages,
        'CLOUDINARY_INCIDENT_FOLDER',
        'incidents'
      );
      const mergedImages = Array.from(
        new Set([...(incident.images || []), ...uploadedFindings, ...uploadedRootCause])
      );
      if (uploadedFindings.length || uploadedRootCause.length) {
        await incidentRepository.updateById(id, { images: mergedImages }, tenantId);
      }

      console.log('🔍 Investigation data received:', {
        investigation: investigation?.substring(0, 50) + '...',
        solution: solution?.substring(0, 50) + '...',
        findingsImages: findingsImages,
        findingsImagesLength: findingsImages?.length
      });


      // Thêm investigation entry
      const investigationHistoryData = {
        action: 'Điều tra',
        performedBy: userId,
        note: investigation,
        timestamp: new Date(),
        findingsImages: findingsImages || []
      };
      
      console.log('📝 Adding investigation history:', {
        action: investigationHistoryData.action,
        findingsImagesCount: investigationHistoryData.findingsImages?.length
      });
      
      await incidentRepository.addHistory(id, investigationHistoryData, tenantId);

      // Thêm solution entry
      await incidentRepository.addHistory(id, {
        action: 'Khắc phục',
        performedBy: userId,
        note: solution,
        timestamp: new Date()
      }, tenantId);

      // Get updated incident with history
      const updatedIncident = await incidentRepository.getIncidentById(id);

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
  static async updateIncidentProgress(id, progressData, userId, tenantId = null) {
    try {
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
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

      // Upload progress images if any
      const uploadedProgressImages = await uploadImagesIfNeeded(
        progressData.images,
        'CLOUDINARY_INCIDENT_FOLDER',
        'incidents'
      );
      if (uploadedProgressImages.length) {
        const merged = Array.from(new Set([...(incident.images || []), ...uploadedProgressImages]));
        await incidentRepository.updateById(id, { images: merged }, tenantId);
      }

      // Thêm progress entry
      await incidentRepository.addHistory(id, {
        action: 'Cập nhật tiến độ',
        performedBy: userId,
        note: note.trim(),
        timestamp: new Date()
      }, tenantId);

      // Get updated incident with history
      const updatedIncident = await incidentRepository.getIncidentById(id);

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
  static async closeIncident(id, closeData, userId, tenantId = null) {
    try {
      const incident = await incidentRepository.getIncidentById(id, tenantId);
      
      if (!incident) {
        return {
          success: false,
          message: 'Không tìm thấy incident',
          statusCode: 404
        };
      }

      const { note, images } = closeData || {};

      // Upload closing images if any
      const uploadedCloseImages = await uploadImagesIfNeeded(
        images,
        'CLOUDINARY_INCIDENT_FOLDER',
        'incidents'
      );
      if (uploadedCloseImages.length) {
        const merged = Array.from(new Set([...(incident.images || []), ...uploadedCloseImages]));
        await incidentRepository.updateById(id, { images: merged }, tenantId);
      }

      // Update status using repository
      const updatedIncident = await incidentRepository.updateById(id, {
        status: 'Đã đóng'
      }, tenantId);

      // Thêm close entry
      await incidentRepository.addHistory(id, {
        action: 'Đóng',
        performedBy: userId,
        note: note || 'Đóng incident',
        timestamp: new Date()
      }, tenantId);

      // Get updated incident with history
      const finalIncident = await incidentRepository.getIncidentById(id);

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
      const stats = await incidentRepository.getIncidentStats(filters);
      
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
      const incidents = await incidentRepository.getIncidentsByUser(userId);
      
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
      const incidents = await incidentRepository.getIncidentsByStatus(status);
      
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
      const incidents = await incidentRepository.getIncidentsBySeverity(severity);
      
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
      const incident = await incidentRepository.getIncidentById(id);
      
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

      const deletedIncident = await incidentRepository.deleteIncident(id);

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
      const incident = await incidentRepository.getIncidentById(id);
      
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

      const updatedIncident = await incidentRepository.updateIncident(id, updateData);

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