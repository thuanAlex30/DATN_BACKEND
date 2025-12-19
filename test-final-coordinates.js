/**
 * Script test tọa độ cuối cùng với nhiều biến thể để tìm vị trí chính xác
 * Chạy: node test-final-coordinates.js
 */

const { PDFDocument, rgb } = require('pdf-lib');
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

async function testFinalCoordinates() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
    
    if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
      throw new Error('Template PDF không tồn tại');
    }

    console.log('📄 Loading template PDF...');
    const templateBytes = await fs.readFile(templatePath);
    
    // Test data
    const testData = {
      companyName: 'Công Ty TNHH Lam Danh Mai ABC',
      companyEmail: 'lamakakigarc@gmail.com',
      companyAddress: 'Số 30 Lê Thánh Tông',
      companyPhone: '0779418439',
      companyTaxCode: '1234567890',
      contactName: 'Nguyễn Thành Vũ'
    };

    // Các bộ tọa độ để test (dựa trên tọa độ hiện tại ± offset)
    const testSets = [
      {
        name: 'Current (370, 358, 340, 328, 310, 299)',
        coords: {
          companyName: { x: 200, y: 471.68 }, // 370 top
          companyEmail: { x: 200, y: 483.68 }, // 358 top
          companyAddress: { x: 200, y: 501.68 }, // 340 top
          companyPhone: { x: 200, y: 513.68 }, // 328 top
          companyTaxCode: { x: 200, y: 531.68 }, // 310 top
          contactName: { x: 200, y: 542.68 } // 299 top
        }
      },
      {
        name: 'X-10 Y-50 (320, 308, 290, 278, 260, 249)',
        coords: {
          companyName: { x: 190, y: 521.68 }, // 320 top (370 - 50)
          companyEmail: { x: 190, y: 533.68 }, // 308 top (358 - 50)
          companyAddress: { x: 190, y: 551.68 }, // 290 top (340 - 50)
          companyPhone: { x: 190, y: 563.68 }, // 278 top (328 - 50)
          companyTaxCode: { x: 190, y: 581.68 }, // 260 top (310 - 50)
          contactName: { x: 190, y: 592.68 } // 249 top (299 - 50)
        }
      },
      {
        name: 'Adjust Y -5 (365, 353, 335, 323, 305, 294)',
        coords: {
          companyName: { x: 200, y: 476.68 }, // 365 top
          companyEmail: { x: 200, y: 488.68 }, // 353 top
          companyAddress: { x: 200, y: 506.68 }, // 335 top
          companyPhone: { x: 200, y: 518.68 }, // 323 top
          companyTaxCode: { x: 200, y: 536.68 }, // 305 top
          contactName: { x: 200, y: 547.68 } // 294 top
        }
      },
      {
        name: 'Adjust Y +5 (375, 363, 345, 333, 315, 304)',
        coords: {
          companyName: { x: 200, y: 466.68 }, // 375 top
          companyEmail: { x: 200, y: 478.68 }, // 363 top
          companyAddress: { x: 200, y: 496.68 }, // 345 top
          companyPhone: { x: 200, y: 508.68 }, // 333 top
          companyTaxCode: { x: 200, y: 526.68 }, // 315 top
          contactName: { x: 200, y: 537.68 } // 304 top
        }
      },
      {
        name: 'Adjust Y -10 (360, 348, 330, 318, 300, 289)',
        coords: {
          companyName: { x: 200, y: 481.68 }, // 360 top
          companyEmail: { x: 200, y: 493.68 }, // 348 top
          companyAddress: { x: 200, y: 511.68 }, // 330 top
          companyPhone: { x: 200, y: 523.68 }, // 318 top
          companyTaxCode: { x: 200, y: 541.68 }, // 300 top
          contactName: { x: 200, y: 552.68 } // 289 top
        }
      },
      {
        name: 'Adjust Y +10 (380, 368, 350, 338, 320, 309)',
        coords: {
          companyName: { x: 200, y: 461.68 }, // 380 top
          companyEmail: { x: 200, y: 473.68 }, // 368 top
          companyAddress: { x: 200, y: 491.68 }, // 350 top
          companyPhone: { x: 200, y: 503.68 }, // 338 top
          companyTaxCode: { x: 200, y: 521.68 }, // 320 top
          contactName: { x: 200, y: 532.68 } // 309 top
        }
      },
      {
        name: 'Adjust X -10, Y -5 (190, 365, 353, 335, 323, 305, 294)',
        coords: {
          companyName: { x: 190, y: 476.68 },
          companyEmail: { x: 190, y: 488.68 },
          companyAddress: { x: 190, y: 506.68 },
          companyPhone: { x: 190, y: 518.68 },
          companyTaxCode: { x: 190, y: 536.68 },
          contactName: { x: 190, y: 547.68 }
        }
      },
      {
        name: 'Adjust X +10, Y -5 (210, 365, 353, 335, 323, 305, 294)',
        coords: {
          companyName: { x: 210, y: 476.68 },
          companyEmail: { x: 210, y: 488.68 },
          companyAddress: { x: 210, y: 506.68 },
          companyPhone: { x: 210, y: 518.68 },
          companyTaxCode: { x: 210, y: 536.68 },
          contactName: { x: 210, y: 547.68 }
        }
      }
    ];

    console.log(`📝 Creating ${testSets.length} test PDFs...\n`);

    for (let i = 0; i < testSets.length; i++) {
      const testSet = testSets[i];
      console.log(`📄 Test ${i + 1}/${testSets.length}: ${testSet.name}`);

      const pdfDoc = await PDFDocument.load(templateBytes);
      const font = await loadVietnameseFont(pdfDoc);
      const fontSize = 11;
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Draw label
      firstPage.drawText(`TEST ${i + 1}: ${testSet.name}`, {
        x: 50,
        y: 800,
        size: 10,
        font: font,
        color: rgb(1, 0, 0)
      });
      
      // Draw all fields
      try {
        firstPage.drawText(testData.companyName, {
          x: testSet.coords.companyName.x,
          y: testSet.coords.companyName.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ companyName: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyEmail, {
          x: testSet.coords.companyEmail.x,
          y: testSet.coords.companyEmail.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ companyEmail: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyAddress, {
          x: testSet.coords.companyAddress.x,
          y: testSet.coords.companyAddress.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ companyAddress: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyPhone, {
          x: testSet.coords.companyPhone.x,
          y: testSet.coords.companyPhone.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ companyPhone: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.companyTaxCode, {
          x: testSet.coords.companyTaxCode.x,
          y: testSet.coords.companyTaxCode.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ companyTaxCode: ${e.message}`);
      }
      
      try {
        firstPage.drawText(testData.contactName, {
          x: testSet.coords.contactName.x,
          y: testSet.coords.contactName.y,
          size: fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } catch (e) {
        console.error(`   ❌ contactName: ${e.message}`);
      }
      
      // Save file
      const fileName = `test-final-${i + 1}-${testSet.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);
      
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      console.log(`   ✅ Saved: ${fileName}`);
      console.log(`   🌐 ${backendUrl}/uploads/contracts/${fileName}\n`);
    }
    
    console.log('✅ All test PDFs created!');
    console.log('');
    console.log('💡 Hướng dẫn:');
    console.log('   1. Mở từng file PDF test');
    console.log('   2. So sánh vị trí text (màu đỏ) với vị trí thực tế trong template');
    console.log('   3. Chọn file có vị trí text khớp nhất');
    console.log('   4. Cho tôi biết số thứ tự file (1-7) hoặc tọa độ chính xác');
    console.log('   5. Tôi sẽ cập nhật tọa độ vào code');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testFinalCoordinates().catch(console.error);

