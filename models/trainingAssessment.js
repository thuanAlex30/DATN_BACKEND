const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const ASSESSMENT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

const trainingAssessmentSchema = new mongoose.Schema({
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
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingSession',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  max_score: {
    type: Number,
    min: 0,
    default: 100
  },
  status: {
    type: String,
    enum: ASSESSMENT_STATUSES,
    default: 'NOT_STARTED'
  },
  completed_at: {
    type: Date
  },
  attempts: {
    type: Number,
    min: 0,
    default: 0
  },
  metadata: {
    type: Object
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
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'training_assessments'
});

trainingAssessmentSchema.index({ tenant_id: 1, department_id: 1, session_id: 1, user_id: 1 }, { unique: true });
trainingAssessmentSchema.index({ session_id: 1, status: 1 });

module.exports = {
  TrainingAssessment: mongoose.model('TrainingAssessment', trainingAssessmentSchema),
  ASSESSMENT_STATUSES
};


