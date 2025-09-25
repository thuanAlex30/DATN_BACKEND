const mongoose = require('mongoose');

const projectAssignmentSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role_in_project: {
    type: String,
    required: true,
    trim: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  responsibilities: {
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

// Index for better performance
projectAssignmentSchema.index({ project_id: 1, user_id: 1 });
projectAssignmentSchema.index({ user_id: 1 });
projectAssignmentSchema.index({ project_id: 1 });

// Ensure unique assignment per user per project
projectAssignmentSchema.index({ project_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('ProjectAssignment', projectAssignmentSchema);
