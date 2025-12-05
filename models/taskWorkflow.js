const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const TASK_LEVELS = ['DEPARTMENT_HEADER', 'MANAGER', 'EMPLOYEE'];
const TASK_STATUSES = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];

const taskWorkflowSchema = new mongoose.Schema({
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
  parent_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskWorkflow',
    default: null
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
    maxlength: 2000
  },
  is_campaign: {
    // True: nhiệm vụ gốc do Dept Header tạo (chiến dịch)
    type: Boolean,
    default: false
  },
  level: {
    // Cấp hiện tại phụ trách task
    type: String,
    enum: TASK_LEVELS,
    required: true
  },
  status: {
    type: String,
    enum: TASK_STATUSES,
    default: 'NEW'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  due_date: {
    type: Date
  },
  progress_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'task_workflows'
});

taskWorkflowSchema.index({ tenant_id: 1, department_id: 1, level: 1, status: 1 });
taskWorkflowSchema.index({ tenant_id: 1, department_id: 1, is_campaign: 1 });
taskWorkflowSchema.index({ parent_task_id: 1 });
taskWorkflowSchema.index({ assigned_to: 1, status: 1 });

module.exports = {
  TaskWorkflow: mongoose.model('TaskWorkflow', taskWorkflowSchema),
  TASK_LEVELS,
  TASK_STATUSES
};


