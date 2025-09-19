const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createTestUserAndGetToken() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safety_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Create test user if not exists
    let user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        username: 'admin',
        password_hash: hashedPassword,
        email: 'admin@test.com',
        full_name: 'Test Admin',
        is_active: true,
        role_id: new mongoose.Types.ObjectId() // Create a dummy role_id
      });
      console.log('Created test user:', user.email);
    } else {
      console.log('Test user already exists:', user.email);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('\nJWT Token:', token);
    
    // Test API call with token
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/v1/positions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('\nAPI Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createTestUserAndGetToken();
