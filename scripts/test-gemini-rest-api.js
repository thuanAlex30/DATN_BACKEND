require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Không tìm thấy GEMINI_API_KEY trong .env');
  process.exit(1);
}

console.log('🔍 Đang test Gemini API qua REST API...');
console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
console.log('');

async function testRESTAPI() {
  const models = [
    { name: 'gemini-pro', version: 'v1beta' },
    { name: 'gemini-pro', version: 'v1' },
    { name: 'gemini-1.5-flash', version: 'v1beta' },
    { name: 'gemini-1.5-flash', version: 'v1' },
    { name: 'gemini-1.5-pro', version: 'v1beta' },
    { name: 'gemini-1.5-pro', version: 'v1' }
  ];

  for (const { name, version } of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${apiKey}`;
      
      console.log(`Testing: ${name} (${version})...`);
      
      const response = await axios.post(
        url,
        {
          contents: [{
            role: 'user',
            parts: [{ text: 'Hello' }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.candidates) {
        console.log(`   ✅ HOẠT ĐỘNG!`);
        console.log(`   Response: "${response.data.candidates[0].content.parts[0].text}"`);
        console.log('');
        console.log('✅ KẾT LUẬN: API key hoạt động!');
        console.log(`   Model: ${name}`);
        console.log(`   Version: ${version}`);
        console.log(`   Cập nhật GEMINI_MODEL=${name} trong .env`);
        return;
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 404) {
          console.log(`   ❌ 404 - Model không tìm thấy`);
          if (errorData.error && errorData.error.message) {
            console.log(`   Chi tiết: ${errorData.error.message.substring(0, 80)}...`);
          }
        } else if (status === 403) {
          console.log(`   ⚠️ 403 - Không có quyền truy cập`);
          if (errorData.error && errorData.error.message) {
            console.log(`   Chi tiết: ${errorData.error.message}`);
          }
          console.log('');
          console.log('💡 Có thể Generative Language API chưa được bật trong project');
          console.log('   Kiểm tra: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        } else if (status === 401) {
          console.log(`   ❌ 401 - API key không hợp lệ`);
        } else {
          console.log(`   ❌ ${status} - ${errorData.error?.message || error.message}`);
        }
      } else {
        console.log(`   ❌ Lỗi: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('❌ Không tìm thấy model nào hoạt động');
  console.log('');
  console.log('💡 Các bước khắc phục:');
  console.log('   1. Kiểm tra Generative Language API đã được bật:');
  console.log('      https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  console.log('   2. Đảm bảo billing account đã được kích hoạt (nếu cần)');
  console.log('   3. Kiểm tra API key chưa bị xóa hoặc vô hiệu hóa');
}

testRESTAPI().catch(error => {
  console.error('❌ Lỗi không mong đợi:', error.message);
  process.exit(1);
});

