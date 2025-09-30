const mongoose = require('mongoose');

const resourceAllocationSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectResource',
    required: true
  },
  allocated_quantity: {
    type: Number,
    min: 0,
    required: true
  },
  actual_used_quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  allocation_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ALLOCATED', 'IN_USE', 'RETURNED', 'CONSUMED'],
    default: 'ALLOCATED'
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
resourceAllocationSchema.index({ task_id: 1, resource_id: 1 });
resourceAllocationSchema.index({ status: 1 });
resourceAllocationSchema.index({ allocation_date: 1 });

module.exports = mongoose.model('ResourceAllocation', resourceAllocationSchema);
