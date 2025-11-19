const mongoose = require('mongoose');

const ppeCategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  lifespan_months: {
    type: Number,
    default: 12,
    min: 1,
    max: 120
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeCategorySchema.index({ category_name: 1 }, { unique: true });

const PPECategory = mongoose.model('PPECategory', ppeCategorySchema);

module.exports = PPECategory;