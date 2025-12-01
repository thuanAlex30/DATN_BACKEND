const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const ppeStockSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  ppe_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEItem',
    required: true
  },
  quantity_available: {
    type: Number,
    required: true,
    min: 0
  },
  quantity_reserved: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  last_audited_at: {
    type: Date
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'ppe_stocks'
});

ppeStockSchema.index({ tenant_id: 1, department_id: 1, ppe_item_id: 1 }, { unique: true });

const PPEStock = mongoose.model('PPEStock', ppeStockSchema);

module.exports = { PPEStock };


