/**
 * Script overlay grid lên template PDF để xác định tọa độ
 * Chạy: node overlay-grid-on-template.js
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function overlayGridOnTemplate() {
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

    console.log(`   Page size: ${width.toFixed(2)} x ${height.toFixed(2)} points`);
    console.log(`   Total pages: ${pages.length}\n`);

    const font = await pdfDoc.embedFont('Helvetica');
    const fontSize = 8;
    const gridSpacing = 20;

    console.log('📐 Drawing grid overlay...');
    console.log(`   Grid spacing: ${gridSpacing} points\n`);

    // Vẽ grid cho tất cả các trang
    pages.forEach((page, pageIndex) => {
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      console.log(`   Processing page ${pageIndex + 1}/${pages.length}...`);

      // Vẽ các đường grid dọc (vertical lines) mỗi 20px
      for (let x = 0; x <= pageWidth; x += gridSpacing) {
        page.drawLine({
          start: { x, y: 0 },
          end: { x, y: pageHeight },
          thickness: x % 100 === 0 ? 0.5 : 0.3, // Đường chính mỗi 100px dày hơn
          color: x % 100 === 0 ? rgb(0, 0, 1) : rgb(0.7, 0.7, 0.7), // Đường chính màu xanh
          opacity: 0.5 // Mờ để không che nội dung
        });
      }

      // Vẽ các đường grid ngang (horizontal lines) mỗi 20px
      for (let y = 0; y <= pageHeight; y += gridSpacing) {
        page.drawLine({
          start: { x: 0, y },
          end: { x: pageWidth, y },
          thickness: y % 100 === 0 ? 0.5 : 0.3, // Đường chính mỗi 100px dày hơn
          color: y % 100 === 0 ? rgb(1, 0, 0) : rgb(0.7, 0.7, 0.7), // Đường chính màu đỏ
          opacity: 0.5 // Mờ để không che nội dung
        });
      }

      // In số tọa độ X ở dưới cùng (bottom) - chỉ trang đầu
      if (pageIndex === 0) {
        for (let x = 0; x <= pageWidth; x += gridSpacing) {
          const label = x.toString();
          const textWidth = label.length * fontSize * 0.6;
          page.drawText(label, {
            x: x - (textWidth / 2),
            y: 3,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 1), // Blue
            opacity: 0.8
          });
        }
      }

      // In số tọa độ Y ở bên trái (left side) - chỉ trang đầu
      if (pageIndex === 0) {
        for (let y = 0; y <= pageHeight; y += gridSpacing) {
          const label = y.toString();
          page.drawText(label, {
            x: 3,
            y: y - (fontSize / 2),
            size: fontSize,
            font: font,
            color: rgb(1, 0, 0), // Red
            opacity: 0.8
          });
        }
      }

      // In số tọa độ (x,y) ở góc trên bên trái của mỗi ô chính (mỗi 100px) - chỉ trang đầu
      if (pageIndex === 0) {
        for (let x = 0; x <= pageWidth; x += 100) {
          for (let y = 0; y <= pageHeight; y += 100) {
            const label = `(${x},${y})`;
            page.drawText(label, {
              x: x + 5,
              y: pageHeight - y - 15, // Top-left of cell (Y is from bottom)
              size: fontSize,
              font: font,
              color: rgb(0, 0.5, 0), // Green
              opacity: 0.7
            });
          }
        }
      }

      // In số tọa độ cho mỗi ô 20x20 ở góc dưới bên phải (chỉ cho các ô ở cạnh) - chỉ trang đầu
      if (pageIndex === 0) {
        for (let x = 0; x <= pageWidth; x += gridSpacing) {
          for (let y = 0; y <= pageHeight; y += gridSpacing) {
            // Chỉ in cho các ô ở cạnh hoặc mỗi 100px
            if (x % 100 === 0 || y % 100 === 0 || (x <= 100 && y <= 100)) {
              const label = `${x},${y}`;
              page.drawText(label, {
                x: x + 2,
                y: pageHeight - y - 2, // Bottom-right of cell
                size: fontSize - 2,
                font: font,
                color: rgb(0.5, 0.5, 0.5), // Gray
                opacity: 0.6
              });
            }
          }
        }
      }
    });

    // Thêm thông tin ở góc dưới bên trái trang đầu
    const infoText = [
      `Grid Overlay - Template with Coordinates`,
      `Page size: ${width.toFixed(2)} x ${height.toFixed(2)} points`,
      `Grid spacing: ${gridSpacing} points`,
      `Blue numbers (bottom): X coordinates`,
      `Red numbers (left): Y coordinates`,
      `Green text: Main cell coordinates (x,y) every 100px`
    ];

    let infoY = height - 20;
    infoText.forEach((text, index) => {
      firstPage.drawText(text, {
        x: 10,
        y: infoY - (index * 12),
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
        opacity: 0.9
      });
    });

    // Lưu file
    const fileName = `CHMS_HopDongThanhToan_WITH_GRID_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);

    const relativePath = `/uploads/contracts/${fileName}`;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fullUrl = `${backendUrl}${relativePath}`;

    console.log('✅ Grid overlay completed!');
    console.log(`📄 File: ${fileName}`);
    console.log(`📁 Path: ${filePath}`);
    console.log(`🌐 URL: ${fullUrl}`);
    console.log('\n💡 Usage:');
    console.log('   1. Open this PDF to see template with grid overlay');
    console.log('   2. Find the fields you need to fill');
    console.log('   3. Read the coordinates (x, y) from the grid');
    console.log('   4. Update contractService.js with those coordinates');
    console.log('\n⚠️  Note: Y coordinates are from bottom (0 at bottom, 841.68 at top)');
    console.log('   In code, use: y = height - gridY (if needed)');

    // Tự động mở PDF
    const { exec } = require('child_process');
    const os = require('os');
    const platform = os.platform();
    
    console.log('\n🔓 Attempting to open PDF automatically...');
    try {
      if (platform === 'win32') {
        exec(`start "" "${filePath}"`, (error) => {
          if (error) console.log('   ⚠️  Could not auto-open. Please open manually.');
          else console.log('   ✅ PDF opened in default viewer');
        });
      } else if (platform === 'darwin') {
        exec(`open "${filePath}"`, (error) => {
          if (error) console.log('   ⚠️  Could not auto-open. Please open manually.');
          else console.log('   ✅ PDF opened in Preview');
        });
      } else {
        exec(`xdg-open "${filePath}"`, (error) => {
          if (error) console.log('   ⚠️  Could not auto-open. Please open manually.');
          else console.log('   ✅ PDF opened in default viewer');
        });
      }
    } catch (error) {
      console.log('   ⚠️  Could not auto-open. Please open manually:');
      console.log(`   ${filePath}`);
    }

    return fullUrl;
  } catch (error) {
    console.error('❌ Error overlaying grid on template:', error);
    throw error;
  }
}

// Run
overlayGridOnTemplate().catch(console.error);
