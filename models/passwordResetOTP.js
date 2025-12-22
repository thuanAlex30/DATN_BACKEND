const mongoose = require('mongoose');

const passwordResetOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Tự động xóa sau khi hết hạn
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Tối đa 5 lần thử
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tự động xóa OTP đã hết hạn
passwordResetOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index để tìm OTP chưa verify
passwordResetOTPSchema.index({ email: 1, verified: 1, expiresAt: 1 });

// Method để kiểm tra OTP có hợp lệ không
passwordResetOTPSchema.methods.isValid = function() {
  return !this.verified && this.expiresAt > new Date() && this.attempts < 5;
};

// Method để đánh dấu đã verify
passwordResetOTPSchema.methods.markAsVerified = function() {
  this.verified = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Method để tăng số lần thử
passwordResetOTPSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

const PasswordResetOTP = mongoose.model('PasswordResetOTP', passwordResetOTPSchema);

module.exports = PasswordResetOTP;

