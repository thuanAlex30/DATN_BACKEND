const mongoose = require('mongoose');

const taskDependencySchema = new mongoose.Schema({
  predecessor_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },
  successor_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
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
taskDependencySchema.index({ predecessor_task_id: 1 });
taskDependencySchema.index({ successor_task_id: 1 });
taskDependencySchema.index({ is_active: 1 });

module.exports = mongoose.model('TaskDependency', taskDependencySchema);
