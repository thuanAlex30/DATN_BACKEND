const mongoose = require('mongoose');

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
  permissions: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
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
roleSchema.index({ role_name: 1 });
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