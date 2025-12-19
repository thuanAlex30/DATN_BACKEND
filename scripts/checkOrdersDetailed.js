/**
 * Script để kiểm tra chi tiết orders trong database
 * Chạy: node scripts/checkOrdersDetailed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/order');

async function checkOrdersDetailed() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI không được cấu hình trong .env');
      process.exit(1);
    }

    console.log('🔌 Đang kết nối database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Kiểm tra tất cả orders
    const allOrders = await Order.find().lean();
    console.log(`📊 Tổng số orders: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('⚠️  Không có orders nào trong database');
      console.log('\n💡 Có thể orders đã bị xóa do TTL index');
    } else {
      // Phân loại orders
      const paidOrders = allOrders.filter(o => o.status === 'paid');
      const pendingOrders = allOrders.filter(o => o.status === 'pending');
      const ordersWithExpiresAt = allOrders.filter(o => o.expiresAt !== null && o.expiresAt !== undefined);
      const ordersWithoutExpiresAt = allOrders.filter(o => !o.expiresAt || o.expiresAt === null);

      console.log('📈 Phân loại orders:');
      console.log(`   - Đã thanh toán (paid): ${paidOrders.length}`);
      console.log(`   - Đang chờ (pending): ${pendingOrders.length}`);
      console.log(`   - Có expiresAt: ${ordersWithExpiresAt.length}`);
      console.log(`   - Không có expiresAt: ${ordersWithoutExpiresAt.length}\n`);

      // Kiểm tra orders đã thanh toán nhưng vẫn có expiresAt (VẤN ĐỀ!)
      const paidOrdersWithExpiresAt = paidOrders.filter(o => o.expiresAt !== null && o.expiresAt !== undefined);
      if (paidOrdersWithExpiresAt.length > 0) {
        console.log('⚠️  CẢNH BÁO: Có orders đã thanh toán nhưng vẫn có expiresAt (sẽ bị xóa!):');
        paidOrdersWithExpiresAt.forEach(order => {
          const expiresAt = new Date(order.expiresAt);
          const now = new Date();
          const isExpired = expiresAt < now;
          console.log(`   - Order ID: ${order.orderId}`);
          console.log(`     Status: ${order.status}`);
          console.log(`     ExpiresAt: ${expiresAt.toLocaleString('vi-VN')}`);
          console.log(`     Đã hết hạn: ${isExpired ? '✅ CÓ (sẽ bị xóa)' : '❌ Chưa'}`);
          console.log(`     Company: ${order.companyInfo?.name || 'N/A'}\n`);
        });
      }

      // Hiển thị chi tiết từng order
      console.log('\n📋 Chi tiết tất cả orders:');
      allOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order.orderId}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Company: ${order.companyInfo?.name || 'N/A'}`);
        console.log(`   Amount: ${order.amount?.toLocaleString('vi-VN')} VND`);
        console.log(`   Created: ${new Date(order.createdAt).toLocaleString('vi-VN')}`);
        console.log(`   ExpiresAt: ${order.expiresAt ? new Date(order.expiresAt).toLocaleString('vi-VN') : 'null (không bị xóa)'}`);
        if (order.expiresAt) {
          const expiresAt = new Date(order.expiresAt);
          const now = new Date();
          const isExpired = expiresAt < now;
          const timeLeft = isExpired ? 'Đã hết hạn' : `${Math.round((expiresAt - now) / 1000 / 60)} phút`;
          console.log(`   ⏰ Thời gian còn lại: ${timeLeft}`);
        }
        console.log(`   TenantId: ${order.tenantId || 'Chưa có'}`);
        console.log(`   PaymentDate: ${order.paymentDate ? new Date(order.paymentDate).toLocaleString('vi-VN') : 'N/A'}`);
      });
    }

    // Kiểm tra TTL index
    console.log('\n🔍 Kiểm tra TTL index:');
    const indexes = await Order.collection.getIndexes();
    const expiresAtIndex = indexes.expiresAt_1;
    if (expiresAtIndex) {
      console.log('   TTL Index tồn tại trên field expiresAt');
      console.log('   ⚠️  MongoDB sẽ tự động xóa documents có expiresAt đã qua');
      console.log('   ⚠️  TTL index chạy mỗi 60 giây');
    }

    await mongoose.disconnect();
    console.log('\n✅ Đã đóng kết nối database');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkOrdersDetailed();

