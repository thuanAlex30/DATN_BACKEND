const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const JOB_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
const JOB_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const maintenanceJobSchema = new mongoose.Schema({
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
  equipment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentStatus'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: JOB_PRIORITIES,
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: JOB_STATUSES,
    default: 'PLANNED'
  },
  scheduled_date: {
    type: Date
  },
  completed_date: {
    type: Date
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'maintenance_jobs'
});

maintenanceJobSchema.index({ tenant_id: 1, department_id: 1, status: 1, priority: 1 });

const MaintenanceJob = mongoose.model('MaintenanceJob', maintenanceJobSchema);

module.exports = {
  MaintenanceJob,
  JOB_STATUSES,
  JOB_PRIORITIES
};


