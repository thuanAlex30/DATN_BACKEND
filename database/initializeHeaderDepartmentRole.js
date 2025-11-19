const mongoose = require('mongoose');
const dbConfig = require('../config/database');
const Role = require('../models/role');

async function init() {
  try {
    await dbConfig.connect();

    const roleName = 'header_department';

    let role = await Role.findOne({ role_name: roleName });

    if (!role) {
      role = await Role.create({
        role_name: roleName,
        description: 'Trưởng bộ phận - quản lý đào tạo, chứng chỉ, PPE và sự cố',
        permissions: {}, // Có thể cấu hình sau trong UI phân quyền
        is_active: true,
      });
      console.log(`✅ Created role '${roleName}' with id:`, role._id.toString());
    } else {
      console.log(`ℹ️ Role '${roleName}' already exists with id:`, role._id.toString());
    }
  } catch (err) {
    console.error('❌ Error initializing header_department role:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

init();


