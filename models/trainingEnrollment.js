const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const trainingEnrollmentSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        default: getDefaultTenantObjectId
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    // Optional for legacy session-based enrollments (backward compatibility)
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingSession',
        required: false
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional - can be self-enrolled or manager-assigned
    },
    enrolled_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['enrolled', 'in_progress', 'completed', 'failed', 'cancelled'],
        default: 'enrolled'
    },
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    passed: {
        type: Boolean
    },
    completion_date: {
        type: Date
    },
    started_at: {
        type: Date
    },
    submitted_at: {
        type: Date
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'training_enrollments'
});

// Add unique compound index - one enrollment per course per user
trainingEnrollmentSchema.index({ course_id: 1, user_id: 1, tenant_id: 1 }, { unique: true });

// Add other indexes
trainingEnrollmentSchema.index({ tenant_id: 1 });
trainingEnrollmentSchema.index({ course_id: 1 });
trainingEnrollmentSchema.index({ user_id: 1 });
trainingEnrollmentSchema.index({ status: 1 });
trainingEnrollmentSchema.index({ enrolled_at: 1 });
trainingEnrollmentSchema.index({ tenant_id: 1, course_id: 1 });
trainingEnrollmentSchema.index({ session_id: 1 });
trainingEnrollmentSchema.index({ assigned_by: 1 });
trainingEnrollmentSchema.index({ tenant_id: 1, user_id: 1 });

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);

module.exports = TrainingEnrollment;