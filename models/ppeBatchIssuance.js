const mongoose = require('mongoose');

const ppeBatchIssuanceSchema = new mongoose.Schema({
  // Batch identifier
  batch_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  },
  // Batch name/description
  batch_name: {
    type: String,
    required: true,
    maxlength: 200
  },
  // Issuer information
  issued_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Issuance level
  issuance_level: {
    type: String,
    enum: ['admin_to_manager', 'manager_to_employee'],
    required: true
  },
  // Manager ID (if manager_to_employee)
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.issuance_level === 'manager_to_employee';
    }
  },
  // Batch status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'partially_completed'],
    default: 'pending'
  },
  // Total items in batch
  total_items: {
    type: Number,
    required: true,
    min: 1
  },
  // Successfully processed items
  processed_items: {
    type: Number,
    default: 0,
    min: 0
  },
  // Failed items
  failed_items: {
    type: Number,
    default: 0,
    min: 0
  },
  // Batch items details
  items: [{
    // User receiving PPE
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // PPE item
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PPEItem',
      required: true
    },
    // Quantity to issue
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    // Expected return date
    expected_return_date: {
      type: Date,
      required: true
    },
    // Individual item status
    status: {
      type: String,
      enum: ['pending', 'issued', 'failed'],
      default: 'pending'
    },
    // Error message if failed
    error_message: {
      type: String,
      maxlength: 500
    },
    // Created issuance ID if successful
    issuance_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PPEIssuance'
    }
  }],
  // Batch processing metadata
  processing_started_at: {
    type: Date
  },
  processing_completed_at: {
    type: Date
  },
  // Error summary
  error_summary: {
    type: String,
    maxlength: 1000
  },
  // Notes
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeBatchIssuanceSchema.index({ batch_id: 1 }, { unique: true });
ppeBatchIssuanceSchema.index({ issued_by: 1, status: 1 });
ppeBatchIssuanceSchema.index({ status: 1, createdAt: -1 });
ppeBatchIssuanceSchema.index({ 'items.user_id': 1 });
ppeBatchIssuanceSchema.index({ 'items.item_id': 1 });

// Pre-save middleware to generate batch_id if not provided
ppeBatchIssuanceSchema.pre('save', function(next) {
  if (!this.batch_id) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.batch_id = `BATCH-${timestamp}-${random}`;
  }
  next();
});

// Instance methods
ppeBatchIssuanceSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'processing' && !this.processing_started_at) {
    this.processing_started_at = new Date();
  }
  if (newStatus === 'completed' || newStatus === 'failed') {
    this.processing_completed_at = new Date();
  }
  return this;
};

ppeBatchIssuanceSchema.methods.updateItemStatus = function(itemIndex, status, errorMessage = null, issuanceId = null) {
  if (this.items[itemIndex]) {
    this.items[itemIndex].status = status;
    if (errorMessage) {
      this.items[itemIndex].error_message = errorMessage;
    }
    if (issuanceId) {
      this.items[itemIndex].issuance_id = issuanceId;
    }
    
    // Update counters
    this.processed_items = this.items.filter(item => item.status === 'issued').length;
    this.failed_items = this.items.filter(item => item.status === 'failed').length;
    
    // Update batch status
    if (this.processed_items === this.total_items) {
      this.status = 'completed';
    } else if (this.failed_items > 0 && this.processed_items > 0) {
      this.status = 'partially_completed';
    } else if (this.failed_items === this.total_items) {
      this.status = 'failed';
    }
  }
  return this;
};

ppeBatchIssuanceSchema.methods.getProgress = function() {
  return {
    total: this.total_items,
    processed: this.processed_items,
    failed: this.failed_items,
    pending: this.total_items - this.processed_items - this.failed_items,
    percentage: Math.round((this.processed_items / this.total_items) * 100)
  };
};

// Static methods
ppeBatchIssuanceSchema.statics.createBatch = async function(batchData) {
  const batch = new this(batchData);
  batch.total_items = batchData.items.length;
  return await batch.save();
};

ppeBatchIssuanceSchema.statics.getBatchProgress = async function(batchId) {
  const batch = await this.findOne({ batch_id: batchId });
  if (!batch) {
    throw new Error('Batch not found');
  }
  return batch.getProgress();
};

const PPEBatchIssuance = mongoose.model('PPEBatchIssuance', ppeBatchIssuanceSchema);

module.exports = PPEBatchIssuance;
