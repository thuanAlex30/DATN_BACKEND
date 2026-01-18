require('dotenv').config();
const connectDB = require('../config/database');
const mongoose = require('mongoose');

// Safety: require explicit env var to run destructive action
if ((process.env.CLEAR_PPE_CONFIRM || '').toUpperCase() !== 'YES') {
  console.error('ABORT: To run this destructive script set CLEAR_PPE_CONFIRM=YES in your environment.');
  console.error('Example (PowerShell): $env:CLEAR_PPE_CONFIRM = \"YES\"; node scripts/clear_ppe_data.js');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();

    const modelsToClear = [
      '../models/ppeIssuance',
      '../models/ppeItem',
      '../models/ppeCategory',
      '../models/ppeSerialReservation',
      '../models/ppeBatchIssuance',
      '../models/ppeStock',
      '../models/ppeStockMovement',
      '../models/ppeRequest',
      '../models/ppeExpiryTracking',
      '../models/ppeApproval'
    ];

    for (const mPath of modelsToClear) {
      try {
        const Model = require(mPath);
        if (!Model || !Model.deleteMany) {
          console.warn(`Skipping ${mPath} — model not found or invalid export`);
          continue;
        }

        const res = await Model.deleteMany({});
        console.log(`Cleared ${mPath}: deletedCount=${res.deletedCount ?? 'unknown'}`);
      } catch (err) {
        console.error(`Error clearing ${mPath}:`, err.message || err);
      }
    }

    // Additionally drop related collections if they exist (safe-guarded)
    const extraCollections = [
      'ppe_serial_reservations',
      'ppe_batch_issuances',
      'ppe_stocks',
      'ppe_stockmovements',
      'ppe_requests',
      'ppe_expirytrackings',
      'ppe_approvals'
    ];
    for (const coll of extraCollections) {
      try {
        const exists = await mongoose.connection.db.listCollections({ name: coll }).hasNext();
        if (exists) {
          await mongoose.connection.db.dropCollection(coll);
          console.log(`Dropped collection ${coll}`);
        }
      } catch (err) {
        console.warn(`Could not drop collection ${coll}:`, err.message || err);
      }
    }

    console.log('PPE data clear complete.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error clearing PPE data:', err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(2);
  }
})();


