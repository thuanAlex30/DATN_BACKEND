const Incident = require('../models/incident');
const User = require('../models/user');
const { sendEmail, sendSMS, sendNotification } = require('../utils/notifications'); // giả sử có các hàm này

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
