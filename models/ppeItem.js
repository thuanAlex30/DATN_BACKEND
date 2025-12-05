const mongoose = require('mongoose');
<<<<<<< HEAD

const ppeItemSchema = new mongoose.Schema({
=======
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const ppeItemSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    default: getDefaultTenantObjectId
  },
>>>>>>> origin/main
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPECategory',
    required: true
  },
  item_code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    uppercase: true,
    match: /^[A-Z0-9-]+$/
  },
  item_name: {
    type: String,
    required: true,
    maxlength: 200
  },
  brand: {
    type: String,
    maxlength: 100
  },
  model: {
    type: String,
    maxlength: 100
  },
  reorder_level: {
    type: Number,
    default: 10,
    min: 0
  },
  quantity_available: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  quantity_allocated: {
    type: Number,
    required: true,
    default: 0,
    min: 0
<<<<<<< HEAD
=======
  },
  // Optimistic locking version field
  version: {
    type: Number,
    default: 0
  },
  // PPE expiry management
  expiry_date: {
    type: Date
  },
  // Manufacturing date for calculating expiry
  manufacturing_date: {
    type: Date
  },
  // Batch number for tracking
  batch_number: {
    type: String,
    maxlength: 50
  },
  // Serial numbers for individual items
  serial_numbers: [{
    type: String,
    maxlength: 100
  }],
  // PPE condition status
  condition_status: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor', 'expired', 'damaged'],
    default: 'new'
  },
  // Last maintenance date
  last_maintenance_date: {
    type: Date
  },
  // Next maintenance due date
  next_maintenance_date: {
    type: Date
  },
  // Maintenance interval in days
  maintenance_interval_days: {
    type: Number,
    default: 30,
    min: 1
>>>>>>> origin/main
  }
}, {
  timestamps: true
});

<<<<<<< HEAD
=======
// Add indexes for better performance
ppeItemSchema.index({ tenant_id: 1 });
ppeItemSchema.index({ item_code: 1 }, { unique: true });
ppeItemSchema.index({ category_id: 1 });
ppeItemSchema.index({ item_name: 'text', brand: 'text', model: 'text' });
ppeItemSchema.index({ expiry_date: 1 });
ppeItemSchema.index({ condition_status: 1 });
ppeItemSchema.index({ next_maintenance_date: 1 });
ppeItemSchema.index({ batch_number: 1 });
ppeItemSchema.index({ quantity_available: 1, reorder_level: 1 });

// Add validation to ensure quantity_available + quantity_allocated >= 0
ppeItemSchema.pre('save', function(next) {
  if (this.quantity_available < 0 || this.quantity_allocated < 0) {
    return next(new Error('Số lượng không được âm'));
  }
  
  // Auto-calculate expiry date if manufacturing_date is provided
  if (this.manufacturing_date && !this.expiry_date) {
    const category = this.category_id;
    if (category && category.lifespan_months) {
      const expiryDate = new Date(this.manufacturing_date);
      expiryDate.setMonth(expiryDate.getMonth() + category.lifespan_months);
      this.expiry_date = expiryDate;
    }
  }
  
  // Auto-calculate next maintenance date
  if (this.last_maintenance_date && this.maintenance_interval_days) {
    const nextMaintenance = new Date(this.last_maintenance_date);
    nextMaintenance.setDate(nextMaintenance.getDate() + this.maintenance_interval_days);
    this.next_maintenance_date = nextMaintenance;
  }
  
  next();
});

// Instance method for optimistic locking
ppeItemSchema.methods.incrementVersion = function() {
  this.version += 1;
  return this;
};

// Static method for optimistic update
ppeItemSchema.statics.updateWithOptimisticLock = async function(filter, update, options = {}) {
  const { maxRetries = 3, retryDelay = 100 } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const doc = await this.findOne(filter);
      if (!doc) {
        throw new Error('Document not found');
      }
      
      const currentVersion = doc.version;
      update.version = currentVersion + 1;
      
      const result = await this.findOneAndUpdate(
        { ...filter, version: currentVersion },
        update,
        { new: true, runValidators: true }
      );
      
      if (result) {
        return result;
      } else {
        if (attempt === maxRetries) {
          throw new Error('Optimistic locking failed after maximum retries');
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
};

>>>>>>> origin/main
const PPEItem = mongoose.model('PPEItem', ppeItemSchema);

module.exports = PPEItem;