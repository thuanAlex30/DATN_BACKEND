const { body, param, query, validationResult } = require('express-validator');

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation cho tạo sự cố mới
const validateCreateIncident = [
  body('title')
    .notEmpty()
    .withMessage('Tiêu đề sự cố là bắt buộc')
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  
  body('description')
    .optional()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Mô tả phải có từ 5-1000 ký tự'),
  
  body('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Địa điểm phải có từ 2-100 ký tự'),
  
  body('severity')
    .optional()
    .isIn(['nhẹ', 'nặng', 'rất nghiêm trọng'])
    .withMessage('Mức độ nghiêm trọng không hợp lệ'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Hình ảnh phải là mảng'),
  
  body('images.*')
    .optional()
    .isString()
    .withMessage('Hình ảnh phải là chuỗi'),
  
  handleValidationErrors
];

// Validation cho phân loại sự cố
const validateClassifyIncident = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('severity')
    .notEmpty()
    .withMessage('Mức độ nghiêm trọng là bắt buộc')
    .isIn(['nhẹ', 'nặng', 'rất nghiêm trọng'])
    .withMessage('Mức độ nghiêm trọng không hợp lệ'),
  
  body('category')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Danh mục phải có từ 2-50 ký tự'),
  
  body('priority')
    .optional()
    .isIn(['thấp', 'trung bình', 'cao', 'khẩn cấp'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho phân công sự cố
const validateAssignIncident = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('assignedTo')
    .notEmpty()
    .withMessage('Người được phân công là bắt buộc')
    .isMongoId()
    .withMessage('ID người được phân công không hợp lệ'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày hết hạn không hợp lệ')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Ngày hết hạn phải lớn hơn ngày hiện tại');
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được quá 500 ký tự'),
  
  handleValidationErrors
];

// Validation cho điều tra sự cố
const validateInvestigateIncident = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('findings')
    .notEmpty()
    .withMessage('Kết quả điều tra là bắt buộc')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Kết quả điều tra phải có từ 10-2000 ký tự'),
  
  
  body('recommendations')
    .optional()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Khuyến nghị phải có từ 5-1000 ký tự'),
  
  handleValidationErrors
];

// Validation cho cập nhật tiến độ
const validateUpdateProgress = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('progress')
    .notEmpty()
    .withMessage('Tiến độ là bắt buộc')
    .isInt({ min: 0, max: 100 })
    .withMessage('Tiến độ phải là số từ 0-100'),
  
  body('note')
    .notEmpty()
    .withMessage('Ghi chú tiến độ là bắt buộc')
    .isLength({ min: 5, max: 500 })
    .withMessage('Ghi chú tiến độ phải có từ 5-500 ký tự'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Tệp đính kèm phải là mảng'),
  
  body('attachments.*')
    .optional()
    .isString()
    .withMessage('Tệp đính kèm phải là chuỗi'),
  
  handleValidationErrors
];

// Validation cho đóng sự cố
const validateCloseIncident = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('resolution')
    .optional()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Giải pháp phải có từ 5-2000 ký tự'),
  
  body('lessonsLearned')
    .optional()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Bài học kinh nghiệm phải có từ 5-1000 ký tự'),
  
  body('preventiveMeasures')
    .optional()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Biện pháp phòng ngừa phải có từ 5-1000 ký tự'),
  
  handleValidationErrors
];

// Validation cho lấy danh sách sự cố
const validateGetIncidents = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng mỗi trang phải từ 1-100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'severity', 'status', 'title'])
    .withMessage('Trường sắp xếp không hợp lệ'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là asc hoặc desc'),
  
  query('status')
    .optional()
    .isIn(['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'])
    .withMessage('Trạng thái không hợp lệ'),
  
  query('severity')
    .optional()
    .isIn(['nhẹ', 'nặng', 'rất nghiêm trọng'])
    .withMessage('Mức độ nghiêm trọng không hợp lệ'),
  
  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('ID người được phân công không hợp lệ'),
  
  query('createdBy')
    .optional()
    .isMongoId()
    .withMessage('ID người tạo không hợp lệ'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation cho tìm kiếm sự cố
const validateSearchIncidents = [
  query('q')
    .notEmpty()
    .withMessage('Từ khóa tìm kiếm là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải có từ 2-100 ký tự'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng mỗi trang phải từ 1-100'),
  
  handleValidationErrors
];

// Validation cho xuất báo cáo
const validateExportIncidents = [
  query('format')
    .optional()
    .isIn(['excel', 'pdf'])
    .withMessage('Định dạng xuất phải là excel hoặc pdf'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  
  query('status')
    .optional()
    .isIn(['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'])
    .withMessage('Trạng thái không hợp lệ'),
  
  query('severity')
    .optional()
    .isIn(['nhẹ', 'nặng', 'rất nghiêm trọng'])
    .withMessage('Mức độ nghiêm trọng không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho lấy thống kê
const validateGetStatistics = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Nhóm theo phải là day, week, month hoặc year'),
  
  handleValidationErrors
];

// Validation cho ID sự cố
const validateIncidentId = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho cập nhật sự cố
const validateUpdateIncident = [
  param('id')
    .isMongoId()
    .withMessage('ID sự cố không hợp lệ'),
  
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Mô tả phải có từ 10-1000 ký tự'),
  
  body('location')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Địa điểm phải có từ 3-100 ký tự'),
  
  body('severity')
    .optional()
    .isIn(['nhẹ', 'nặng', 'rất nghiêm trọng'])
    .withMessage('Mức độ nghiêm trọng không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'])
    .withMessage('Trạng thái không hợp lệ'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Hình ảnh phải là mảng'),
  
  body('images.*')
    .optional()
    .isString()
    .withMessage('Hình ảnh phải là chuỗi'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateIncident,
  validateClassifyIncident,
  validateAssignIncident,
  validateInvestigateIncident,
  validateUpdateProgress,
  validateCloseIncident,
  validateGetIncidents,
  validateSearchIncidents,
  validateExportIncidents,
  validateGetStatistics,
  validateIncidentId,
  validateUpdateIncident,
  handleValidationErrors
};
