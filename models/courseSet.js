const mongoose = require('mongoose');

const courseSetSchema = new mongoose.Schema({
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
    collection: 'course_sets'
});

// Add indexes
courseSetSchema.index({ name: 1 });

const CourseSet = mongoose.model('CourseSet', courseSetSchema);

module.exports = CourseSet;