const mongoose = require('mongoose');

const CONTRACT_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

const PLAN_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

const contractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  planType: {
    type: String,
    enum: Object.values(PLAN_TYPES),
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  companyInfo: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    taxCode: {
      type: String
    }
  },
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    position: {
      type: String,
      default: 'Đại diện'
    }
  },
  status: {
    type: String,
    enum: Object.values(CONTRACT_STATUS),
    default: CONTRACT_STATUS.ACTIVE,
    index: true
  },
  pdfFileUrl: {
    type: String
  },
  signedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'contracts'
});

contractSchema.index({ tenantId: 1, status: 1 });
contractSchema.index({ orderId: 1 });
contractSchema.index({ startDate: 1, endDate: 1 });

contractSchema.methods.isExpired = function() {
  return this.endDate < new Date();
};

contractSchema.methods.isActive = function() {
  return this.status === CONTRACT_STATUS.ACTIVE && !this.isExpired();
};

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
module.exports.CONTRACT_STATUS = CONTRACT_STATUS;
module.exports.PLAN_TYPES = PLAN_TYPES;

