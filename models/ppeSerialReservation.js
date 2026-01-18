const mongoose = require('mongoose');

const ppeSerialReservationSchema = new mongoose.Schema({
  serial: { type: String, required: true, index: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PPEItem', required: true, index: true },
  reserved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reserved_token: { type: String, required: true, index: true },
  assigned_issuance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PPEIssuance' },
  created_at: { type: Date, default: Date.now, index: true }
});

// Unique constraint to prevent duplicate reservation of same serial
ppeSerialReservationSchema.index({ serial: 1 }, { unique: true });

const PPESerialReservation = mongoose.model('PPESerialReservation', ppeSerialReservationSchema);

module.exports = PPESerialReservation;


