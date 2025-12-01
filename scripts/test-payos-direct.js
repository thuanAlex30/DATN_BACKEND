/**
 * Script test PayOS trực tiếp với API để debug lỗi
 * Usage: node scripts/test-payos-direct.js
 */

const axios = require('axios');

async function testPayOSDirect() {
  console.log('\n🔍 Test PayOS trực tiếp với API...\n');

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const baseUrl = process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn';

  if (!clientId || !apiKey) {
    console.error('❌ Thiếu PAYOS_CLIENT_ID hoặc PAYOS_API_KEY');
    process.exit(1);
  }

  // Tạo orderCode unique
  const orderCode = Date.now() % 100000000;
  const orderCodeStr = orderCode.toString().padStart(8, '0');

  // Test với các URL khác nhau
  const testCases = [
    {
      name: 'Test 1: Ngrok URL (hiện tại)',
      returnUrl: 'https://connately-bivoltine-suzette.ngrok-free.dev/api/pricing/payment-return',
      cancelUrl: 'https://connately-bivoltine-suzette.ngrok-free.dev/api/pricing/payment-cancel'
    },
    {
      name: 'Test 2: Frontend localhost',
      returnUrl: 'http://localhost:5173/pricing/payment-success',
      cancelUrl: 'http://localhost:5173/pricing/payment-cancelled'
    },
    {
      name: 'Test 3: Backend localhost',
      returnUrl: 'http://localhost:3000/api/pricing/payment-return',
      cancelUrl: 'http://localhost:3000/api/pricing/payment-cancel'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(testCase.name);
    console.log('='.repeat(70));

    const payload = {
      orderCode: parseInt(orderCodeStr),
      amount: 1000,
      description: 'Test payment',
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          price: 1000
        }
      ],
      returnUrl: testCase.returnUrl,
      cancelUrl: testCase.cancelUrl
    };

    console.log('\n📋 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(
        `${baseUrl}/v2/payment-requests`,
        payload,
        {
          headers: {
            'x-client-id': clientId,
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.code === '00') {
        console.log('\n🎉 Payment link created successfully!');
        console.log('Checkout URL:', response.data.data.checkoutUrl);
        return; // Thành công, dừng test
      }
    } catch (error) {
      console.log('\n❌ ERROR');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }

    // Tăng orderCode cho test case tiếp theo
    orderCode = (orderCode + 1) % 100000000;
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Gợi ý:');
  console.log('1. Kiểm tra PayOS Dashboard - Kênh kết nối có đang "Hoạt động" không?');
  console.log('2. Kiểm tra Credentials có đúng không?');
  console.log('3. Thử liên hệ PayOS Support nếu vẫn lỗi');
  console.log('');
}

testPayOSDirect().catch(error => {
  console.error('\n❌ Lỗi khi chạy test:', error);
  process.exit(1);
});

