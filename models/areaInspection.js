const mongoose = require('mongoose');

const areaInspectionSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteArea',
    required: true
  },
  checklist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AreaSafetyChecklist',
    required: true
  },
  inspector_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inspection_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  inspection_results: [{
    item_name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'N/A'],
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    photos: [{
      file_name: String,
      file_path: String,
      uploaded_at: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  overall_status: {
    type: String,
    enum: ['PASS', 'FAIL', 'CONDITIONAL_PASS'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  corrective_actions: [{
    action: {
      type: String,
      required: true,
      trim: true
    },
    responsible_person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    due_date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
      default: 'PENDING'
    },
    completed_at: {
      type: Date
    }
  }],
  next_inspection_date: {
    type: Date,
    required: true
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
areaInspectionSchema.index({ area_id: 1, inspection_date: -1 });
areaInspectionSchema.index({ inspector_id: 1, inspection_date: -1 });
areaInspectionSchema.index({ overall_status: 1 });
areaInspectionSchema.index({ next_inspection_date: 1 });

module.exports = mongoose.model('AreaInspection', areaInspectionSchema);
