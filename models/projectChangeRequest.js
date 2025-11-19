const mongoose = require('mongoose');

const projectChangeRequestSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  change_title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  change_type: {
    type: String,
    enum: ['SCOPE', 'SCHEDULE', 'RESOURCE', 'QUALITY', 'TECHNICAL'],
    required: true
  },
  schedule_impact_days: {
    type: Number,
    min: 0,
    default: 0
  },
  justification: {
    type: String,
    required: true,
    trim: true
  },
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requested_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED'],
    default: 'PENDING'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  },
  approval_notes: {
    type: String,
    trim: true
  },
  implementation_date: {
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
  timestamps: true
});

// Indexes for better performance
projectChangeRequestSchema.index({ project_id: 1, status: 1 });
projectChangeRequestSchema.index({ change_type: 1 });
projectChangeRequestSchema.index({ requested_by: 1 });
projectChangeRequestSchema.index({ status: 1 });
projectChangeRequestSchema.index({ requested_at: -1 });

module.exports = mongoose.model('ProjectChangeRequest', projectChangeRequestSchema);
