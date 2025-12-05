const mongoose = require('mongoose');
<<<<<<< HEAD

const projectSchema = new mongoose.Schema({
=======
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const projectSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
>>>>>>> origin/main
  project_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
    required: true
  },
<<<<<<< HEAD
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
=======
  actual_start_date: {
    type: Date
  },
  actual_end_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
    default: 'PLANNING'
>>>>>>> origin/main
  },
  leader_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
<<<<<<< HEAD
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
=======
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false  // ✅ Không bắt buộc để có thể tạo project trước
>>>>>>> origin/main
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
<<<<<<< HEAD
  budget: {
    type: Number,
    min: 0,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
=======
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  project_type: {
    type: String,
    enum: ['CONSTRUCTION', 'MAINTENANCE', 'RENOVATION', 'INSPECTION', 'SAFETY', 'TRAINING'],
    default: 'CONSTRUCTION'
  },
  client_name: {
    type: String,
    trim: true
  },
  client_contact: {
    name: String,
    email: String,
    phone: String
>>>>>>> origin/main
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
projectSchema.index({ project_name: 'text', description: 'text' });
projectSchema.index({ status: 1 });
projectSchema.index({ leader_id: 1 });
<<<<<<< HEAD
projectSchema.index({ site_id: 1 });
projectSchema.index({ start_date: 1, end_date: 1 });

module.exports = mongoose.model('Project', projectSchema);
=======
projectSchema.index({ created_by: 1 });
projectSchema.index({ tenant_id: 1 });
projectSchema.index({ site_id: 1 });
projectSchema.index({ start_date: 1, end_date: 1 });

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
>>>>>>> origin/main
