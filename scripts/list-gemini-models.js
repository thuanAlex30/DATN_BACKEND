require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello");
    const response = await result.response;
    return {
      success: true,
      response: response.text()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function listModels() {
  try {
    console.log('🔍 Đang kiểm tra các model có sẵn với API key...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 20)}...` : 'NOT FOUND');
    console.log('');
    
    // Danh sách các model phổ biến để test
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-001',
      'gemini-pro-vision',
      'gemini-2.0-flash-exp'
    ];
    
    console.log(`🧪 Đang test ${modelsToTest.length} model(s)...`);
    console.log('');
    
    const results = [];
    
    for (const modelName of modelsToTest) {
      process.stdout.write(`Testing ${modelName}... `);
      const result = await testModel(modelName);
      if (result.success) {
        console.log('✅ HOẠT ĐỘNG');
        results.push({
          name: modelName,
          status: 'OK',
          response: result.response.substring(0, 50)
        });
      } else {
        if (result.error.includes('404') || result.error.includes('not found')) {
          console.log('❌ Không tìm thấy');
        } else if (result.error.includes('403') || result.error.includes('permission')) {
          console.log('⚠️ Không có quyền');
        } else {
          console.log(`❌ Lỗi: ${result.error.substring(0, 30)}...`);
        }
        results.push({
          name: modelName,
          status: 'ERROR',
          error: result.error
        });
      }
    }
    
    console.log('');
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(60));
    
    const workingModels = results.filter(r => r.status === 'OK');
    if (workingModels.length > 0) {
      console.log(`✅ Tìm thấy ${workingModels.length} model(s) hoạt động:`);
      workingModels.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name}`);
        console.log(`      Response: ${model.response}...`);
      });
    } else {
      console.log('❌ Không tìm thấy model nào hoạt động');
      console.log('');
      console.log('💡 Gợi ý:');
      console.log('   - Kiểm tra lại API key có hợp lệ không');
      console.log('   - API key từ Google AI Studio thường chỉ hỗ trợ gemini-pro');
      console.log('   - Để dùng gemini-1.5-flash, cần API key từ Google Cloud Console');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi test models:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('   API key không hợp lệ hoặc đã hết hạn');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('   API key không có quyền truy cập');
    }
  }
}

listModels();

