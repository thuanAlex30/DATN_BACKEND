const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const MOVEMENT_TYPES = ['INBOUND', 'OUTBOUND', 'ADJUSTMENT'];

const ppeStockMovementSchema = new mongoose.Schema({
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
  movement_type: {
    type: String,
    enum: MOVEMENT_TYPES,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  reference_type: {
    type: String
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'ppe_stock_movements'
});

ppeStockMovementSchema.index({ tenant_id: 1, department_id: 1, ppe_item_id: 1, movement_type: 1 });

const PPEStockMovement = mongoose.model('PPEStockMovement', ppeStockMovementSchema);

module.exports = {
  PPEStockMovement,
  MOVEMENT_TYPES
};


