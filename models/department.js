const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');
require('./employee');
const departmentSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  department_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  manager_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Một phòng ban chỉ có thể có tối đa 5 quản lý'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
departmentSchema.index({ tenant_id: 1 });
departmentSchema.index({ department_name: 1 });
departmentSchema.index({ is_active: 1 });

// Virtual for employee count
departmentSchema.virtual('employees_count', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department_id',
  count: true
});

// Pre-delete middleware to handle employee reassignment
departmentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // Remove department reference from employees
  await mongoose.model('Employee').updateMany(
    { department_id: this._id },
    { $unset: { department_id: 1 } }
  );
});

// Transform output to include id field
departmentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Department', departmentSchema);