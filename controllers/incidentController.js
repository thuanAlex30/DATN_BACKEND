const incidentService = require('../services/incidentService');
const websocketService = require('../services/websocketService');
const User = require('../models/user');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

// 1. Ghi nhận sự cố
exports.reportIncident = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      images, 
      location, 
      severity,
      affectedEmployeeId,
      employeeStatus,
      incidentType,
      witnesses,
      medicalReport
    } = req.body;
    
    // Tạo incidentId tự động
    const incidentId = 'INC' + Date.now();
    const incident = new Incident({
      title,
      description,
      images,
      location,
      severity,
      incidentId,
      createdBy: req.user._id,
      // Thêm các trường mới cho Update Employee Incident
      affectedEmployeeId,
      employeeStatus,
      incidentType,
      witnesses: witnesses || [],
      medicalReport,
      histories: [{ 
        action: 'Ghi nhận', 
        performedBy: req.user._id, 
        note: `Ghi nhận sự cố${affectedEmployeeId ? ` - Nhân viên: ${affectedEmployeeId}` : ''}` 
      }]
    });
    await incident.save();
    
    const result = await incidentService.createIncident(incidentData, userId);
    
    if (result.success) {
      // Emit WebSocket notification for incident reported
      try {
        const reporter = await User.findById(userId).select('_id role full_name');
        if (reporter) {
          websocketService.emitIncidentReported(result.data, reporter);
          console.log(`🚨 Incident reported WebSocket notification sent for user: ${reporter._id}`);
        }
      } catch (wsError) {
        console.error('Failed to emit incident reported WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 2. Lấy tất cả incidents
  static getIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await incidentService.getAllIncidents();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 3. Lấy incident theo ID
  static getIncidentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await incidentService.getIncidentById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  // 4. Phân loại & thông báo
  static classifyIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { severity } = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.classifyIncident(id, severity, userId);
    
    if (result.success) {
      // Emit WebSocket notification for incident classified
      try {
        const classifier = await User.findById(userId).select('_id role full_name');
        if (classifier) {
          websocketService.emitIncidentClassified(result.data, classifier);
          console.log(`🚨 Incident classified WebSocket notification sent for user: ${classifier._id}`);
        }
      } catch (wsError) {
        console.error('Failed to emit incident classified WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 5. Phân công xử lý
  static assignIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.assignIncident(id, assignedTo, userId);
    
    if (result.success) {
      // Emit WebSocket notification for incident assigned
      try {
        const assigner = await User.findById(userId).select('_id role full_name');
        const assignee = await User.findById(assignedTo).select('_id role full_name');
        if (assigner && assignee) {
          websocketService.emitIncidentAssigned(result.data, assignee, assigner);
          console.log(`🚨 Incident assigned WebSocket notification sent for user: ${assignee._id}`);
        }
      } catch (wsError) {
        console.error('Failed to emit incident assigned WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 6. Điều tra sự cố
  static investigateIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const investigationData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.investigateIncident(id, investigationData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 7. Cập nhật tiến độ
  static updateIncidentProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
<<<<<<< HEAD
    const progressData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.updateIncidentProgress(id, progressData, userId);
    
    if (result.success) {
      // Emit WebSocket notification for incident progress updated
      try {
        const updater = await User.findById(userId).select('_id role full_name');
        if (updater) {
          websocketService.emitIncidentProgressUpdated(result.data, updater);
          console.log(`🚨 Incident progress updated WebSocket notification sent for user: ${updater._id}`);
        }
      } catch (wsError) {
        console.error('Failed to emit incident progress updated WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 8. Đóng sự cố
  static closeIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const closeData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.closeIncident(id, closeData, userId);
    
    if (result.success) {
      // Emit WebSocket notification for incident closed
      try {
        const closer = await User.findById(userId).select('_id role full_name');
        if (closer) {
          websocketService.emitIncidentClosed(result.data, closer);
          console.log(`🚨 Incident closed WebSocket notification sent for user: ${closer._id}`);
        }
      } catch (wsError) {
        console.error('Failed to emit incident closed WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 9. Lấy thống kê incidents
  static getIncidentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await incidentService.getIncidentStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 10. Tìm kiếm incidents
  static searchIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const result = await incidentService.searchIncidents(q);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 11. Lấy incidents theo user
  static getIncidentsByUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await incidentService.getIncidentsByUser(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 12. Lấy incidents theo project
  static getIncidentsByProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const result = await incidentService.getIncidentsByProject(projectId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 13. Lấy incidents theo status
  static getIncidentsByStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.params;
    const result = await incidentService.getIncidentsByStatus(status);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 14. Lấy incidents theo severity
  static getIncidentsBySeverity = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { severity } = req.params;
    const result = await incidentService.getIncidentsBySeverity(severity);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 15. Xóa incident
  static deleteIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const result = await incidentService.deleteIncident(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 16. Cập nhật incident
  static updateIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    
    const result = await incidentService.updateIncident(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });
}

module.exports = IncidentController;
=======
    const incident = await Incident.findById(id).populate('createdBy assignedTo histories.performedBy');
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Cập nhật thông tin nhân viên trong sự cố
exports.updateEmployeeIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      affectedEmployeeId, 
      employeeStatus, 
      medicalReport, 
      witnesses, 
      incidentType,
      additionalNotes 
    } = req.body;
    
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    
    // Cập nhật thông tin nhân viên
    incident.affectedEmployeeId = affectedEmployeeId;
    incident.employeeStatus = employeeStatus;
    incident.medicalReport = medicalReport;
    incident.witnesses = witnesses || [];
    incident.incidentType = incidentType;
    incident.additionalNotes = additionalNotes;
    
    // Thêm vào lịch sử
    incident.histories.push({ 
      action: 'Cập nhật thông tin nhân viên', 
      performedBy: req.user._id, 
      note: `Cập nhật tình trạng nhân viên: ${employeeStatus}` 
    });
    
    await incident.save();
    
    // Emit WebSocket event for employee incident updated
    websocketService.emitEmployeeIncidentUpdated(incident, req.user);
    
    // Emit Kafka event for incident updated
    try {
      const changes = { 
        affectedEmployeeId, 
        employeeStatus, 
        incidentType,
        updatedBy: req.user._id 
      };
      await IncidentEvents.emitIncidentUpdated(incident, req.user, changes);
    } catch (eventError) {
      console.error('Failed to emit incident updated event:', eventError);
    }
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
>>>>>>> origin/anh-thy
