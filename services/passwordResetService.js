const PasswordResetOTP = require('../models/passwordResetOTP');
const UserRepository = require('../repository/UserRepository');
const HashUtils = require('../utils/hash');
const emailService = require('./emailService');
const { createResponse } = require('../utils/response');

class PasswordResetService {
  /**
   * Tạo mã OTP 6 chữ số
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Gửi mã OTP đến email
   */
  static async sendOTP(email, ipAddress = null, userAgent = null) {
    try {
      // Kiểm tra email có tồn tại trong hệ thống không
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // Không tiết lộ email có tồn tại hay không (bảo mật)
        return createResponse(200, 'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email của bạn.');
      }

      // Tạo mã OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

      // Xóa các OTP cũ của email này (chưa verify)
      await PasswordResetOTP.deleteMany({
        email: email.toLowerCase(),
        verified: false
      });

      // Lưu OTP mới
      const otpRecord = new PasswordResetOTP({
        email: email.toLowerCase(),
        otp,
        expiresAt,
        ipAddress,
        userAgent
      });
      await otpRecord.save();

      // Gửi email OTP
      const emailSubject = 'Mã OTP đặt lại mật khẩu';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Đặt lại mật khẩu</h2>
          </div>
          <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #2d3748; font-size: 16px;">Xin chào,</p>
            <p style="color: #4a5568; line-height: 1.6;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. 
              Vui lòng sử dụng mã OTP sau để xác nhận:
            </p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            <p style="color: #718096; font-size: 14px; margin-top: 20px;">
              <strong>Lưu ý:</strong>
            </p>
            <ul style="color: #718096; font-size: 14px; line-height: 1.8;">
              <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong></li>
              <li>Mã OTP chỉ có thể sử dụng <strong>1 lần</strong></li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            </ul>
            <p style="color: #a0aec0; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Đây là email tự động, vui lòng không trả lời email này.
            </p>
          </div>
        </div>
      `;

      try {
        await emailService._sendEmail({ to: email, subject: emailSubject, html: emailHtml });
        console.log(`✅ [PasswordReset] OTP sent to ${email} (via Resend)`);
      } catch (emailError) {
        console.error('❌ [PasswordReset] Error sending email via Resend:', emailError);
        // Vẫn trả về success để không tiết lộ email có tồn tại hay không
      }

      return createResponse(200, 'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email của bạn.', {
        expiresIn: 600 // 10 phút (giây)
      });
    } catch (error) {
      console.error('❌ [PasswordReset] Error sending OTP:', error);
      return createResponse(500, 'Lỗi khi gửi mã OTP', null, error.message);
    }
  }

  /**
   * Xác nhận mã OTP
   */
  static async verifyOTP(email, otp) {
    try {
      const otpRecord = await PasswordResetOTP.findOne({
        email: email.toLowerCase(),
        verified: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 }); // Lấy OTP mới nhất

      if (!otpRecord) {
        return createResponse(400, 'Mã OTP không tồn tại hoặc đã hết hạn');
      }

      if (!otpRecord.isValid()) {
        return createResponse(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
      }

      if (otpRecord.otp !== otp) {
        await otpRecord.incrementAttempts();
        const remainingAttempts = 5 - otpRecord.attempts;
        if (remainingAttempts <= 0) {
          return createResponse(400, 'Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng yêu cầu mã OTP mới.');
        }
        return createResponse(400, `Mã OTP không đúng. Bạn còn ${remainingAttempts} lần thử.`);
      }

      // Đánh dấu OTP đã được verify
      await otpRecord.markAsVerified();

      // Tạo token tạm thời để reset password (có thể dùng JWT hoặc đơn giản là lưu trong OTP record)
      // Ở đây ta sẽ dùng email + verified OTP để xác thực ở bước reset password
      return createResponse(200, 'Mã OTP hợp lệ', {
        token: otpRecord._id.toString() // Dùng OTP record ID làm token
      });
    } catch (error) {
      console.error('❌ [PasswordReset] Error verifying OTP:', error);
      return createResponse(500, 'Lỗi khi xác nhận mã OTP', null, error.message);
    }
  }

  /**
   * Đặt lại mật khẩu với OTP đã xác nhận
   */
  static async resetPassword(email, newPassword, otpToken) {
    try {
      // Kiểm tra OTP đã được verify chưa
      const otpRecord = await PasswordResetOTP.findById(otpToken);
      if (!otpRecord) {
        return createResponse(400, 'Token không hợp lệ');
      }

      if (!otpRecord.verified) {
        return createResponse(400, 'OTP chưa được xác nhận');
      }

      if (otpRecord.email.toLowerCase() !== email.toLowerCase()) {
        return createResponse(400, 'Email không khớp với OTP');
      }

      // Kiểm tra OTP đã được sử dụng chưa (có thể thêm flag used nếu cần)
      // Ở đây ta sẽ xóa OTP sau khi reset password thành công

      // Tìm user
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return createResponse(404, 'Người dùng không tồn tại');
      }

      // Hash mật khẩu mới
      const password_hash = await HashUtils.hashPassword(newPassword);

      // Cập nhật mật khẩu
      await UserRepository.updateById(user._id, { password_hash });

      // Xóa OTP đã sử dụng
      await PasswordResetOTP.deleteMany({
        email: email.toLowerCase(),
        verified: true
      });

      console.log(`✅ [PasswordReset] Password reset successful for ${email}`);

      return createResponse(200, 'Đặt lại mật khẩu thành công');
    } catch (error) {
      console.error('❌ [PasswordReset] Error resetting password:', error);
      return createResponse(500, 'Lỗi khi đặt lại mật khẩu', null, error.message);
    }
  }
}

module.exports = PasswordResetService;

