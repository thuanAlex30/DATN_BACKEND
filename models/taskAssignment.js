const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role_in_task: {
    type: String,
    required: true,
    trim: true
  },
  assigned_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  allocated_hours: {
    type: Number,
    min: 0,
    required: true
  },
  actual_hours: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  notes: {
    type: String,
    trim: true
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
taskAssignmentSchema.index({ task_id: 1, user_id: 1 });
taskAssignmentSchema.index({ user_id: 1, status: 1 });
taskAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('TaskAssignment', taskAssignmentSchema);
