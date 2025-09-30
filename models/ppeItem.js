const mongoose = require('mongoose');

const ppeItemSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPECategory',
    required: true
  },
  item_code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    uppercase: true,
    match: /^[A-Z0-9-]+$/
  },
  item_name: {
    type: String,
    required: true,
    maxlength: 200
  },
  brand: {
    type: String,
    maxlength: 100
  },
  model: {
    type: String,
    maxlength: 100
  },
  reorder_level: {
    type: Number,
    default: 10,
    min: 0
  },
  quantity_available: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  quantity_allocated: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeItemSchema.index({ item_code: 1 }, { unique: true });
ppeItemSchema.index({ category_id: 1 });
ppeItemSchema.index({ item_name: 'text', brand: 'text', model: 'text' });
ppeItemSchema.index({ quantity_available: 1, reorder_level: 1 });

// Add validation to ensure quantity_available + quantity_allocated >= 0
ppeItemSchema.pre('save', function(next) {
  if (this.quantity_available < 0 || this.quantity_allocated < 0) {
    return next(new Error('Số lượng không được âm'));
  }
  next();
});

const PPEItem = mongoose.model('PPEItem', ppeItemSchema);

module.exports = PPEItem;