const mongoose = require('mongoose');

const IncidentHistorySchema = new mongoose.Schema({
  action: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: String,
  images: [String]
});

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  images: [String],
  location: String,
  severity: { type: String, enum: ['nhẹ', 'nặng', 'rất nghiêm trọng'], default: 'nhẹ' },
  status: { type: String, enum: ['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'], default: 'Mới ghi nhận' },
  incidentId: { type: String, unique: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notified: { type: Boolean, default: false },
  histories: [IncidentHistorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better performance
IncidentSchema.index({ incidentId: 1 }, { unique: true });
IncidentSchema.index({ createdBy: 1 });
IncidentSchema.index({ assignedTo: 1 });
IncidentSchema.index({ project_id: 1 });
IncidentSchema.index({ status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', IncidentSchema);