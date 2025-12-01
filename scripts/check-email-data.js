/**
 * Script để kiểm tra dữ liệu liên quan đến email
 * 
 * Usage: node scripts/check-email-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/order');
const User = require('../models/user');
const Tenant = require('../models/tenant');

const TEST_EMAILS = [
  'LamMDDE170681@fpt.edu.vn',
  'lammdde170681@fpt.edu.vn',
  'Lamakakigarc@gmail.com',
  'lamakakigarc@gmail.com'
];

async function checkEmailData() {
  try {
    await connectDB();
    console.log('✅ Đã kết nối database\n');

    // Tìm Users (case-insensitive)
    console.log('🔍 Tìm Users...');
    const users = await User.find({
      $or: TEST_EMAILS.map(email => ({
        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }))
    });
    console.log(`Tìm thấy ${users.length} user(s):`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.username}) - Tenant: ${u.tenant_id || 'N/A'}`);
    });
    console.log('');

    // Tìm Orders (case-insensitive)
    console.log('🔍 Tìm Orders...');
    const orders = await Order.find({
      $or: [
        ...TEST_EMAILS.map(email => ({
          'contactPerson.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        })),
        ...TEST_EMAILS.map(email => ({
          'companyInfo.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }))
      ]
    });
    console.log(`Tìm thấy ${orders.length} order(s):`);
    orders.forEach(o => {
      console.log(`   - ${o.orderId} - ${o.contactPerson.email} - Status: ${o.status} - Tenant: ${o.tenantId || 'N/A'}`);
    });
    console.log('');

    // Tìm Tenants liên quan
    console.log('🔍 Tìm Tenants...');
    const tenantIds = [
      ...users.map(u => u.tenant_id).filter(Boolean),
      ...orders.map(o => o.tenantId).filter(Boolean)
    ].filter((id, index, self) => 
      index === self.findIndex(t => t?.toString() === id?.toString())
    );

    if (tenantIds.length > 0) {
      const tenants = await Tenant.find({ _id: { $in: tenantIds } });
      console.log(`Tìm thấy ${tenants.length} tenant(s):`);
      tenants.forEach(t => {
        console.log(`   - ${t.name} (${t.tenant_code}) - Email: ${t.contact?.email || 'N/A'}`);
      });
    } else {
      console.log('Không tìm thấy tenant nào');
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkEmailData();

