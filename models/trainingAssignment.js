const mongoose = require('mongoose');

const { getDefaultTenantObjectId } = require('../utils/tenancy');

const trainingAssignmentSchema = new mongoose.Schema({
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
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assigned_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'training_assignments'
});

// Add indexes
trainingAssignmentSchema.index({ course_id: 1 });
trainingAssignmentSchema.index({ department_id: 1 });
trainingAssignmentSchema.index({ assigned_by: 1 });
trainingAssignmentSchema.index({ status: 1 });
trainingAssignmentSchema.index({ tenant_id: 1 });
trainingAssignmentSchema.index({ course_id: 1, department_id: 1, tenant_id: 1 }, { unique: true });

// Virtual populate
trainingAssignmentSchema.virtual('course', {
    ref: 'Course',
    localField: 'course_id',
    foreignField: '_id',
    justOne: true
});

trainingAssignmentSchema.virtual('department', {
    ref: 'Department',
    localField: 'department_id',
    foreignField: '_id',
    justOne: true
});

trainingAssignmentSchema.virtual('assigner', {
    ref: 'User',
    localField: 'assigned_by',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
trainingAssignmentSchema.set('toJSON', { virtuals: true });
trainingAssignmentSchema.set('toObject', { virtuals: true });

const TrainingAssignment = mongoose.model('TrainingAssignment', trainingAssignmentSchema);

module.exports = TrainingAssignment;
