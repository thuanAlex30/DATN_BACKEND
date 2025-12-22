const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const courseSetSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        default: getDefaultTenantObjectId
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
    collection: 'course_sets'
});

// Add indexes
courseSetSchema.index({ tenant_id: 1 });
courseSetSchema.index({ name: 1 });
courseSetSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

const CourseSet = mongoose.model('CourseSet', courseSetSchema);

module.exports = CourseSet;