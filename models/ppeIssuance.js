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
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  actual_return_date: {
    type: Date
  }
}, {
  timestamps: true
});

const PPEIssuance = mongoose.model('PPEIssuance', ppeIssuanceSchema);

module.exports = PPEIssuance;