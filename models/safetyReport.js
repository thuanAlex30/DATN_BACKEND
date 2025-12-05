const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const SAFETY_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SAFETY_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const safetyReportSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  severity: {
    type: String,
    enum: SAFETY_SEVERITIES,
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: SAFETY_STATUSES,
    default: 'OPEN'
  },
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    name: String,
    url: String
  }],
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'safety_reports'
});

safetyReportSchema.index({ tenant_id: 1, department_id: 1, status: 1, severity: 1 });

module.exports = {
  SafetyReport: mongoose.model('SafetyReport', safetyReportSchema),
  SAFETY_SEVERITIES,
  SAFETY_STATUSES
};


