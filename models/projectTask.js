const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parent_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    default: null
  },
  task_code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  task_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  task_order: {
    type: Number,
    min: 1,
    default: 1
  },
  task_type: {
    type: String,
    enum: ['CONSTRUCTION', 'INSPECTION', 'DOCUMENTATION', 'PLANNING', 'COORDINATION', 'SAFETY', 'QUALITY'],
    required: true
  },
  planned_start_date: {
    type: Date,
    required: true
  },
  planned_end_date: {
    type: Date,
    required: true
  },
  actual_start_date: {
    type: Date
  },
  actual_end_date: {
    type: Date
  },
  planned_duration_hours: {
    type: Number,
    min: 0,
    required: true
  },
  actual_duration_hours: {
    type: Number,
    min: 0,
    default: 0
  },
  progress_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
    default: 'PENDING'
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteArea',
    required: true
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLocation',
    required: true
  },
  responsible_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  estimated_cost: {
    type: Number,
    min: 0,
    default: 0
  },
  actual_cost: {
    type: Number,
    min: 0,
    default: 0
  },
  completion_criteria: {
    type: String,
    trim: true
  },
  dependencies: [{
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTask'
    },
    dependency_type: {
      type: String,
      enum: ['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'],
      default: 'FINISH_TO_START'
    },
    lag_days: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectTaskSchema.index({ project_id: 1, phase_id: 1, task_order: 1 });
projectTaskSchema.index({ project_id: 1, status: 1 });
projectTaskSchema.index({ task_code: 1 });
projectTaskSchema.index({ status: 1 });
projectTaskSchema.index({ area_id: 1, location_id: 1 });
projectTaskSchema.index({ planned_start_date: 1, planned_end_date: 1 });
projectTaskSchema.index({ responsible_user_id: 1 });
projectTaskSchema.index({ parent_task_id: 1 });
projectTaskSchema.index({ priority: 1 });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
