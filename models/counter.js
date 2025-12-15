const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  sequence_value: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'counters'
});

// Index for faster lookups
counterSchema.index({ name: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
