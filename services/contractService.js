const ContractRepository = require('../repository/ContractRepository');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const fontkit = require('@pdf-lib/fontkit');

// Resolve a writable uploads/contracts directory.
// Uses env UPLOADS_DIR or project uploads folder, falls back to /tmp/uploads.
const DEFAULT_UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../uploads');
const FALLBACK_UPLOADS_DIR = path.resolve('/tmp/uploads');
let resolvedContractsDir = null;

async function getContractsUploadDir() {
  if (resolvedContractsDir) return resolvedContractsDir;

  const candidates = [
    path.join(DEFAULT_UPLOADS_DIR, 'contracts'),
    path.join(FALLBACK_UPLOADS_DIR, 'contracts')
  ];

  for (const dir of candidates) {
    try {
      await fsPromises.mkdir(dir, { recursive: true });
      await fsPromises.access(dir, fs.constants.W_OK);
      if (dir !== candidates[0]) {
        console.warn(`⚠️ [ContractPreview] Using fallback upload dir: ${dir}`);
      }
      resolvedContractsDir = dir;
      return dir;
    } catch (err) {
      console.warn(`⚠️ [ContractPreview] Cannot use upload dir ${dir}: ${err.message}`);
    }
  }

  throw new Error('Không tìm thấy thư mục uploads/contracts có thể ghi');
}

class ContractService {
  /**
   * Helper function to load Vietnamese font
   * Tries to load custom font, falls back to system font or standard font
   */
  async loadVietnameseFont(pdfDoc) {
    try {
      // Register fontkit
      pdfDoc.registerFontkit(fontkit);
      
      // Try to load custom font from fonts directory
      const fontsDir = path.join(__dirname, '../fonts');
      const possibleFonts = [
        'NotoSans-Regular.ttf',
        'NotoSans-Vietnamese.ttf',
        'Arial.ttf',
        'TimesNewRoman.ttf',
        'arial.ttf',
        'times.ttf'
      ];
      
      for (const fontFile of possibleFonts) {
        const fontPath = path.join(fontsDir, fontFile);
        try {
          if (await fsPromises.access(fontPath).then(() => true).catch(() => false)) {
            const fontBytes = await fsPromises.readFile(fontPath);
            const font = await pdfDoc.embedFont(fontBytes);
            console.log(`✅ [Font] Loaded custom font: ${fontFile}`);
            return font;
          }
        } catch (e) {
          // Continue to next font
        }
      }
      
      // Try to load from Windows fonts directory
      const windowsFontsDir = 'C:\\Windows\\Fonts';
      const windowsFonts = ['arial.ttf', 'times.ttf', 'timesi.ttf'];
      
      for (const fontFile of windowsFonts) {
        const fontPath = path.join(windowsFontsDir, fontFile);
        try {
          if (await fsPromises.access(fontPath).then(() => true).catch(() => false)) {
            const fontBytes = await fsPromises.readFile(fontPath);
            const font = await pdfDoc.embedFont(fontBytes);
            console.log(`✅ [Font] Loaded Windows font: ${fontFile}`);
            return font;
          }
        } catch (e) {
          // Continue to next font
        }
      }
      
      // Fallback: Use standard font (will need to remove diacritics)
      console.warn('⚠️ [Font] No custom font found, using Times-Roman (Vietnamese characters will be removed)');
      return await pdfDoc.embedFont('Times-Roman');
    } catch (error) {
      console.error('❌ [Font] Error loading font:', error.message);
      // Fallback to standard font
      return await pdfDoc.embedFont('Times-Roman');
    }
  }

  /**
   * Remove Vietnamese diacritics (bỏ dấu)
   * Fallback when font doesn't support Vietnamese
   */
  removeDiacritics(str) {
    if (!str) return str;
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  async createContract(contractData) {
    try {
      const {
        tenantId,
        userId,
        orderId,
        planType,
        amount,
        startDate,
        endDate,
        companyInfo,
        contactPerson
      } = contractData;

      if (!tenantId || !userId || !orderId || !planType || !amount || !startDate || !endDate) {
        throw new Error('Thiếu thông tin bắt buộc để tạo hợp đồng');
      }

      if (!companyInfo || !companyInfo.name || !companyInfo.email || !companyInfo.phone) {
        throw new Error('Thiếu thông tin công ty');
      }

      if (!contactPerson || !contactPerson.name || !contactPerson.email || !contactPerson.phone) {
        throw new Error('Thiếu thông tin người liên hệ');
      }

      const contractId = this.generateContractId();

      const contract = await ContractRepository.create({
        contractId,
        tenantId,
        userId,
        orderId,
        planType,
        amount,
        startDate,
        endDate,
        companyInfo: {
          name: companyInfo.name,
          address: companyInfo.address || '',
          phone: companyInfo.phone,
          email: companyInfo.email,
          taxCode: companyInfo.taxCode || ''
        },
        contactPerson: {
          name: contactPerson.name,
          email: contactPerson.email,
          phone: contactPerson.phone,
          position: contactPerson.position || 'Đại diện'
        },
        status: 'active'
      });

      console.log(`✅ Contract created successfully: ${contractId} for tenant: ${tenantId}`);

      return contract;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  generateContractId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = uuidv4().substring(0, 8).toUpperCase();
    return `CONTRACT-${dateStr}-${randomStr}`;
  }

  async generatePdf(contract) {
    try {
      if (!contract || !contract._id) {
        throw new Error('Contract không hợp lệ');
      }

      const uploadsDir = await getContractsUploadDir();

      const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      const { PDFDocument } = require('pdf-lib');
      const templateBytes = await fsPromises.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      const font = await this.loadVietnameseFont(pdfDoc);
      const fontSize = 10;

      const planName = contract.planType === 'monthly' ? 'Gói tháng' : 
                      contract.planType === 'quarterly' ? 'Gói quý' : 'Gói năm';
      const amountText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.amount);
      const startDateText = new Date(contract.startDate).toLocaleDateString('vi-VN');
      const endDateText = new Date(contract.endDate).toLocaleDateString('vi-VN');
      const signDateText = new Date(contract.startDate).toLocaleDateString('vi-VN');

      const textFields = {
        contractId: contract.contractId,
        companyName: (contract.companyInfo.name || '').trim(),
        companyAddress: (contract.companyInfo.address || '').trim(),
        companyPhone: (contract.companyInfo.phone || '').trim(),
        companyEmail: (contract.companyInfo.email || '').trim(),
        companyTaxCode: (contract.companyInfo.taxCode || '').trim(),
        contactName: (contract.contactPerson.name || '').trim(),
        contactPosition: (contract.contactPerson.position || 'Đại diện').trim(),
        contactEmail: (contract.contactPerson.email || '').trim(),
        contactPhone: (contract.contactPerson.phone || '').trim(),
        planType: planName,
        amount: amountText,
        startDate: startDateText,
        endDate: endDateText,
        signDate: signDateText
      };

      const form = pdfDoc.getForm();
      const formFields = form.getFields();

      console.log(`📋 [Contract] Found ${formFields.length} form fields in PDF template`);

      if (formFields.length > 0) {
        try {
          const fieldNames = formFields.map(field => field.getName());
          console.log(`📋 [Contract] All field names in PDF:`, fieldNames);

          // Expanded field mapping with more variations
          const fieldMapping = {
            companyName: ['companyName', 'company_name', 'tenCongTy', 'ten_cong_ty', 'company', 'tencongty', 'tencongty', 'tên công ty', 'tencongty', 'congty', 'cong_ty'],
            companyAddress: ['companyAddress', 'company_address', 'diaChi', 'dia_chi', 'address', 'diachi', 'diachi', 'địa chỉ', 'diachi', 'address'],
            companyPhone: ['companyPhone', 'company_phone', 'dienThoai', 'dien_thoai', 'phone', 'dienthoai', 'dienthoai', 'điện thoại', 'dienthoai', 'phone', 'sdt'],
            companyEmail: ['companyEmail', 'company_email', 'email', 'emailcongty', 'email_cong_ty', 'email công ty', 'email'],
            companyTaxCode: ['companyTaxCode', 'company_tax_code', 'maSoThue', 'ma_so_thue', 'taxCode', 'tax_code', 'masothue', 'masothue', 'mã số thuế', 'masothue', 'tax'],
            contactName: ['contactName', 'contact_name', 'nguoiDaiDien', 'nguoi_dai_dien', 'contact', 'nguoidaidien', 'nguoidaidien', 'người đại diện', 'nguoidaidien', 'daidien', 'dai_dien', 'representative'],
            contactPosition: ['contactPosition', 'contact_position', 'chucVu', 'chuc_vu', 'position', 'chucvu', 'chucvu', 'chức vụ', 'chucvu', 'position'],
            contactEmail: ['contactEmail', 'contact_email', 'emailLienHe', 'email_lien_he', 'emaillienhe', 'email_lien_he', 'email liên hệ', 'emaillienhe'],
            contactPhone: ['contactPhone', 'contact_phone', 'sdtLienHe', 'sdt_lien_he', 'sdttlienhe', 'sdt_lien_he', 'sđt liên hệ', 'sdttlienhe', 'phone'],
            planType: ['planType', 'plan_type', 'loaiGoi', 'loai_goi', 'goiDichVu', 'goi_dich_vu', 'loaigoi', 'loaigoi', 'loại gói', 'loaigoi', 'goi', 'goi_dich_vu'],
            amount: ['amount', 'giaTri', 'gia_tri', 'soTien', 'so_tien', 'price', 'giatri', 'giatri', 'giá trị', 'giatri', 'sotien', 'so_tien', 'số tiền', 'sotien'],
            startDate: ['startDate', 'start_date', 'tuNgay', 'tu_ngay', 'ngayBatDau', 'ngay_bat_dau', 'tungay', 'tungay', 'từ ngày', 'tungay', 'ngaybatdau', 'ngay_bat_dau', 'ngày bắt đầu'],
            endDate: ['endDate', 'end_date', 'denNgay', 'den_ngay', 'ngayKetThuc', 'ngay_ket_thuc', 'denngay', 'denngay', 'đến ngày', 'denngay', 'ngayketthuc', 'ngay_ket_thuc', 'ngày kết thúc'],
            signDate: ['signDate', 'sign_date', 'ngayKy', 'ngay_ky', 'ngayDangKy', 'ngay_dang_ky', 'ngayky', 'ngayky', 'ngày ký', 'ngayky', 'ngaydangky', 'ngay_dang_ky', 'ngày đăng ký']
          };

          const filledFields = [];
          const unfilledFields = [];

          // First pass: try to match fields
          for (const fieldName of fieldNames) {
            let filled = false;
            const normalizedFieldName = fieldName.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
            
            for (const [dataKey, possibleNames] of Object.entries(fieldMapping)) {
              const matched = possibleNames.some(name => {
                const normalizedName = name.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
                return normalizedFieldName === normalizedName || 
                       normalizedFieldName.includes(normalizedName) ||
                       normalizedName.includes(normalizedFieldName);
              });
              
              if (matched) {
                try {
                  const textField = form.getTextField(fieldName);
                  if (textField) {
                    const value = textFields[dataKey] || '';
                    if (value) {
                      textField.setText(value);
                      filledFields.push({ fieldName, dataKey, value });
                      filled = true;
                      console.log(`✅ [Contract] Filled field "${fieldName}" with "${dataKey}": "${value}"`);
                      break;
                    }
                  }
                } catch (e) {
                  console.warn(`⚠️ [Contract] Cannot fill field "${fieldName}":`, e.message);
                }
              }
            }
            
            if (!filled) {
              unfilledFields.push(fieldName);
              console.log(`⚠️ [Contract] No match for field: "${fieldName}"`);
            }
          }

          console.log(`📋 [Contract] Filled ${filledFields.length}/${fieldNames.length} fields`);
          
          // Fallback: if we didn't fill many fields, try a more aggressive matching
          if (filledFields.length < fieldNames.length / 2 && unfilledFields.length > 0) {
            console.log(`🔄 [Contract] Trying fallback matching for ${unfilledFields.length} unfilled fields...`);
            
            for (const fieldName of unfilledFields) {
              const normalizedFieldName = fieldName.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
              
              // Try to match with any data key
              for (const [dataKey, value] of Object.entries(textFields)) {
                if (!value) continue;
                
                const normalizedKey = dataKey.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
                
                // Check if field name contains key or vice versa
                if (normalizedFieldName.includes(normalizedKey) || normalizedKey.includes(normalizedFieldName)) {
                  try {
                    const textField = form.getTextField(fieldName);
                    if (textField) {
                      textField.setText(value);
                      filledFields.push({ fieldName, dataKey, value });
                      console.log(`✅ [Contract] Fallback filled field "${fieldName}" with "${dataKey}": "${value}"`);
                      break;
                    }
                  } catch (e) {
                    // Skip this field
                  }
                }
              }
            }
            
            console.log(`📋 [Contract] After fallback: Filled ${filledFields.length}/${fieldNames.length} fields`);
          }
          
          if (unfilledFields.length > 0) {
            console.log(`⚠️ [Contract] Unfilled fields (${unfilledFields.length}):`, unfilledFields);
            console.log(`💡 [Contract] Available data keys:`, Object.keys(textFields));
          }
        } catch (fieldError) {
          console.error('❌ [Contract] Error filling form fields:', fieldError);
          console.error('❌ [Contract] Error stack:', fieldError.stack);
          console.log('⚠️ [Contract] Template không có form fields, sẽ dùng overlay text');
        }
      } else {
        console.log('⚠️ [Contract] Template không có form fields, sẽ dùng overlay text');
      }

      // Text overlay for PDFs without form fields
      // Exact coordinates from grid overlay analysis
      // PDF size: 595.44 x 841.68 points (A4)
      // Section II (BÊN SỬ DỤNG) - coordinates measured from actual template grid
      // Y coordinates are from bottom (0 at bottom, 841.68 at top)
      if (formFields.length === 0) {
        console.log('📝 [Contract] Drawing text overlay on PDF...');
        
        // Updated coordinates from actual PDF measurement (Top-down → Bottom-up conversion)
        // PDF height: 841.68, Y coordinates converted from top-down to bottom-up
        // All fields use X = 200
        // Company Name - "Tên Công ty:" - Y 370 (top) → Y 471.68 (bottom-up), X 200
        if (textFields.companyName) {
          firstPage.drawText(textFields.companyName, {
            x: 200,
            y: 471.68, // 841.68 - 370 (measured from PDF)
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew company name: "${textFields.companyName}" at (200, 471.68)`);
        }
        
        // Company Email - "Email Công ty:" - Y 358 (top) → Y 483.68 (bottom-up), X 200
        if (textFields.companyEmail) {
          firstPage.drawText(textFields.companyEmail, {
            x: 200,
            y: 483.68, // 841.68 - 358 (measured from PDF)
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew company email: "${textFields.companyEmail}" at (200, 483.68)`);
        }
        
        // Company Address - "Địa chỉ:" - Y 340 (top) → Y 501.68 (bottom-up), X 200
        if (textFields.companyAddress) {
          // Split long addresses into multiple lines (max 60 chars per line)
          const maxCharsPerLine = 60;
          const addressLines = [];
          let remaining = textFields.companyAddress;
          while (remaining.length > 0) {
            if (remaining.length <= maxCharsPerLine) {
              addressLines.push(remaining);
              break;
            }
            // Try to break at space
            let breakPoint = remaining.lastIndexOf(' ', maxCharsPerLine);
            if (breakPoint === -1) breakPoint = maxCharsPerLine;
            addressLines.push(remaining.substring(0, breakPoint));
            remaining = remaining.substring(breakPoint).trim();
          }
          
          // Draw first line at y=501.68, subsequent lines above (decrease Y)
          addressLines.forEach((line, index) => {
            firstPage.drawText(line, {
              x: 200,
              y: 501.68 - (index * 20), // 841.68 - 340 (measured from PDF), each line 20px above previous
              size: fontSize,
              font: font,
            });
          });
          console.log(`✅ [Contract] Drew company address (${addressLines.length} lines) starting at (200, 501.68): "${textFields.companyAddress}"`);
        }
        
        // Company Phone - "Điện thoại:" - Y 328 (top) → Y 513.68 (bottom-up), X 200
        if (textFields.companyPhone) {
          firstPage.drawText(textFields.companyPhone, {
            x: 200,
            y: 513.68, // 841.68 - 328 (measured from PDF)
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew company phone: "${textFields.companyPhone}" at (200, 513.68)`);
        }
        
        // Company Tax Code - "Mã số thuế:" - Y 310 (top) → Y 531.68 (bottom-up), X 200
        if (textFields.companyTaxCode) {
          firstPage.drawText(textFields.companyTaxCode, {
            x: 200,
            y: 531.68, // 841.68 - 310 (measured from PDF)
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew company tax code: "${textFields.companyTaxCode}" at (200, 531.68)`);
        }
        
        // Contact Person - "Đại diện:" - Y 299 (top) → Y 542.68 (bottom-up), X 200
        if (textFields.contactName) {
          firstPage.drawText(textFields.contactName, {
            x: 200,
            y: 542.68, // 841.68 - 299 (measured from PDF)
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew contact name: "${textFields.contactName}" at (200, 542.68)`);
        }
        
        // Contact Position - "Chức vụ:" (if exists in template)
        // Note: Position not specified in grid, using estimated position below contact name
        if (textFields.contactPosition && textFields.contactPosition !== 'Đại diện') {
          firstPage.drawText(textFields.contactPosition, {
            x: 110,
            y: 385, // Estimated: 20px below contact name
            size: fontSize,
            font: font,
          });
          console.log(`✅ [Contract] Drew contact position: "${textFields.contactPosition}" at (110, 385)`);
        }
        
        console.log('✅ [Contract] Text overlay completed');
      }

      form.flatten();

      const fileName = `contract-${contract.contractId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await pdfDoc.save();
      await fsPromises.writeFile(filePath, pdfBytes);

      const relativePath = `/uploads/contracts/${fileName}`;
      const fullUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}${relativePath}`;
      
      console.log(`✅ PDF generated from template: ${fileName}`);
      return fullUrl;
    } catch (error) {
      console.error('Error generating PDF from template:', error);
      throw error;
    }
  }

  generatePdfContent(contract) {
    return {
      contractId: contract.contractId,
      companyName: contract.companyInfo.name,
      amount: contract.amount,
      planType: contract.planType,
      startDate: contract.startDate,
      endDate: contract.endDate
    };
  }

  async findByTenant(tenantId, options = {}) {
    try {
      return await ContractRepository.findByTenant(tenantId, options);
    } catch (error) {
      console.error('Error finding contracts by tenant:', error);
      throw error;
    }
  }

  async getLatestContract(tenantId) {
    try {
      return await ContractRepository.getLatestContract(tenantId);
    } catch (error) {
      console.error('Error getting latest contract:', error);
      throw error;
    }
  }

  async findByContractId(contractId) {
    try {
      return await ContractRepository.findByContractId(contractId);
    } catch (error) {
      console.error('Error finding contract by ID:', error);
      throw error;
    }
  }

  async findByOrderId(orderId) {
    try {
      return await ContractRepository.findByOrderId(orderId);
    } catch (error) {
      console.error('Error finding contract by order ID:', error);
      throw error;
    }
  }

  async update(contractId, updateData) {
    try {
      return await ContractRepository.updateByContractId(contractId, updateData);
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  }

  async renewContract(oldContract, newPlanData) {
    try {
      if (!oldContract || !oldContract._id) {
        throw new Error('Contract cũ không hợp lệ');
      }

      const newStartDate = oldContract.endDate > new Date() 
        ? oldContract.endDate 
        : new Date();

      const newContract = await this.createContract({
        tenantId: oldContract.tenantId,
        userId: oldContract.userId,
        orderId: newPlanData.orderId,
        planType: newPlanData.planType,
        amount: newPlanData.amount,
        startDate: newStartDate,
        endDate: newPlanData.endDate,
        companyInfo: oldContract.companyInfo,
        contactPerson: oldContract.contactPerson
      });

      return newContract;
    } catch (error) {
      console.error('Error renewing contract:', error);
      throw error;
    }
  }

  async cancelContract(contractId, reason) {
    try {
      return await ContractRepository.cancel(contractId, reason);
    } catch (error) {
      console.error('Error cancelling contract:', error);
      throw error;
    }
  }

  async generatePreviewPdf(contractData) {
    try {
      const {
        planType,
        amount,
        companyInfo,
        contactPerson
      } = contractData;

      if (!planType || !amount || !companyInfo || !contactPerson) {
        throw new Error('Thiếu thông tin để tạo preview hợp đồng');
      }

      const uploadsDir = await getContractsUploadDir();

      const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      const { PDFDocument } = require('pdf-lib');
      const templateBytes = await fsPromises.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      const font = await this.loadVietnameseFont(pdfDoc);
      const fontSize = 11;

      const planName = planType === 'monthly' ? 'Gói tháng' : 
                      planType === 'quarterly' ? 'Gói quý' : 'Gói năm';
      const amountText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
      const startDate = new Date();
      const endDate = new Date();
      
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const startDateText = startDate.toLocaleDateString('vi-VN');
      const endDateText = endDate.toLocaleDateString('vi-VN');
      const signDateText = startDate.toLocaleDateString('vi-VN');
      const previewContractId = `PREVIEW-${Date.now()}`;

      const textFields = {
        contractId: previewContractId,
        companyName: (companyInfo.name || '').trim(),
        companyAddress: (companyInfo.address || '').trim(),
        companyPhone: (companyInfo.phone || '').trim(),
        companyEmail: (companyInfo.email || '').trim(),
        companyTaxCode: (companyInfo.taxCode || '').trim(),
        contactName: (contactPerson.name || '').trim(),
        contactPosition: (contactPerson.position || 'Đại diện').trim(),
        contactEmail: (contactPerson.email || '').trim(),
        contactPhone: (contactPerson.phone || '').trim(),
        planType: planName,
        amount: amountText,
        startDate: startDateText,
        endDate: endDateText,
        signDate: signDateText
      };

      // Debug: Log all text fields
      console.log('📋 [ContractPreview] Text fields to draw:');
      console.log('   companyName:', textFields.companyName, `(length: ${textFields.companyName?.length || 0})`);
      console.log('   companyEmail:', textFields.companyEmail, `(length: ${textFields.companyEmail?.length || 0})`);
      console.log('   companyAddress:', textFields.companyAddress, `(length: ${textFields.companyAddress?.length || 0})`);
      console.log('   companyPhone:', textFields.companyPhone, `(length: ${textFields.companyPhone?.length || 0})`);
      console.log('   companyTaxCode:', textFields.companyTaxCode, `(length: ${textFields.companyTaxCode?.length || 0})`);
      console.log('   contactName:', textFields.contactName, `(length: ${textFields.contactName?.length || 0})`);
      console.log('📐 [ContractPreview] Page dimensions:', { width, height });

      const form = pdfDoc.getForm();
      const formFields = form.getFields();

      console.log(`📋 [ContractPreview] Found ${formFields.length} form fields in PDF template`);

      if (formFields.length > 0) {
        try {
          const fieldNames = formFields.map(field => field.getName());
          console.log(`📋 [ContractPreview] All field names in PDF:`, fieldNames);

          // Expanded field mapping with more variations
          const fieldMapping = {
            companyName: ['companyName', 'company_name', 'tenCongTy', 'ten_cong_ty', 'company', 'tencongty', 'tencongty', 'tên công ty', 'tencongty', 'congty', 'cong_ty'],
            companyAddress: ['companyAddress', 'company_address', 'diaChi', 'dia_chi', 'address', 'diachi', 'diachi', 'địa chỉ', 'diachi', 'address'],
            companyPhone: ['companyPhone', 'company_phone', 'dienThoai', 'dien_thoai', 'phone', 'dienthoai', 'dienthoai', 'điện thoại', 'dienthoai', 'phone', 'sdt'],
            companyEmail: ['companyEmail', 'company_email', 'email', 'emailcongty', 'email_cong_ty', 'email công ty', 'email'],
            companyTaxCode: ['companyTaxCode', 'company_tax_code', 'maSoThue', 'ma_so_thue', 'taxCode', 'tax_code', 'masothue', 'masothue', 'mã số thuế', 'masothue', 'tax'],
            contactName: ['contactName', 'contact_name', 'nguoiDaiDien', 'nguoi_dai_dien', 'contact', 'nguoidaidien', 'nguoidaidien', 'người đại diện', 'nguoidaidien', 'daidien', 'dai_dien', 'representative'],
            contactPosition: ['contactPosition', 'contact_position', 'chucVu', 'chuc_vu', 'position', 'chucvu', 'chucvu', 'chức vụ', 'chucvu', 'position'],
            contactEmail: ['contactEmail', 'contact_email', 'emailLienHe', 'email_lien_he', 'emaillienhe', 'email_lien_he', 'email liên hệ', 'emaillienhe'],
            contactPhone: ['contactPhone', 'contact_phone', 'sdtLienHe', 'sdt_lien_he', 'sdttlienhe', 'sdt_lien_he', 'sđt liên hệ', 'sdttlienhe', 'phone'],
            planType: ['planType', 'plan_type', 'loaiGoi', 'loai_goi', 'goiDichVu', 'goi_dich_vu', 'loaigoi', 'loaigoi', 'loại gói', 'loaigoi', 'goi', 'goi_dich_vu'],
            amount: ['amount', 'giaTri', 'gia_tri', 'soTien', 'so_tien', 'price', 'giatri', 'giatri', 'giá trị', 'giatri', 'sotien', 'so_tien', 'số tiền', 'sotien'],
            startDate: ['startDate', 'start_date', 'tuNgay', 'tu_ngay', 'ngayBatDau', 'ngay_bat_dau', 'tungay', 'tungay', 'từ ngày', 'tungay', 'ngaybatdau', 'ngay_bat_dau', 'ngày bắt đầu'],
            endDate: ['endDate', 'end_date', 'denNgay', 'den_ngay', 'ngayKetThuc', 'ngay_ket_thuc', 'denngay', 'denngay', 'đến ngày', 'denngay', 'ngayketthuc', 'ngay_ket_thuc', 'ngày kết thúc'],
            signDate: ['signDate', 'sign_date', 'ngayKy', 'ngay_ky', 'ngayDangKy', 'ngay_dang_ky', 'ngayky', 'ngayky', 'ngày ký', 'ngayky', 'ngaydangky', 'ngay_dang_ky', 'ngày đăng ký']
          };

          const filledFields = [];
          const unfilledFields = [];

          // First pass: try to match fields
          for (const fieldName of fieldNames) {
            let filled = false;
            const normalizedFieldName = fieldName.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
            
            for (const [dataKey, possibleNames] of Object.entries(fieldMapping)) {
              const matched = possibleNames.some(name => {
                const normalizedName = name.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
                return normalizedFieldName === normalizedName || 
                       normalizedFieldName.includes(normalizedName) ||
                       normalizedName.includes(normalizedFieldName);
              });
              
              if (matched) {
                try {
                  const textField = form.getTextField(fieldName);
                  if (textField) {
                    const value = textFields[dataKey] || '';
                    if (value) {
                      textField.setText(value);
                      filledFields.push({ fieldName, dataKey, value });
                      filled = true;
                      console.log(`✅ [ContractPreview] Filled field "${fieldName}" with "${dataKey}": "${value}"`);
                      break;
                    }
                  }
                } catch (e) {
                  console.warn(`⚠️ [ContractPreview] Cannot fill field "${fieldName}":`, e.message);
                }
              }
            }
            
            if (!filled) {
              unfilledFields.push(fieldName);
              console.log(`⚠️ [ContractPreview] No match for field: "${fieldName}"`);
            }
          }

          console.log(`📋 [ContractPreview] Filled ${filledFields.length}/${fieldNames.length} fields`);
          
          // Fallback: if we didn't fill many fields, try a more aggressive matching
          if (filledFields.length < fieldNames.length / 2 && unfilledFields.length > 0) {
            console.log(`🔄 [ContractPreview] Trying fallback matching for ${unfilledFields.length} unfilled fields...`);
            
            for (const fieldName of unfilledFields) {
              const normalizedFieldName = fieldName.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
              
              // Try to match with any data key
              for (const [dataKey, value] of Object.entries(textFields)) {
                if (!value) continue;
                
                const normalizedKey = dataKey.toLowerCase().trim().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '');
                
                // Check if field name contains key or vice versa
                if (normalizedFieldName.includes(normalizedKey) || normalizedKey.includes(normalizedFieldName)) {
                  try {
                    const textField = form.getTextField(fieldName);
                    if (textField) {
                      textField.setText(value);
                      filledFields.push({ fieldName, dataKey, value });
                      console.log(`✅ [ContractPreview] Fallback filled field "${fieldName}" with "${dataKey}": "${value}"`);
                      break;
                    }
                  } catch (e) {
                    // Skip this field
                  }
                }
              }
            }
            
            console.log(`📋 [ContractPreview] After fallback: Filled ${filledFields.length}/${fieldNames.length} fields`);
          }
          
          if (unfilledFields.length > 0) {
            console.log(`⚠️ [ContractPreview] Unfilled fields (${unfilledFields.length}):`, unfilledFields);
            console.log(`💡 [ContractPreview] Available data keys:`, Object.keys(textFields));
          }
        } catch (fieldError) {
          console.error('❌ [ContractPreview] Error filling form fields:', fieldError);
          console.error('❌ [ContractPreview] Error stack:', fieldError.stack);
        }
      } else {
        console.log('⚠️ [ContractPreview] Template không có form fields, sẽ dùng overlay text');
      }

      // Text overlay for PDFs without form fields
      // Based on typical contract layout, these are estimated positions
      // You may need to adjust these coordinates based on your actual PDF template
      if (formFields.length === 0) {
        console.log('📝 [ContractPreview] Drawing text overlay on PDF...');
        console.log(`📐 [ContractPreview] Page size: ${width} x ${height} points`);
        
        // Test: Draw markers to verify coordinates work
        try {
          // Test 1: ASCII text
          firstPage.drawText('TEST ASCII', {
            x: 50,
            y: 800,
            size: 12,
            font: font,
          });
          console.log('✅ [ContractPreview] Test ASCII marker drawn at (50, 800)');
          
          // Test 2: At exact coordinates
          firstPage.drawText('TEST 110,505', {
            x: 110,
            y: 505,
            size: 10,
            font: font,
          });
          console.log('✅ [ContractPreview] Test marker at exact coordinates (110, 505)');
          
          // Test 3: Draw numbers to verify position
          firstPage.drawText('505', {
            x: 90,
            y: 505,
            size: 8,
            font: font,
          });
          firstPage.drawText('485', {
            x: 90,
            y: 485,
            size: 8,
            font: font,
          });
          firstPage.drawText('465', {
            x: 90,
            y: 465,
            size: 8,
            font: font,
          });
          console.log('✅ [ContractPreview] Test coordinate markers drawn');
        } catch (testError) {
          console.error('❌ [ContractPreview] Error drawing test markers:', testError.message);
        }
        
        // Coordinates are in points (1/72 inch)
        // A4 page: 595 x 842 points (width x height)
        // Y coordinate starts from bottom (0) to top (height)
        
        // Section II: BÊN SỬ DỤNG (Party B)
        // Coordinates adjusted for typical Vietnamese contract layout
        // A4: 595 x 842 points, Y starts from bottom
        // Typical contract has company info around middle of page
        
        // Exact coordinates from grid overlay analysis
        // PDF size: 595.44 x 841.68 points (A4)
        // Section II (BÊN SỬ DỤNG) - coordinates measured from actual template grid
        // Y coordinates are from bottom (0 at bottom, 841.68 at top)
        
        // Updated coordinates from actual PDF measurement (Top-down → Bottom-up conversion)
        // PDF height: 841.68, Y coordinates converted from top-down to bottom-up
        // All fields use X = 200
        // Company Name - "Tên Công ty:" - Y 370 (top) → Y 471.68 (bottom-up), X 200
        if (textFields.companyName) {
          try {
            firstPage.drawText(textFields.companyName, {
              x: 200,
              y: 471.68, // 841.68 - 370 (measured from PDF)
              size: fontSize,
              font: font,
            });
            console.log(`✅ [ContractPreview] Drew company name: "${textFields.companyName}" at (200, 471.68)`);
          } catch (textError) {
            console.error(`❌ [ContractPreview] Error drawing company name:`, textError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] companyName is empty, skipping');
        }
        
        // Company Email - "Email Công ty:" - Y 358 (top) → Y 483.68 (bottom-up), X 200
        if (textFields.companyEmail) {
          try {
            firstPage.drawText(textFields.companyEmail, {
              x: 200,
              y: 483.68, // 841.68 - 358 (measured from PDF)
              size: fontSize,
              font: font,
            });
            console.log(`✅ [ContractPreview] Drew company email: "${textFields.companyEmail}" at (200, 483.68)`);
          } catch (textError) {
            console.error(`❌ [ContractPreview] Error drawing company email:`, textError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] companyEmail is empty, skipping');
        }
        
        // Company Address - "Địa chỉ:" - Y 340 (top) → Y 501.68 (bottom-up), X 200
        if (textFields.companyAddress) {
          try {
            // Split long addresses into multiple lines (max 60 chars per line)
            const maxCharsPerLine = 60;
            const addressLines = [];
            let remaining = textFields.companyAddress;
            while (remaining.length > 0) {
              if (remaining.length <= maxCharsPerLine) {
                addressLines.push(remaining);
                break;
              }
              // Try to break at space
              let breakPoint = remaining.lastIndexOf(' ', maxCharsPerLine);
              if (breakPoint === -1) breakPoint = maxCharsPerLine;
              addressLines.push(remaining.substring(0, breakPoint));
              remaining = remaining.substring(breakPoint).trim();
            }
            
            // Draw first line at y=501.68, subsequent lines above (decrease Y)
            addressLines.forEach((line, index) => {
              try {
                firstPage.drawText(line, {
                  x: 200,
                  y: 501.68 - (index * 20), // 841.68 - 340 (measured from PDF), each line 20px above previous
                  size: fontSize,
                  font: font,
                });
              } catch (lineError) {
                console.error(`❌ [ContractPreview] Error drawing address line ${index}:`, lineError.message);
              }
            });
            console.log(`✅ [ContractPreview] Drew company address (${addressLines.length} lines) starting at (200, 501.68): "${textFields.companyAddress}"`);
          } catch (addressError) {
            console.error(`❌ [ContractPreview] Error drawing company address:`, addressError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] companyAddress is empty, skipping');
        }
        
        // Company Phone - "Điện thoại:" - Y 328 (top) → Y 513.68 (bottom-up), X 200
        if (textFields.companyPhone) {
          try {
            firstPage.drawText(textFields.companyPhone, {
              x: 200,
              y: 513.68, // 841.68 - 328 (measured from PDF)
              size: fontSize,
              font: font,
            });
            console.log(`✅ [ContractPreview] Drew company phone: "${textFields.companyPhone}" at (200, 513.68)`);
          } catch (textError) {
            console.error(`❌ [ContractPreview] Error drawing company phone:`, textError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] companyPhone is empty, skipping');
        }
        
        // Company Tax Code - "Mã số thuế:" - Y 310 (top) → Y 531.68 (bottom-up), X 200
        if (textFields.companyTaxCode) {
          try {
            firstPage.drawText(textFields.companyTaxCode, {
              x: 200,
              y: 531.68, // 841.68 - 310 (measured from PDF)
              size: fontSize,
              font: font,
            });
            console.log(`✅ [ContractPreview] Drew company tax code: "${textFields.companyTaxCode}" at (200, 531.68)`);
          } catch (textError) {
            console.error(`❌ [ContractPreview] Error drawing company tax code:`, textError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] companyTaxCode is empty, skipping');
        }
        
        // Contact Person - "Đại diện:" - Y 299 (top) → Y 542.68 (bottom-up), X 200
        if (textFields.contactName) {
          try {
            firstPage.drawText(textFields.contactName, {
              x: 200,
              y: 542.68, // 841.68 - 299 (measured from PDF)
              size: fontSize,
              font: font,
            });
            console.log(`✅ [ContractPreview] Drew contact name: "${textFields.contactName}" at (200, 542.68)`);
          } catch (textError) {
            console.error(`❌ [ContractPreview] Error drawing contact name:`, textError.message);
          }
        } else {
          console.warn('⚠️ [ContractPreview] contactName is empty, skipping');
        }
        
        // Contact Position - "Chức vụ:" (if exists in template)
        // Note: Position not specified in grid, using estimated position below contact name
        if (textFields.contactPosition && textFields.contactPosition !== 'Đại diện') {
          firstPage.drawText(textFields.contactPosition, {
            x: 110,
            y: 385, // Estimated: 20px below contact name
            size: fontSize,
            font: font,
          });
          console.log(`✅ [ContractPreview] Drew contact position: "${textFields.contactPosition}" at (110, 385)`);
        }
        
        console.log('✅ [ContractPreview] Text overlay completed');
      }

      form.flatten();

      const fileName = `preview-${previewContractId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await pdfDoc.save();
      await fsPromises.writeFile(filePath, pdfBytes);

      const relativePath = `/uploads/contracts/${fileName}`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const fullUrl = `${backendUrl}${relativePath}`;
      
      console.log(`✅ Preview PDF generated: ${fileName}`);
      console.log(`📄 PDF URL: ${fullUrl}`);
      console.log(`📁 File path: ${filePath}`);
      console.log(`🌐 Backend URL: ${backendUrl}`);
      
      if (!await fsPromises.access(filePath).then(() => true).catch(() => false)) {
        throw new Error(`PDF file không tồn tại sau khi tạo: ${filePath}`);
      }
      
      return fullUrl;
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      throw error;
    }
  }

  async listPdfFormFields() {
    try {
      const uploadsDir = await getContractsUploadDir();
      const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      const { PDFDocument } = require('pdf-lib');
      const templateBytes = await fsPromises.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      const form = pdfDoc.getForm();
      const formFields = form.getFields();

      const fieldsInfo = formFields.map(field => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        let fieldValue = '';
        
        try {
          if (fieldType === 'PDFTextField') {
            fieldValue = field.getText() || '';
          }
        } catch (e) {
          fieldValue = 'N/A';
        }

        return {
          name: fieldName,
          type: fieldType,
          currentValue: fieldValue
        };
      });

      return {
        totalFields: fieldsInfo.length,
        fields: fieldsInfo
      };
    } catch (error) {
      console.error('Error listing PDF form fields:', error);
      throw error;
    }
  }

  /**
   * Debug endpoint: Test text overlay with custom coordinates
   * @param {Object} options - Test options
   * @param {number} options.baseY - Starting Y position (default: calculated from height)
   * @param {number} options.textX - X position for text (default: 130)
   * @param {number} options.lineHeight - Space between lines (default: 18)
   * @param {number} options.fontSize - Font size (default: 11)
   */
  async testTextOverlay(options = {}) {
    try {
      const uploadsDir = await getContractsUploadDir();

      const templatePath = path.join(uploadsDir, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      const { PDFDocument } = require('pdf-lib');
      const templateBytes = await fsPromises.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      const font = await this.loadVietnameseFont(pdfDoc);
      
      // Default values (recommended coordinates)
      const fontSize = options.fontSize || 11;
      const baseY = options.baseY !== undefined ? parseFloat(options.baseY) : (height - 240);
      const textX = options.textX !== undefined ? parseFloat(options.textX) : 135;
      const lineHeight = options.lineHeight !== undefined ? parseFloat(options.lineHeight) : 19;

      // Sample data for testing
      const testData = {
        companyName: 'CÔNG TY TNHH TEST DEBUG',
        companyEmail: 'test@example.com',
        companyAddress: '123 Đường Test, Phường Test, Quận Test, TP. Test',
        companyPhone: '0123456789',
        companyTaxCode: '1234567890',
        contactName: 'Nguyễn Văn Test',
        contactPosition: 'Giám đốc'
      };

      console.log(`🔧 [Debug] Testing text overlay with:`);
      console.log(`   - baseY: ${baseY}`);
      console.log(`   - textX: ${textX}`);
      console.log(`   - lineHeight: ${lineHeight}`);
      console.log(`   - fontSize: ${fontSize}`);
      console.log(`   - Page size: ${width} x ${height}`);

      let currentY = baseY;

      // Draw grid lines for reference (optional)
      if (options.showGrid) {
        // Draw horizontal lines every 20 points
        for (let y = 0; y < height; y += 20) {
          firstPage.drawLine({
            start: { x: 0, y },
            end: { x: width, y },
            thickness: 0.5,
            color: { r: 0.9, g: 0.9, b: 0.9 }
          });
        }
        // Draw vertical lines every 50 points
        for (let x = 0; x < width; x += 50) {
          firstPage.drawLine({
            start: { x, y: 0 },
            end: { x, y: height },
            thickness: 0.5,
            color: { r: 0.9, g: 0.9, b: 0.9 }
          });
        }
      }

      // Draw coordinate markers
      firstPage.drawText(`Y=${currentY.toFixed(0)}`, {
        x: 10,
        y: currentY,
        size: 8,
        font: font,
        color: { r: 1, g: 0, b: 0 }
      });

      // Company Name
      if (testData.companyName) {
        firstPage.drawText(testData.companyName, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew company name at (${textX}, ${currentY})`);
      }
      currentY -= lineHeight;

      // Company Email
      if (testData.companyEmail) {
        firstPage.drawText(testData.companyEmail, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew company email at (${textX}, ${currentY})`);
      }
      currentY -= lineHeight;

      // Company Address
      if (testData.companyAddress) {
        const maxCharsPerLine = 60;
        const addressLines = [];
        let remaining = testData.companyAddress;
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
          firstPage.drawText(line, {
            x: textX,
            y: currentY - (index * lineHeight),
            size: fontSize,
            font: font,
          });
        });
        currentY -= (addressLines.length * lineHeight);
        console.log(`✅ Drew company address (${addressLines.length} lines) starting at y=${currentY + (addressLines.length * lineHeight)}`);
      } else {
        currentY -= lineHeight;
      }

      // Company Phone
      if (testData.companyPhone) {
        firstPage.drawText(testData.companyPhone, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew company phone at (${textX}, ${currentY})`);
      }
      currentY -= lineHeight;

      // Company Tax Code
      if (testData.companyTaxCode) {
        firstPage.drawText(testData.companyTaxCode, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew company tax code at (${textX}, ${currentY})`);
      }
      currentY -= lineHeight;

      // Contact Name
      if (testData.contactName) {
        firstPage.drawText(testData.contactName, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew contact name at (${textX}, ${currentY})`);
      }
      currentY -= lineHeight;

      // Contact Position
      if (testData.contactPosition) {
        firstPage.drawText(testData.contactPosition, {
          x: textX,
          y: currentY,
          size: fontSize,
          font: font,
        });
        console.log(`✅ Drew contact position at (${textX}, ${currentY})`);
      }

      const fileName = `debug-test-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfBytes = await pdfDoc.save();
      await fsPromises.writeFile(filePath, pdfBytes);

      const relativePath = `/uploads/contracts/${fileName}`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const fullUrl = `${backendUrl}${relativePath}`;

      return {
        pdfUrl: fullUrl,
        coordinates: {
          baseY,
          textX,
          lineHeight,
          fontSize,
          pageSize: { width, height }
        },
        testData
      };
    } catch (error) {
      console.error('Error testing text overlay:', error);
      throw error;
    }
  }
}

module.exports = new ContractService();

