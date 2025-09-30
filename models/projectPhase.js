const mongoose = require('mongoose');

const projectPhaseSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  phase_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  phase_order: {
    type: Number,
    required: true,
    min: 1
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
  planned_budget: {
    type: Number,
    min: 0,
    default: 0
  },
  actual_cost: {
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
  status: {
    type: String,
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
    default: 'PLANNED'
  },
  is_active: {
    type: Boolean,
    default: true
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
projectPhaseSchema.index({ project_id: 1, phase_order: 1 });
projectPhaseSchema.index({ status: 1 });
projectPhaseSchema.index({ planned_start_date: 1, planned_end_date: 1 });

module.exports = mongoose.model('ProjectPhase', projectPhaseSchema);
