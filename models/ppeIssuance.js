const mongoose = require('mongoose');

const ppeIssuanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  issued_date: {
    type: Date,
    required: true
  },
  expected_return_date: {
    type: Date,
    required: true
  },
  issued_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue', 'damaged', 'replacement_needed'],
    default: 'issued'
  },
  actual_return_date: {
    type: Date
  },
  return_condition: {
    type: String,
    enum: ['good', 'damaged', 'worn']
  },
  notes: {
    type: String,
    maxlength: 500
  },
  report_type: {
    type: String,
    enum: ['damage', 'replacement', 'lost']
  },
  report_description: {
    type: String,
    maxlength: 1000
  },
  report_severity: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  reported_date: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeIssuanceSchema.index({ user_id: 1, status: 1 });
ppeIssuanceSchema.index({ item_id: 1, status: 1 });
ppeIssuanceSchema.index({ status: 1, expected_return_date: 1 });
ppeIssuanceSchema.index({ issued_date: -1 });

const PPEIssuance = mongoose.models.PPEIssuance || mongoose.model('PPEIssuance', ppeIssuanceSchema);

module.exports = PPEIssuance;