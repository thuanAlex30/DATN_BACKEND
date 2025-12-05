const mongoose = require('mongoose');

const trainingEnrollmentSchema = new mongoose.Schema({
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
    enrolled_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['enrolled', 'completed', 'failed', 'cancelled'],
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
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'training_enrollments'
});

// Add unique compound index
trainingEnrollmentSchema.index({ session_id: 1, user_id: 1 }, { unique: true });

// Add other indexes
trainingEnrollmentSchema.index({ session_id: 1 });
trainingEnrollmentSchema.index({ user_id: 1 });
trainingEnrollmentSchema.index({ status: 1 });
trainingEnrollmentSchema.index({ enrolled_at: 1 });

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);

module.exports = TrainingEnrollment;