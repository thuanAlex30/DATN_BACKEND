const mongoose = require('mongoose');

const AccidentHistorySchema = new mongoose.Schema({
  action: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  timestamp: { type: Date, default: Date.now },
  note: String
});

const AccidentSchema = new mongoose.Schema({
  description: { type: String, required: true },
  images: [String],
  location: String,
  severity: { type: String, enum: ['nhẹ', 'nặng', 'nghiêm trọng'], default: 'nhẹ' },
  status: { type: String, enum: ['Báo cáo', 'Đang xử lý', 'Hoàn thành', 'Đã đóng'], default: 'Báo cáo' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  plan: String,
  solution: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  histories: [AccidentHistorySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('accident', AccidentSchema);