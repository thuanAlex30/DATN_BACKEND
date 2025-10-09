const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Role = require('./models/role');
const HashUtils = require('./utils/hash');

async function checkAndCreateAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      console.log(`👤 Admin user already exists: ${adminUser.full_name} (${adminUser._id})`);
      return adminUser;
    }

    // Find admin role
    const adminRole = await Role.findOne({ role_name: 'admin' });
    if (!adminRole) {
      console.error('❌ Admin role not found');
      return null;
    }

    console.log(`🔑 Found admin role: ${adminRole.role_name} (${adminRole._id})`);

    // Create admin user
    const password_hash = await HashUtils.hashPassword('admin123');
    
    const adminUserData = {
      username: 'admin',
      password_hash: password_hash,
      email: 'admin@safety.com',
      full_name: 'System Administrator',
      phone: '0123456789',
      role_id: adminRole._id,
      is_active: true
    };

    const newAdmin = new User(adminUserData);
    await newAdmin.save();
    
    console.log(`✅ Created admin user: ${newAdmin.full_name} (${newAdmin._id})`);
    console.log(`📧 Email: ${newAdmin.email}`);
    console.log(`🔐 Password: admin123`);
    
    return newAdmin;

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkAndCreateAdmin();
