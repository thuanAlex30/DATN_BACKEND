const mongoose = require('mongoose');

const milestoneDeliverableSchema = new mongoose.Schema({
  milestone_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectMilestone',
    required: true
  },
  deliverable_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  deliverable_type: {
    type: String,
    enum: ['DOCUMENT', 'REPORT', 'DRAWING', 'SPECIFICATION', 'PROTOTYPE', 'SOFTWARE', 'HARDWARE'],
    required: true
  },
  acceptance_criteria: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISED'],
    default: 'PENDING'
  },
  reviewer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitted_at: {
    type: Date
  },
  approved_at: {
    type: Date
  },
  file_path: {
    type: String,
    trim: true
  },
  file_size: {
    type: Number,
    min: 0
  },
  file_type: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    default: '1.0'
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
milestoneDeliverableSchema.index({ milestone_id: 1 });
milestoneDeliverableSchema.index({ status: 1 });
milestoneDeliverableSchema.index({ reviewer_id: 1 });
milestoneDeliverableSchema.index({ submitted_at: 1 });

module.exports = mongoose.model('MilestoneDeliverable', milestoneDeliverableSchema);
