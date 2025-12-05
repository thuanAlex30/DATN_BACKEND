/**
 * Script để kiểm tra orders trong database
 * Chạy: node scripts/checkOrders.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Tenant = require('../models/tenant');

async function checkOrders() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI không được cấu hình trong .env');
      process.exit(1);
    }

    console.log('🔌 Đang kết nối database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database');

    // Đếm tổng số orders
    const totalOrders = await Order.countDocuments();
    console.log(`\n📊 Tổng số orders: ${totalOrders}`);

    if (totalOrders === 0) {
      console.log('\n⚠️  Collection orders đang rỗng!');
      console.log('\n🔍 Kiểm tra các nguyên nhân có thể:');
      console.log('   1. Chưa có ai tạo order mới');
      console.log('   2. Orders đã bị xóa do TTL index (hết hạn sau 15 phút nếu chưa thanh toán)');
      console.log('   3. Database connection issue');
      console.log('   4. Collection name không đúng');
      
      // Kiểm tra collection name
      const collections = await mongoose.connection.db.listCollections().toArray();
      const orderCollections = collections.filter(c => c.name.toLowerCase().includes('order'));
      console.log(`\n📁 Collections liên quan đến order: ${orderCollections.map(c => c.name).join(', ') || 'Không tìm thấy'}`);
      
      // Kiểm tra tenants
      const totalTenants = await Tenant.countDocuments();
      console.log(`\n👥 Tổng số tenants: ${totalTenants}`);
      
      if (totalTenants > 0) {
        console.log('\n💡 Có tenants nhưng không có orders - có thể orders đã bị xóa hoặc chưa được tạo');
      }
    } else {
      // Hiển thị thống kê orders
      console.log('\n📈 Thống kê orders theo status:');
      const statusCounts = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      statusCounts.forEach(stat => {
        console.log(`   ${stat._id || 'null'}: ${stat.count}`);
      });

      // Hiển thị orders có tenantId
      const ordersWithTenant = await Order.countDocuments({ tenantId: { $ne: null } });
      const paidOrders = await Order.countDocuments({ status: 'paid' });
      const paidOrdersWithTenant = await Order.countDocuments({ 
        status: 'paid', 
        tenantId: { $ne: null } 
      });

      console.log(`\n💰 Orders đã thanh toán: ${paidOrders}`);
      console.log(`   - Có tenantId: ${paidOrdersWithTenant}`);
      console.log(`   - Chưa có tenantId: ${paidOrders - paidOrdersWithTenant}`);
      console.log(`\n🔗 Tổng orders có tenantId: ${ordersWithTenant}`);

      // Hiển thị 5 orders gần nhất
      console.log('\n📋 5 orders gần nhất:');
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderId status planType amount companyInfo.name contactPerson.email tenantId paymentDate createdAt')
        .lean();

      recentOrders.forEach((order, index) => {
        console.log(`\n   ${index + 1}. Order ID: ${order.orderId}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Company: ${order.companyInfo?.name || 'N/A'}`);
        console.log(`      Contact: ${order.contactPerson?.email || 'N/A'}`);
        console.log(`      Plan: ${order.planType}, Amount: ${order.amount?.toLocaleString('vi-VN')} VND`);
        console.log(`      TenantId: ${order.tenantId || 'Chưa có'}`);
        console.log(`      Payment Date: ${order.paymentDate ? new Date(order.paymentDate).toLocaleString('vi-VN') : 'N/A'}`);
        console.log(`      Created: ${new Date(order.createdAt).toLocaleString('vi-VN')}`);
      });
    }

    // Kiểm tra TTL index
    console.log('\n🔍 Kiểm tra indexes trên collection orders:');
    const indexes = await Order.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Đã đóng kết nối database');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkOrders();

