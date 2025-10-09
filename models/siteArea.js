const mongoose = require('mongoose');

const siteAreaSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  area_code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  area_name: {
    type: String,
    required: true,
    trim: true
  },
  area_type: {
    type: String,
    enum: ['CONSTRUCTION', 'STORAGE', 'OFFICE', 'SAFETY', 'EQUIPMENT', 'MEETING', 'REST'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  area_size_sqm: {
    type: Number,
    min: 0,
    required: true
  },
  safety_level: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  supervisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  capacity: {
    type: Number,
    min: 1,
    default: 1
  },
  special_requirements: {
    type: String,
    trim: true
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
siteAreaSchema.index({ site_id: 1, area_code: 1 });
siteAreaSchema.index({ project_id: 1, area_code: 1 });
siteAreaSchema.index({ project_id: 1, site_id: 1 });
siteAreaSchema.index({ area_type: 1 });
siteAreaSchema.index({ safety_level: 1 });
siteAreaSchema.index({ supervisor_id: 1 });
siteAreaSchema.index({ is_active: 1 });

module.exports = mongoose.model('SiteArea', siteAreaSchema);
