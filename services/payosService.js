const { PayOS } = require('@payos/node');
const crypto = require('crypto');

class PayOSService {
  constructor() {
    this.clientId = process.env.PAYOS_CLIENT_ID;
    this.apiKey = process.env.PAYOS_API_KEY;
    this.checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    
    // Khởi tạo PayOS client
    if (this.clientId && this.apiKey && this.checksumKey) {
      try {
        // Thử khởi tạo với object format (theo PayOS SDK v2.0.3)
        this.payOS = new PayOS({
          clientId: this.clientId,
          apiKey: this.apiKey,
          checksumKey: this.checksumKey,
        });
        console.log('✅ PayOS SDK initialized with object format');
      } catch (error) {
        // Fallback: thử positional arguments nếu object format không work
        try {
          this.payOS = new PayOS(
            this.clientId,
            this.apiKey,
            this.checksumKey
          );
          console.log('✅ PayOS SDK initialized with positional arguments');
        } catch (fallbackError) {
          console.error('❌ Failed to initialize PayOS SDK:', fallbackError);
          this.payOS = null;
        }
      }
    } else {
      console.warn('⚠️ PayOS credentials missing. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
      this.payOS = new PayOS(
        this.clientId,
        this.apiKey,
        this.checksumKey
      );     
    }
    
    // Xác định returnUrl và cancelUrl
    // Ưu tiên: PAYOS_RETURN_URL/CANCEL_URL > Render URL > Frontend URL > localhost
    if (process.env.PAYOS_RETURN_URL && process.env.PAYOS_CANCEL_URL) {
      // Kiểm tra nếu URL có chứa ngrok (có thể đã offline)
      const returnUrl = process.env.PAYOS_RETURN_URL;
      const cancelUrl = process.env.PAYOS_CANCEL_URL;
      
      if (returnUrl.includes('ngrok') || cancelUrl.includes('ngrok')) {
        console.warn('⚠️ PayOS URLs đang trỏ đến ngrok (có thể đã offline). Sẽ sử dụng Render/Frontend URL thay thế.');
        // Fallback về Render/Frontend URL
        this._setDefaultUrls();
      } else {
        // Normalize URLs (remove double slashes)
        this.returnUrl = returnUrl.replace(/([^:]\/)\/+/g, '$1');
        this.cancelUrl = cancelUrl.replace(/([^:]\/)\/+/g, '$1');
      }
    } else {
      this._setDefaultUrls();
    }
    
    console.log('📋 PayOS Callback URLs:', {
      returnUrl: this.returnUrl,
      cancelUrl: this.cancelUrl
    });
  }

  /**
   * Helper: Set default return/cancel URLs
   * Ưu tiên: FRONTEND_URL > Production Vercel URL > Render Backend URL > localhost
   */
  _setDefaultUrls() {
    // Production Frontend URL
    const PRODUCTION_FRONTEND_URL = 'https://datn-fontend-sigma.vercel.app';
    
    // Xác định frontend URL - ưu tiên production URLs
    let frontendUrl = process.env.FRONTEND_URL;
    
    // Nếu không có FRONTEND_URL, dùng production Vercel URL
    if (!frontendUrl) {
      // Kiểm tra nếu đang chạy trên production (Render/Vercel)
      const isProduction = process.env.NODE_ENV === 'production' || 
                          process.env.RENDER_EXTERNAL_URL || 
                          process.env.RENDER_URL ||
                          process.env.VERCEL;
      
      // Luôn dùng production URL khi deploy, chỉ dùng localhost khi development local
      frontendUrl = isProduction ? PRODUCTION_FRONTEND_URL : 'http://localhost:5173';
    }
    
    // Luôn dùng frontend URL cho return/cancel (frontend sẽ xử lý redirect)
    this.returnUrl = `${frontendUrl}/pricing/payment-success`;
    this.cancelUrl = `${frontendUrl}/pricing/payment-cancelled`;
  }

  /**
   * Helper: Gọi PayOS API với retry logic
   * @param {Function} apiCall - Function gọi PayOS API
   * @param {number} maxRetries - Số lần retry tối đa
   * @param {number} retryCount - Số lần đã retry
   * @returns {Promise<any>} - Response từ PayOS API
   */
  async _callPayOSWithRetry(apiCall, maxRetries = 3, retryCount = 0) {
    try {
      return await apiCall();
    } catch (error) {
      const isConnectionError = error.message?.includes('Connection error') || 
                                error.message?.includes('ECONNREFUSED') ||
                                error.message?.includes('ETIMEDOUT') ||
                                error.message?.includes('ENOTFOUND') ||
                                error.constructor?.name === 'ConnectionError';
      
      if (isConnectionError && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.warn(`⚠️ PayOS connection error (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this._callPayOSWithRetry(apiCall, maxRetries, retryCount + 1);
      }
      throw error;
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
      console.log('PayOS Config Check:', {
        hasPayOS: !!this.payOS,
        hasClientId: !!this.clientId,
        hasApiKey: !!this.apiKey,
        hasChecksumKey: !!this.checksumKey,
        clientIdPrefix: this.clientId ? `${this.clientId.substring(0, 4)}...` : 'NOT SET',
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl
      });

      // Sử dụng PayOS SDK
      if (!this.payOS) {
        throw new Error('PayOS chưa được khởi tạo. Vui lòng kiểm tra PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
      }

      // Gọi PayOS API qua SDK với retry logic
      console.log('Calling PayOS API: paymentRequests.create()');
      const paymentLinkResponse = await this._callPayOSWithRetry(
        () => this.payOS.paymentRequests.create(paymentDataPayload),
        3 // max retries
      );

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
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error type:', error.constructor?.name);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
      console.error('Error statusCode:', error.statusCode);
      console.error('Error response:', error.response);
      
      // Thông báo lỗi chi tiết hơn
      const errorDesc = error.message || error.toString();
      const errorCode = error.code || error.statusCode || error.status;
      const isConnectionError = errorDesc?.includes('Connection error') || 
                                errorDesc?.includes('ECONNREFUSED') ||
                                errorDesc?.includes('ETIMEDOUT') ||
                                errorDesc?.includes('ENOTFOUND') ||
                                error.constructor?.name === 'ConnectionError';
      
      // Xử lý lỗi Connection Error
      if (isConnectionError) {
        let errorMsg = '❌ PayOS Connection Error - Không thể kết nối đến PayOS API.\n';
        errorMsg += '\n📋 Nguyên nhân có thể:\n';
        errorMsg += '\n1. ✅ Kiểm tra Network/Firewall trên Render:\n';
        errorMsg += '   - Render service có thể bị chặn kết nối ra ngoài\n';
        errorMsg += '   - PayOS API endpoint: https://api-merchant.payos.vn\n';
        errorMsg += '   - Kiểm tra Render logs để xem chi tiết lỗi network\n';
        errorMsg += '\n2. ✅ Kiểm tra PayOS API Status:\n';
        errorMsg += '   - PayOS API có thể đang bảo trì hoặc gặp sự cố\n';
        errorMsg += '   - Kiểm tra: https://status.payos.vn/ (nếu có)\n';
        errorMsg += '   - Thử lại sau vài phút\n';
        errorMsg += '\n3. ✅ Kiểm tra Timeout Settings:\n';
        errorMsg += '   - Render có thể timeout khi gọi PayOS API\n';
        errorMsg += '   - PayOS API có thể mất thời gian để phản hồi\n';
        errorMsg += '   - Đã thử retry 3 lần nhưng vẫn thất bại\n';
        errorMsg += '\n4. ✅ Giải pháp tạm thời:\n';
        errorMsg += '   - Thử lại sau vài phút\n';
        errorMsg += '   - Kiểm tra Render service logs để xem chi tiết\n';
        errorMsg += '   - Liên hệ PayOS support nếu vấn đề kéo dài\n';
        errorMsg += '\n5. ✅ Kiểm tra PayOS Credentials:\n';
        errorMsg += '   - Đảm bảo PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY đúng\n';
        errorMsg += '   - Copy lại từ PayOS Dashboard: https://pay.payos.vn/web4s/\n';
        
        console.error('\n📋 Connection Error Details:');
        console.error('  Error:', error.message);
        console.error('  Error Type:', error.constructor?.name);
        console.error('  Error Code:', error.code);
        console.error('  PayOS API Endpoint: https://api-merchant.payos.vn');
        console.error('  Request Payload:', JSON.stringify(paymentDataPayload, null, 2));
        
        throw new Error(errorMsg);
      }
      
      // Xử lý lỗi HTTP 404
      if (errorDesc?.includes('404') || errorCode === 404 || error.statusCode === 404 || error.status === 404) {
        let errorMsg = '❌ PayOS API trả về lỗi 404 (Not Found).\n';
        errorMsg += '\n📋 Nguyên nhân có thể:\n';
        errorMsg += '\n1. ✅ Kiểm tra PayOS Credentials trên Render:\n';
        errorMsg += '   - Đăng nhập Render Dashboard\n';
        errorMsg += '   - Vào Environment Variables của service\n';
        errorMsg += '   - Kiểm tra các biến:\n';
        errorMsg += '     * PAYOS_CLIENT_ID (phải có giá trị)\n';
        errorMsg += '     * PAYOS_API_KEY (phải có giá trị)\n';
        errorMsg += '     * PAYOS_CHECKSUM_KEY (phải có giá trị)\n';
        errorMsg += '   - Nếu thiếu hoặc sai, copy từ PayOS Dashboard:\n';
        errorMsg += '     → https://pay.payos.vn/web4s/\n';
        errorMsg += '     → Vào "Kênh kết nối" → Chọn kênh của bạn\n';
        errorMsg += '     → Copy Client ID, API Key, Checksum Key\n';
        errorMsg += '   - Sau khi cập nhật, restart service trên Render\n';
        errorMsg += '\n2. ✅ Kiểm tra PayOS Channel:\n';
        errorMsg += '   - Đăng nhập PayOS Dashboard: https://pay.payos.vn/web4s/\n';
        errorMsg += '   - Vào "Kênh kết nối" → Kiểm tra kênh đang "Hoạt động"\n';
        errorMsg += '   - Nếu kênh bị "Tạm dừng" hoặc không tồn tại, tạo kênh mới\n';
        errorMsg += '\n3. ✅ Kiểm tra Request Payload:\n';
        errorMsg += '   - OrderCode: ' + paymentDataPayload.orderCode + ' (phải là số nguyên 8 chữ số) ✓\n';
        errorMsg += '   - Amount: ' + paymentDataPayload.amount + ' VND (phải từ 1,000 - 500,000,000) ✓\n';
        errorMsg += '   - ReturnUrl: ' + paymentDataPayload.returnUrl + '\n';
        errorMsg += '   - CancelUrl: ' + paymentDataPayload.cancelUrl + '\n';
        errorMsg += '\n4. ✅ Kiểm tra PayOS SDK:\n';
        errorMsg += '   - Version: @payos/node@^2.0.3\n';
        errorMsg += '   - Xem docs: https://docs.payos.vn/\n';
        
        console.error('\n📋 Full Error Object:', error);
        console.error('\n📋 Request Payload:', JSON.stringify(paymentDataPayload, null, 2));
        
        throw new Error(errorMsg);
      }
      
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

