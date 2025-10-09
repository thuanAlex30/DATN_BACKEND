const mongoose = require('mongoose');

const projectMilestoneSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  milestone_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  planned_date: {
    type: Date,
    required: true
  },
  actual_date: {
    type: Date
  },
  milestone_type: {
    type: String,
    enum: ['PHASE_COMPLETION', 'DELIVERY', 'APPROVAL', 'REVIEW', 'CHECKPOINT'],
    required: true
  },
  completion_criteria: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'],
    default: 'PENDING'
  },
  responsible_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_critical: {
    type: Boolean,
    default: false
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true
});

// Indexes for better performance
projectMilestoneSchema.index({ project_id: 1 });
projectMilestoneSchema.index({ planned_date: 1 });
projectMilestoneSchema.index({ status: 1 });
projectMilestoneSchema.index({ responsible_user_id: 1 });
projectMilestoneSchema.index({ is_critical: 1 });

module.exports = mongoose.model('ProjectMilestone', projectMilestoneSchema);
