/**
 * Script test hàm generatePreviewPdf
 * Chạy: node test-preview-pdf.js
 */

const contractService = require('./services/contractService');

// Test data giống như form input
const testData = {
  planType: 'monthly', // 'monthly', 'quarterly', 'yearly'
  amount: 5000, // VND
  companyInfo: {
    name: 'Công Ty TNHH Lam Danh Mai ABC',
    email: 'lamakakigarc@gmail.com',
    address: 'Số 30 Lê Thánh Tông',
    phone: '0779418439',
    taxCode: '1234567890'
  },
  contactPerson: {
    name: 'Nguyễn Thành Vũ',
    position: 'Giám đốc',
    email: 'nguyenthanhvu@example.com',
    phone: '0123456789'
  }
};

async function testGeneratePreviewPdf() {
  try {
    console.log('🧪 Testing generatePreviewPdf...\n');
    console.log('📋 Test data:');
    console.log('   Plan Type:', testData.planType);
    console.log('   Amount:', testData.amount);
    console.log('   Company Name:', testData.companyInfo.name);
    console.log('   Company Email:', testData.companyInfo.email);
    console.log('   Company Address:', testData.companyInfo.address);
    console.log('   Company Phone:', testData.companyInfo.phone);
    console.log('   Company Tax Code:', testData.companyInfo.taxCode);
    console.log('   Contact Name:', testData.contactPerson.name);
    console.log('   Contact Position:', testData.contactPerson.position);
    console.log('');

    console.log('🔄 Generating PDF preview...');
    const previewPdfUrl = await contractService.generatePreviewPdf(testData);

    console.log('\n✅ PDF preview generated successfully!');
    console.log('📄 Preview PDF URL:', previewPdfUrl);
    console.log('');
    console.log('💡 Cách xem PDF:');
    console.log('   1. Mở URL trong browser:', previewPdfUrl);
    console.log('   2. Hoặc mở file trực tiếp từ thư mục uploads/contracts/');
    console.log('   3. Kiểm tra xem text có hiển thị đúng vị trí không');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error testing generatePreviewPdf:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Chạy test
testGeneratePreviewPdf();

