/**
 * Script test các tọa độ khác nhau cho text overlay
 * Chạy: node test-coordinates.js
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Test data (using ASCII-safe characters for testing)
const testData = {
  companyName: 'CONG TY TNHH TEST DEBUG',
  companyEmail: 'test@example.com',
  companyAddress: '123 Duong Test, Phuong Test, Quan Test, TP. Test',
  companyPhone: '0123456789',
  companyTaxCode: '1234567890',
  contactName: 'Nguyen Van Test',
  contactPosition: 'Giam doc'
};

// Các bộ tọa độ để test
const testCoordinates = [
  {
    name: 'Option 1: Vị trí cao (gần đầu trang)',
    baseY: 700, // height - 141.68
    textX: 120,
    lineHeight: 18,
    fontSize: 11
  },
  {
    name: 'Option 2: Vị trí giữa-cao',
    baseY: 650, // height - 191.68
    textX: 130,
    lineHeight: 18,
    fontSize: 11
  },
  {
    name: 'Option 3: Vị trí giữa (khuyến nghị)',
    baseY: 600, // height - 241.68
    textX: 140,
    lineHeight: 20,
    fontSize: 11
  },
  {
    name: 'Option 4: Vị trí giữa-thấp',
    baseY: 550, // height - 291.68
    textX: 150,
    lineHeight: 20,
    fontSize: 11
  },
  {
    name: 'Option 5: Vị trí thấp',
    baseY: 500, // height - 341.68
    textX: 160,
    lineHeight: 22,
    fontSize: 12
  },
  {
    name: 'Option 6: Dựa trên mô tả hình ảnh (ước tính)',
    baseY: 580, // height - 261.68
    textX: 135,
    lineHeight: 19,
    fontSize: 11
  }
];

async function runCoordinateTests() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    await fs.mkdir(uploadsDir, { recursive: true });

    const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
    
    if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
      throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
    }

    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log('📄 PDF Template Info:');
    console.log(`   - Size: ${width.toFixed(2)} x ${height.toFixed(2)} points`);
    console.log(`   - A4 standard: 595 x 842 points\n`);

    console.log('🧪 Testing multiple coordinate sets...\n');

    const results = [];

    for (let i = 0; i < testCoordinates.length; i++) {
      const coords = testCoordinates[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Test ${i + 1}: ${coords.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`   baseY: ${coords.baseY} (from bottom)`);
      console.log(`   textX: ${coords.textX}`);
      console.log(`   lineHeight: ${coords.lineHeight}`);
      console.log(`   fontSize: ${coords.fontSize}`);

      // Create a new PDF for each test
      const testPdfDoc = await PDFDocument.load(templateBytes);
      const testPages = testPdfDoc.getPages();
      const testFirstPage = testPages[0];
      const font = await testPdfDoc.embedFont('Helvetica');

      let currentY = coords.baseY;

      // Draw coordinate marker
      testFirstPage.drawText(`Y=${currentY}`, {
        x: 10,
        y: currentY,
        size: 8,
        font: font
      });

      // Draw all fields
      const fields = [
        { key: 'companyName', label: 'Tên Công ty' },
        { key: 'companyEmail', label: 'Email Công ty' },
        { key: 'companyAddress', label: 'Địa chỉ' },
        { key: 'companyPhone', label: 'Điện thoại' },
        { key: 'companyTaxCode', label: 'Mã số thuế' },
        { key: 'contactName', label: 'Đại diện' },
        { key: 'contactPosition', label: 'Chức vụ' }
      ];

      const drawnFields = [];

      for (const field of fields) {
        const value = testData[field.key];
        if (!value) continue;

        if (field.key === 'companyAddress') {
          // Handle multi-line address
          const maxCharsPerLine = 60;
          const addressLines = [];
          let remaining = value;
          while (remaining.length > 0) {
            if (remaining.length <= maxCharsPerLine) {
              addressLines.push(remaining);
              break;
            }
            let breakPoint = remaining.lastIndexOf(' ', maxCharsPerLine);
            if (breakPoint === -1) breakPoint = maxCharsPerLine;
            addressLines.push(remaining.substring(0, breakPoint));
            remaining = remaining.substring(breakPoint).trim();
          }
          
          addressLines.forEach((line, index) => {
            testFirstPage.drawText(line, {
              x: coords.textX,
              y: currentY - (index * coords.lineHeight),
              size: coords.fontSize,
              font: font,
            });
          });
          drawnFields.push({
            field: field.label,
            y: currentY,
            lines: addressLines.length
          });
          currentY -= (addressLines.length * coords.lineHeight);
        } else {
          testFirstPage.drawText(value, {
            x: coords.textX,
            y: currentY,
            size: coords.fontSize,
            font: font,
          });
          drawnFields.push({
            field: field.label,
            y: currentY,
            lines: 1
          });
          currentY -= coords.lineHeight;
        }
      }

      // Save test PDF
      const fileName = `test-coords-${i + 1}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await testPdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);

      const relativePath = `/uploads/contracts/${fileName}`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const fullUrl = `${backendUrl}${relativePath}`;

      results.push({
        ...coords,
        pdfUrl: fullUrl,
        fileName: fileName,
        fields: drawnFields,
        finalY: currentY
      });

      console.log(`   ✅ Saved: ${fileName}`);
      console.log(`   📄 URL: ${fullUrl}`);
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY - Recommended Coordinates');
    console.log(`${'='.repeat(60)}\n`);

    // Recommend based on typical Vietnamese contract layout
    // Section II usually starts around 1/3 to 1/2 down the page
    const recommendedY = height - 240; // Approximately 1/3 down from top
    const recommendedX = 135; // After typical label width

    console.log('🎯 RECOMMENDED COORDINATES (based on analysis):');
    console.log(`   baseY: ${recommendedY.toFixed(0)} (height - ${(height - recommendedY).toFixed(0)})`);
    console.log(`   textX: ${recommendedX}`);
    console.log(`   lineHeight: 19`);
    console.log(`   fontSize: 11`);
    console.log(`\n   Reasoning:`);
    console.log(`   - Section II (BÊN SỬ DỤNG) typically starts at ~1/3 down the page`);
    console.log(`   - Labels like "Tên Công ty:" are usually ~100-120px wide`);
    console.log(`   - Text should start after labels, around 130-140px`);
    console.log(`   - Line spacing of 19-20px works well for 11pt font`);

    console.log(`\n📋 All test PDFs created:`);
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name}`);
      console.log(`      PDF: ${result.pdfUrl}`);
    });

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Open each PDF to see which coordinates work best`);
    console.log(`   2. Check which one aligns with the actual form fields in your template`);
    console.log(`   3. Update contractService.js with the best coordinates`);
    console.log(`   4. Test with real data using the debug endpoint`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runCoordinateTests();

