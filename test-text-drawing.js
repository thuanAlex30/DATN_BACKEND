/**
 * Script test vẽ text lên PDF để debug
 * Chạy: node test-text-drawing.js
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function testTextDrawing() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    await fs.mkdir(uploadsDir, { recursive: true });

    const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
    
    if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
      throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
    }

    console.log('📄 Loading template PDF...');
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log(`   Page size: ${width.toFixed(2)} x ${height.toFixed(2)} points\n`);

    // Test với Times-Roman (standard font trong pdf-lib)
    const font = await pdfDoc.embedFont('Times-Roman');
    const fontSize = 11;

    console.log('📝 Testing text drawing...\n');

    // Test 1: ASCII text
    try {
      firstPage.drawText('TEST ASCII TEXT', {
        x: 50,
        y: 800,
        size: 12,
        font: font,
      });
      console.log('✅ Test 1: ASCII text drawn at (50, 800)');
    } catch (e) {
      console.error('❌ Test 1 failed:', e.message);
    }

    // Test 2: Text tại tọa độ chính xác
    try {
      firstPage.drawText('TEST 110,505', {
        x: 110,
        y: 505,
        size: 10,
        font: font,
      });
      console.log('✅ Test 2: Text drawn at (110, 505)');
    } catch (e) {
      console.error('❌ Test 2 failed:', e.message);
    }

    // Test 3: Text tiếng Việt (không dấu)
    try {
      firstPage.drawText('CONG TY TNHH TEST', {
        x: 110,
        y: 505,
        size: fontSize,
        font: font,
      });
      console.log('✅ Test 3: Vietnamese text (no accent) drawn at (110, 505)');
    } catch (e) {
      console.error('❌ Test 3 failed:', e.message);
    }

    // Test 4: Text tiếng Việt (có dấu) - có thể fail
    try {
      firstPage.drawText('CÔNG TY TNHH TEST', {
        x: 110,
        y: 485,
        size: fontSize,
        font: font,
      });
      console.log('✅ Test 4: Vietnamese text (with accent) drawn at (110, 485)');
    } catch (e) {
      console.error('❌ Test 4 failed (expected if font doesn\'t support Vietnamese):', e.message);
    }

    // Test 5: Vẽ số tọa độ
    try {
      firstPage.drawText('505', { x: 90, y: 505, size: 8, font: font });
      firstPage.drawText('485', { x: 90, y: 485, size: 8, font: font });
      firstPage.drawText('465', { x: 90, y: 465, size: 8, font: font });
      firstPage.drawText('445', { x: 90, y: 445, size: 8, font: font });
      firstPage.drawText('425', { x: 90, y: 425, size: 8, font: font });
      firstPage.drawText('405', { x: 90, y: 405, size: 8, font: font });
      console.log('✅ Test 5: Coordinate numbers drawn');
    } catch (e) {
      console.error('❌ Test 5 failed:', e.message);
    }

    // Test 6: Vẽ tất cả các trường với dữ liệu test
    const testData = {
      companyName: 'CONG TY TNHH TEST',
      companyEmail: 'test@example.com',
      companyAddress: '123 Test Street',
      companyPhone: '0123456789',
      companyTaxCode: '1234567890',
      contactName: 'NGUYEN VAN TEST'
    };

    console.log('\n📋 Drawing test data at exact coordinates:');
    
    try {
      firstPage.drawText(testData.companyName, { x: 110, y: 505, size: fontSize, font: font });
      console.log(`   ✅ companyName at (110, 505)`);
    } catch (e) {
      console.error(`   ❌ companyName failed:`, e.message);
    }

    try {
      firstPage.drawText(testData.companyEmail, { x: 140, y: 485, size: fontSize, font: font });
      console.log(`   ✅ companyEmail at (140, 485)`);
    } catch (e) {
      console.error(`   ❌ companyEmail failed:`, e.message);
    }

    try {
      firstPage.drawText(testData.companyAddress, { x: 110, y: 465, size: fontSize, font: font });
      console.log(`   ✅ companyAddress at (110, 465)`);
    } catch (e) {
      console.error(`   ❌ companyAddress failed:`, e.message);
    }

    try {
      firstPage.drawText(testData.companyPhone, { x: 140, y: 445, size: fontSize, font: font });
      console.log(`   ✅ companyPhone at (140, 445)`);
    } catch (e) {
      console.error(`   ❌ companyPhone failed:`, e.message);
    }

    try {
      firstPage.drawText(testData.companyTaxCode, { x: 140, y: 425, size: fontSize, font: font });
      console.log(`   ✅ companyTaxCode at (140, 425)`);
    } catch (e) {
      console.error(`   ❌ companyTaxCode failed:`, e.message);
    }

    try {
      firstPage.drawText(testData.contactName, { x: 110, y: 405, size: fontSize, font: font });
      console.log(`   ✅ contactName at (110, 405)`);
    } catch (e) {
      console.error(`   ❌ contactName failed:`, e.message);
    }

    // Save file
    const fileName = `test-text-drawing-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);

    const relativePath = `/uploads/contracts/${fileName}`;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fullUrl = `${backendUrl}${relativePath}`;

    console.log('\n✅ Test PDF created!');
    console.log(`📄 File: ${fileName}`);
    console.log(`🌐 URL: ${fullUrl}`);
    console.log('\n💡 Open this PDF to see if text is visible');
    console.log('   - If ASCII text is visible but Vietnamese is not → Font encoding issue');
    console.log('   - If no text is visible → Coordinate or drawing issue');
    console.log('   - If coordinate numbers are visible → Coordinates work, check data');

    // Auto open
    const { exec } = require('child_process');
    const os = require('os');
    const platform = os.platform();
    
    if (platform === 'win32') {
      exec(`start "" "${filePath}"`);
    } else if (platform === 'darwin') {
      exec(`open "${filePath}"`);
    } else {
      exec(`xdg-open "${filePath}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testTextDrawing().catch(console.error);

