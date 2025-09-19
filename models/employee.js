const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position'
  },
  hire_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  contract_type: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERN'],
    default: 'FULL_TIME'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

employeeSchema.index({ user_id: 1 });
employeeSchema.index({ department_id: 1 });
employeeSchema.index({ position_id: 1 });
employeeSchema.index({ is_active: 1 });

employeeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Employee', employeeSchema);
