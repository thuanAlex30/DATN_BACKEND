const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const courseSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false,
        default: getDefaultTenantObjectId
    },
    course_set_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseSet',
        required: true
    },
    course_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        trim: true
    },
    duration_hours: {
        type: Number,
        required: true,
        min: 1
    },
    is_mandatory: {
        type: Boolean,
        required: true,
        default: false
    },
    validity_months: {
        type: Number,
        min: 1
    },
    is_deployed: {
        type: Boolean,
        default: false
    },
    deployed_at: {
        type: Date
    },
    deployed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    prerequisite_course_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Course',
        default: []
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'courses'
});

// Add indexes
courseSchema.index({ tenant_id: 1 });
courseSchema.index({ course_set_id: 1 });
courseSchema.index({ course_name: 1 });
courseSchema.index({ is_mandatory: 1 });
courseSchema.index({ is_deployed: 1 });
courseSchema.index({ tenant_id: 1, course_set_id: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;