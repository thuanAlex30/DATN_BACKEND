const Accident = require('../models/accident');
const User = require('../models/user');

// Báo cáo tai nạn
exports.reportAccident = async (req, res) => {
  try {
    const { description, images, location, severity } = req.body;
    const accident = new Accident({
      description,
      images,
      location,
      severity,
      createdBy: req.user._id,
      histories: [{ action: 'Báo cáo', performedBy: req.user._id, note: 'Báo cáo tai nạn' }]
    });
    await accident.save();
    res.status(201).json(accident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xác nhận & phân loại
exports.confirmAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const { severity, assignedTo, plan } = req.body;
    const accident = await Accident.findById(id);
    if (!accident) return res.status(404).json({ error: 'Không tìm thấy tai nạn' });
    accident.severity = severity;
    accident.assignedTo = assignedTo;
    accident.plan = plan;
    accident.status = 'Đang xử lý';
    accident.histories.push({ action: 'Xác nhận & phân loại', performedBy: req.user._id, note: `Phân loại: ${severity}` });
    await accident.save();
    res.json(accident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật xử lý & ghi nhận biện pháp
exports.updateAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution, status } = req.body;
    const accident = await Accident.findById(id);
    if (!accident) return res.status(404).json({ error: 'Không tìm thấy tai nạn' });
    if (solution) accident.solution = solution;
    if (status) accident.status = status;
    accident.histories.push({ action: 'Cập nhật xử lý', performedBy: req.user._id, note: solution });
    await accident.save();
    res.json(accident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đánh giá & đóng sự cố
exports.closeAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const accident = await Accident.findById(id);
    if (!accident) return res.status(404).json({ error: 'Không tìm thấy tai nạn' });
    accident.status = 'Đã đóng';
    accident.confirmedBy = req.user._id;
    accident.histories.push({ action: 'Đóng sự cố', performedBy: req.user._id, note: 'Đã xác nhận & đóng báo cáo' });
    await accident.save();
    res.json(accident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh sách tai nạn (phục vụ thống kê)
exports.getAccidents = async (req, res) => {
  try {
    const accidents = await Accident.find().populate('createdBy assignedTo confirmedBy histories.performedBy');
    res.json(accidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
