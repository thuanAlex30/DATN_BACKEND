const mongoose = require('mongoose');

const projectStatusReportSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  report_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  overall_progress: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  budget_utilization: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  tasks_completed: {
    type: Number,
    min: 0,
    default: 0
  },
  tasks_in_progress: {
    type: Number,
    min: 0,
    default: 0
  },
  tasks_overdue: {
    type: Number,
    min: 0,
    default: 0
  },
  status_summary: {
    type: String,
    required: true,
    trim: true
  },
  key_achievements: {
    type: String,
    trim: true
  },
  upcoming_activities: {
    type: String,
    trim: true
  },
  risks_issues: {
    type: String,
    trim: true
  },
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
projectStatusReportSchema.index({ project_id: 1, report_date: -1 });
projectStatusReportSchema.index({ reported_by: 1 });
projectStatusReportSchema.index({ report_date: -1 });

module.exports = mongoose.model('ProjectStatusReport', projectStatusReportSchema);
