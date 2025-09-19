require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/department');
const Position = require('../models/position');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDepartments = async () => {
  try {
    console.log('Seeding departments...');
    
    // Check if departments already exist
    const existingDepartments = await Department.find();
    if (existingDepartments.length > 0) {
      console.log('Departments already exist, skipping department seeding...');
      return existingDepartments;
    }

    const departments = [
      {
        department_name: 'HR',
        description: 'Human Resources Department',
        is_active: true
      },
      {
        department_name: 'IT',
        description: 'Information Technology Department',
        is_active: true
      },
      {
        department_name: 'Finance',
        description: 'Finance and Accounting Department',
        is_active: true
      },
      {
        department_name: 'Production',
        description: 'Production Department',
        is_active: true
      },
      {
        department_name: 'Sales',
        description: 'Sales Department',
        is_active: true
      },
      {
        department_name: 'Support',
        description: 'Customer Support Department',
        is_active: true
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('✅ Departments seeded successfully:', createdDepartments.map(d => d.department_name));
    return createdDepartments;
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    throw error;
  }
};

const seedPositions = async () => {
  try {
    console.log('Seeding positions...');
    
    // Check if positions already exist
    const existingPositions = await Position.find();
    if (existingPositions.length > 0) {
      console.log('Positions already exist, skipping position seeding...');
      return existingPositions;
    }

    const positions = [
      {
        position_name: 'Manager',
        description: 'Department Manager',
        level: 4,
        is_active: true
      },
      {
        position_name: 'Developer',
        description: 'Software Developer',
        level: 2,
        is_active: true
      },
      {
        position_name: 'Accountant',
        description: 'Financial Accountant',
        level: 2,
        is_active: true
      },
      {
        position_name: 'Supervisor',
        description: 'Production Supervisor',
        level: 3,
        is_active: true
      },
      {
        position_name: 'Worker',
        description: 'Production Worker',
        level: 1,
        is_active: true
      },
      {
        position_name: 'Director',
        description: 'Sales Director',
        level: 5,
        is_active: true
      },
      {
        position_name: 'Sales',
        description: 'Sales Representative',
        level: 2,
        is_active: true
      },
      {
        position_name: 'Support',
        description: 'Customer Support',
        level: 2,
        is_active: true
      },
      {
        position_name: 'Admin',
        description: 'System Administrator',
        level: 5,
        is_active: true
      }
    ];

    const createdPositions = await Position.insertMany(positions);
    console.log('✅ Positions seeded successfully:', createdPositions.map(p => p.position_name));
    return createdPositions;
  } catch (error) {
    console.error('❌ Error seeding positions:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding for departments and positions...\n');
    
    await seedDepartments();
    await seedPositions();
    
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

module.exports = {
  seedDepartments,
  seedPositions,
  seedDatabase
};
