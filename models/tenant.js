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
  // Additional fields for frontend compatibility
  tenant_name: {
    type: String,
    trim: true,
    maxlength: 150
  },
  tax_code: {
    type: String,
    trim: true,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'active'
  },
  subscription: {
    type: subscriptionSchema,
    default: () => ({})
  },
  // Flat fields for frontend compatibility
  subscription_plan: {
    type: String,
    trim: true
  },
  subscription_expires_at: {
    type: Date
  },
  contact: {
    type: contactSchema,
    default: () => ({})
  },
  // Flat contact fields for frontend compatibility
  contact_name: {
    type: String,
    trim: true,
    maxlength: 150
  },
  contact_email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 150
  },
  contact_phone: {
    type: String,
    trim: true,
    maxlength: 30
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

// Virtual for tenant_name (alias of name)
tenantSchema.virtual('tenant_name_virtual').get(function() {
  return this.tenant_name || this.name;
});

// Pre-save middleware to sync fields
tenantSchema.pre('save', function(next) {
  // Sync name and tenant_name (prefer tenant_name if both exist)
  if (this.isModified('tenant_name') || this.isModified('name')) {
    if (this.tenant_name && !this.name) {
      this.name = this.tenant_name;
    } else if (this.name && !this.tenant_name) {
      this.tenant_name = this.name;
    }
  }
  
  // Sync contact fields
  if (this.isModified('contact_name') || this.isModified('contact.name')) {
    if (this.contact_name) {
      if (!this.contact) this.contact = {};
      this.contact.name = this.contact_name;
    } else if (this.contact?.name && !this.contact_name) {
      this.contact_name = this.contact.name;
    }
  }
  
  if (this.isModified('contact_email') || this.isModified('contact.email')) {
    if (this.contact_email) {
      if (!this.contact) this.contact = {};
      this.contact.email = this.contact_email;
    } else if (this.contact?.email && !this.contact_email) {
      this.contact_email = this.contact.email;
    }
  }
  
  if (this.isModified('contact_phone') || this.isModified('contact.phone')) {
    if (this.contact_phone) {
      if (!this.contact) this.contact = {};
      this.contact.phone = this.contact_phone;
    } else if (this.contact?.phone && !this.contact_phone) {
      this.contact_phone = this.contact.phone;
    }
  }
  
  // Sync subscription fields
  if (this.isModified('subscription_plan') || this.isModified('subscription.plan')) {
    if (this.subscription_plan) {
      if (!this.subscription) this.subscription = {};
      this.subscription.plan = this.subscription_plan;
    } else if (this.subscription?.plan && !this.subscription_plan) {
      this.subscription_plan = this.subscription.plan;
    }
  }
  
  if (this.isModified('subscription_expires_at') || this.isModified('subscription.expires_at')) {
    if (this.subscription_expires_at) {
      if (!this.subscription) this.subscription = {};
      this.subscription.expires_at = this.subscription_expires_at;
    } else if (this.subscription?.expires_at && !this.subscription_expires_at) {
      this.subscription_expires_at = this.subscription.expires_at;
    }
  }
  
  // Normalize status to uppercase (only if status is modified)
  if (this.isModified('status') && this.status) {
    const statusLower = this.status.toLowerCase();
    if (['active', 'inactive', 'suspended'].includes(statusLower)) {
      this.status = statusLower; // Keep lowercase in DB, convert in toJSON
    }
  }
  
  next();
});

tenantSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    
    // Ensure frontend-compatible format
    ret.tenant_name = ret.tenant_name || ret.name;
    ret.contact_name = ret.contact_name || ret.contact?.name;
    ret.contact_email = ret.contact_email || ret.contact?.email;
    ret.contact_phone = ret.contact_phone || ret.contact?.phone;
    ret.subscription_plan = ret.subscription_plan || ret.subscription?.plan;
    ret.subscription_expires_at = ret.subscription_expires_at || ret.subscription?.expires_at;
    
    // Normalize status
    if (ret.status) {
      ret.status = ret.status.toUpperCase();
    }
    
    return ret;
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);

