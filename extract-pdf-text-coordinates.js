/**
 * Script extract text và tọa độ từ PDF để xác định vị trí các trường
 * Chạy: node extract-pdf-text-coordinates.js
 * 
 * Lưu ý: pdf-lib không hỗ trợ extract text, cần dùng thư viện khác
 * Tạm thời script này sẽ tạo PDF với test text tại các vị trí để so sánh
 */

const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');

async function loadVietnameseFont(pdfDoc) {
  try {
    pdfDoc.registerFontkit(fontkit);
    
    const fontsDir = path.join(__dirname, 'fonts');
    const possibleFonts = ['NotoSans-Regular.ttf', 'Arial.ttf'];
    
    for (const fontFile of possibleFonts) {
      const fontPath = path.join(fontsDir, fontFile);
      try {
        if (await fs.access(fontPath).then(() => true).catch(() => false)) {
          const fontBytes = await fs.readFile(fontPath);
          return await pdfDoc.embedFont(fontBytes);
        }
      } catch (e) {}
    }
    
    return await pdfDoc.embedFont('Times-Roman');
  } catch (error) {
    return await pdfDoc.embedFont('Times-Roman');
  }
}

async function extractPdfTextCoordinates() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
    
    if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
      throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
    }

    console.log('📄 Loading PDF template...');
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`📐 Page size: ${width.toFixed(2)} x ${height.toFixed(2)} points (A4)`);
    console.log('');

    // Load font
    const font = await loadVietnameseFont(pdfDoc);
    const fontSize = 11;

    // Tạo test PDF với text tại các vị trí khác nhau để tìm vị trí chính xác
    console.log('🔍 Creating test PDFs with text at different positions...');
    console.log('   Mục đích: So sánh với template để tìm vị trí chính xác\n');

    // Các vị trí test (dựa trên tọa độ hiện tại ± offset)
    const testPositions = [
      // Test cho "Tên Công ty"
      { label: 'Tên Công ty', x: 200, y: 481.68, testText: 'TEST TEN CONG TY' },
      { label: 'Tên Công ty', x: 200, y: 471.68, testText: 'TEST TEN CONG TY -10' },
      { label: 'Tên Công ty', x: 200, y: 491.68, testText: 'TEST TEN CONG TY +10' },
      { label: 'Tên Công ty', x: 190, y: 481.68, testText: 'TEST TEN CONG TY X-10' },
      { label: 'Tên Công ty', x: 210, y: 481.68, testText: 'TEST TEN CONG TY X+10' },
      
      // Test cho "Email Công ty"
      { label: 'Email Công ty', x: 200, y: 501.68, testText: 'test@email.com' },
      { label: 'Email Công ty', x: 200, y: 491.68, testText: 'test@email.com -10' },
      { label: 'Email Công ty', x: 200, y: 511.68, testText: 'test@email.com +10' },
      
      // Test cho "Địa chỉ"
      { label: 'Địa chỉ', x: 200, y: 521.68, testText: '123 Test Street' },
      { label: 'Địa chỉ', x: 200, y: 511.68, testText: '123 Test -10' },
      { label: 'Địa chỉ', x: 200, y: 531.68, testText: '123 Test +10' },
      
      // Test cho "Điện thoại"
      { label: 'Điện thoại', x: 200, y: 541.68, testText: '0123456789' },
      { label: 'Điện thoại', x: 200, y: 531.68, testText: '0123456789 -10' },
      { label: 'Điện thoại', x: 200, y: 551.68, testText: '0123456789 +10' },
      
      // Test cho "Mã số thuế"
      { label: 'Mã số thuế', x: 200, y: 561.68, testText: '1234567890' },
      { label: 'Mã số thuế', x: 200, y: 551.68, testText: '1234567890 -10' },
      { label: 'Mã số thuế', x: 200, y: 571.68, testText: '1234567890 +10' },
      
      // Test cho "Đại diện"
      { label: 'Đại diện', x: 200, y: 621.68, testText: 'NGUYEN VAN TEST' },
      { label: 'Đại diện', x: 200, y: 611.68, testText: 'NGUYEN VAN -10' },
      { label: 'Đại diện', x: 200, y: 631.68, testText: 'NGUYEN VAN +10' },
    ];

    // Tạo một PDF với tất cả test positions
    const testPdf = await PDFDocument.load(templateBytes);
    const testPage = testPdf.getPages()[0];
    const testFont = await loadVietnameseFont(testPdf);

    console.log('📍 Drawing test markers...');
    testPositions.forEach((pos, index) => {
      // Chỉ vẽ một số vị trí để không quá đông
      if (index % 2 === 0) {
        try {
          testPage.drawText(pos.testText, {
            x: pos.x,
            y: pos.y,
            size: fontSize,
            font: testFont,
            color: rgb(1, 0, 0),
            opacity: 0.7
          });
          
          // Vẽ số thứ tự
          testPage.drawText(`${index}`, {
            x: pos.x - 10,
            y: pos.y,
            size: 6,
            font: testFont,
            color: rgb(0, 0, 1)
          });
        } catch (e) {
          // Skip nếu lỗi
        }
      }
    });

    const testFileName = `test-positions-${Date.now()}.pdf`;
    const testPath = path.join(uploadsDir, testFileName);
    const testBytes = await testPdf.save();
    await fs.writeFile(testPath, testBytes);

    console.log(`✅ Test PDF created: ${testFileName}`);
    console.log('');

    // Tạo bảng tọa độ
    console.log('📋 Bảng tọa độ hiện tại (cần kiểm chứng):');
    console.log('');
    console.log('| Trường | X | Y (Bottom-up) | Y (Top-down) | Status |');
    console.log('|--------|---|---------------|--------------|--------|');
    
    const currentPositions = [
      { label: 'Tên Công ty', x: 200, y: 481.68 },
      { label: 'Email Công ty', x: 200, y: 501.68 },
      { label: 'Địa chỉ', x: 200, y: 521.68 },
      { label: 'Điện thoại', x: 200, y: 541.68 },
      { label: 'Mã số thuế', x: 200, y: 561.68 },
      { label: 'Đại diện', x: 200, y: 621.68 }
    ];
    
    currentPositions.forEach(pos => {
      const yTop = (height - pos.y).toFixed(2);
      console.log(`| ${pos.label} | ${pos.x} | ${pos.y.toFixed(2)} | ${yTop} | Cần kiểm chứng |`);
    });
    
    console.log('');
    console.log('💡 Hướng dẫn xác định tọa độ chính xác:');
    console.log('   1. Mở file template-with-grid-*.pdf (đã tạo trước đó)');
    console.log('   2. Tìm vị trí của các label trong template:');
    console.log('      - "Tên Công ty:"');
    console.log('      - "Email Công ty:"');
    console.log('      - "Địa chỉ:"');
    console.log('      - "Điện thoại:"');
    console.log('      - "Mã số thuế:"');
    console.log('      - "Đại diện:"');
    console.log('   3. Đọc tọa độ từ grid (số đỏ) tại vị trí bắt đầu của text field');
    console.log('   4. Ghi lại tọa độ (X, Y) - Y từ dưới lên');
    console.log('   5. Cập nhật tọa độ vào contractService.js');
    console.log('');
    console.log('📄 Files created:');
    console.log(`   - template-with-grid-*.pdf (grid overlay trên template)`);
    console.log(`   - test-positions-*.pdf (test text tại các vị trí)`);
    console.log(`   - coordinate-grid-*.pdf (grid thuần)`);
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    console.log('');
    console.log('🌐 URLs:');
    console.log(`   Template + Grid: ${backendUrl}/uploads/contracts/template-with-grid-*.pdf`);
    console.log(`   Test Positions: ${backendUrl}/uploads/contracts/${testFileName}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Import rgb
const { rgb } = require('pdf-lib');

extractPdfTextCoordinates().catch(console.error);

