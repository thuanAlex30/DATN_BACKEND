const ContractRepository = require('../repository/ContractRepository');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const fontkit = require('@pdf-lib/fontkit');
const cloudinary = require('cloudinary').v2;

// Resolve a writable uploads/contracts directory.
// Uses env UPLOADS_DIR or project uploads folder, falls back to /tmp/uploads.
const DEFAULT_UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../uploads');
const FALLBACK_UPLOADS_DIR = path.resolve('/tmp/uploads');
let resolvedContractsDir = null;

// Template directory (read‑only is fine – used only for reading the base PDF)
// Always points to the project uploads/contracts folder inside the image.
const TEMPLATE_CONTRACTS_DIR = path.resolve(__dirname, '../uploads/contracts');

// Cloudinary configuration (optional)
const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  folder: process.env.CLOUDINARY_CONTRACT_FOLDER || 'contracts'
};
const CLOUDINARY_ENABLED = Boolean(
  CLOUDINARY_CONFIG.cloudName &&
  CLOUDINARY_CONFIG.apiKey &&
  CLOUDINARY_CONFIG.apiSecret
);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret
  });
}

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

  /**
   * Upload PDF to Cloudinary (if configured). Returns secure URL or null on failure/disabled.
   */
  async uploadPdfToCloudinary(filePath, publicId, folder) {
    if (!CLOUDINARY_ENABLED) return null;
    try {
      const uploadFolder = folder || CLOUDINARY_CONFIG.folder || 'contracts';
      const res = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw', // allow PDFs
        type: 'upload',       // make it publicly accessible
        access_mode: 'public',
        folder: uploadFolder,
        public_id: publicId,
        overwrite: true,
        format: 'pdf' // ensure pdf extension for delivery
      });
      console.log(`✅ [Cloudinary] Uploaded PDF: ${res.secure_url}`);
      return {
        secureUrl: res.secure_url,
        publicId: res.public_id // already includes folder prefix
      };
    } catch (err) {
      console.error('⚠️ [Cloudinary] Upload failed:', err.message);
      return null;
    }
  }

  /**
   * Generate a signed download URL for Cloudinary raw PDF.
   */
  getCloudinaryDownloadUrl(publicIdWithPath) {
    if (!CLOUDINARY_ENABLED || !publicIdWithPath) return null;
    try {
      // Prefer signed URL; if fails, caller should fall back to secureUrl.
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1h
      const url = cloudinary.utils.private_download_url(
        publicIdWithPath,
        'pdf',
        {
          resource_type: 'raw',
          expires_at: expiresAt,
          attachment: false
        }
      );
      return url;
    } catch (err) {
      console.error('⚠️ [Cloudinary] Cannot create signed URL:', err.message);
      return null;
    }
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
      // Always read template from the project template folder (can be read‑only in production)
      const templatePath = path.join(TEMPLATE_CONTRACTS_DIR, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      // Template PDF đã có sẵn dữ liệu, chỉ cần copy file
      const fileName = `contract-${contract.contractId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Read template PDF into buffer and write to output (avoids file lock issues on Windows)
      const templateBytes = await fsPromises.readFile(templatePath);
      await fsPromises.writeFile(filePath, templateBytes);
      console.log(`✅ [Contract] Copied template PDF: ${fileName}`);

      const relativePath = `/uploads/contracts/${fileName}`;
      const fullUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}${relativePath}`;
      const remoteUpload = await this.uploadPdfToCloudinary(
        filePath,
        `contract-${contract.contractId}`,
        process.env.CLOUDINARY_CONTRACT_FOLDER || 'contracts'
      );
      const remoteUrl =
        remoteUpload?.secureUrl ||
        this.getCloudinaryDownloadUrl(remoteUpload?.publicId);
      
      console.log(`✅ PDF generated from template: ${fileName}`);
      return remoteUrl || fullUrl;
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
      // Always read template from the project template folder (can be read‑only in production)
      const templatePath = path.join(TEMPLATE_CONTRACTS_DIR, 'CHMS_HopDongThanhToan.pdf');
      
      if (!await fsPromises.access(templatePath).then(() => true).catch(() => false)) {
        throw new Error('Template PDF không tồn tại: CHMS_HopDongThanhToan.pdf');
      }

      // Template PDF đã có sẵn dữ liệu, chỉ cần copy file
      const previewContractId = `PREVIEW-${Date.now()}`;
      const fileName = `preview-${previewContractId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Read template PDF into buffer and write to output (avoids file lock issues on Windows)
      const templateBytes = await fsPromises.readFile(templatePath);
      await fsPromises.writeFile(filePath, templateBytes);
      console.log(`✅ [ContractPreview] Copied template PDF: ${fileName}`);

      const relativePath = `/uploads/contracts/${fileName}`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const fullUrl = `${backendUrl}${relativePath}`;
      const remoteUpload = await this.uploadPdfToCloudinary(
        filePath,
        previewContractId,
        process.env.CLOUDINARY_CONTRACT_FOLDER
          ? `${process.env.CLOUDINARY_CONTRACT_FOLDER}/previews`
          : 'contracts/previews'
      );
      const remoteUrl =
        remoteUpload?.secureUrl ||
        this.getCloudinaryDownloadUrl(remoteUpload?.publicId);
      
      console.log(`✅ Preview PDF generated: ${fileName}`);
      console.log(`📄 PDF URL: ${fullUrl}`);
      console.log(`📁 File path: ${filePath}`);
      console.log(`🌐 Backend URL: ${backendUrl}`);
      
      if (!await fsPromises.access(filePath).then(() => true).catch(() => false)) {
        throw new Error(`PDF file không tồn tại sau khi tạo: ${filePath}`);
      }
      
      // Upload lên Cloudinary để lưu trữ, nhưng luôn serve qua backend.
      if (remoteUrl) {
        console.log(`🌐 Cloudinary URL (preview, stored only): ${remoteUrl}`);
      } else {
        console.warn('⚠️ Cloudinary upload unavailable, only backend URL will be used');
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
      // Always read template from the project template folder (can be read‑only in production)
      const templatePath = path.join(TEMPLATE_CONTRACTS_DIR, 'CHMS_HopDongThanhToan.pdf');
      
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

      // Always read template from the project template folder (can be read‑only in production)
      const templatePath = path.join(TEMPLATE_CONTRACTS_DIR, 'CHMS_HopDongThanhToan.pdf');
      
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

      // Debug-only helper; avoid verbose console logging in production.

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

