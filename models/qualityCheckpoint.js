const mongoose = require('mongoose');

const qualityCheckpointSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },
  checkpoint_name: {
    type: String,
    required: true,
    trim: true
  },
  quality_criteria: {
    type: String,
    required: true,
    trim: true
  },
  inspection_method: {
    type: String,
    required: true,
    trim: true
  },
  inspector_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduled_date: {
    type: Date,
    required: true
  },
  actual_date: {
    type: Date
  },
  result: {
    type: String,
    enum: ['PASS', 'FAIL', 'CONDITIONAL_PASS'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  findings: {
    type: String,
    trim: true
  },
  corrective_actions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  photos: [{
    file_name: String,
    file_path: String,
    uploaded_at: {
      type: Date,
      default: Date.now
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
qualityCheckpointSchema.index({ task_id: 1, scheduled_date: 1 });
qualityCheckpointSchema.index({ inspector_id: 1 });
qualityCheckpointSchema.index({ status: 1 });
qualityCheckpointSchema.index({ result: 1 });

module.exports = mongoose.model('QualityCheckpoint', qualityCheckpointSchema);
