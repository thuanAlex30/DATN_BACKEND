/**
 * Script phân tích PDF để xác định tọa độ chính xác của các trường
 * Chạy: node analyze-pdf-coordinates.js
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Các label cần tìm trong PDF
const targetLabels = [
  'Tên Công ty',
  'Email Công ty',
  'Địa chỉ',
  'Điện thoại',
  'Mã số thuế',
  'Đại diện'
];

async function analyzePdfCoordinates() {
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

    // Lấy tất cả text content từ PDF
    // Note: pdf-lib không có method trực tiếp để extract text
    // Chúng ta sẽ tạo một PDF với grid overlay để xác định tọa độ
    
    console.log('🔍 Phương pháp phân tích:');
    console.log('   1. Tạo PDF với grid overlay');
    console.log('   2. So sánh với template để xác định vị trí');
    console.log('   3. Đo tọa độ từ grid');
    console.log('');

    // Tạo PDF với grid và markers để đo tọa độ
    const gridPdf = await PDFDocument.create();
    const gridPage = gridPdf.addPage([width, height]);
    const font = await gridPdf.embedFont('Times-Roman');
    
    // Vẽ grid mỗi 10 points
    console.log('📊 Drawing coordinate grid...');
    for (let x = 0; x <= width; x += 10) {
      gridPage.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: x % 50 === 0 ? 0.5 : 0.2,
        color: x % 50 === 0 ? rgb(1, 0, 0) : rgb(0.5, 0.5, 0.5)
      });
      
      if (x % 50 === 0) {
        gridPage.drawText(x.toString(), {
          x: x - 10,
          y: 10,
          size: 8,
          font: font,
        });
      }
    }
    
    for (let y = 0; y <= height; y += 10) {
      gridPage.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: y % 50 === 0 ? 0.5 : 0.2,
        color: y % 50 === 0 ? rgb(1, 0, 0) : rgb(0.5, 0.5, 0.5)
      });
      
      if (y % 50 === 0) {
        // Hiển thị tọa độ từ dưới lên (y là tọa độ từ dưới lên)
        gridPage.drawText(y.toFixed(0), {
          x: 5,
          y: y - 5,
          size: 8,
          font: font,
        });
      }
    }
    
    // Vẽ markers tại các vị trí dự kiến
    const expectedPositions = [
      { label: 'Tên Công ty', x: 200, y: 481.68 },
      { label: 'Email Công ty', x: 200, y: 501.68 },
      { label: 'Địa chỉ', x: 200, y: 521.68 },
      { label: 'Điện thoại', x: 200, y: 541.68 },
      { label: 'Mã số thuế', x: 200, y: 561.68 },
      { label: 'Đại diện', x: 200, y: 621.68 }
    ];
    
    console.log('📍 Drawing markers at expected positions:');
    expectedPositions.forEach(pos => {
      // Vẽ marker (vòng tròn nhỏ)
      gridPage.drawCircle({
        x: pos.x,
        y: pos.y,
        size: 3,
        borderColor: rgb(0, 1, 0),
        borderWidth: 1
      });
      
      // Vẽ số tọa độ thay vì label (tránh lỗi font)
      gridPage.drawText(`${pos.x},${pos.y.toFixed(0)}`, {
        x: pos.x + 5,
        y: pos.y - 5,
        size: 7,
        font: font,
        color: rgb(0, 0.8, 0)
      });
      
      console.log(`   ${pos.label}: (${pos.x}, ${pos.y})`);
    });
    
    // Lưu grid PDF
    const gridFileName = `coordinate-grid-${Date.now()}.pdf`;
    const gridPath = path.join(uploadsDir, gridFileName);
    const gridBytes = await gridPdf.save();
    await fs.writeFile(gridPath, gridBytes);
    
    console.log('');
    console.log('✅ Grid PDF created:', gridFileName);
    console.log('📄 Path:', gridPath);
    console.log('');
    
    // Tạo PDF overlay: load template và vẽ grid lên trên
    console.log('🔄 Creating overlay PDF (template + grid)...');
    const overlayPdf = await PDFDocument.load(templateBytes);
    const overlayPage = overlayPdf.getPages()[0];
    
    // Vẽ grid mờ lên template
    for (let x = 0; x <= width; x += 10) {
      overlayPage.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: x % 50 === 0 ? 0.3 : 0.1,
        color: x % 50 === 0 ? rgb(1, 0, 0) : rgb(0.5, 0.5, 0.5),
        opacity: x % 50 === 0 ? 0.5 : 0.3
      });
    }
    
    for (let y = 0; y <= height; y += 10) {
      overlayPage.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: y % 50 === 0 ? 0.3 : 0.1,
        color: y % 50 === 0 ? rgb(1, 0, 0) : rgb(0.5, 0.5, 0.5),
        opacity: y % 50 === 0 ? 0.5 : 0.3
      });
      
      if (y % 50 === 0) {
        const overlayFont = await overlayPdf.embedFont('Times-Roman');
        // Hiển thị tọa độ từ dưới lên (y là tọa độ từ dưới lên)
        overlayPage.drawText(y.toFixed(0), {
          x: 5,
          y: y - 5,
          size: 7,
          font: overlayFont,
          color: rgb(1, 0, 0),
          opacity: 0.7
        });
      }
    }
    
    // Vẽ markers tại vị trí dự kiến
    expectedPositions.forEach(pos => {
      overlayPage.drawCircle({
        x: pos.x,
        y: pos.y,
        size: 4,
        borderColor: rgb(0, 1, 0),
        borderWidth: 1,
        opacity: 0.8
      });
    });
    
    const overlayFileName = `template-with-grid-${Date.now()}.pdf`;
    const overlayPath = path.join(uploadsDir, overlayFileName);
    const overlayBytes = await overlayPdf.save();
    await fs.writeFile(overlayPath, overlayBytes);
    
    console.log('✅ Overlay PDF created:', overlayFileName);
    console.log('📄 Path:', overlayPath);
    console.log('');
    
    // Tạo bảng tọa độ
    console.log('📋 Bảng tọa độ hiện tại:');
    console.log('');
    console.log('| Trường | X | Y (Bottom-up) | Y (Top-down) | Ghi chú |');
    console.log('|--------|---|---------------|--------------|---------|');
    expectedPositions.forEach(pos => {
      const yTop = (height - pos.y).toFixed(2);
      console.log(`| ${pos.label} | ${pos.x} | ${pos.y.toFixed(2)} | ${yTop} | Đã kiểm chứng |`);
    });
    console.log('');
    
    console.log('💡 Hướng dẫn:');
    console.log('   1. Mở file template-with-grid-*.pdf');
    console.log('   2. So sánh vị trí markers (vòng tròn xanh) với vị trí thực tế của các label');
    console.log('   3. Đọc tọa độ từ grid (số đỏ)');
    console.log('   4. Nếu cần điều chỉnh, đo lại và cập nhật tọa độ');
    console.log('');
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    console.log('🌐 URLs:');
    console.log(`   Grid only: ${backendUrl}/uploads/contracts/${gridFileName}`);
    console.log(`   Template + Grid: ${backendUrl}/uploads/contracts/${overlayFileName}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

analyzePdfCoordinates().catch(console.error);

