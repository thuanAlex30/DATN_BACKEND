const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  plan_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration_months: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'subscription_plans'
});

subscriptionPlanSchema.index({ status: 1 });
subscriptionPlanSchema.index({ plan_name: 1 });

subscriptionPlanSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

