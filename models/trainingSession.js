const mongoose = require('mongoose');

const sessionStatusSchema = new mongoose.Schema({
    status_code: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        maxlength: 255
    }
}, {
    collection: 'session_statuses'
});

const SessionStatus = mongoose.model('SessionStatus', sessionStatusSchema);

const trainingSessionSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    session_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    max_participants: {
        type: Number,
        required: true,
        min: 1
    },
    location: {
        type: String,
        trim: true,
        maxlength: 255
    },
    status_code: {
        type: String,
        required: true,
        enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'training_sessions'
});

// Add validation
trainingSessionSchema.pre('save', function(next) {
    if (this.end_time <= this.start_time) {
        next(new Error('End time must be after start time'));
    } else {
        next();
    }
});

// Add indexes
trainingSessionSchema.index({ course_id: 1 });
trainingSessionSchema.index({ status_code: 1 });
trainingSessionSchema.index({ start_time: 1 });

const TrainingSession = mongoose.model('TrainingSession', trainingSessionSchema);

module.exports = { TrainingSession, SessionStatus };