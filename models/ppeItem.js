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

const PPEItem = mongoose.model('PPEItem', ppeItemSchema);

module.exports = PPEItem;