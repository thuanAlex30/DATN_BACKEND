const { PayOS } = require('@payos/node');
const crypto = require('crypto');

class PayOSService {
  constructor() {
    this.clientId = process.env.PAYOS_CLIENT_ID;
    this.apiKey = process.env.PAYOS_API_KEY;
    this.checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    
    // Khởi tạo PayOS client
    if (this.clientId && this.apiKey && this.checksumKey) {
      this.payOS = new PayOS(
        this.clientId,
        this.apiKey,
        this.checksumKey
      );      
    }
    
    if (process.env.PAYOS_RETURN_URL && process.env.PAYOS_CANCEL_URL) {
      this.returnUrl = process.env.PAYOS_RETURN_URL;
      this.cancelUrl = process.env.PAYOS_CANCEL_URL;
    } else {
      // Mặc định: trỏ trực tiếp về frontend (localhost được chấp nhận)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      this.returnUrl = `${frontendUrl}/pricing/payment-success`;
      this.cancelUrl = `${frontendUrl}/pricing/payment-cancelled`;
    }
  }

  /**
   * Tạo payment link từ PayOS
   * @param {Object} paymentData - Dữ liệu thanh toán
   * @param {string} paymentData.orderId - Mã đơn hàng
   * @param {number} paymentData.amount - Số tiền (VNĐ)
   * @param {string} paymentData.description - Mô tả đơn hàng
   * @param {Object} paymentData.items - Danh sách sản phẩm (optional)
   * @returns {Promise<Object>} - Payment link và QR code
   */
  async createPaymentLink(paymentData) {
    const {
      orderId,
      amount,
      description = 'Thanh toán đơn hàng',
      items = []
    } = paymentData;

    // Validate credentials
    if (!this.clientId || !this.apiKey || !this.checksumKey) {
      throw new Error('PayOS chưa được cấu hình đầy đủ. Vui lòng kiểm tra PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
    }

    // PayOS yêu cầu returnUrl và cancelUrl trong API call (bắt buộc)
    // Nhưng business logic sẽ được xử lý bởi webhook, không phải return URL

    // Validate amount
    if (!amount || amount < 1000 || amount > 500000000) {
      throw new Error('Amount phải từ 1,000 VND đến 500,000,000 VND');
    }

    // Giới hạn description tối đa 25 ký tự (yêu cầu của PayOS)
    const maxDescriptionLength = 25;
    let truncatedDescription = description || 'Thanh toán đơn hàng';
    if (truncatedDescription.length > maxDescriptionLength) {
      truncatedDescription = truncatedDescription.substring(0, maxDescriptionLength);
      console.warn(`Description đã được cắt ngắn từ "${description}" thành "${truncatedDescription}" (tối đa ${maxDescriptionLength} ký tự)`);
    }

    // Tạo orderCode từ orderId (PayOS yêu cầu số nguyên 8 chữ số)
    // Extract số từ orderId hoặc dùng timestamp
    let orderCode = parseInt(orderId.replace(/\D/g, ''));
    if (!orderCode || orderCode.toString().length > 8) {
      // Nếu không extract được hoặc quá dài, dùng timestamp mod 100000000
      orderCode = Date.now() % 100000000;
    }
    // Đảm bảo orderCode có 8 chữ số
    orderCode = parseInt(orderCode.toString().padStart(8, '0').substring(0, 8));

    // Tạo payment data
    // PayOS API v2 sử dụng x-client-id và x-api-key trong headers để authenticate
    // Signature chỉ dùng cho webhook verification, không cần trong request body
    const paymentDataPayload = {
      orderCode: orderCode,
      amount: amount,
      description: truncatedDescription,
      items: items.length > 0 ? items.map(item => ({
        ...item,
        name: item.name && item.name.length > maxDescriptionLength 
          ? item.name.substring(0, maxDescriptionLength)
          : item.name || truncatedDescription
      })) : [
        {
          name: truncatedDescription,
          quantity: 1,
          price: amount
        }
      ],
      cancelUrl: this.cancelUrl,
      returnUrl: this.returnUrl
    };

    try {
      // Log để debug
      console.log('PayOS Request Payload:', JSON.stringify(paymentDataPayload, null, 2));

      // Sử dụng PayOS SDK
      if (!this.payOS) {
        throw new Error('PayOS chưa được khởi tạo. Vui lòng kiểm tra PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
      }

      // Gọi PayOS API qua SDK
      const paymentLinkResponse = await this.payOS.paymentRequests.create(paymentDataPayload);

      // Log response để debug
      console.log('PayOS Response:', JSON.stringify(paymentLinkResponse, null, 2));

      // PayOS SDK trả về object trực tiếp, không có wrapper code/desc
      if (paymentLinkResponse && paymentLinkResponse.checkoutUrl) {
        return {
          success: true,
          checkoutUrl: paymentLinkResponse.checkoutUrl,
          qrCode: paymentLinkResponse.qrCode,
          orderCode: paymentDataPayload.orderCode
        };
      } else {
        throw new Error('Không nhận được checkoutUrl từ PayOS');
      }
    } catch (error) {
      console.error('PayOS createPaymentLink error:', error.message || error);
      console.error('Error details:', error);
      
      // Thông báo lỗi chi tiết hơn
      const errorDesc = error.message || error.toString();
      if (errorDesc === 'Thông tin truyền lên không đúng' || errorDesc?.includes('không đúng')) {
        // Kiểm tra nếu returnUrl/cancelUrl là localhost
        const hasLocalhost = paymentDataPayload.returnUrl.includes('localhost') || 
                            paymentDataPayload.cancelUrl.includes('localhost');
        
        let errorMsg = 'Thông tin truyền lên không đúng.\n';
        errorMsg += '\n📋 Nguyên nhân có thể:\n';
        errorMsg += '\n1. ✅ Kiểm tra PayOS Dashboard:\n';
        errorMsg += '   - Đăng nhập: https://pay.payos.vn/web4s/\n';
        errorMsg += '   - Vào "Kênh kết nối" → Kiểm tra kênh đang "Hoạt động" (không bị tạm dừng)\n';
        errorMsg += '   - Copy lại Client ID, API Key, Checksum Key và cập nhật trong .env\n';
        
        if (hasLocalhost) {
          errorMsg += '\n2. ⚠️ PayOS có thể không chấp nhận localhost cho Return URL và Cancel URL:\n';
          errorMsg += '   - Return URL hiện tại: ' + paymentDataPayload.returnUrl + '\n';
          errorMsg += '   - Cancel URL hiện tại: ' + paymentDataPayload.cancelUrl + '\n';
          errorMsg += '\n   💡 Giải pháp:\n';
          errorMsg += '   a) Dùng ngrok để tạo public URL cho backend:\n';
          errorMsg += '      → Chạy: ngrok http 3000\n';
          errorMsg += '      → Chạy script: node scripts/get-ngrok-url.js\n';
          errorMsg += '      → Copy URL và thêm vào .env:\n';
          errorMsg += '         PAYOS_RETURN_URL=https://abc123.ngrok.io/api/pricing/payment-return\n';
          errorMsg += '         PAYOS_CANCEL_URL=https://abc123.ngrok.io/api/pricing/payment-cancel\n';
          errorMsg += '\n   b) Hoặc dùng ngrok cho frontend:\n';
          errorMsg += '      → Chạy: ngrok http 5173\n';
          errorMsg += '      → Thêm vào .env:\n';
          errorMsg += '         PAYOS_RETURN_URL=https://abc123.ngrok.io/pricing/payment-success\n';
          errorMsg += '         PAYOS_CANCEL_URL=https://abc123.ngrok.io/pricing/payment-cancelled\n';
          errorMsg += '\n   c) Hoặc trỏ về domain thật (production):\n';
          errorMsg += '      → PAYOS_RETURN_URL=https://yourdomain.com/pricing/payment-success\n';
          errorMsg += '      → PAYOS_CANCEL_URL=https://yourdomain.com/pricing/payment-cancelled\n';
        } else {
          errorMsg += '\n2. ⚠️ QUAN TRỌNG: Return URL và Cancel URL phải được cấu hình trên PayOS Dashboard:\n';
          errorMsg += '   - Đăng nhập: https://pay.payos.vn/web4s/\n';
          errorMsg += '   - Vào "Kênh kết nối" → Chọn kênh của bạn\n';
          errorMsg += '   - Thêm Return URL: ' + paymentDataPayload.returnUrl + '\n';
          errorMsg += '   - Thêm Cancel URL: ' + paymentDataPayload.cancelUrl + '\n';
          errorMsg += '   - Lưu cấu hình\n';
          errorMsg += '   - Xem hướng dẫn chi tiết: DATN_BACKEND/docs/PAYOS_FIX_RETURN_URL.md\n';
        }
        
        errorMsg += '\n3. Kiểm tra Amount: ' + paymentDataPayload.amount + ' VND (phải từ 1,000 - 500,000,000)\n';
        errorMsg += '\n4. Kiểm tra OrderCode: ' + paymentDataPayload.orderCode + ' (phải là số nguyên 8 chữ số)\n';
        
        // Log thêm thông tin để debug
        console.error('\n📋 Request Details:');
        console.error('  OrderCode:', paymentDataPayload.orderCode);
        console.error('  Amount:', paymentDataPayload.amount);
        console.error('  ReturnUrl:', paymentDataPayload.returnUrl);
        console.error('  CancelUrl:', paymentDataPayload.cancelUrl);
        console.error('  Description:', paymentDataPayload.description);
        console.error('  Items:', JSON.stringify(paymentDataPayload.items, null, 2));
        
        throw new Error(errorMsg);
      }
      
      throw new Error(errorDesc || error.message || 'Lỗi khi tạo payment link từ PayOS');
    }
  }

  /**
   * Verify payment webhook từ PayOS
   * @param {Object} webhookData - Dữ liệu từ PayOS webhook
   * @returns {Object} - Kết quả verify
   */
  verifyWebhook(webhookData) {
    try {
      const { data, signature } = webhookData;

      if (!data || !signature) {
        return {
          isValid: false,
          message: 'Thiếu dữ liệu webhook'
        };
      }

      // Tạo checksum từ data
      const dataString = JSON.stringify(data);
      const checksum = crypto
        .createHmac('sha256', this.checksumKey)
        .update(dataString)
        .digest('hex');

      // So sánh signature
      if (checksum === signature) {
        return {
          isValid: true,
          orderCode: data.orderCode,
          orderId: data.description || `ORDER-${data.orderCode}`, // Có thể lưu orderId trong description
          amount: data.amount,
          status: data.status, // 'PAID' hoặc 'CANCELLED'
          transactionId: data.transactionDateTime || data.id
        };
      }

      return {
        isValid: false,
        message: 'Invalid signature'
      };
    } catch (error) {
      console.error('PayOS verifyWebhook error:', error);
      return {
        isValid: false,
        message: error.message
      };
    }
  }

  /**
   * Lấy thông tin payment request
   * @param {number} orderCode - Mã đơn hàng PayOS
   * @returns {Promise<Object>} - Thông tin payment
   */
  async getPaymentInfo(orderCode) {
    try {
      if (!this.payOS) {
        throw new Error('PayOS chưa được khởi tạo');
      }

      const paymentInfo = await this.payOS.paymentRequests.get(orderCode);

      return {
        success: true,
        data: paymentInfo
      };
    } catch (error) {
      console.error('PayOS getPaymentInfo error:', error.message || error);
      throw new Error(error.message || 'Lỗi khi lấy thông tin payment');
    }
  }

  /**
   * Hủy payment link
   * @param {number} orderCode - Mã đơn hàng PayOS
   * @returns {Promise<Object>} - Kết quả hủy
   */
  async cancelPaymentLink(orderCode) {
    try {
      if (!this.payOS) {
        throw new Error('PayOS chưa được khởi tạo');
      }

      await this.payOS.paymentRequests.cancel(orderCode);

      return {
        success: true,
        message: 'Đã hủy payment link thành công'
      };
    } catch (error) {
      console.error('PayOS cancelPaymentLink error:', error.message || error);
      throw new Error(error.message || 'Lỗi khi hủy payment link');
    }
  }

  /**
   * Xác thực dữ liệu từ returnUrl/cancelUrl của PayOS
   * PayOS sẽ redirect về returnUrl/cancelUrl với query params chứa thông tin thanh toán
   * @param {Object} queryParams - Query parameters từ URL
   * @returns {Object} - Kết quả xác thực và thông tin thanh toán
   */
  verifyReturnUrl(queryParams) {
    try {
      // PayOS trả về các thông tin sau trong returnUrl/cancelUrl:
      // - code: Mã kết quả ('00' = thành công, khác = lỗi)
      // - desc: Mô tả kết quả
      // - data: Object chứa thông tin thanh toán
      //   - orderCode: Mã đơn hàng PayOS
      //   - amount: Số tiền
      //   - description: Mô tả
      //   - accountNumber: Số tài khoản
      //   - accountName: Tên tài khoản
      //   - transactionDateTime: Thời gian giao dịch
      //   - paymentLinkId: Mã link thanh toán
      //   - code: Mã kết quả
      //   - desc: Mô tả

      const { code, desc, data } = queryParams;

      if (!code) {
        return {
          isValid: false,
          message: 'Thiếu thông tin từ PayOS'
        };
      }

      // Parse data nếu là string (JSON)
      let paymentData = data;
      if (typeof data === 'string') {
        try {
          paymentData = JSON.parse(data);
        } catch (e) {
          // Nếu không parse được, có thể data đã là object hoặc format khác
          paymentData = data;
        }
      }

      // Kiểm tra code
      const isSuccess = code === '00';

      return {
        isValid: true,
        success: isSuccess,
        code: code,
        message: desc || (isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'),
        orderCode: paymentData?.orderCode || queryParams.orderCode,
        amount: paymentData?.amount || queryParams.amount,
        description: paymentData?.description || queryParams.description,
        accountNumber: paymentData?.accountNumber || queryParams.accountNumber,
        accountName: paymentData?.accountName || queryParams.accountName,
        transactionDateTime: paymentData?.transactionDateTime || queryParams.transactionDateTime,
        paymentLinkId: paymentData?.paymentLinkId || queryParams.paymentLinkId,
        rawData: paymentData || queryParams
      };
    } catch (error) {
      console.error('PayOS verifyReturnUrl error:', error);
      return {
        isValid: false,
        message: error.message
      };
    }
  }
}

module.exports = new PayOSService();

