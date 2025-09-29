const mongoose = require('mongoose');

const IncidentHistorySchema = new mongoose.Schema({
  action: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: String
});

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  images: [String],
  location: { type: String },
  severity: { type: String, enum: ['nhẹ', 'nặng', 'rất nghiêm trọng'], default: 'nhẹ' },
  status: { type: String, enum: ['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'], default: 'Mới ghi nhận' },
  incidentId: { type: String, unique: true, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notified: { type: Boolean, default: false },
  
  // Thông tin phân loại
  category: String,
  priority: { type: String, enum: ['thấp', 'trung bình', 'cao', 'khẩn cấp'], default: 'trung bình' },
  
  // Thông tin điều tra
  investigation: {
    findings: String,
    rootCause: String,
    evidence: [String],
    recommendations: String,
    investigatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    investigatedAt: Date
  },
  
  // Thông tin giải quyết
  resolution: {
    description: String,
    lessonsLearned: String,
    preventiveMeasures: String,
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: Date
  },
  
  // Thông tin tiến độ
  progress: { type: Number, min: 0, max: 100, default: 0 },
  lastUpdated: Date,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Thông tin thời hạn
  dueDate: Date,
  
  // Lịch sử
  histories: [IncidentHistorySchema],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
IncidentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes để tối ưu hóa truy vấn
IncidentSchema.index({ incidentId: 1 });
IncidentSchema.index({ createdBy: 1 });
IncidentSchema.index({ assignedTo: 1 });
IncidentSchema.index({ status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Incident', IncidentSchema);