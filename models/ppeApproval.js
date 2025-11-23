const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const PPE_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const ppeApprovalSchema = new mongoose.Schema({
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
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPERequest',
    required: true
  },
  approver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: PPE_APPROVAL_STATUSES,
    default: 'PENDING'
  },
  decision_notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  decided_at: {
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
  collection: 'ppe_approvals'
});

ppeApprovalSchema.index({ tenant_id: 1, department_id: 1, status: 1 });
ppeApprovalSchema.index({ request_id: 1 });
ppeApprovalSchema.index({ approver_id: 1, status: 1 });

module.exports = {
  PPEApproval: mongoose.model('PPEApproval', ppeApprovalSchema),
  PPE_APPROVAL_STATUSES
};


