/**
 * Script lấy URL từ ngrok và hiển thị cấu hình PayOS
 * 
 * Usage: node scripts/get-ngrok-url.js
 */

const axios = require('axios');

async function getNgrokUrl() {
  try {
    console.log('\n🔍 Đang lấy URL từ ngrok...\n');
    
    // Chờ ngrok khởi động
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = response.data.tunnels;
    
    if (!tunnels || tunnels.length === 0) {
      console.error('❌ Không tìm thấy tunnel nào. Đảm bảo ngrok đang chạy: ngrok http 3000');
      process.exit(1);
    }
    
    // Tìm HTTPS tunnel
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    const httpTunnel = tunnels.find(t => t.proto === 'http');
    
    const tunnel = httpsTunnel || httpTunnel;
    
    if (!tunnel) {
      console.error('❌ Không tìm thấy tunnel hợp lệ');
      process.exit(1);
    }
    
    const ngrokUrl = tunnel.public_url;
    
    console.log('✅ Ngrok URL:', ngrokUrl);
    console.log('\n📋 Cấu hình PayOS:\n');
    console.log('Thêm vào file .env:\n');
    console.log(`PAYOS_RETURN_URL=${ngrokUrl}/api/pricing/payment-return`);
    console.log(`PAYOS_CANCEL_URL=${ngrokUrl}/api/pricing/payment-cancel`);
    console.log(`\nHoặc nếu muốn trỏ trực tiếp về frontend (localhost được chấp nhận):\n`);
    console.log(`PAYOS_RETURN_URL=http://localhost:5173/pricing/payment-success`);
    console.log(`PAYOS_CANCEL_URL=http://localhost:5173/pricing/payment-cancelled`);
    console.log('\n💡 Lưu ý:');
    console.log('   - Nếu dùng ngrok URL, backend sẽ xử lý và redirect về frontend');
    console.log('   - Nếu dùng localhost, PayOS sẽ redirect trực tiếp về frontend');
    console.log('   - Sau khi cập nhật .env, restart server\n');
    
    return ngrokUrl;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Không thể kết nối đến ngrok API (http://localhost:4040)');
      console.error('\n💡 Đảm bảo ngrok đang chạy:');
      console.error('   1. Mở terminal mới');
      console.error('   2. Chạy: ngrok http 3000');
      console.error('   3. Chạy lại script này\n');
    } else {
      console.error('❌ Lỗi:', error.message);
    }
    process.exit(1);
  }
}

getNgrokUrl();

