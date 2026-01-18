#!/usr/bin/env node
require('dotenv').config();
const connectDB = require('../config/database');
const mongoose = require('mongoose');

async function run() {
  try {
    await connectDB();

    const PPEIssuance = require('../models/ppeIssuance');

    const query = {
      issuance_level: 'admin_to_manager',
      status: 'returned',
      remaining_quantity: { $gt: 0 }
    };

    console.log('[fix_inconsistent_admin_returns] Searching for inconsistent admin->manager issuances...');
    const docs = await PPEIssuance.find(query).lean();

    if (!docs || docs.length === 0) {
      console.log('[fix_inconsistent_admin_returns] No inconsistent records found. Nothing to do.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`[fix_inconsistent_admin_returns] Found ${docs.length} inconsistent issuance(s).`);
    docs.forEach(d => {
      console.log(` - _id: ${d._id}, item_id: ${d.item_id}, quantity: ${d.quantity}, remaining_quantity: ${d.remaining_quantity}, status: ${d.status}`);
    });

    const apply = process.argv.includes('--apply');
    if (!apply) {
      console.log('\nDry run only. To perform fixes run with --apply flag.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\nApplying fixes: setting status => "issued" for each inconsistent issuance (quantities unchanged).');

    const results = [];
    for (const doc of docs) {
      const _id = doc._id;
      const before = { status: doc.status, remaining_quantity: doc.remaining_quantity };
      const res = await PPEIssuance.updateOne({ _id }, { $set: { status: 'issued' } });
      results.push({ _id, before, result: res });
      console.log(`Updated _id=${_id} => matched:${res.matchedCount} modified:${res.modifiedCount}`);
    }

    console.log('\nAll done. Summary:');
    results.forEach(r => {
      console.log(` - ${r._id}: status ${r.before.status} -> issued, remaining_quantity=${r.before.remaining_quantity}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[fix_inconsistent_admin_returns] Error:', err);
    try { await mongoose.connection.close(); } catch (e) {}
    process.exit(1);
  }
}

run();


