const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const PPE_SCHEDULE_TYPES = ['INSPECTION', 'REPLACEMENT', 'STOCK_CHECK'];
const PPE_SCHEDULE_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const ppeScheduleSchema = new mongoose.Schema({
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
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEItem'
  },
  schedule_type: {
    type: String,
    enum: PPE_SCHEDULE_TYPES,
    required: true
  },
  planned_date: {
    type: Date,
    required: true
  },
  completed_date: {
    type: Date
  },
  status: {
    type: String,
    enum: PPE_SCHEDULE_STATUSES,
    default: 'PLANNED'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
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
  collection: 'ppe_schedules'
});

ppeScheduleSchema.index({ tenant_id: 1, department_id: 1, schedule_type: 1, status: 1 });
ppeScheduleSchema.index({ planned_date: 1 });

module.exports = {
  PPESchedule: mongoose.model('PPESchedule', ppeScheduleSchema),
  PPE_SCHEDULE_TYPES,
  PPE_SCHEDULE_STATUSES
};


