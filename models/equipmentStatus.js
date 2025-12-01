const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const EQUIPMENT_STATUSES = ['OPERATIONAL', 'MAINTENANCE_DUE', 'UNDER_REPAIR', 'OUT_OF_SERVICE'];

const equipmentStatusSchema = new mongoose.Schema({
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
  equipment_name: {
    type: String,
    required: true,
    trim: true
  },
  equipment_code: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: EQUIPMENT_STATUSES,
    default: 'OPERATIONAL'
  },
  last_inspected_at: {
    type: Date
  },
  next_maintenance_at: {
    type: Date
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'equipment_statuses'
});

equipmentStatusSchema.index({ tenant_id: 1, department_id: 1, status: 1 });

const EquipmentStatus = mongoose.model('EquipmentStatus', equipmentStatusSchema);

module.exports = {
  EquipmentStatus,
  EQUIPMENT_STATUSES
};


