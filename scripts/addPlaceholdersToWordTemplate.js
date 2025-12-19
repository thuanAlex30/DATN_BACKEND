/**
 * Script to add placeholders to Word template
 * This script will find specific text patterns and add placeholders after them
 */

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

async function addPlaceholdersToTemplate() {
  try {
    const templatePath = path.join(__dirname, '../uploads/contracts/CHMS_HopDongThanhToan.docx');
    
    // Check if template exists
    if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
      console.error('❌ Template file not found:', templatePath);
      return;
    }

    console.log('📄 Reading template file...');
    const content = await fsPromises.readFile(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Read the main document XML
    const docXml = zip.files['word/document.xml'].asText();
    console.log('📄 Original document XML (first 1000 chars):', docXml.substring(0, 1000));

    // Define replacements: find text and add placeholder after it
    // Based on extracted text: "Tên Công ty Email Công ty : Địa chỉ : Điện thoại : Mã số thuế : Đại diện :"
    // In Word XML, text is split across multiple <w:t> tags, so we need to handle XML structure
    const replacements = [
      // Date placeholders - look for pattern with dots
      { find: /ngày\s*\.\.\.\.\s*tháng\s*\.\.\.\.\s*năm\s*\.\.\.\./gi, 
        replace: 'ngày {{SIGN_DAY}} tháng {{SIGN_MONTH}} năm {{SIGN_YEAR}}' },
      
      // Company name - "Tên Công ty" (no colon, followed by "Email Công ty")
      // Pattern: find </w:t> after "Tên Công ty" and insert placeholder before next <w:t>
      { find: /(Tên Công ty)(<\/w:t>)(\s*<w:t[^>]*>)(Email Công ty)/gi, 
        replace: '$1{{COMPANY_NAME}}$2$3$4' },
      // Fallback: just "Tên Công ty" at end of tag
      { find: /(Tên Công ty)(<\/w:t>)(?!\s*<w:t[^>]*>Email)/gi, 
        replace: '$1{{COMPANY_NAME}}$2' },
      
      // Company email - "Email Công ty :" (with colon and space)
      // Pattern: find "Email Công ty" followed by " :" in same or next tag
      { find: /(Email Công ty)(<\/w:t>)(\s*<w:t[^>]*>\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{COMPANY_EMAIL}}$2$3$4' },
      // Fallback: "Email Công ty" in same tag with colon
      { find: /(Email Công ty\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{COMPANY_EMAIL}}$2' },
      
      // Company address - "Địa chỉ :" (already has placeholder from previous run, but ensure it's there)
      { find: /(Địa chỉ\s*:\s*)(<\/w:t>)(?!\s*<w:t[^>]*>\{\{COMPANY_ADDRESS\}\})/gi, 
        replace: '$1{{COMPANY_ADDRESS}}$2' },
      
      // Company phone - "Điện thoại :" (already has placeholder from previous run, but ensure it's there)
      { find: /(Điện thoại\s*:\s*)(<\/w:t>)(?!\s*<w:t[^>]*>\{\{COMPANY_PHONE\}\})/gi, 
        replace: '$1{{COMPANY_PHONE}}$2' },
      
      // Tax code - "Mã số thuế :" (with colon and space)
      { find: /(Mã số thuế)(<\/w:t>)(\s*<w:t[^>]*>\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{COMPANY_TAX_CODE}}$2$3$4' },
      // Fallback: "Mã số thuế" in same tag with colon
      { find: /(Mã số thuế\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{COMPANY_TAX_CODE}}$2' },
      
      // Representative - "Đại diện :" (with colon and space)
      { find: /(Đại diện)(<\/w:t>)(\s*<w:t[^>]*>\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{CONTACT_NAME}}$2$3$4' },
      // Fallback: "Đại diện" in same tag with colon
      { find: /(Đại diện\s*:\s*)(<\/w:t>)/gi, 
        replace: '$1{{CONTACT_NAME}}$2' },
    ];

    // First, let's search for the actual text patterns in the XML
    console.log('\n🔍 Searching for text patterns in XML...');
    const searchPatterns = [
      'Tên Công ty',
      'Tên công ty', 
      'Email Công ty',
      'Email công ty',
      'Mã số thuế',
      'Đại diện'
    ];
    
    searchPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = docXml.match(regex);
      if (matches) {
        console.log(`  Found "${pattern}": ${matches.length} times`);
      } else {
        console.log(`  NOT found: "${pattern}"`);
      }
    });

    // First, let's find the exact XML structure for "BÊN SỬ DỤNG" section
    // Search for the section containing "Tên Công ty", "Email Công ty", etc.
    const benSuDungIndex = docXml.indexOf('BÊN SỬ DỤNG');
    if (benSuDungIndex > 0) {
      console.log(`\n📍 Found "BÊN SỬ DỤNG" section at position ${benSuDungIndex}`);
      // Extract a portion of XML around this section for inspection
      const sectionXml = docXml.substring(
        Math.max(0, benSuDungIndex - 200), 
        Math.min(docXml.length, benSuDungIndex + 2000)
      );
      console.log('📄 Section XML (first 500 chars):', sectionXml.substring(0, 500));
    }

    let modifiedXml = docXml;
    let changesMade = 0;

    // Apply replacements - try multiple strategies
    for (const replacement of replacements) {
      const before = modifiedXml;
      modifiedXml = modifiedXml.replace(replacement.find, replacement.replace);
      if (before !== modifiedXml) {
        changesMade++;
        console.log(`✅ Applied replacement: ${replacement.find}`);
      }
    }
    
    // Additional strategy: Find text patterns and insert placeholder in next <w:t> tag
    // Pattern: "Tên Công ty" followed by "Email Công ty" - insert {{COMPANY_NAME}} between them
    const patterns = [
      {
        find: /(Tên Công ty)(<\/w:t>)(\s*<w:t[^>]*>)(Email Công ty)/gi,
        replace: '$1{{COMPANY_NAME}}$2$3$4',
        name: 'COMPANY_NAME after Tên Công ty'
      },
      {
        find: /(Email Công ty\s*:\s*)(<\/w:t>)(?!\s*<w:t[^>]*>\{\{COMPANY_EMAIL\}\})/gi,
        replace: '$1{{COMPANY_EMAIL}}$2',
        name: 'COMPANY_EMAIL after Email Công ty :'
      },
      {
        find: /(Mã số thuế\s*:\s*)(<\/w:t>)(?!\s*<w:t[^>]*>\{\{COMPANY_TAX_CODE\}\})/gi,
        replace: '$1{{COMPANY_TAX_CODE}}$2',
        name: 'COMPANY_TAX_CODE after Mã số thuế :'
      },
      {
        find: /(Đại diện\s*:\s*)(<\/w:t>)(?!\s*<w:t[^>]*>\{\{CONTACT_NAME\}\})/gi,
        replace: '$1{{CONTACT_NAME}}$2',
        name: 'CONTACT_NAME after Đại diện :'
      }
    ];
    
    for (const pattern of patterns) {
      const before = modifiedXml;
      modifiedXml = modifiedXml.replace(pattern.find, pattern.replace);
      if (before !== modifiedXml) {
        changesMade++;
        console.log(`✅ Applied pattern: ${pattern.name}`);
      }
    }

    if (changesMade === 0) {
      console.log('⚠️ No changes made. Placeholders might already exist or pattern not found.');
      console.log('📄 Searching for existing placeholders...');
      const existingPlaceholders = modifiedXml.match(/\{\{[^}]+\}\}/g);
      if (existingPlaceholders) {
        console.log('✅ Found existing placeholders:', existingPlaceholders);
      } else {
        console.log('⚠️ No placeholders found. You may need to manually add them to the Word file.');
      }
      return;
    }

    // Update the document XML
    zip.file('word/document.xml', modifiedXml);

    // Save the modified template
    const outputPath = templatePath.replace('.docx', '_with_placeholders.docx');
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fsPromises.writeFile(outputPath, buffer);
    
    console.log(`✅ Modified template saved to: ${outputPath}`);
    console.log(`✅ Made ${changesMade} replacements`);
    
    // Also update the original file
    await fsPromises.writeFile(templatePath, buffer);
    console.log(`✅ Original template updated: ${templatePath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addPlaceholdersToTemplate()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addPlaceholdersToTemplate };

