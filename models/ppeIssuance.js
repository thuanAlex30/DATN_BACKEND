const mongoose = require('mongoose');

const ppeIssuanceSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false
  },
  // Người nhận PPE (có thể là Manager hoặc Employee)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Thiết bị PPE
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PPEItem',
    required: true
  },
  // Số lượng phát
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Ngày phát
  issued_date: {
    type: Date,
    required: true
  },
  // Ngày trả dự kiến
  expected_return_date: {
    type: Date,
    required: true
  },
  // Người phát PPE (Admin phát cho Manager, Manager phát cho Employee)
  issued_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Cấp độ phát: 'admin_to_manager' hoặc 'manager_to_employee'
  issuance_level: {
    type: String,
    enum: ['admin_to_manager', 'manager_to_employee'],
    required: true
  },
  // ID của Manager (nếu phát cho Employee)
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.issuance_level === 'manager_to_employee';
    }
  },
  // Trạng thái PPE
  status: {
    type: String,
    enum: ['pending_confirmation', 'issued', 'returned', 'overdue', 'damaged', 'replacement_needed', 'pending_manager_return'],
    default: 'pending_confirmation'
  },
  // Ngày trả thực tế
  actual_return_date: {
    type: Date
  },
  // Tình trạng khi trả
  return_condition: {
    type: String,
    enum: ['good', 'damaged', 'worn']
  },
  // Ghi chú
  notes: {
    type: String,
    maxlength: 500
  },
  // Loại báo cáo sự cố
  report_type: {
    type: String,
    enum: ['damage', 'replacement', 'lost']
  },
  // Mô tả báo cáo sự cố
  report_description: {
    type: String,
    maxlength: 1000
  },
  // Mức độ nghiêm trọng
  report_severity: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  // Ngày báo cáo sự cố
  reported_date: {
    type: Date
  },
  // Số lượng còn lại của Manager (chỉ áp dụng khi Manager phát cho Employee)
  manager_remaining_quantity: {
    type: Number,
    min: 0,
    default: function() {
      return this.issuance_level === 'manager_to_employee' ? this.quantity : undefined;
    }
  },
  // Số lượng còn lại có thể trả (cho trường hợp trả từng phần)
  remaining_quantity: {
    type: Number,
    min: 0
  },
  // Serial numbers được gán cho employee này (individual tracking)
  assigned_serial_numbers: [{
    type: String,
    maxlength: 100
  }],
  // Serial numbers đã được trả lại (khi trả từng phần)
  returned_serial_numbers: [{
    type: String,
    maxlength: 100
  }],
  // Ngày xác nhận nhận PPE
  confirmed_date: {
    type: Date
  },
  // Ghi chú khi xác nhận nhận PPE
  confirmation_notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ppeIssuanceSchema.index({ user_id: 1, status: 1 });
ppeIssuanceSchema.index({ item_id: 1, status: 1 });
ppeIssuanceSchema.index({ status: 1, expected_return_date: 1 });
ppeIssuanceSchema.index({ issued_date: -1 });
ppeIssuanceSchema.index({ issuance_level: 1, status: 1 });
ppeIssuanceSchema.index({ manager_id: 1, status: 1 });
ppeIssuanceSchema.index({ issued_by: 1, issuance_level: 1 });

const PPEIssuance = mongoose.models.PPEIssuance || mongoose.model('PPEIssuance', ppeIssuanceSchema);

module.exports = PPEIssuance;