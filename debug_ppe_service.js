const mongoose = require('mongoose');
const PPEService = require('./services/ppeService');

mongoose.connect('mongodb+srv://thuandh30:admin@safetymanagementsystem.0gssvfl.mongodb.net/safety_management_system?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    const managerId = '68f09e9a0e5cbe5680a1f827';
    console.log('Testing PPEService.getDepartmentEmployeesPPE for manager:', managerId);
    
    const result = await PPEService.getDepartmentEmployeesPPE(managerId);
    
    console.log('PPE Service result:', {
      success: result.success,
      message: result.message,
      statusCode: result.statusCode,
      data: result.data ? {
        total_items: result.data.total_items,
        department_id: result.data.department_id,
        department_name: result.data.department_name,
        issuances_count: result.data.issuances ? result.data.issuances.length : 0
      } : null
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
