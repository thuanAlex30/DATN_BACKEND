require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Không tìm thấy GEMINI_API_KEY trong .env');
  process.exit(1);
}

console.log('🔍 Đang kiểm tra API key...');
console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
console.log('');

const genAI = new GoogleGenerativeAI(apiKey);

async function testAPIKey() {
  // Test 1: Kiểm tra API key có hợp lệ không bằng cách gọi model đơn giản nhất
  console.log('📝 Test 1: Kiểm tra API key cơ bản...');
  
  const testModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest'
  ];
  
  let workingModel = null;
  
  for (const modelName of testModels) {
    try {
      console.log(`   Đang thử model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one word");
      const response = await result.response;
      
      console.log(`   ✅ ${modelName}: HOẠT ĐỘNG!`);
      console.log(`   Response: "${response.text()}"`);
      workingModel = modelName;
      break;
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`   ❌ ${modelName}: Model không tìm thấy`);
      } else if (error.message.includes('403') || error.message.includes('permission')) {
        console.log(`   ⚠️ ${modelName}: Không có quyền truy cập`);
      } else if (error.message.includes('401') || error.message.includes('API_KEY_INVALID')) {
        console.log(`   ❌ ${modelName}: API key không hợp lệ`);
        console.log(`   Error: ${error.message}`);
        break; // Dừng lại nếu API key không hợp lệ
      } else {
        console.log(`   ❌ ${modelName}: ${error.message.substring(0, 50)}...`);
      }
    }
  }
  
  console.log('');
  
  // Test 2: Kiểm tra chi tiết hơn nếu có model hoạt động
  if (workingModel) {
    console.log('📝 Test 2: Kiểm tra chi tiết API key...');
    try {
      const model = genAI.getGenerativeModel({ model: workingModel });
      
      // Test với prompt dài hơn
      const prompt = "Trả lời ngắn gọn: Hệ thống quản lý an toàn lao động là gì?";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      console.log(`   ✅ API key hoạt động tốt với model: ${workingModel}`);
      console.log(`   Prompt: "${prompt}"`);
      console.log(`   Response: "${response.text().substring(0, 100)}..."`);
      console.log('');
      
      // Kiểm tra metadata
      if (result.response.candidates && result.response.candidates[0]) {
        const candidate = result.response.candidates[0];
        console.log('📊 Thông tin response:');
        if (candidate.finishReason) {
          console.log(`   Finish Reason: ${candidate.finishReason}`);
        }
        if (result.response.usageMetadata) {
          console.log(`   Tokens used: ${JSON.stringify(result.response.usageMetadata)}`);
        }
      }
      
      console.log('');
      console.log('✅ KẾT LUẬN: API key CÒN HOẠT ĐỘNG');
      console.log(`   Model khuyến nghị: ${workingModel}`);
      console.log(`   Cập nhật GEMINI_MODEL=${workingModel} trong .env`);
      
    } catch (error) {
      console.log(`   ❌ Lỗi khi test chi tiết: ${error.message}`);
      console.log('');
      console.log('⚠️ KẾT LUẬN: API key có vấn đề');
    }
  } else {
    console.log('❌ KẾT LUẬN: API key KHÔNG HOẠT ĐỘNG hoặc không có quyền truy cập model');
    console.log('');
    console.log('💡 Gợi ý:');
    console.log('   1. Kiểm tra lại API key trong Google Cloud Console');
    console.log('   2. Đảm bảo API key chưa bị xóa hoặc vô hiệu hóa');
    console.log('   3. Kiểm tra xem API key có quyền truy cập Generative Language API không');
    console.log('   4. Thử tạo API key mới nếu cần');
  }
}

testAPIKey().catch(error => {
  console.error('❌ Lỗi không mong đợi:', error.message);
  process.exit(1);
});

