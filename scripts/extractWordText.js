/**
 * Script to extract all text from Word template to see actual structure
 */

const PizZip = require('pizzip');
const fsPromises = require('fs').promises;
const path = require('path');

async function extractWordText() {
  try {
    const templatePath = path.join(__dirname, '../uploads/contracts/CHMS_HopDongThanhToan.docx');
    
    if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
      console.error('❌ Template file not found:', templatePath);
      return;
    }

    console.log('📄 Reading template file...');
    const content = await fsPromises.readFile(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Read the main document XML
    const docXml = zip.files['word/document.xml'].asText();
    
    // Extract all text content (remove XML tags)
    const textOnly = docXml
      .replace(/<[^>]+>/g, ' ') // Remove all XML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    console.log('\n📄 Full text content (first 2000 chars):');
    console.log(textOnly.substring(0, 2000));
    
    // Search for specific patterns
    console.log('\n🔍 Searching for specific patterns:');
    const patterns = [
      'Tên Công ty',
      'Tên công ty',
      'Email Công ty',
      'Email công ty',
      'Địa chỉ',
      'Điện thoại',
      'Mã số thuế',
      'Đại diện',
      'BÊN SỬ DỤNG',
      'Bên B'
    ];
    
    patterns.forEach(pattern => {
      const index = textOnly.indexOf(pattern);
      if (index >= 0) {
        const context = textOnly.substring(Math.max(0, index - 50), Math.min(textOnly.length, index + 100));
        console.log(`\n✅ Found "${pattern}" at position ${index}:`);
        console.log(`   Context: ...${context}...`);
      } else {
        console.log(`❌ NOT found: "${pattern}"`);
      }
    });
    
    // Save full text to file for inspection
    const outputPath = path.join(__dirname, '../uploads/contracts/word_text_extract.txt');
    await fsPromises.writeFile(outputPath, textOnly, 'utf8');
    console.log(`\n✅ Full text saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  extractWordText()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { extractWordText };

