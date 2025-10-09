const mongoose = require('mongoose');

const projectResourceSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  resource_type: {
    type: String,
    enum: ['MATERIAL', 'EQUIPMENT', 'TOOL', 'VEHICLE', 'PERSONNEL', 'SUBCONTRACTOR'],
    required: true
  },
  resource_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  planned_quantity: {
    type: Number,
    min: 0,
    required: true
  },
  actual_quantity: {  
    type: Number,
    min: 0,
    default: 0
  },
  unit_cost: {
    type: Number,
    min: 0,
    default: 0
  },
  unit_measure: {
    type: String,
    required: true,
    trim: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  supplier_name: {
    type: String,
    trim: true
  },
  required_date: {
    type: Date,
    required: true
  },
  delivered_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ORDERED', 'DELIVERED', 'IN_USE', 'CONSUMED', 'RETURNED'],
    default: 'PLANNED'
  },
  location: {
    type: String,
    trim: true
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
projectResourceSchema.index({ project_id: 1, resource_type: 1 });
projectResourceSchema.index({ status: 1 });
projectResourceSchema.index({ required_date: 1 });
projectResourceSchema.index({ supplier_id: 1 });

module.exports = mongoose.model('ProjectResource', projectResourceSchema);
