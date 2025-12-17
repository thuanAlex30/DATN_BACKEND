/**
 * Script to fix Word template placeholders by finding exact XML structure
 */

const PizZip = require('pizzip');
const fsPromises = require('fs').promises;
const path = require('path');

async function fixWordPlaceholders() {
  try {
    const templatePath = path.join(__dirname, '../uploads/contracts/CHMS_HopDongThanhToan.docx');
    
    if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
      console.error('❌ Template file not found:', templatePath);
      return;
    }

    console.log('📄 Reading template file...');
    const content = await fsPromises.readFile(templatePath, 'binary');
    const zip = new PizZip(content);
    
    const docXml = zip.files['word/document.xml'].asText();
    
    // Find the section "BÊN SỬ DỤNG"
    const benSuDungIndex = docXml.indexOf('BÊN SỬ DỤNG');
    if (benSuDungIndex < 0) {
      console.error('❌ Could not find "BÊN SỬ DỤNG" section');
      return;
    }
    
    console.log(`📍 Found "BÊN SỬ DỤNG" at position ${benSuDungIndex}`);
    
    // Extract section from "BÊN SỬ DỤNG" to "XÉT RẰNG" (next section)
    const xetRangIndex = docXml.indexOf('XÉT RẰNG', benSuDungIndex);
    const sectionEnd = xetRangIndex > 0 ? xetRangIndex : benSuDungIndex + 5000;
    const sectionXml = docXml.substring(benSuDungIndex, sectionEnd);
    
    console.log('\n📄 Section XML (first 1000 chars):');
    console.log(sectionXml.substring(0, 1000));
    
    // Search for patterns in the section
    const patterns = [
      { text: 'Tên Công ty', placeholder: '{{COMPANY_NAME}}' },
      { text: 'Email Công ty', placeholder: '{{COMPANY_EMAIL}}' },
      { text: 'Mã số thuế', placeholder: '{{COMPANY_TAX_CODE}}' },
      { text: 'Đại diện', placeholder: '{{CONTACT_NAME}}' }
    ];
    
    console.log('\n🔍 Searching for patterns in section...');
    patterns.forEach(pattern => {
      const index = sectionXml.indexOf(pattern.text);
      if (index >= 0) {
        const context = sectionXml.substring(Math.max(0, index - 100), Math.min(sectionXml.length, index + 200));
        console.log(`\n✅ Found "${pattern.text}" at position ${index}:`);
        console.log(`   Context: ...${context}...`);
      } else {
        console.log(`❌ NOT found: "${pattern.text}"`);
      }
    });
    
    // Try to find and replace in the full XML
    let modifiedXml = docXml;
    let changesMade = 0;
    
    // Strategy: Find text followed by </w:t> and insert placeholder before closing tag
    // Pattern 1: "Tên Công ty</w:t>" -> "Tên Công ty{{COMPANY_NAME}}</w:t>"
    const replacements = [
      {
        find: /(Tên Công ty)(<\/w:t>)/gi,
        replace: '$1{{COMPANY_NAME}}$2',
        name: 'COMPANY_NAME'
      },
      {
        find: /(Email Công ty\s*:\s*)(<\/w:t>)/gi,
        replace: '$1{{COMPANY_EMAIL}}$2',
        name: 'COMPANY_EMAIL'
      },
      {
        find: /(Mã số thuế\s*:\s*)(<\/w:t>)/gi,
        replace: '$1{{COMPANY_TAX_CODE}}$2',
        name: 'COMPANY_TAX_CODE'
      },
      {
        find: /(Đại diện\s*:\s*)(<\/w:t>)/gi,
        replace: '$1{{CONTACT_NAME}}$2',
        name: 'CONTACT_NAME'
      }
    ];
    
    for (const replacement of replacements) {
      const before = modifiedXml;
      modifiedXml = modifiedXml.replace(replacement.find, replacement.replace);
      if (before !== modifiedXml) {
        changesMade++;
        console.log(`\n✅ Added placeholder: ${replacement.name}`);
      } else {
        console.log(`\n⚠️ Could not add placeholder: ${replacement.name}`);
      }
    }
    
    if (changesMade === 0) {
      console.log('\n⚠️ No changes made. The text might be in a different XML structure.');
      console.log('💡 You may need to manually add placeholders in Word:');
      patterns.forEach(pattern => {
        console.log(`   - ${pattern.text} -> ${pattern.text}: ${pattern.placeholder}`);
      });
      return;
    }
    
    // Update the document XML
    zip.file('word/document.xml', modifiedXml);
    
    // Save the modified template
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fsPromises.writeFile(templatePath, buffer);
    
    console.log(`\n✅ Modified template saved: ${templatePath}`);
    console.log(`✅ Made ${changesMade} changes`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fixWordPlaceholders()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixWordPlaceholders };

