const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    default: 'standard',
    trim: true
  },
  seats: {
    type: Number,
    default: 0,
    min: 0
  },
  expires_at: {
    type: Date
  },
  auto_renew: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 150
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 150
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 30
  }
}, { _id: false });

const tenantSchema = new mongoose.Schema({
  tenant_code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  subscription: {
    type: subscriptionSchema,
    default: () => ({})
  },
  contact: {
    type: contactSchema,
    default: () => ({})
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'tenants'
});

tenantSchema.index({ tenant_code: 1 }, { unique: true });
tenantSchema.index({ status: 1 });

tenantSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);

