const mongoose = require('mongoose');
const Position = require('./models/position');
const User = require('./models/User');

async function testPositionEmployeeCount() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safety_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get all positions with employee count
    const positions = await Position.find({})
      .populate('employees_count')
      .lean();
    
    console.log('\n=== POSITIONS WITH EMPLOYEE COUNT ===');
    console.log(`Total positions: ${positions.length}`);
    
    positions.forEach((pos, index) => {
      console.log(`\n${index + 1}. ${pos.position_name}`);
      console.log(`   ID: ${pos._id}`);
      console.log(`   Level: ${pos.level}`);
      console.log(`   Active: ${pos.is_active}`);
      console.log(`   Employee Count: ${pos.employees_count || 0}`);
    });
    
    // Get actual employee counts from User collection
    console.log('\n=== ACTUAL EMPLOYEE COUNTS FROM USER COLLECTION ===');
    
    for (const pos of positions) {
      const actualCount = await User.countDocuments({ 
        position_id: pos._id, 
        is_active: true 
      });
      
      console.log(`${pos.position_name}: ${actualCount} employees`);
    }
    
    // Test the API endpoint format
    console.log('\n=== API RESPONSE FORMAT ===');
    const apiResponse = {
      success: true,
      message: 'Positions retrieved successfully',
      data: {
        positions: positions.map(pos => ({
          id: pos._id,
          position_name: pos.position_name,
          level: pos.level,
          is_active: pos.is_active,
          employees_count: pos.employees_count || 0,
          created_at: pos.created_at,
          updated_at: pos.updated_at
        })),
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: positions.length,
          items_per_page: positions.length
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testPositionEmployeeCount();
