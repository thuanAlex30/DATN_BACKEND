require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/role');
const User = require('../models/user');
const HashUtils = require('../utils/hash');
const { ROLES, ROLE_PERMISSIONS } = require('../utils/permissions');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedRoles = async () => {
  try {
    console.log('Seeding roles...');
    
    // Check if roles already exist
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log('Roles already exist, skipping role seeding...');
      return existingRoles;
    }

    const roles = [
      {
        role_name: ROLES.ADMIN,
        description: 'System Administrator with full access to all features',
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN].reduce((acc, permission) => {
          acc[permission] = true;
          return acc;
        }, {}),
        is_active: true
      },
      {
        role_name: ROLES.LEADER,
        description: 'Department Leader with management capabilities',
        permissions: ROLE_PERMISSIONS[ROLES.LEADER].reduce((acc, permission) => {
          acc[permission] = true;
          return acc;
        }, {}),
        is_active: true
      },
      {
        role_name: ROLES.EMPLOYEE,
        description: 'Regular Employee with basic access',
        permissions: ROLE_PERMISSIONS[ROLES.EMPLOYEE].reduce((acc, permission) => {
          acc[permission] = true;
          return acc;
        }, {}),
        is_active: true
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log('✅ Roles seeded successfully:', createdRoles.map(r => r.role_name));
    return createdRoles;
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

const seedUsers = async () => {
  try {
    console.log('Seeding users...');
    
    // Check if users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log('Users already exist, skipping user seeding...');
      return;
    }

    // Get roles
    const adminRole = await Role.findOne({ role_name: ROLES.ADMIN });
    const leaderRole = await Role.findOne({ role_name: ROLES.LEADER });
    const employeeRole = await Role.findOne({ role_name: ROLES.EMPLOYEE });

    if (!adminRole || !leaderRole || !employeeRole) {
      throw new Error('Roles not found. Please seed roles first.');
    }

    const users = [
      {
        username: 'admin',
        password_hash: await HashUtils.hashPassword('Admin@123'),
        email: 'admin@safetysystem.com',
        full_name: 'System Administrator',
        phone: '+84901234567',
        role_id: adminRole._id,
        is_active: true
      },
      {
        username: 'leader1',
        password_hash: await HashUtils.hashPassword('Leader@123'),
        email: 'leader1@safetysystem.com',
        full_name: 'Department Leader 1',
        phone: '+84901234568',
        role_id: leaderRole._id,
        is_active: true
      },
      {
        username: 'employee1',
        password_hash: await HashUtils.hashPassword('Employee@123'),
        email: 'employee1@safetysystem.com',
        full_name: 'Employee One',
        phone: '+84901234569',
        role_id: employeeRole._id,
        is_active: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('✅ Users seeded successfully:', createdUsers.map(u => u.username));
    
    console.log('\n📝 Default Login Credentials:');
    console.log('==========================================');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin@123');
    console.log('  Role: admin');
    console.log('');
    console.log('Leader:');
    console.log('  Username: leader1');
    console.log('  Password: Leader@123');
    console.log('  Role: leader');
    console.log('');
    console.log('Employee:');
    console.log('  Username: employee1');
    console.log('  Password: Employee@123');
    console.log('  Role: employee');
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...\n');
    
    await seedRoles();
    await seedUsers();
    
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed.');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedRoles, seedUsers };