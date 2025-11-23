require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Không tìm thấy GEMINI_API_KEY trong .env');
  process.exit(1);
}

console.log('🔍 Đang kiểm tra trạng thái Generative Language API...');
console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
console.log('');

async function checkAPIStatus() {
  // Thử list models để xem API có hoạt động không
  const versions = ['v1beta', 'v1'];
  
  for (const version of versions) {
    try {
      console.log(`📋 Đang thử list models với ${version}...`);
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.models) {
        console.log(`✅ API hoạt động với ${version}!`);
        console.log(`   Tìm thấy ${response.data.models.length} model(s):`);
        console.log('');
        
        response.data.models.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.name}`);
          if (model.displayName) {
            console.log(`      Display: ${model.displayName}`);
          }
          if (model.supportedGenerationMethods) {
            console.log(`      Methods: ${model.supportedGenerationMethods.join(', ')}`);
          }
        });
        
        // Tìm model hỗ trợ generateContent
        const generateContentModels = response.data.models.filter(m => 
          m.supportedGenerationMethods && 
          m.supportedGenerationMethods.includes('generateContent')
        );
        
        if (generateContentModels.length > 0) {
          console.log('');
          console.log('✅ Các model có thể sử dụng:');
          generateContentModels.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.name}`);
          });
          console.log('');
          console.log('💡 Cập nhật GEMINI_MODEL trong .env với một trong các model trên');
        }
        
        return;
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 403) {
          console.log(`   ⚠️ 403 - Không có quyền truy cập`);
          if (errorData.error && errorData.error.message) {
            console.log(`   Chi tiết: ${errorData.error.message}`);
          }
          console.log('');
          console.log('💡 Generative Language API có thể chưa được bật trong project');
          console.log('   Kiểm tra và bật tại:');
          console.log('   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
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
  
  console.log('❌ Không thể list models');
  console.log('');
  console.log('💡 Các bước khắc phục:');
  console.log('   1. Bật Generative Language API:');
  console.log('      https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  console.log('   2. Đảm bảo API key có quyền truy cập (đã kiểm tra - OK)');
  console.log('   3. Đợi vài phút sau khi bật API rồi test lại');
}

checkAPIStatus().catch(error => {
  console.error('❌ Lỗi không mong đợi:', error.message);
  process.exit(1);
});

