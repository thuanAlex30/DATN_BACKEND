const mongoose = require('mongoose');

const ppeExpiryTrackingSchema = new mongoose.Schema({
  // PPE Item reference
  ppe_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEItem',
    required: true
  },
  // PPE Issuance reference (if issued)
  ppe_issuance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEIssuance'
  },
  // User who has the PPE (if issued)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Expiry date
  expiry_date: {
    type: Date,
    required: true
  },
  // Manufacturing date
  manufacturing_date: {
    type: Date,
    required: true
  },
  // Batch number
  batch_number: {
    type: String,
    maxlength: 50
  },
  // Serial number (for individual items)
  serial_number: {
    type: String,
    maxlength: 100
  },
  // Current status
  status: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'replaced', 'disposed'],
    default: 'active'
  },
  // Days until expiry
  days_until_expiry: {
    type: Number
  },
  // Notification settings
  notifications: {
    // Days before expiry to send notifications
    notify_days_before: [{
      type: Number,
      min: 1,
      max: 365
    }],
    // Last notification sent
    last_notification_sent: {
      type: Date
    },
    // Notification status
    notification_status: {
      type: String,
      enum: ['none', 'sent', 'acknowledged', 'dismissed'],
      default: 'none'
    }
  },
  // Replacement information
  replacement: {
    // Replacement PPE item ID
    replacement_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PPEItem'
    },
    // Replacement date
    replacement_date: {
      type: Date
    },
    // Replacement reason
    replacement_reason: {
      type: String,
      enum: ['expired', 'damaged', 'lost', 'upgrade', 'other'],
      maxlength: 200
    }
  },
  // Disposal information
  disposal: {
    // Disposal date
    disposal_date: {
      type: Date
    },
    // Disposal method
    disposal_method: {
      type: String,
      enum: ['recycled', 'destroyed', 'donated', 'sold', 'other'],
      maxlength: 100
    },
    // Disposal certificate
    disposal_certificate: {
      type: String,
      maxlength: 200
    }
  },
  // Compliance tracking
  compliance: {
    // Is compliant with safety standards
    is_compliant: {
      type: Boolean,
      default: true
    },
    // Compliance check date
    last_compliance_check: {
      type: Date
    },
    // Compliance notes
    compliance_notes: {
      type: String,
      maxlength: 500
    }
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeExpiryTrackingSchema.index({ ppe_item_id: 1 });
ppeExpiryTrackingSchema.index({ ppe_issuance_id: 1 });
ppeExpiryTrackingSchema.index({ user_id: 1 });
ppeExpiryTrackingSchema.index({ expiry_date: 1 });
ppeExpiryTrackingSchema.index({ status: 1 });
ppeExpiryTrackingSchema.index({ batch_number: 1 });
ppeExpiryTrackingSchema.index({ serial_number: 1 });
ppeExpiryTrackingSchema.index({ 'notifications.notify_days_before': 1 });

// Pre-save middleware to calculate days until expiry
ppeExpiryTrackingSchema.pre('save', function(next) {
  if (this.expiry_date) {
    const today = new Date();
    const expiryDate = new Date(this.expiry_date);
    const timeDiff = expiryDate.getTime() - today.getTime();
    this.days_until_expiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Update status based on days until expiry
    if (this.days_until_expiry < 0) {
      this.status = 'expired';
    } else if (this.days_until_expiry <= 30) {
      this.status = 'expiring_soon';
    } else {
      this.status = 'active';
    }
  }
  next();
});

// Instance methods
ppeExpiryTrackingSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this;
};

ppeExpiryTrackingSchema.methods.markAsReplaced = function(replacementData) {
  this.status = 'replaced';
  this.replacement = {
    ...this.replacement,
    ...replacementData,
    replacement_date: new Date()
  };
  return this;
};

ppeExpiryTrackingSchema.methods.markAsDisposed = function(disposalData) {
  this.status = 'disposed';
  this.disposal = {
    ...this.disposal,
    ...disposalData,
    disposal_date: new Date()
  };
  return this;
};

ppeExpiryTrackingSchema.methods.updateNotificationStatus = function(status) {
  this.notifications.notification_status = status;
  this.notifications.last_notification_sent = new Date();
  return this;
};

// Static methods
ppeExpiryTrackingSchema.statics.getExpiringItems = async function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return await this.find({
    expiry_date: { $lte: futureDate },
    status: { $in: ['active', 'expiring_soon'] }
  }).populate('ppe_item_id user_id ppe_issuance_id');
};

ppeExpiryTrackingSchema.statics.getExpiredItems = async function() {
  const today = new Date();
  
  return await this.find({
    expiry_date: { $lt: today },
    status: { $in: ['active', 'expiring_soon'] }
  }).populate('ppe_item_id user_id ppe_issuance_id');
};

ppeExpiryTrackingSchema.statics.getItemsNeedingNotification = async function(daysBefore = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBefore);
  
  return await this.find({
    expiry_date: { $lte: futureDate },
    status: { $in: ['active', 'expiring_soon'] },
    'notifications.notify_days_before': daysBefore,
    'notifications.notification_status': { $ne: 'sent' }
  }).populate('ppe_item_id user_id ppe_issuance_id');
};

ppeExpiryTrackingSchema.statics.createTrackingRecord = async function(trackingData) {
  const tracking = new this(trackingData);
  return await tracking.save();
};

const PPEExpiryTracking = mongoose.model('PPEExpiryTracking', ppeExpiryTrackingSchema);

module.exports = PPEExpiryTracking;
