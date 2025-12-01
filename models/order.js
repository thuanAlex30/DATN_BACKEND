const mongoose = require('mongoose');

const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

const PLAN_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
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
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
    index: true
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
  paymentLink: {
    type: String
  },
  paymentTransactionId: {
    type: String
  },
  paymentOrderCode: {
    type: String,
    index: true
  },
  paymentBankCode: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // Tự động xóa sau khi hết hạn
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// Indexes
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ expiresAt: 1 });

// Methods
orderSchema.methods.markAsPaid = function(transactionData) {
  this.status = ORDER_STATUS.PAID;
  this.paymentTransactionId = transactionData.transactionId;
  this.paymentBankCode = transactionData.bankCode;
  this.paymentDate = new Date();
  return this.save();
};

orderSchema.methods.markAsFailed = function() {
  this.status = ORDER_STATUS.FAILED;
  return this.save();
};

orderSchema.methods.markAsCancelled = function() {
  this.status = ORDER_STATUS.CANCELLED;
  return this.save();
};

// Static methods
orderSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

orderSchema.statics.findPendingOrders = function() {
  return this.find({ status: ORDER_STATUS.PENDING });
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PLAN_TYPES = PLAN_TYPES;

