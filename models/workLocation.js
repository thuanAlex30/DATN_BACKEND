const mongoose = require('mongoose');

const workLocationSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteArea',
    required: true
  },
  location_code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location_name: {
    type: String,
    required: true,
    trim: true
  },
  location_type: {
    type: String,
    enum: ['WORKSTATION', 'EQUIPMENT_AREA', 'MEETING_POINT', 'STORAGE', 'SAFETY_ZONE', 'REST_AREA'],
    required: true
  },
  coordinates_within_area: {
    x: {
      type: Number,
      required: false
    },
    y: {
      type: Number,
      required: false
    },
    z: {
      type: Number,
      required: false
    }
  },
  access_requirements: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: 1,
    default: 1
  },
  safety_equipment_required: [{
    equipment_name: String,
    is_mandatory: {
      type: Boolean,
      default: true
    }
  }],
  special_instructions: {
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
workLocationSchema.index({ area_id: 1, location_code: 1 });
workLocationSchema.index({ location_type: 1 });
workLocationSchema.index({ is_active: 1 });

module.exports = mongoose.model('WorkLocation', workLocationSchema);
