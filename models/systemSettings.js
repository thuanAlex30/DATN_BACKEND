const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  system_name: {
    type: String,
    default: 'Safety Management System',
    trim: true,
    maxlength: 150
  },
  system_email: {
    type: String,
    default: 'admin@safety-system.com',
    trim: true,
    lowercase: true,
    maxlength: 150
  },
  system_phone: {
    type: String,
    default: '',
    trim: true,
    maxlength: 30
  },
  enable_2fa: {
    type: Boolean,
    default: false
  },
  enable_logging: {
    type: Boolean,
    default: true
  },
  enable_auto_backup: {
    type: Boolean,
    default: false
  },
  session_timeout: {
    type: Number,
    default: 60, // minutes
    min: 5,
    max: 1440
  },
  max_login_attempts: {
    type: Number,
    default: 5,
    min: 3,
    max: 10
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'system_settings'
});

// Ensure only one document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

systemSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

