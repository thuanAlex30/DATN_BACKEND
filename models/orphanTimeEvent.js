const mongoose = require('mongoose');
const { Schema } = mongoose;

const orphanTimeEventSchema = new Schema({
  device_id: { type: Schema.Types.ObjectId, ref: 'TimeDevice', required: false },
  raw_device_id: { type: String },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: false },
  badge: { type: String },
  timestamp: { type: Date },
  payload: { type: Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  notes: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('OrphanTimeEvent', orphanTimeEventSchema);


