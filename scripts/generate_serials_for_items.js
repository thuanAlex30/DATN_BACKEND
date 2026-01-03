const connectDB = require('../config/database');
const PPEItem = require('../models/ppeItem');
const mongoose = require('mongoose');

function padNumber(num, width = 6) {
  return String(num).padStart(width, '0');
}

function generateSerial(itemCode, seq) {
  const timestamp = Date.now().toString().slice(-6);
  return `${itemCode}-${timestamp}-${padNumber(seq, 4)}`;
}

async function generateForAll() {
  await connectDB();
  console.log('Connected to DB. Scanning PPE items...');

  const items = await PPEItem.find({}).lean();
  for (const item of items) {
    try {
      const existing = Array.isArray(item.serial_numbers) ? item.serial_numbers : [];
      const needed = (item.quantity_available || 0) - existing.length;
      if (needed <= 0) {
        console.log(`Item ${item._id} (${item.item_code}) already has ${existing.length} serials - skipping`);
        continue;
      }

      const newSerials = [];
      const startIndex = existing.length + 1;
      for (let i = 0; i < needed; i++) {
        newSerials.push(generateSerial(item.item_code || 'ITEM', startIndex + i));
      }

      await PPEItem.updateOne({ _id: item._id }, { $push: { serial_numbers: { $each: newSerials } } });
      console.log(`Added ${newSerials.length} serials to item ${item._id} (${item.item_code})`);
    } catch (err) {
      console.error('Error generating serials for item', item._id, err);
    }
  }

  mongoose.connection.close();
  console.log('Done. Disconnected.');
}

if (require.main === module) {
  generateForAll().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}


