const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const PPE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED'];

const ppeRequestSchema = new mongoose.Schema({
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
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PPEItem',
      required: true
    },
    quantity: {
      type: Number,
      min: 1,
      required: true
    }
  }],
  purpose: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: PPE_REQUEST_STATUSES,
    default: 'PENDING'
  },
  needed_date: {
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
  collection: 'ppe_requests'
});

ppeRequestSchema.index({ tenant_id: 1, department_id: 1, status: 1 });
ppeRequestSchema.index({ requester_id: 1, status: 1 });

module.exports = {
  PPERequest: mongoose.model('PPERequest', ppeRequestSchema),
  PPE_REQUEST_STATUSES
};


