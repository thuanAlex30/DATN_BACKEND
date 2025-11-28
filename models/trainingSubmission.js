const mongoose = require('mongoose');

/**
 * Training Submission Model
 * Lưu bài làm của user, chờ admin chấm điểm
 * Note: Không sửa model TrainingEnrollment, tạo model mới này
 */
const trainingSubmissionSchema = new mongoose.Schema({
    enrollment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingEnrollment',
        required: true,
        unique: true // Mỗi enrollment chỉ có 1 submission
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
    answers: {
        type: Map,
        of: String,
        required: true
        // Format: { questionId: "selectedAnswer" }
    },
    submitted_at: {
        type: Date,
        default: Date.now
    },
    graded_at: {
        type: Date
    },
    graded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['submitted', 'graded'],
        default: 'submitted'
    },
    // Admin có thể thêm comments khi chấm
    admin_comments: {
        type: String,
        trim: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'training_submissions'
});

// Add indexes
trainingSubmissionSchema.index({ enrollment_id: 1 }, { unique: true });
trainingSubmissionSchema.index({ session_id: 1 });
trainingSubmissionSchema.index({ user_id: 1 });
trainingSubmissionSchema.index({ status: 1 });
trainingSubmissionSchema.index({ submitted_at: 1 });

const TrainingSubmission = mongoose.model('TrainingSubmission', trainingSubmissionSchema);

module.exports = TrainingSubmission;

