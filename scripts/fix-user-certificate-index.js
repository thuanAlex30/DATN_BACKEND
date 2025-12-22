// scripts/clearTrainingData.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

const dbName = uri.split('/').pop()?.split('?')[0] || 'safety_system';
const collections = [
  'training_enrollments',
  'training_sessions',
  'training_assignments',
  'questions',
  'question_banks',
  'courses',
  'course_sets',
  // Thêm tên collection khác nếu có dữ liệu training cần xóa
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to DB: ${dbName}`);

    for (const col of collections) {
      const res = await db.collection(col).deleteMany({});
      console.log(`Cleared ${col}: deleted ${res.deletedCount} docs`);
    }

    // Xóa index cũ nếu vẫn còn (tránh lỗi duplicate session_id)
    try {
      await db.collection('training_enrollments').dropIndex('session_id_1_user_id_1');
      console.log('Dropped index session_id_1_user_id_1');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Index session_id_1_user_id_1 not found, skip');
      } else {
        console.warn('Drop index warning:', e.message);
      }
    }

    console.log('✅ Training data cleared');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();