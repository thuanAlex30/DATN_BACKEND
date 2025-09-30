const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Project = require('../models/project');
const User = require('../models/user');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.8qj8x.mongodb.net/safetypro?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const testProjects = async () => {
  try {
    await connectDB();
    
    // Check if there are any projects
    const projects = await Project.find();
    console.log('Số lượng dự án trong database:', projects.length);
    
    if (projects.length > 0) {
      console.log('Dự án đầu tiên:');
      console.log(JSON.stringify(projects[0], null, 2));
    } else {
      console.log('Không có dự án nào trong database');
      
      // Check if there are users
      const users = await User.find();
      console.log('Số lượng user trong database:', users.length);
      
      if (users.length > 0) {
        console.log('User đầu tiên:');
        console.log(JSON.stringify(users[0], null, 2));
        
        // Create a test project
        const testProject = new Project({
          project_name: 'Dự án Test',
          description: 'Dự án test để kiểm tra hệ thống',
          status: 'active',
          priority: 'high',
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          budget: 1000000,
          progress_percentage: 0,
          leader_id: users[0]._id,
          site_name: 'Site Test',
          created_by: users[0]._id
        });
        
        const savedProject = await testProject.save();
        console.log('Đã tạo dự án test:', savedProject._id);
      }
    }
    
    // Generate a test token
    const users = await User.find();
    if (users.length > 0) {
      const testUser = users[0];
      const token = jwt.sign(
        { 
          id: testUser._id, 
          email: testUser.email,
          role: testUser.role 
        },
        'your-secret-key', // This should match your JWT secret
        { expiresIn: '1h' }
      );
      
      console.log('\nTest token:');
      console.log(token);
      console.log('\nSử dụng token này để test API:');
      console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:3000/api/projects');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

testProjects();




