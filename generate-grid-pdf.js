/**
 * Script tạo PDF grid để làm reference cho việc xác định tọa độ
 * Chạy: node generate-grid-pdf.js
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function generateGridPdf() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads/contracts');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Tạo PDF mới với kích thước A4
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.44, 841.68]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont('Helvetica');
    const fontSize = 8;

    console.log('📐 Creating grid PDF...');
    console.log(`   Page size: ${width} x ${height} points`);
    console.log(`   Grid spacing: 20 points\n`);

    // Vẽ các đường grid dọc (vertical lines) mỗi 20px
    for (let x = 0; x <= width; x += 20) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: x % 100 === 0 ? 0.5 : 0.3, // Đường chính mỗi 100px dày hơn
        color: x % 100 === 0 ? rgb(0, 0, 0) : rgb(0.7, 0.7, 0.7)
      });
    }

    // Vẽ các đường grid ngang (horizontal lines) mỗi 20px
    for (let y = 0; y <= height; y += 20) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: y % 100 === 0 ? 0.5 : 0.3, // Đường chính mỗi 100px dày hơn
        color: y % 100 === 0 ? rgb(0, 0, 0) : rgb(0.7, 0.7, 0.7)
      });
    }

    // In số tọa độ X ở dưới cùng (bottom) - mỗi 20px
    for (let x = 0; x <= width; x += 20) {
      const label = x.toString();
      // Tính toán vị trí để center text
      const textWidth = label.length * fontSize * 0.6; // Approximate text width
      page.drawText(label, {
        x: x - (textWidth / 2),
        y: 3,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 1) // Blue color for X coordinates
      });
    }

    // In số tọa độ Y ở bên trái (left side) - mỗi 20px
    for (let y = 0; y <= height; y += 20) {
      const label = y.toString();
      page.drawText(label, {
        x: 3,
        y: y - (fontSize / 2), // Center align vertically
        size: fontSize,
        font: font,
        color: rgb(1, 0, 0) // Red color for Y coordinates
      });
    }

    // In số tọa độ (x,y) ở góc trên bên trái của mỗi ô chính (mỗi 100px)
    for (let x = 0; x <= width; x += 100) {
      for (let y = 0; y <= height; y += 100) {
        const label = `(${x},${y})`;
        page.drawText(label, {
          x: x + 5,
          y: height - y - 15, // Top-left of cell (Y is from bottom, so invert)
          size: fontSize,
          font: font,
          color: rgb(0, 0.5, 0) // Green color for coordinates
        });
      }
    }

    // In số tọa độ cho mỗi ô 20x20 ở góc dưới bên phải (chỉ cho các ô chính)
    // Để dễ xác định tọa độ chính xác hơn
    for (let x = 0; x <= width; x += 20) {
      for (let y = 0; y <= height; y += 20) {
        // Chỉ in cho các ô ở cạnh hoặc mỗi 100px để tránh quá nhiều text
        if (x % 100 === 0 || y % 100 === 0 || (x % 20 === 0 && y % 20 === 0 && x <= 100 && y <= 100)) {
          const label = `${x},${y}`;
          page.drawText(label, {
            x: x + 2,
            y: height - y - 2, // Bottom-right of cell
            size: fontSize - 2,
            font: font,
            color: rgb(0.5, 0.5, 0.5) // Gray color for cell coordinates
          });
        }
      }
    }

    // Thêm thông tin ở góc dưới bên trái
    const infoText = [
      `Grid Reference PDF`,
      `Page size: ${width.toFixed(2)} x ${height.toFixed(2)} points`,
      `Grid spacing: 20 points`,
      `Blue numbers (bottom): X coordinates`,
      `Red numbers (left): Y coordinates`,
      `Green text: Main cell coordinates (x,y) every 100px`,
      `Gray text: Detailed coordinates at edges`
    ];

    let infoY = height - 20;
    infoText.forEach((text, index) => {
      page.drawText(text, {
        x: 10,
        y: infoY - (index * 12),
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    });

    // Lưu file
    const fileName = `grid-reference-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);

    const relativePath = `/uploads/contracts/${fileName}`;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fullUrl = `${backendUrl}${relativePath}`;

    console.log('✅ Grid PDF created successfully!');
    console.log(`📄 File: ${fileName}`);
    console.log(`📁 Path: ${filePath}`);
    console.log(`🌐 URL: ${fullUrl}`);
    console.log('\n💡 Usage:');
    console.log('   1. Open this grid PDF');
    console.log('   2. Open your template PDF in another window');
    console.log('   3. Overlay template on grid to see exact coordinates');
    console.log('   4. Note the (x, y) coordinates where fields should be');
    console.log('   5. Update contractService.js with those coordinates');
    console.log('\n📖 See HOW_TO_USE_GRID.md for detailed instructions');

    // Tự động mở PDF (optional)
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
    console.error('❌ Error creating grid PDF:', error);
    throw error;
  }
}

// Run
generateGridPdf().catch(console.error);

