const mongoose = require('mongoose');
const HashUtils = require('../utils/hash');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const userSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    maxlength: 50 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true, 
    maxlength: 100,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  full_name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 100 
  },
  phone: { 
    type: String, 
    trim: true, 
    maxlength: 20 
  },
  birth_date: { 
    type: Date 
  },
  address: { 
    type: String, 
    trim: true 
  },
  role_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role', 
    required: true 
  },
  department_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  position_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Position' 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  },
  last_login: { 
    type: Date 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }, 
  collection: 'users' 
});

// Add indexes
userSchema.index({ tenant_id: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role_id: 1 });
userSchema.index({ is_active: 1 });
userSchema.index({ department_id: 1 });
userSchema.index({ position_id: 1 });

// Virtual for getting role details
userSchema.virtual('role', {
  ref: 'Role',
  localField: 'role_id',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password_hash;
    delete ret.__v;
    return ret;
  }
});
userSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password_hash;
    delete ret.__v;
    return ret;
  }
});

// Hash password if set directly
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password_hash = await HashUtils.hashPassword(this.password);
    this.password = undefined;
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(password) {
  return await HashUtils.comparePassword(password, this.password_hash);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.last_login = new Date();
  return await this.save();
};

// Static method to find by username or email
userSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
