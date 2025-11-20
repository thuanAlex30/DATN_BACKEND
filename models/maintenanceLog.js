const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const maintenanceLogSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceJob',
    required: true
  },
  entry_type: {
    type: String,
    enum: ['NOTE', 'PROGRESS', 'ISSUE', 'COST'],
    default: 'NOTE'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  spent_hours: {
    type: Number,
    min: 0
  },
  cost_amount: {
    type: Number,
    min: 0
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'maintenance_logs'
});

maintenanceLogSchema.index({ tenant_id: 1, department_id: 1, job_id: 1 });

const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);

module.exports = { MaintenanceLog };


