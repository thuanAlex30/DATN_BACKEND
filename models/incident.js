const mongoose = require('mongoose');
<<<<<<< HEAD
=======
const { getDefaultTenantObjectId } = require('../utils/tenancy');
>>>>>>> origin/main

const IncidentHistorySchema = new mongoose.Schema({
  action: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: String
});

const IncidentSchema = new mongoose.Schema({
<<<<<<< HEAD
=======
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
>>>>>>> origin/main
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
  histories: [IncidentHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

<<<<<<< HEAD
=======
IncidentSchema.index({ tenant_id: 1 });
IncidentSchema.index({ status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ assignedTo: 1 });
IncidentSchema.index({ createdBy: 1 });

>>>>>>> origin/main
module.exports = mongoose.model('Incident', IncidentSchema);