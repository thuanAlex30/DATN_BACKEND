/**
 * Script để fix notification_id index
 * Chuyển từ unique index sang sparse unique index để cho phép nhiều document có notification_id: null
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function fixNotificationIndex() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('notifications');
    
    console.log('📋 Current indexes:');
    const currentIndexes = await collection.indexes();
    console.log(JSON.stringify(currentIndexes, null, 2));
    
    // Drop old notification_id index if exists
    try {
      console.log('🗑️  Dropping old notification_id index...');
      await collection.dropIndex('notification_id_1');
      console.log('✅ Old index dropped');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Old index not found (already dropped or never existed)');
      } else {
        throw error;
      }
    }
    
    // Create sparse unique index
    console.log('📝 Creating sparse unique index on notification_id...');
    await collection.createIndex(
      { notification_id: 1 },
      { 
        unique: true,
        sparse: true, // Only index documents that have notification_id field
        name: 'notification_id_1'
      }
    );
    console.log('✅ Sparse unique index created');
    
    // Verify new index
    console.log('📋 New indexes:');
    const newIndexes = await collection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));
    
    console.log('✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing notification index:', error);
    process.exit(1);
  }
}

fixNotificationIndex();

