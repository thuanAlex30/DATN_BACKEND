const mongoose = require('mongoose');
const { Schema } = mongoose;

const attendanceSchema = new Schema({
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: false, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: false, index: true },
  device_id: { type: Schema.Types.ObjectId, ref: 'TimeDevice', required: false, index: true },
  raw_device_id: { type: String }, // original device_id string
  badge: { type: String },
  timestamp: { type: Date, required: true },
  type: { type: String, enum: ['checkin','checkout','unknown'], default: 'unknown' },
  raw_payload: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

attendanceSchema.index({ tenant_id: 1, project_id: 1, employee_id: 1, timestamp: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);


