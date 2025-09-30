const mongoose = require('mongoose');

const areaAccessControlSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteArea',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  access_level: {
    type: String,
    enum: ['READ_ONLY', 'WORK', 'SUPERVISE', 'MANAGE'],
    required: true
  },
  valid_from: {
    type: Date,
    required: true,
    default: Date.now
  },
  valid_to: {
    type: Date,
    required: true
  },
  authorized_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  granted_at: {
    type: Date,
    default: Date.now
  },
  reason: {
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
areaAccessControlSchema.index({ area_id: 1, user_id: 1 });
areaAccessControlSchema.index({ user_id: 1, is_active: 1 });
areaAccessControlSchema.index({ valid_from: 1, valid_to: 1 });
areaAccessControlSchema.index({ is_active: 1 });

module.exports = mongoose.model('AreaAccessControl', areaAccessControlSchema);
