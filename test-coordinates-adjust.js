/**
 * Script test và điều chỉnh tọa độ text overlay
 * Tạo PDF với nhiều tọa độ khác nhau để tìm vị trí chính xác
 * Chạy: node test-coordinates-adjust.js
 */

const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');

// Test data với tiếng Việt
const testData = {
  companyName: 'Công Ty TNHH Lam Danh Mai ABC',
  companyEmail: 'lamakakigarc@gmail.com',
  companyAddress: 'Số 30 Lê Thánh Tông',
  companyPhone: '0779418439',
  companyTaxCode: '1234567890',
  contactName: 'Nguyễn Thành Vũ'
};

// Các bộ tọa độ để test (dựa trên tọa độ hiện tại)
const testCoordinates = [
  {
    name: 'Current (110, 505)',
    companyName: { x: 110, y: 505 },
    companyEmail: { x: 140, y: 485 },
    companyAddress: { x: 110, y: 465 },
    companyPhone: { x: 140, y: 445 },
    companyTaxCode: { x: 140, y: 425 },
    contactName: { x: 110, y: 405 }
  },
  {
    name: 'Adjust X +20 (130, 505)',
    companyName: { x: 130, y: 505 },
    companyEmail: { x: 160, y: 485 },
    companyAddress: { x: 130, y: 465 },
    companyPhone: { x: 160, y: 445 },
    companyTaxCode: { x: 160, y: 425 },
    contactName: { x: 130, y: 405 }
  },
  {
    name: 'Adjust X -20 (90, 505)',
    companyName: { x: 90, y: 505 },
    companyEmail: { x: 120, y: 485 },
    companyAddress: { x: 90, y: 465 },
    companyPhone: { x: 120, y: 445 },
    companyTaxCode: { x: 120, y: 425 },
    contactName: { x: 90, y: 405 }
  },
  {
    name: 'Adjust Y +30 (110, 535)',
    companyName: { x: 110, y: 535 },
    companyEmail: { x: 140, y: 515 },
    companyAddress: { x: 110, y: 495 },
    companyPhone: { x: 140, y: 475 },
    companyTaxCode: { x: 140, y: 455 },
    contactName: { x: 110, y: 435 }
  },
  {
    name: 'Adjust Y -30 (110, 475)',
    companyName: { x: 110, y: 475 },
    companyEmail: { x: 140, y: 455 },
    companyAddress: { x: 110, y: 435 },
    companyPhone: { x: 140, y: 415 },
    companyTaxCode: { x: 140, y: 395 },
    contactName: { x: 110, y: 375 }
  },
  {
    name: 'Both X+20 Y+30 (130, 535)',
    companyName: { x: 130, y: 535 },
    companyEmail: { x: 160, y: 515 },
    companyAddress: { x: 130, y: 495 },
    companyPhone: { x: 160, y: 475 },
    companyTaxCode: { x: 160, y: 455 },
    contactName: { x: 130, y: 435 }
  },
  {
    name: 'Both X+20 Y-30 (130, 475)',
    companyName: { x: 130, y: 475 },
    companyEmail: { x: 160, y: 455 },
    companyAddress: { x: 130, y: 435 },
    companyPhone: { x: 160, y: 415 },
    companyTaxCode: { x: 160, y: 395 },
    contactName: { x: 130, y: 375 }
  },
  {
    name: 'Fine-tune X+10 Y+15 (120, 520)',
    companyName: { x: 120, y: 520 },
    companyEmail: { x: 150, y: 500 },
    companyAddress: { x: 120, y: 480 },
    companyPhone: { x: 150, y: 460 },
    companyTaxCode: { x: 150, y: 440 },
    contactName: { x: 120, y: 420 }
  }
];

async function loadVietnameseFont(pdfDoc) {
  try {
    pdfDoc.registerFontkit(fontkit);
    
    // Try to load custom font
    const fontsDir = path.join(__dirname, 'fonts');
    const possibleFonts = [
      'NotoSans-Regular.ttf',
      'NotoSans-Vietnamese.ttf',
      'Arial.ttf',
      'TimesNewRoman.ttf'
    ];
    
    for (const fontFile of possibleFonts) {
      const fontPath = path.join(fontsDir, fontFile);
      try {
        if (await fs.access(fontPath).then(() => true).catch(() => false)) {
          const fontBytes = await fs.readFile(fontPath);
          const font = await pdfDoc.embedFont(fontBytes);
          console.log(`✅ Loaded font: ${fontFile}`);
          return font;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Try Windows fonts
    const windowsFontsDir = 'C:\\Windows\\Fonts';
    const windowsFonts = ['arial.ttf', 'times.ttf'];
    
    for (const fontFile of windowsFonts) {
      const fontPath = path.join(windowsFontsDir, fontFile);
      try {
        if (await fs.access(fontPath).then(() => true).catch(() => false)) {
          const fontBytes = await fs.readFile(fontPath);
          const font = await pdfDoc.embedFont(fontBytes);
          console.log(`✅ Loaded Windows font: ${fontFile}`);
          return font;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Fallback
    console.warn('⚠️ Using Times-Roman (may not support Vietnamese)');
    return await pdfDoc.embedFont('Times-Roman');
  } catch (error) {
    console.error('❌ Error loading font:', error.message);
    return await pdfDoc.embedFont('Times-Roman');
  }
}

async function runCoordinateAdjustmentTests() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    await fs.mkdir(uploadsDir, { recursive: true });

    const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
    
    if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
      throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
    }

    console.log('📄 Loading template PDF...');
    const templateBytes = await fs.readFile(templatePath);
    
    for (let i = 0; i < testCoordinates.length; i++) {
      const coords = testCoordinates[i];
      console.log(`\n📝 Testing coordinates set ${i + 1}/${testCoordinates.length}: ${coords.name}`);
      
      const pdfDoc = await PDFDocument.load(templateBytes);
      const font = await loadVietnameseFont(pdfDoc);
      const fontSize = 11;
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Draw label for this test
      firstPage.drawText(`TEST: ${coords.name}`, {
        x: 50,
        y: 800,
        size: 12,
        font: font,
      });
      
      // Draw all fields
      try {
        firstPage.drawText(testData.companyName, {
          x: coords.companyName.x,
          y: coords.companyName.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ companyName at (${coords.companyName.x}, ${coords.companyName.y})`);
      } catch (e) {
        console.error(`   ❌ companyName failed: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyEmail, {
          x: coords.companyEmail.x,
          y: coords.companyEmail.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ companyEmail at (${coords.companyEmail.x}, ${coords.companyEmail.y})`);
      } catch (e) {
        console.error(`   ❌ companyEmail failed: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyAddress, {
          x: coords.companyAddress.x,
          y: coords.companyAddress.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ companyAddress at (${coords.companyAddress.x}, ${coords.companyAddress.y})`);
      } catch (e) {
        console.error(`   ❌ companyAddress failed: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyPhone, {
          x: coords.companyPhone.x,
          y: coords.companyPhone.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ companyPhone at (${coords.companyPhone.x}, ${coords.companyPhone.y})`);
      } catch (e) {
        console.error(`   ❌ companyPhone failed: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyTaxCode, {
          x: coords.companyTaxCode.x,
          y: coords.companyTaxCode.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ companyTaxCode at (${coords.companyTaxCode.x}, ${coords.companyTaxCode.y})`);
      } catch (e) {
        console.error(`   ❌ companyTaxCode failed: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.contactName, {
          x: coords.contactName.x,
          y: coords.contactName.y,
          size: fontSize,
          font: font,
        });
        console.log(`   ✅ contactName at (${coords.contactName.x}, ${coords.contactName.y})`);
      } catch (e) {
        console.error(`   ❌ contactName failed: ${e.message}`);
      }
      
      // Save file
      const fileName = `test-coords-${i + 1}-${coords.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);
      
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const fullUrl = `${backendUrl}/uploads/contracts/${fileName}`;
      
      console.log(`   📄 Saved: ${fileName}`);
      console.log(`   🌐 URL: ${fullUrl}`);
    }
    
    console.log('\n✅ All test PDFs created!');
    console.log('💡 Mở các file PDF và so sánh để tìm tọa độ chính xác nhất');
    console.log('📋 Sau đó cập nhật tọa độ vào contractService.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

runCoordinateAdjustmentTests().catch(console.error);

