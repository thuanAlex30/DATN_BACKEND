const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const WeatherAlertSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId,
    index: true
  },
  // Location for this alert
  location: {
    name: { type: String, default: 'Default Location' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  // Alert details
  alert_type: {
    type: String,
    enum: [
      'high_temperature',
      'low_temperature',
      'high_wind',
      'heavy_rain',
      'thunderstorm',
      'high_uv',
      'poor_air_quality',
      'low_visibility',
      'extreme_weather'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  // Weather data that triggered this alert
  weather_data: {
    temperature: Number,
    windspeed: Number,
    weathercode: Number,
    uv_index: Number,
    visibility: Number,
    air_quality_aqi: Number,
    precipitation: Number,
    windgusts: Number
  },
  // Alert status
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  triggered_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved_at: {
    type: Date,
    default: null
  },
  // Notification tracking
  notifications_sent: {
    type: Number,
    default: 0
  },
  last_notification_sent_at: {
    type: Date,
    default: null
  },
  // Deduplication: hash of conditions to prevent duplicate alerts
  condition_hash: {
    type: String,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for performance
WeatherAlertSchema.index({ tenant_id: 1, is_active: 1 });
WeatherAlertSchema.index({ tenant_id: 1, alert_type: 1, is_active: 1 });
WeatherAlertSchema.index({ tenant_id: 1, triggered_at: -1 });
WeatherAlertSchema.index({ condition_hash: 1, is_active: 1 });
WeatherAlertSchema.index({ resolved_at: 1 });

// Static methods
WeatherAlertSchema.statics.createAlert = async function(alertData) {
  try {
    const alert = new this(alertData);
    await alert.save();
    return alert;
  } catch (error) {
    throw error;
  }
};

WeatherAlertSchema.statics.findActiveAlerts = async function(tenantId, filters = {}) {
  const query = {
    tenant_id: tenantId,
    is_active: true,
    ...filters
  };
  return await this.find(query).sort({ triggered_at: -1 });
};

WeatherAlertSchema.statics.resolveAlert = async function(alertId, tenantId) {
  return await this.findOneAndUpdate(
    { _id: alertId, tenant_id: tenantId, is_active: true },
    {
      is_active: false,
      resolved_at: new Date()
    },
    { new: true }
  );
};

WeatherAlertSchema.statics.findDuplicateAlert = async function(conditionHash, tenantId, location) {
  // Find active alert with same condition hash and location within last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return await this.findOne({
    tenant_id: tenantId,
    condition_hash: conditionHash,
    is_active: true,
    'location.latitude': location.latitude,
    'location.longitude': location.longitude,
    triggered_at: { $gte: oneHourAgo }
  });
};

// Instance methods
WeatherAlertSchema.methods.resolve = function() {
  this.is_active = false;
  this.resolved_at = new Date();
  return this.save();
};

module.exports = mongoose.model('WeatherAlert', WeatherAlertSchema);

