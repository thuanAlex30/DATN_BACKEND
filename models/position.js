const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  position_name: {
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
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

positionSchema.index({ position_name: 1 });
positionSchema.index({ level: 1 });
positionSchema.index({ is_active: 1 });

positionSchema.virtual('employees_count', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'position_id',
  count: true
});

positionSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await mongoose.model('Employee').updateMany(
    { position_id: this._id },
    { $unset: { position_id: 1 } }
  );
});

positionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Position', positionSchema);