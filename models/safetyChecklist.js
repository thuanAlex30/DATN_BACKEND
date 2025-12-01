const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const checklistItemSchema = new mongoose.Schema({
  item_text: {
    type: String,
    required: true,
    trim: true
  },
  is_required: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'NA'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const safetyChecklistSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true
  },
  checklist_items: [checklistItemSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  conducted_at: {
    type: Date
  },
  conducted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'safety_checklists'
});

safetyChecklistSchema.index({ tenant_id: 1, department_id: 1, status: 1 });

const SafetyChecklist = mongoose.model('SafetyChecklist', safetyChecklistSchema);

module.exports = {
  SafetyChecklist
};


