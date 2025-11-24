const Incident = require('../models/incident');
const User = require('../models/user');
const { IncidentEscalation } = require('../models/incidentEscalation');
const { sendEmail, sendSMS, sendNotification } = require('../utils/notifications'); // giả sử có các hàm này
const websocketService = require('../services/websocketService');
const IncidentEvents = require('../events/incidentEvents');

// 1. Ghi nhận sự cố
exports.reportIncident = async (req, res) => {
  try {
    const { title, description, images, location, severity } = req.body;
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
      histories: [{ action: 'Ghi nhận', performedBy: req.user._id, note: 'Ghi nhận sự cố' }]
    });
    await incident.save();
    
    // Emit WebSocket event for incident reported
    websocketService.emitIncidentReported(incident, req.user);
    
    // Emit Kafka event for incident reported
    try {
      await IncidentEvents.emitIncidentReported(incident, req.user);
    } catch (eventError) {
      console.error('Failed to emit incident reported event:', eventError);
    }
    
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Phân loại & thông báo
exports.classifyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { severity } = req.body;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    
    const oldSeverity = incident.severity;
    incident.severity = severity;
    incident.status = 'Đang xử lý';
    incident.histories.push({ action: 'Phân loại', performedBy: req.user._id, note: `Phân loại: ${severity}` });
    
    // Gửi thông báo theo mức độ
    if (severity === 'rất nghiêm trọng') {
      await sendSMS('Giám đốc, ATVS, Y tế', `Sự cố ${incident.incidentId} rất nghiêm trọng!`);
    } else if (severity === 'nặng') {
      await sendEmail('Trưởng ca, Quản lý dự án', `Sự cố ${incident.incidentId} nặng!`);
      await sendNotification('Trưởng ca, Quản lý dự án', `Sự cố ${incident.incidentId} nặng!`);
    } else {
      await sendEmail('Trưởng ca', `Sự cố ${incident.incidentId} nhẹ!`);
      incident.notified = true;
    }
    await incident.save();
    
    // Emit WebSocket event for incident classified
    websocketService.emitIncidentClassified(incident, req.user);
    
    // Emit Kafka event for incident updated
    try {
      const changes = { severity: { old: oldSeverity, new: severity } };
      await IncidentEvents.emitIncidentUpdated(incident, req.user, changes);
    } catch (eventError) {
      console.error('Failed to emit incident updated event:', eventError);
    }
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Phân công người phụ trách
exports.assignIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    incident.assignedTo = assignedTo;
    incident.histories.push({ action: 'Phân công', performedBy: req.user._id, note: `Phân công cho user ${assignedTo}` });
    await incident.save();
    
    // Get assignee user for WebSocket notification
    const assignee = await User.findById(assignedTo);
    if (assignee) {
      websocketService.emitIncidentAssigned(incident, assignee, req.user);
    }
    
    // Emit Kafka event for incident assigned
    try {
      if (assignee) {
        await IncidentEvents.emitIncidentAssigned(incident, assignee, req.user);
      }
    } catch (eventError) {
      console.error('Failed to emit incident assigned event:', eventError);
    }
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Điều tra & xử lý
exports.investigateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { investigation, solution } = req.body;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    incident.histories.push({ action: 'Điều tra', performedBy: req.user._id, note: investigation });
    incident.histories.push({ action: 'Khắc phục', performedBy: req.user._id, note: solution });
    await incident.save();
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Cập nhật tiến độ
exports.updateIncidentProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    incident.histories.push({ action: 'Cập nhật tiến độ', performedBy: req.user._id, note: progress });
    await incident.save();
    
    // Emit WebSocket event for incident progress updated
    websocketService.emitIncidentProgressUpdated(incident, req.user);
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Đóng sự cố & xuất báo cáo
exports.closeIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    incident.status = 'Đã đóng';
    incident.histories.push({ action: 'Đóng sự cố', performedBy: req.user._id, note: 'Đã xác nhận & đóng sự cố' });
    await incident.save();
    
    // Emit WebSocket event for incident closed
    websocketService.emitIncidentClosed(incident, req.user);
    
    // Emit Kafka event for incident closed
    try {
      await IncidentEvents.emitIncidentClosed(incident, req.user);
    } catch (eventError) {
      console.error('Failed to emit incident closed event:', eventError);
    }
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Lấy danh sách sự cố
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().populate('createdBy assignedTo histories.performedBy');
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. Lấy chi tiết sự cố
exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id).populate('createdBy assignedTo histories.performedBy');
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Escalate incident (Department Header)
exports.escalateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalation_level, reason } = req.body;
    
    // Validate escalation_level
    const validLevels = ['SITE', 'DEPARTMENT', 'COMPANY', 'EXTERNAL'];
    if (!escalation_level || !validLevels.includes(escalation_level)) {
      return res.status(400).json({ error: 'escalation_level phải là một trong: SITE, DEPARTMENT, COMPANY, EXTERNAL' });
    }
    
    // Find incident
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    }
    
    // Check if user is Department Header and has department_id
    if (!req.user.department_id) {
      return res.status(403).json({ error: 'Bạn phải thuộc một department để escalate sự cố' });
    }
    
    // Check tenant scope
    if (req.user.tenant_id && incident.tenant_id.toString() !== req.user.tenant_id.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập sự cố này' });
    }
    
    // Create escalation record
    const escalation = new IncidentEscalation({
      tenant_id: req.user.tenant_id || incident.tenant_id,
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
    
    res.status(201).json({
      incident,
      escalation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 10. Get escalations for an incident
exports.getIncidentEscalations = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    }
    
    // Check tenant scope
    if (req.user.tenant_id && incident.tenant_id.toString() !== req.user.tenant_id.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập sự cố này' });
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
    
    res.json(escalations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};