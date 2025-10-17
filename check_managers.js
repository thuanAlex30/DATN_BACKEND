const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/department');

mongoose.connect('mongodb+srv://thuandh30:admin@safetymanagementsystem.0gssvfl.mongodb.net/safety_management_system?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    // Tìm tất cả managers
    const managers = await User.find({ role: { $in: ['manager', '68d040500712b0083b916164'] } }).populate('department_id');
    console.log('\n=== ALL MANAGERS ===');
    managers.forEach(m => {
      console.log({
        id: m._id,
        username: m.username,
        role: m.role,
        department_id: m.department_id,
        department_name: m.department_id ? m.department_id.name : 'No department'
      });
    });
    
    // Tìm user manager_hr cụ thể
    const managerHr = await User.findOne({ username: 'manager_hr' }).populate('department_id');
    console.log('\n=== MANAGER_HR ===');
    if (managerHr) {
      console.log({
        id: managerHr._id,
        username: managerHr.username,
        role: managerHr.role,
        department_id: managerHr.department_id,
        department_name: managerHr.department_id ? managerHr.department_id.name : 'No department'
      });
    } else {
      console.log('manager_hr not found');
    }
    
    // Tìm tất cả departments
    const departments = await Department.find();
    console.log('\n=== ALL DEPARTMENTS ===');
    departments.forEach(d => {
      console.log({
        id: d._id,
        name: d.name,
        description: d.description
      });
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
