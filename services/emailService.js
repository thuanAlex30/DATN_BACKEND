const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Gửi email tài khoản/mật khẩu
   */
  async sendAccountCredentials({ to, username, password, companyName, loginUrl }) {
    const mailOptions = {
      from: `"Hệ Thống An Toàn" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Thông tin tài khoản đăng nhập - Hệ Thống Quản Lý An Toàn Lao Động',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #1890ff; }
            .button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với Hệ Thống Quản Lý An Toàn Lao Động</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Cảm ơn bạn đã đăng ký sử dụng dịch vụ của chúng tôi cho công ty <strong>${companyName}</strong>.</p>
              
              <div class="credentials">
                <h3>Thông tin đăng nhập của bạn:</h3>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <p><strong>Mật khẩu:</strong> ${password}</p>
                <p style="color: #1890ff; font-weight: bold;">💡 Vui lòng liên hệ quản trị viên hệ thống nếu cần đổi mật khẩu hoặc hỗ trợ thêm.</p>
              </div>

              <p>Bạn có thể đăng nhập vào hệ thống bằng cách nhấn vào nút bên dưới:</p>
              <a href="${loginUrl}" class="button">Đăng nhập ngay</a>
              
              <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ Hệ Thống Quản Lý An Toàn Lao Động</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  /**
   * Gửi lại email thông tin đăng nhập (khi resend)
   * Dùng khi đã tạo tài khoản nhưng cần gửi lại email
   */
  async sendAccountCredentialsResend({ to, username, companyName, loginUrl, forgotPasswordUrl }) {
    const mailOptions = {
      from: `"Hệ Thống An Toàn" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Thông tin tài khoản đăng nhập - Hệ Thống Quản Lý An Toàn Lao Động',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #1890ff; }
            .button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; margin-right: 10px; }
            .button-secondary { display: inline-block; padding: 12px 30px; background: #52c41a; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff7e6; border-left: 4px solid #faad14; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thông tin tài khoản đăng nhập</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Cảm ơn bạn đã đăng ký sử dụng dịch vụ của chúng tôi cho công ty <strong>${companyName}</strong>.</p>
              
              <div class="credentials">
                <h3>Thông tin đăng nhập của bạn:</h3>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <div class="warning">
                  <p><strong>⚠️ Lưu ý:</strong> Mật khẩu đã được gửi trong email đầu tiên. Nếu bạn chưa nhận được email hoặc quên mật khẩu, vui lòng sử dụng tính năng "Quên mật khẩu" để đặt lại mật khẩu mới.</p>
                </div>
              </div>

              <p>Bạn có thể đăng nhập vào hệ thống bằng cách nhấn vào nút bên dưới:</p>
              <a href="${loginUrl}" class="button">Đăng nhập ngay</a>
              <a href="${forgotPasswordUrl || loginUrl}" class="button-secondary">Quên mật khẩu?</a>
              
              <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ Hệ Thống Quản Lý An Toàn Lao Động</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Resend email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Resend email send error:', error);
      throw error;
    }
  }

  /**
   * Gửi email xác nhận thanh toán thành công
   */
  async sendPaymentConfirmation({ to, companyName, orderId, planType, amount, paymentDate, loginUrl, username, password }) {
    const planTypeNames = {
      monthly: 'Gói Tháng',
      quarterly: 'Gói Quý',
      yearly: 'Gói Năm'
    };

    // Nếu có username và password, hiển thị thông tin tài khoản
    const accountCredentialsSection = (username && password) ? `
              <div class="info" style="border-left: 4px solid #1890ff; margin-top: 20px;">
                <h3>🔐 Thông tin đăng nhập của bạn:</h3>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <p><strong>Mật khẩu:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #1890ff;">${password}</span></p>
                <p style="color: #1890ff; font-weight: bold; margin-top: 10px;">💡 Vui lòng liên hệ quản trị viên hệ thống nếu cần đổi mật khẩu hoặc hỗ trợ thêm.</p>
              </div>
    ` : '';

    const accountMessage = (username && password) 
      ? '<p>Tài khoản của bạn đã được tạo thành công. Vui lòng sử dụng thông tin đăng nhập bên dưới để truy cập hệ thống.</p>'
      : '<p>Đơn hàng của bạn đang được xử lý. Bạn sẽ nhận được email thông tin tài khoản trong vài phút tới.</p>';

    const mailOptions = {
      from: `"Hệ Thống An Toàn" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Xác nhận thanh toán thành công - Hệ Thống Quản Lý An Toàn Lao Động',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #52c41a; }
            .button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Thanh toán thành công</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Cảm ơn bạn đã thanh toán thành công cho công ty <strong>${companyName}</strong>.</p>
              
              <div class="info">
                <h3>Thông tin đơn hàng:</h3>
                <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
                <p><strong>Gói dịch vụ:</strong> ${planTypeNames[planType] || planType}</p>
                <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                <p><strong>Ngày thanh toán:</strong> ${paymentDate ? new Date(paymentDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}</p>
              </div>

              ${accountCredentialsSection}

              ${accountMessage}
              
              ${(username && password) ? `<a href="${loginUrl}" class="button">Đăng nhập ngay</a>` : ''}
              
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ Hệ Thống Quản Lý An Toàn Lao Động</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Payment confirmation email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Payment confirmation email send error:', error);
      throw error;
    }
  }

  /**
   * Gửi email xác nhận gia hạn gói
   */
  async sendRenewalConfirmation({ to, companyName, planType, expiresAt, loginUrl }) {
    const planTypeNames = {
      monthly: 'Gói Tháng',
      quarterly: 'Gói Quý',
      yearly: 'Gói Năm'
    };

    const mailOptions = {
      from: `"Hệ Thống An Toàn" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Xác nhận gia hạn gói dịch vụ - Hệ Thống Quản Lý An Toàn Lao Động',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #52c41a; }
            .button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác nhận gia hạn gói dịch vụ</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Cảm ơn bạn đã gia hạn gói dịch vụ cho công ty <strong>${companyName}</strong>.</p>
              
              <div class="info">
                <h3>Thông tin gói dịch vụ:</h3>
                <p><strong>Gói đã đăng ký:</strong> ${planTypeNames[planType] || planType}</p>
                <p><strong>Ngày hết hạn:</strong> ${expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>

              <p>Bạn có thể tiếp tục sử dụng dịch vụ bằng cách đăng nhập vào hệ thống:</p>
              <a href="${loginUrl}" class="button">Đăng nhập ngay</a>
              
              <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ Hệ Thống Quản Lý An Toàn Lao Động</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Renewal confirmation email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Renewal confirmation email send error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();

