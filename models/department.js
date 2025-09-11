const mongoose = require('mongoose');
require('./employee');
const departmentSchema = new mongoose.Schema({
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
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
departmentSchema.index({ department_name: 1 });
departmentSchema.index({ is_active: 1 });

// Virtual for employee count
departmentSchema.virtual('employees_count', {
  ref: 'Employee',
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