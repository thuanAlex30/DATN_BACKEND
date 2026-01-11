const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const IncidentHistorySchema = new mongoose.Schema({
  action: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: String,
  // Minh chứng - Evidence
  evidenceImages: { type: [String], default: [] }, // Hình ảnh minh chứng (tổng quát)
  findingsImages: { type: [String], default: [] }, // Hình ảnh minh chứng cho action "Điều tra" (backward compatible)
  evidenceType: { 
    type: String, 
    enum: ['photo', 'document', 'video', 'other'],
    default: 'photo'
  }, // Loại minh chứng
  evidenceDescription: { type: String } // Mô tả về minh chứng
});

const IncidentSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  title: { type: String, required: true },
  description: String,
  images: [String],
  location: String,
  severity: { type: String, enum: ['nhẹ', 'nặng', 'rất nghiêm trọng'], default: 'nhẹ' },
  status: { type: String, enum: ['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'], default: 'Mới ghi nhận' },
  incidentId: { type: String, unique: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notified: { type: Boolean, default: false },
  // Thời gian xử lý
  estimatedCompletionTime: { type: Date }, // Thời gian dự kiến hoàn thành
  actualStartTime: { type: Date }, // Thời gian bắt đầu xử lý thực tế (khi assign)
  actualCompletionTime: { type: Date }, // Thời gian hoàn thành thực tế (khi close)
  histories: [IncidentHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

IncidentSchema.index({ tenant_id: 1 });
IncidentSchema.index({ status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ assignedTo: 1 });
IncidentSchema.index({ createdBy: 1 });
IncidentSchema.index({ location: 1 }); // Index cho location để kiểm tra conflict
IncidentSchema.index({ assignedTo: 1, status: 1, location: 1 }); // Composite index cho location conflict check

module.exports = mongoose.model('Incident', IncidentSchema);