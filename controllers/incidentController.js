const incidentService = require('../services/incidentService');
const Incident = require('../models/incident');
const User = require('../models/user');
const { IncidentEscalation } = require('../models/incidentEscalation');
const { sendSMS, sendNotification } = require('../utils/notifications'); // sendEmail replaced with Resend-based service
const emailService = require('../services/emailService');
const websocketService = require('../services/websocketService');
const IncidentEvents = require('../events/incidentEvents');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class IncidentController {
  // 1. Ghi nhận sự cố
  static reportIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const incidentData = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.createIncident(incidentData, userId, tenantId);
    
    if (result.success) {
        // Send realtime notification (WebSocket + Database) for incident reported
      try {
        const IncidentNotificationService = require('../services/incidentNotificationService');
        const reporter = await User.findById(userId).select('_id role full_name tenant_id').lean();
        const incident = result.data;
        
        // Get stakeholders (managers and admins in tenant)
        const Role = require('../models/role');
        const managerRole = await Role.findOne({ role_code: 'manager' });
        const adminRole = await Role.findOne({ role_code: 'admin' });
        const stakeholders = await User.find({
          tenant_id: tenantId,
          is_active: true,
          $or: [
            { role_id: managerRole?._id },
            { role_id: adminRole?._id }
          ]
        }).select('_id full_name').lean();
        
        await IncidentNotificationService.notifyIncidentReported({
          incident,
          reporter,
          stakeholders,
          tenantId
        });
        
        // Also emit WebSocket for backward compatibility
        if (reporter) {
          websocketService.emitIncidentReported(incident, reporter);
        }
        console.log(`🚨 Incident reported notification sent (realtime + database) for user: ${reporter?._id}`);
      } catch (notifError) {
        console.error('Failed to send incident reported notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 2. Lấy tất cả incidents
  static getIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const filters = req.query || {};
    const user = req.user;
    const result = await incidentService.getAllIncidents(tenantId, filters, user);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 3. Lấy incident theo ID
  static getIncidentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await incidentService.getIncidentById(id, tenantId);
    
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
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.classifyIncident(id, severity, userId, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for incident classified
      try {
        const IncidentNotificationService = require('../services/incidentNotificationService');
        const classifier = await User.findById(userId).select('_id role full_name tenant_id').lean();
        const incident = result.data;
        
        // Get stakeholders (reporter, assignee, managers, admins)
        const stakeholders = [];
        if (incident.createdBy) {
          const reporter = await User.findById(incident.createdBy).select('_id full_name').lean();
          if (reporter) stakeholders.push(reporter);
        }
        if (incident.assignedTo) {
          const assignee = await User.findById(incident.assignedTo).select('_id full_name').lean();
          if (assignee) stakeholders.push(assignee);
        }
        
        await IncidentNotificationService.notifyIncidentClassified({
          incident,
          classifier,
          stakeholders,
          tenantId
        });
        
        // Also emit WebSocket for backward compatibility
        if (classifier) {
          websocketService.emitIncidentClassified(incident, classifier);
        }
        console.log(`🚨 Incident classified notification sent (realtime + database) for user: ${classifier?._id}`);
      } catch (notifError) {
        console.error('Failed to send incident classified notification:', notifError);
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
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.assignIncident(id, assignedTo, userId, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for incident assigned
      try {
        const IncidentNotificationService = require('../services/incidentNotificationService');
        const assigner = await User.findById(userId).select('_id role full_name tenant_id').lean();
        const assignee = await User.findById(assignedTo).select('_id role full_name tenant_id').lean();
        const incident = result.data;
        
        if (assigner && assignee) {
          await IncidentNotificationService.notifyIncidentAssigned({
            incident,
            assignee,
            assigner,
            tenantId
          });
          
          // Also emit WebSocket for backward compatibility
          websocketService.emitIncidentAssigned(incident, assignee, assigner);
          console.log(`🚨 Incident assigned notification sent (realtime + database) for user: ${assignee._id}`);
        }
      } catch (notifError) {
        console.error('Failed to send incident assigned notification:', notifError);
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
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.investigateIncident(id, investigationData, userId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 7. Cập nhật tiến độ
  static updateIncidentProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const progressData = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.updateIncidentProgress(id, progressData, userId, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for incident progress updated
      try {
        const IncidentNotificationService = require('../services/incidentNotificationService');
        const updater = await User.findById(userId).select('_id role full_name tenant_id').lean();
        const incident = result.data;
        
        // Get stakeholders (reporter, assignee, managers, admins)
        const stakeholders = [];
        if (incident.createdBy) {
          const reporter = await User.findById(incident.createdBy).select('_id full_name').lean();
          if (reporter) stakeholders.push(reporter);
        }
        if (incident.assignedTo) {
          const assignee = await User.findById(incident.assignedTo).select('_id full_name').lean();
          if (assignee) stakeholders.push(assignee);
        }
        
        await IncidentNotificationService.notifyIncidentProgressUpdated({
          incident,
          updater,
          stakeholders,
          tenantId
        });
        
        // Also emit WebSocket for backward compatibility
        if (updater) {
          websocketService.emitIncidentProgressUpdated(incident, updater);
        }
        console.log(`🚨 Incident progress updated notification sent (realtime + database) for user: ${updater?._id}`);
      } catch (notifError) {
        console.error('Failed to send incident progress updated notification:', notifError);
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
    const tenantId = req.user.tenant_id;
    
    const result = await incidentService.closeIncident(id, closeData, userId, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for incident closed
      try {
        const IncidentNotificationService = require('../services/incidentNotificationService');
        const closer = await User.findById(userId).select('_id role full_name tenant_id').lean();
        const incident = result.data;
        
        // Get stakeholders (reporter, assignee, managers, admins)
        const stakeholders = [];
        if (incident.createdBy) {
          const reporter = await User.findById(incident.createdBy).select('_id full_name').lean();
          if (reporter) stakeholders.push(reporter);
        }
        if (incident.assignedTo) {
          const assignee = await User.findById(incident.assignedTo).select('_id full_name').lean();
          if (assignee) stakeholders.push(assignee);
        }
        
        await IncidentNotificationService.notifyIncidentClosed({
          incident,
          closer,
          stakeholders,
          tenantId
        });
        
        // Also emit WebSocket for backward compatibility
        if (closer) {
          websocketService.emitIncidentClosed(incident, closer);
        }
        console.log(`🚨 Incident closed notification sent (realtime + database) for user: ${closer?._id}`);
      } catch (notifError) {
        console.error('Failed to send incident closed notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // 9. Lấy thống kê incidents
  static getIncidentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      console.log('📊 getIncidentStats controller called');
      console.log('📊 Request path:', req.path);
      console.log('📊 Request originalUrl:', req.originalUrl);
      
      const tenantId = req.user?.tenant_id || null;
      
      const filters = {
        ...req.query,
        tenant_id: tenantId
      };
      
      console.log('📊 getIncidentStats filters:', filters);
      
      const result = await incidentService.getIncidentStats(filters);
      
      console.log('📊 getIncidentStats result:', {
        success: result.success,
        statusCode: result.statusCode,
        hasData: !!result.data
      });
      
      if (result.success) {
        return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('❌ Error in getIncidentStats controller:', error);
      console.error('❌ Error stack:', error.stack);
      return ApiResponse.error(res, error.message || 'Lỗi khi lấy thống kê incidents', 500);
    }
  });

  // 10. Tìm kiếm incidents
  static searchIncidents = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const tenantId = req.user.tenant_id;
    const result = await incidentService.searchIncidents(q, tenantId);
    
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
    const tenantId = req.user.tenant_id;
    const result = await incidentService.getIncidentsByProject(projectId, tenantId);
    
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

  // 17. Cập nhật thông tin nhân viên trong incident
  static updateEmployeeIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
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

  // 9. Escalate incident (Department Header)
  static escalateIncident = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { escalation_level, reason } = req.body;
    
    // Validate escalation_level
    const validLevels = ['SITE', 'DEPARTMENT', 'COMPANY', 'EXTERNAL'];
    if (!escalation_level || !validLevels.includes(escalation_level)) {
      return ApiResponse.error(res, 'escalation_level phải là một trong: SITE, DEPARTMENT, COMPANY, EXTERNAL', 400);
    }
    
    // Find incident
    const incident = await Incident.findById(id);
    if (!incident) {
      return ApiResponse.error(res, 'Không tìm thấy sự cố', 404);
    }
    
    // Check if user is Department Header and has department_id
    if (!req.user.department_id) {
      return ApiResponse.error(res, 'Bạn phải thuộc một department để escalate sự cố', 403);
    }
    
    // Create escalation record
    const escalation = new IncidentEscalation({
      tenant_id: incident.tenant_id || req.user.tenant_id,
      department_id: req.user.department_id,
      incident_id: incident._id,
      escalation_level,
      reason: reason || '',
      status: 'OPEN',
      created_by: req.user._id
    });
    await escalation.save();
    
    // Update incident history
    incident.histories.push({ 
      action: 'Escalate', 
      performedBy: req.user._id, 
      note: `Escalate lên ${escalation_level}: ${reason || 'Không có lý do'}` 
    });
    await incident.save();
    
    // Send notifications based on escalation level
    if (escalation_level === 'COMPANY' || escalation_level === 'EXTERNAL') {
      await sendEmail('Company Admin', `Sự cố ${incident.incidentId} đã được escalate lên ${escalation_level}`);
      await sendNotification('Company Admin', `Sự cố ${incident.incidentId} đã được escalate lên ${escalation_level}`);
    } else if (escalation_level === 'SITE') {
      await sendEmail('Site Manager', `Sự cố ${incident.incidentId} đã được escalate lên ${escalation_level}`);
    }
    
    // Emit WebSocket event
    try {
      websocketService.emitToAll('incident_escalated', {
        incident: {
          id: incident._id,
          incidentId: incident.incidentId,
          title: incident.title,
          severity: incident.severity,
          status: incident.status
        },
        escalation: {
          id: escalation._id,
          escalationLevel: escalation.escalation_level,
          reason: escalation.reason,
          status: escalation.status
        },
        escalator: {
          id: req.user._id,
          full_name: req.user.full_name,
          role: req.user.role
        },
        timestamp: new Date()
      });
    } catch (wsError) {
      console.error('Failed to emit WebSocket event:', wsError);
    }
    
    // Emit Kafka event
    try {
      await IncidentEvents.emitIncidentEscalated(incident, escalation, req.user);
    } catch (eventError) {
      console.error('Failed to emit incident escalated event:', eventError);
    }
    
    return ApiResponse.success(res, { incident, escalation }, 'Escalate incident thành công', 201);
  });

  // 10. Get escalations for an incident
  static getIncidentEscalations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
      return ApiResponse.error(res, 'Không tìm thấy sự cố', 404);
    }
    
    const escalations = await IncidentEscalation.find({ incident_id: id })
      .populate({
        path: 'created_by',
        select: 'full_name email role_id',
        populate: {
          path: 'role_id',
          select: 'role_name role_code'
        }
      })
      .populate('resolved_by', 'full_name email')
      .sort({ created_at: -1 });
    
    return ApiResponse.success(res, escalations, 'Lấy danh sách escalations thành công', 200);
  });
}

module.exports = IncidentController;
