const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const ppeCategorySchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    default: getDefaultTenantObjectId
  },
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
ppeCategorySchema.index({ tenant_id: 1 });
ppeCategorySchema.index({ tenant_id: 1, category_name: 1 }, { unique: true });

const PPECategory = mongoose.model('PPECategory', ppeCategorySchema);

module.exports = PPECategory;