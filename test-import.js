const fs = require('fs');
const path = require('path');

// Test file upload
const testFileUpload = async () => {
  try {
    const filePath = 'D:/DO_AN/sample_users_import.xlsx';
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', filePath);
      return;
    }
    
    console.log('✅ File exists:', filePath);
    console.log('📁 File size:', fs.statSync(filePath).size, 'bytes');
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📖 File read successfully, buffer size:', fileBuffer.length);
    
    // Test XLSX parsing
    const XLSX = require('xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    console.log('📊 Workbook sheets:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📋 Data rows:', data.length);
    console.log('📋 First row:', data[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
};

testFileUpload();
