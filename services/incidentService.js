const incidentRepository = require('../repository/incidentRepository');
const IncidentUtils = require('../utils/incidentUtils');
const websocketService = require('./websocketService');
const IncidentEvents = require('../events/incidentEvents');
const User = require('../models/user');

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
            assignedTo: filters.assignedTo,
            createdBy: filters.createdBy,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
          }
        );
        
        // If department_header, filter results by department after query
        let incidents = result.incidents || [];
        if (user?.department_id && user?.role?.role_code === 'department_header') {
          const User = require('../models/user');
          const mongoose = require('mongoose');
          
          // Filter incidents where createdBy or assignedTo belongs to the department_header's department
          const filteredIncidents = [];
          for (const incident of incidents) {
            // Populate createdBy and assignedTo if not already populated
            let createdByUser = incident.createdBy;
            let assignedToUser = incident.assignedTo;
            
            if (mongoose.Types.ObjectId.isValid(incident.createdBy) && typeof incident.createdBy === 'object' && !incident.createdBy.department_id) {
              createdByUser = await User.findById(incident.createdBy).select('department_id');
            }
            if (incident.assignedTo && mongoose.Types.ObjectId.isValid(incident.assignedTo) && typeof incident.assignedTo === 'object' && !incident.assignedTo.department_id) {
              assignedToUser = await User.findById(incident.assignedTo).select('department_id');
            }
            
            // Include incident if createdBy or assignedTo belongs to the same department
            const createdByDeptId = createdByUser?.department_id?.toString() || (typeof createdByUser === 'object' && createdByUser?.department_id?.toString());
            const assignedToDeptId = assignedToUser?.department_id?.toString() || (typeof assignedToUser === 'object' && assignedToUser?.department_id?.toString());
            const userDeptId = user.department_id.toString();
            
            if (createdByDeptId === userDeptId || assignedToDeptId === userDeptId) {
              filteredIncidents.push(incident);
            }
          }
          incidents = filteredIncidents;
        }
        
        return {
          success: true,
          data: incidents,
          pagination: {
            ...result.pagination,
            totalItems: incidents.length,
            totalPages: Math.ceil(incidents.length / (result.pagination?.itemsPerPage || 20))
          },
          message: 'Lấy danh sách incidents thành công',
          statusCode: 200
        };
      } else {
        const result = await incidentRepository.findAll(
          { tenant_id: tenantId },
          {
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        );
        
        // If department_header, filter results by department after query
        let incidents = result.incidents || [];
        if (user?.department_id && user?.role?.role_code === 'department_header') {
          const User = require('../models/user');
          const mongoose = require('mongoose');
          
          // Filter incidents where createdBy or assignedTo belongs to the department_header's department
          const filteredIncidents = [];
          for (const incident of incidents) {
            // Populate createdBy and assignedTo if not already populated
            let createdByUser = incident.createdBy;
            let assignedToUser = incident.assignedTo;
            
            if (mongoose.Types.ObjectId.isValid(incident.createdBy) && typeof incident.createdBy === 'object' && !incident.createdBy.department_id) {
              createdByUser = await User.findById(incident.createdBy).select('department_id');
            }
            if (incident.assignedTo && mongoose.Types.ObjectId.isValid(incident.assignedTo) && typeof incident.assignedTo === 'object' && !incident.assignedTo.department_id) {
              assignedToUser = await User.findById(incident.assignedTo).select('department_id');
            }
            
            // Include incident if createdBy or assignedTo belongs to the same department
            const createdByDeptId = createdByUser?.department_id?.toString() || (typeof createdByUser === 'object' && createdByUser?.department_id?.toString());
            const assignedToDeptId = assignedToUser?.department_id?.toString() || (typeof assignedToUser === 'object' && assignedToUser?.department_id?.toString());
            const userDeptId = user.department_id.toString();
            
            if (createdByDeptId === userDeptId || assignedToDeptId === userDeptId) {
              filteredIncidents.push(incident);
            }
          }
          incidents = filteredIncidents;
        }
        
        return {
          success: true,
          data: incidents,
          pagination: {
            ...result.pagination,
            totalItems: incidents.length,
            totalPages: Math.ceil(incidents.length / (result.pagination?.itemsPerPage || 20))
          },
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

      // Thêm investigation entry
      await incidentRepository.addHistory(id, {
        action: 'Điều tra',
        performedBy: userId,
        note: investigation,
        timestamp: new Date()
      }, tenantId);

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
  static async getIncidentStats(filters = {}, tenantId = null, user = null) {
    try {
      let stats = await incidentRepository.getIncidentStats({
        ...filters,
        tenant_id: tenantId
      });
      
      // If department_header, filter stats by department
      if (user?.department_id && user?.role?.role_code === 'department_header') {
        console.log('🔍 Filtering stats for department_header:', {
          userId: user._id,
          departmentId: user.department_id,
          roleCode: user.role?.role_code
        });
        
        const User = require('../models/user');
        const mongoose = require('mongoose');
        const Incident = require('../models/incident');
        
        // Get all incidents of the tenant with populated users for department filtering
        const allIncidents = await Incident.find({ tenant_id: tenantId })
          .select('title description location severity status incidentId assignedTo createdBy images createdAt')
          .populate('createdBy', 'department_id')
          .populate('assignedTo', 'department_id')
          .lean();
        
        console.log(`📊 Found ${allIncidents.length} total incidents for tenant ${tenantId}`);
        
        // Filter incidents by department
        const filteredIncidents = [];
        const userDeptId = user.department_id.toString();
        
        for (const incident of allIncidents || []) {
          // Get department_id from populated or fetch if needed
          let createdByDeptId = null;
          let assignedToDeptId = null;
          
          if (incident.createdBy) {
            if (typeof incident.createdBy === 'object' && incident.createdBy.department_id) {
              createdByDeptId = incident.createdBy.department_id.toString();
            } else if (mongoose.Types.ObjectId.isValid(incident.createdBy)) {
              const createdByUser = await User.findById(incident.createdBy).select('department_id').lean();
              createdByDeptId = createdByUser?.department_id?.toString() || null;
            }
          }
          
          if (incident.assignedTo) {
            if (typeof incident.assignedTo === 'object' && incident.assignedTo.department_id) {
              assignedToDeptId = incident.assignedTo.department_id.toString();
            } else if (mongoose.Types.ObjectId.isValid(incident.assignedTo)) {
              const assignedToUser = await User.findById(incident.assignedTo).select('department_id').lean();
              assignedToDeptId = assignedToUser?.department_id?.toString() || null;
            }
          }
          
          // Include incident if createdBy or assignedTo belongs to the same department
          if (createdByDeptId === userDeptId || assignedToDeptId === userDeptId) {
            filteredIncidents.push(incident);
          }
        }
        
        console.log(`✅ Filtered to ${filteredIncidents.length} incidents for department ${userDeptId}`);
        
        // Recalculate stats from filtered incidents
        const total = filteredIncidents.length;
        const statusBreakdown = {};
        const severityBreakdown = {};
        
        filteredIncidents.forEach(incident => {
          const status = incident.status || 'Mới ghi nhận';
          const severity = incident.severity || 'nhẹ';
          
          statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
          severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;
        });
        
        const inProgress = (statusBreakdown['Đang xử lý'] || 0) + 
                          (statusBreakdown['in_progress'] || 0) + 
                          (statusBreakdown['investigating'] || 0);
        const resolved = (statusBreakdown['Đã đóng'] || 0) + 
                        (statusBreakdown['resolved'] || 0) + 
                        (statusBreakdown['closed'] || 0);
        const critical = (severityBreakdown['rất nghiêm trọng'] || 0) + 
                       (severityBreakdown['critical'] || 0) + 
                       (severityBreakdown['nặng'] || 0);
        
        stats = {
          total,
          inProgress,
          resolved,
          critical,
          byStatus: statusBreakdown,
          bySeverity: severityBreakdown
        };
      }
      
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
  static async getIncidentsByUser(userId, tenantId = null) {
    try {
      const incidents = await incidentRepository.getIncidentsByUser(userId, tenantId);
      
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
  static async getIncidentsByStatus(status, tenantId = null) {
    try {
      const incidents = await incidentRepository.getIncidentsByStatus(status, tenantId);
      
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
  static async getIncidentsBySeverity(severity, tenantId = null) {
    try {
      const incidents = await incidentRepository.getIncidentsBySeverity(severity, tenantId);
      
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
