const mongoose = require('mongoose');

const projectRiskSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  phase_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectPhase',
    required: false
  },
  risk_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  risk_category: {
    type: String,
    enum: ['TECHNICAL', 'SCHEDULE', 'SAFETY', 'ENVIRONMENTAL', 'REGULATORY', 'SUPPLIER', 'PERSONNEL'],
    required: true
  },
  probability: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  impact_score: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 5,
    required: true
  },
  mitigation_plan: {
    type: String,
    required: true,
    trim: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['IDENTIFIED', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'IDENTIFIED'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  identified_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  target_resolution_date: {
    type: Date,
    required: true
  },
  actual_resolution_date: {
    type: Date
  },
  schedule_impact_days: {
    type: Number,
    min: 0,
    default: 0
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
projectRiskSchema.index({ project_id: 1, phase_id: 1 });
projectRiskSchema.index({ risk_category: 1 });
projectRiskSchema.index({ risk_score: -1 });
projectRiskSchema.index({ status: 1 });
projectRiskSchema.index({ owner_id: 1 });
projectRiskSchema.index({ identified_date: -1 });

module.exports = mongoose.model('ProjectRisk', projectRiskSchema);
