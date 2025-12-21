/**
 * Script to fix UserCertificate unique index issue
 * 
 * Problem: Unique index on (tenant_id, certificate_id, user_id) prevents multiple
 * personal certificates (where certificate_id is null) for the same user in the same tenant.
 * 
 * Solution: 
 * 1. Drop the old unique index
 * 2. Create a partial unique index that only applies when certificate_id is not null
 *    (for organizational certificates - one assignment per certificate per user)
 * 3. Personal certificates (certificate_id = null) can have multiple entries per user
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safety_system';

async function fixUserCertificateIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('usercertificates');

    // Step 1: Check existing indexes
    console.log('\n📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Step 2: Drop the problematic unique index if it exists
    const problematicIndexName = 'tenant_id_1_certificate_id_1_user_id_1';
    const hasProblematicIndex = indexes.some(idx => idx.name === problematicIndexName);
    
    if (hasProblematicIndex) {
      console.log(`\n🗑️  Dropping problematic unique index: ${problematicIndexName}...`);
      try {
        await collection.dropIndex(problematicIndexName);
        console.log('✅ Successfully dropped the problematic index');
      } catch (error) {
        if (error.code === 27) {
          console.log('⚠️  Index does not exist (may have been dropped already)');
        } else {
          throw error;
        }
      }
    } else {
      console.log(`\n⚠️  Index ${problematicIndexName} not found (may have been dropped already)`);
    }

    // Step 3: Create partial unique index for organizational certificates only
    // This ensures one assignment per certificate per user, but allows multiple personal certificates
    console.log('\n📝 Creating partial unique index for organizational certificates...');
    
    // MongoDB partial index: only applies when certificate_id is not null
    const partialIndexDefinition = {
      tenant_id: 1,
      certificate_id: 1,
      user_id: 1
    };

    const partialIndexOptions = {
      name: 'tenant_id_1_certificate_id_1_user_id_1_partial',
      unique: true,
      partialFilterExpression: {
        certificate_id: { $exists: true, $type: 'objectId' }
      }
    };

    try {
      await collection.createIndex(partialIndexDefinition, partialIndexOptions);
      console.log('✅ Successfully created partial unique index for organizational certificates');
      console.log('   (This index only applies when certificate_id is not null)');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Index already exists');
      } else {
        throw error;
      }
    }

    // Step 4: Verify new indexes
    console.log('\n📋 Verifying new indexes...');
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:');
    newIndexes.forEach(index => {
      const isUnique = index.unique ? '(UNIQUE)' : '';
      const isPartial = index.partialFilterExpression ? '(PARTIAL)' : '';
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${isUnique} ${isPartial}`);
      if (index.partialFilterExpression) {
        console.log(`    Filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Removed unique constraint that prevented multiple personal certificates');
    console.log('  - Created partial unique index for organizational certificates only');
    console.log('  - Users can now have multiple personal certificates (certificate_id = null)');
    console.log('  - Organizational certificates still have unique constraint (one per certificate per user)');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixUserCertificateIndex()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUserCertificateIndex };

