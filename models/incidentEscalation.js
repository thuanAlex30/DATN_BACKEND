const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const ESCALATION_LEVELS = ['SITE', 'DEPARTMENT', 'COMPANY', 'EXTERNAL'];
const ESCALATION_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

const incidentEscalationSchema = new mongoose.Schema({
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
  incident_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true
  },
  escalation_level: {
    type: String,
    enum: ESCALATION_LEVELS,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ESCALATION_STATUSES,
    default: 'OPEN'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolved_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'incident_escalations'
});

incidentEscalationSchema.index({ tenant_id: 1, department_id: 1, incident_id: 1, status: 1 });

module.exports = {
  IncidentEscalation: mongoose.model('IncidentEscalation', incidentEscalationSchema),
  ESCALATION_LEVELS,
  ESCALATION_STATUSES
};


