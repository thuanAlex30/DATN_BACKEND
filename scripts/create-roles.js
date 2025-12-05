require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Role = require('../models/role');
const { ROLE_DEFINITIONS } = require('../config/roleMatrix');

/**
 * Seed roles into database from ROLE_DEFINITIONS.
 * - Idempotent: chạy nhiều lần không tạo trùng role_code
 * - Không xóa/sửa role hiện có, chỉ tạo mới nếu thiếu
 */
async function seedRoles() {
  try {
    await connectDB();

    console.log('🔐 Seeding roles from config/roleMatrix.js ...');

    const existingRoles = await Role.find({}).lean();
    const existingByCode = new Map(
      existingRoles
        .filter(r => r.role_code)
        .map(r => [r.role_code, r])
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const def of ROLE_DEFINITIONS) {
      const code = def.role_code;
      const existing = existingByCode.get(code);

      if (existing) {
        console.log(`⏭  Role '${code}' đã tồn tại, bỏ qua (id=${existing._id})`);
        skippedCount += 1;
        continue;
      }

      const payload = {
        role_code: def.role_code,
        role_name: def.role_name,
        role_level: def.role_level,
        description: def.description,
        scope_rules: def.scope_rules,
        permissions: def.permissions,
        is_active: true,
        is_default: def.is_default === true
      };

      const role = new Role(payload);
      await role.save();

      console.log(`✅ Tạo role mới: ${def.role_code} (${def.role_name}) - id=${role._id}`);
      createdCount += 1;
    }

    console.log('🎯 Hoàn tất seed roles.');
    console.log(`   - Đã tạo mới: ${createdCount}`);
    console.log(`   - Bỏ qua (đã tồn tại): ${skippedCount}`);
  } catch (err) {
    console.error('❌ Lỗi khi seed roles:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
    process.exit(0);
  }
}

seedRoles();


