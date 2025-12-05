const mongoose = require('mongoose');

<<<<<<< HEAD
const roleSchema = new mongoose.Schema({
  role_name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    maxlength: 100 
  },
  description: { 
    type: String, 
    trim: true 
  },
=======
const scopeRulesSchema = new mongoose.Schema({
  tenant_scope: {
    type: String,
    enum: ['global', 'tenant', 'self'],
    default: 'tenant'
  },
  department_scope: {
    type: String,
    enum: ['all', 'hierarchy', 'own', 'none'],
    default: 'own'
  },
  data_scope: {
    type: String,
    enum: ['full', 'department', 'self'],
    default: 'department'
  },
  can_assign_lower_roles: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  role_code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  role_name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true, 
    maxlength: 150 
  },
  role_level: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  description: {
    type: String, 
    trim: true 
  },
  // Thuộc tenant nào (đa tenant). Null hoặc undefined = role hệ thống (global)
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null,
    index: true
  },
  scope_rules: {
    type: scopeRulesSchema,
    default: () => ({})
  },
>>>>>>> origin/main
  permissions: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
<<<<<<< HEAD
=======
  is_default: {
    type: Boolean,
    default: false
  },
>>>>>>> origin/main
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }, 
  collection: 'roles' 
});

// Add indexes
<<<<<<< HEAD
roleSchema.index({ role_name: 1 });
=======
roleSchema.index({ role_code: 1 }, { unique: true });
roleSchema.index({ role_name: 1 });
roleSchema.index({ role_level: -1 });
>>>>>>> origin/main
roleSchema.index({ is_active: 1 });

// Transform output
roleSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;