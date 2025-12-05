const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');
const { TASK_LEVELS } = require('./taskWorkflow');

const TASK_ACTIONS = [
  'CREATE_CAMPAIGN',
  'BREAKDOWN',
  'ASSIGN',
  'REASSIGN',
  'UPDATE_PROGRESS',
  'COMMENT'
];

const taskWorkflowLogSchema = new mongoose.Schema({
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
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskWorkflow',
    required: true
  },
  from_level: {
    type: String,
    enum: TASK_LEVELS,
    required: false
  },
  to_level: {
    type: String,
    enum: TASK_LEVELS,
    required: false
  },
  from_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  to_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: TASK_ACTIONS,
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  metadata: {
    type: Object
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  },
  collection: 'task_workflow_logs'
});

taskWorkflowLogSchema.index({ tenant_id: 1, department_id: 1, task_id: 1, created_at: -1 });
taskWorkflowLogSchema.index({ task_id: 1, action: 1 });

module.exports = {
  TaskWorkflowLog: mongoose.model('TaskWorkflowLog', taskWorkflowLogSchema),
  TASK_ACTIONS
};


