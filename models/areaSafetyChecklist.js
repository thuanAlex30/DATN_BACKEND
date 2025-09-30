const mongoose = require('mongoose');

const areaSafetyChecklistSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteArea',
    required: true
  },
  checklist_name: {
    type: String,
    required: true,
    trim: true
  },
  safety_items: [{
    item_name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    is_critical: {
      type: Boolean,
      default: false
    },
    required_action: {
      type: String,
      trim: true
    }
  }],
  frequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED'],
    required: true
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
areaSafetyChecklistSchema.index({ area_id: 1 });
areaSafetyChecklistSchema.index({ frequency: 1 });
areaSafetyChecklistSchema.index({ is_active: 1 });

module.exports = mongoose.model('AreaSafetyChecklist', areaSafetyChecklistSchema);
