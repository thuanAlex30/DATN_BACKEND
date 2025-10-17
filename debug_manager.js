const mongoose = require('mongoose');
const UserService = require('./services/userService');

mongoose.connect('mongodb+srv://thuandh30:admin@safetymanagementsystem.0gssvfl.mongodb.net/safety_management_system?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    const managerId = '68f09e9a0e5cbe5680a1f827';
    console.log('Testing UserService.getUserById for manager:', managerId);
    
    const result = await UserService.getUserById(managerId);
    console.log('UserService result:', {
      success: result.success,
      message: result.message,
      data: result.data ? {
        id: result.data.id,
        username: result.data.username,
        department: result.data.department,
        role: result.data.role
      } : null
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
