const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'question_banks'
});

// Add indexes
questionBankSchema.index({ course_id: 1 });
questionBankSchema.index({ name: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);

const questionSchema = new mongoose.Schema({
    bank_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionBank',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(options) {
                return options && options.length >= 2;
            },
            message: 'Question must have at least 2 options'
        }
    },
    correct_answer: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    explanation: {
        type: String,
        trim: true
    },
    difficulty_level: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        default: 'MEDIUM'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'questions'
});

// Add validation to ensure correct_answer is in options
questionSchema.pre('save', function(next) {
    if (!this.options.includes(this.correct_answer)) {
        next(new Error('Correct answer must be one of the provided options'));
    } else {
        next();
    }
});

// Add indexes
questionSchema.index({ bank_id: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = { QuestionBank, Question };