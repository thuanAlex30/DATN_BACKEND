const mongoose = require('mongoose');
const Position = require('./models/position');
const User = require('./models/User');

async function testPositionVirtualField() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safety_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Test virtual field directly
    const positions = await Position.find({}).populate('employees_count');
    
    console.log('\n=== TESTING VIRTUAL FIELD ===');
    positions.forEach((pos, index) => {
      console.log(`\n${index + 1}. ${pos.position_name}`);
      console.log(`   ID: ${pos._id}`);
      console.log(`   Level: ${pos.level}`);
      console.log(`   Active: ${pos.is_active}`);
      console.log(`   Employee Count (virtual): ${pos.employees_count}`);
      console.log(`   Employee Count (typeof): ${typeof pos.employees_count}`);
    });
    
    // Test manual count
    console.log('\n=== MANUAL COUNT TEST ===');
    for (const pos of positions) {
      const manualCount = await User.countDocuments({ 
        position_id: pos._id, 
        is_active: true 
      });
      
      console.log(`${pos.position_name}: Virtual=${pos.employees_count}, Manual=${manualCount}`);
    }
    
    // Test with toJSON
    console.log('\n=== TOJSON TEST ===');
    const positionsJSON = positions.map(pos => pos.toJSON());
    positionsJSON.forEach((pos, index) => {
      console.log(`${index + 1}. ${pos.position_name}: employees_count=${pos.employees_count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testPositionVirtualField();
