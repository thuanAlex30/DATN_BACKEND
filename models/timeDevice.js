const mongoose = require('mongoose');
const { Schema } = mongoose;

const timeDeviceSchema = new Schema({
  device_id: { type: String, required: true, index: true, unique: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String },
  ip: { type: String },
  port: { type: Number },
  baseURL: { type: String },
  vendor: { type: String },
  username: { type: String },
  password: { type: String },
  secret: { type: String },
  protocol: { type: String, enum: ['tcp','udp','http','https'], default: 'http' },
  polling_interval_seconds: { type: Number, default: 60 },
  last_sync: { type: Date },
  status: { type: String, enum: ['online','offline','error'], default: 'offline' },
  meta: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

timeDeviceSchema.index({ tenant_id: 1, project_id: 1 });

module.exports = mongoose.model('TimeDevice', timeDeviceSchema);


