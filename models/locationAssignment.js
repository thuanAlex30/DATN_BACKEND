const mongoose = require('mongoose');

const locationAssignmentSchema = new mongoose.Schema({
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLocation',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  work_type: {
    type: String,
    enum: ['CONSTRUCTION', 'INSPECTION', 'SUPERVISION', 'MAINTENANCE', 'CLEANING', 'SECURITY'],
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
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
locationAssignmentSchema.index({ location_id: 1, user_id: 1 });
locationAssignmentSchema.index({ project_id: 1, status: 1 });
locationAssignmentSchema.index({ start_time: 1, end_time: 1 });
locationAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('LocationAssignment', locationAssignmentSchema);
