/**
 * Script liệt kê các file PDF đã tạo
 * Chạy: node list-pdf-files.js
 */

const fs = require('fs').promises;
const path = require('path');

async function listPdfFiles() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    
    // Kiểm tra thư mục tồn tại
    try {
      await fs.access(uploadsDir);
    } catch {
      console.log('❌ Thư mục uploads/contracts không tồn tại');
      return;
    }

    const files = await fs.readdir(uploadsDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf')).sort().reverse();

    if (pdfFiles.length === 0) {
      console.log('❌ Không tìm thấy file PDF nào');
      return;
    }

    console.log('📄 Danh sách file PDF trong uploads/contracts:\n');
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    // Tìm các file quan trọng
    const importantFiles = {
      'Template với Grid': pdfFiles.find(f => f.startsWith('template-with-grid-')),
      'Test Positions': pdfFiles.find(f => f.startsWith('test-positions-')),
      'Coordinate Grid': pdfFiles.find(f => f.startsWith('coordinate-grid-')),
      'Preview PDF': pdfFiles.find(f => f.startsWith('preview-')),
      'Test Coordinates': pdfFiles.filter(f => f.startsWith('test-coords-'))
    };

    console.log('🔗 URLs quan trọng:');
    console.log('');
    
    if (importantFiles['Template với Grid']) {
      console.log(`✅ Template với Grid:`);
      console.log(`   ${backendUrl}/uploads/contracts/${importantFiles['Template với Grid']}`);
      console.log('');
    }
    
    if (importantFiles['Test Positions']) {
      console.log(`✅ Test Positions:`);
      console.log(`   ${backendUrl}/uploads/contracts/${importantFiles['Test Positions']}`);
      console.log('');
    }
    
    if (importantFiles['Coordinate Grid']) {
      console.log(`✅ Coordinate Grid:`);
      console.log(`   ${backendUrl}/uploads/contracts/${importantFiles['Coordinate Grid']}`);
      console.log('');
    }

    if (importantFiles['Test Coordinates'].length > 0) {
      console.log(`✅ Test Coordinates (${importantFiles['Test Coordinates'].length} files):`);
      importantFiles['Test Coordinates'].slice(0, 5).forEach(file => {
        console.log(`   ${backendUrl}/uploads/contracts/${file}`);
      });
      if (importantFiles['Test Coordinates'].length > 5) {
        console.log(`   ... và ${importantFiles['Test Coordinates'].length - 5} file khác`);
      }
      console.log('');
    }

    console.log('📋 Tất cả file PDF (10 file mới nhất):');
    console.log('');
    pdfFiles.slice(0, 10).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
      console.log(`      ${backendUrl}/uploads/contracts/${file}`);
    });
    
    if (pdfFiles.length > 10) {
      console.log(`\n   ... và ${pdfFiles.length - 10} file khác`);
    }

    console.log('');
    console.log('💡 Cách sử dụng:');
    console.log('   1. Copy URL của file "Template với Grid"');
    console.log('   2. Mở trong browser để xem template với grid overlay');
    console.log('   3. Đo tọa độ từ grid để xác định vị trí chính xác');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listPdfFiles();

