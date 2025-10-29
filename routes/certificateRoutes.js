const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/certificateController');
const { body, param, query } = require('express-validator');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Validation rules
const createCertificateValidation = [
    body('certificateName')
        .notEmpty()
        .withMessage('Tên chứng chỉ là bắt buộc')
        .isLength({ max: 200 })
        .withMessage('Tên chứng chỉ không được vượt quá 200 ký tự'),
    
    body('certificateCode')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Mã chứng chỉ không được vượt quá 50 ký tự')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('Mã chứng chỉ chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),
    
    body('category')
        .isIn(['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'])
        .withMessage('Danh mục không hợp lệ'),
    
    body('subCategory')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Danh mục phụ không được vượt quá 100 ký tự'),
    
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
        .withMessage('Mức độ ưu tiên không hợp lệ'),
    
    body('issuingAuthority')
        .notEmpty()
        .withMessage('Cơ quan cấp phát là bắt buộc')
        .isLength({ max: 200 })
        .withMessage('Cơ quan cấp phát không được vượt quá 200 ký tự'),
    
    body('validityPeriod')
        .isInt({ min: 1, max: 120 })
        .withMessage('Thời gian hiệu lực phải từ 1 đến 120 tháng'),
    
    body('validityPeriodUnit')
        .optional()
        .isIn(['MONTHS', 'YEARS'])
        .withMessage('Đơn vị thời gian hiệu lực không hợp lệ'),
    
    body('cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Chi phí phải là số dương'),
    
    body('currency')
        .optional()
        .isLength({ max: 3 })
        .withMessage('Mã tiền tệ không được vượt quá 3 ký tự'),
    
    body('reminderSettings.reminderDays')
        .optional()
        .isArray()
        .withMessage('Danh sách ngày nhắc nhở phải là mảng'),
    
    body('reminderSettings.reminderDays.*')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Mỗi ngày nhắc nhở phải từ 1 đến 365'),
    
    body('reminderSettings.notificationMethods')
        .optional()
        .isArray()
        .withMessage('Phương thức thông báo phải là mảng'),
    
    body('reminderSettings.notificationMethods.*')
        .optional()
        .isIn(['EMAIL', 'SMS', 'SYSTEM'])
        .withMessage('Phương thức thông báo không hợp lệ'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    
    body('tags.*')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Mỗi tag không được vượt quá 50 ký tự')
];

const updateCertificateValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID chứng chỉ không hợp lệ'),
    
    body('certificateName')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Tên chứng chỉ không được vượt quá 200 ký tự'),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),
    
    body('category')
        .optional()
        .isIn(['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'])
        .withMessage('Danh mục không hợp lệ'),
    
    body('status')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'])
        .withMessage('Trạng thái không hợp lệ')
];

const idValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID chứng chỉ không hợp lệ')
];

const categoryValidation = [
    param('category')
        .isIn(['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'])
        .withMessage('Danh mục không hợp lệ')
];

const searchValidation = [
    query('q')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Từ khóa tìm kiếm không được vượt quá 100 ký tự'),
    
    query('category')
        .optional()
        .isIn(['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'])
        .withMessage('Danh mục không hợp lệ'),
    
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Số ngày phải từ 1 đến 365'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100')
];

// Routes
// Tạo chứng chỉ mới (chỉ admin và manager)
router.post('/', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'manager']),
    createCertificateValidation,
    CertificateController.createCertificate
);

// Lấy danh sách chứng chỉ (tất cả user đã đăng nhập)
router.get('/', 
    AuthMiddleware.authenticate,
    searchValidation,
    CertificateController.getCertificates
);

// Lấy chi tiết chứng chỉ
router.get('/:id', 
    AuthMiddleware.authenticate,
    idValidation,
    CertificateController.getCertificateById
);

// Cập nhật chứng chỉ (chỉ admin và manager)
router.put('/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'manager']),
    updateCertificateValidation,
    CertificateController.updateCertificate
);

// Xóa chứng chỉ (chỉ admin)
router.delete('/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin']),
    idValidation,
    CertificateController.deleteCertificate
);

// Lấy chứng chỉ theo danh mục
router.get('/category/:category', 
    AuthMiddleware.authenticate,
    categoryValidation,
    CertificateController.getCertificatesByCategory
);

// Lấy chứng chỉ sắp hết hạn
router.get('/expiring/soon', 
    AuthMiddleware.authenticate,
    searchValidation,
    CertificateController.getExpiringCertificates
);

// Lấy thống kê chứng chỉ (chỉ admin và manager)
router.get('/stats/overview', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'manager']),
    CertificateController.getCertificateStats
);

// Tìm kiếm chứng chỉ
router.get('/search/query', 
    AuthMiddleware.authenticate,
    searchValidation,
    CertificateController.searchCertificates
);

// Cập nhật cài đặt nhắc nhở (chỉ admin và manager)
router.put('/:id/reminder-settings', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'manager']),
    [
        ...idValidation,
        body('reminderSettings.enabled')
            .optional()
            .isBoolean()
            .withMessage('Trạng thái nhắc nhở phải là boolean'),
        
        body('reminderSettings.reminderDays')
            .optional()
            .isArray()
            .withMessage('Danh sách ngày nhắc nhở phải là mảng'),
        
        body('reminderSettings.reminderDays.*')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('Mỗi ngày nhắc nhở phải từ 1 đến 365'),
        
        body('reminderSettings.notificationMethods')
            .optional()
            .isArray()
            .withMessage('Phương thức thông báo phải là mảng'),
        
        body('reminderSettings.notificationMethods.*')
            .optional()
            .isIn(['EMAIL', 'SMS', 'SYSTEM'])
            .withMessage('Phương thức thông báo không hợp lệ'),
        
        body('reminderSettings.recipients')
            .optional()
            .isArray()
            .withMessage('Danh sách người nhận phải là mảng'),
        
        body('reminderSettings.recipients.*')
            .optional()
            .isMongoId()
            .withMessage('ID người nhận không hợp lệ')
    ],
    CertificateController.updateReminderSettings
);

// Gia hạn chứng chỉ (chỉ admin và manager)
router.post('/:id/renew', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'manager']),
    [
        ...idValidation,
        body('renewalDate')
            .optional()
            .isISO8601()
            .withMessage('Ngày gia hạn không hợp lệ'),
        
        body('notes')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Ghi chú không được vượt quá 2000 ký tự')
    ],
    CertificateController.renewCertificate
);

module.exports = router;
