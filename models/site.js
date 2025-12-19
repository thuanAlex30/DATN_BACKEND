const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  site_name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
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
  description: {
    type: String,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  contact_phone: {
    type: String,
    trim: true
  },
  contact_email: {
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

// Index for better performance
siteSchema.index({ project_id: 1, site_name: 1 });
siteSchema.index({ project_id: 1 });
siteSchema.index({ site_name: 'text', address: 'text' });
siteSchema.index({ is_active: 1 });

module.exports = mongoose.model('Site', siteSchema);