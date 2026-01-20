const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/certificateController');
const UserCertificateController = require('../controllers/userCertificateController');
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
// Tạo chứng chỉ mới (chỉ department_header và manager)
router.post('/', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    createCertificateValidation,
    CertificateController.createCertificate
);

// Lấy danh sách chứng chỉ (tất cả user đã đăng nhập)
router.get('/', 
    AuthMiddleware.authenticate,
    searchValidation,
    CertificateController.getCertificates
);

// ========== USER CERTIFICATE ROUTES (must be before /:id to avoid conflicts) ==========

// Get users by department for assignment
// IMPORTANT: This route must be placed BEFORE /:id route to avoid conflicts
router.get('/users/department/:departmentId',
    AuthMiddleware.authenticate,
    (req, res, next) => {
        console.log('🔍 Route matched: GET /users/department/:departmentId', {
            method: req.method,
            originalUrl: req.originalUrl,
            path: req.path,
            params: req.params,
            user: req.user ? {
                id: req.user._id,
                role_code: req.user.role_code,
                role_name: req.user.role?.role_name,
                tenant_id: req.user.tenant_id
            } : null
        });
        next();
    },
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    [
        param('departmentId')
            .isMongoId()
            .withMessage('ID phòng ban không hợp lệ')
    ],
    (req, res, next) => {
        // Express-validator middleware
        const { validationResult } = require('express-validator');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }
        console.log('✅ Validation passed, calling controller for department:', req.params.departmentId);
        next();
    },
    UserCertificateController.getUsersByDepartment
);

// Lấy chi tiết chứng chỉ
router.get('/:id', 
    AuthMiddleware.authenticate,
    idValidation,
    CertificateController.getCertificateById
);

// Cập nhật chứng chỉ (chỉ department_header và manager)
router.put('/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    updateCertificateValidation,
    CertificateController.updateCertificate
);

// Xóa chứng chỉ (chỉ department_header)
router.delete('/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header']),
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

// Lấy thống kê chứng chỉ (chỉ department_header và manager)
router.get('/stats/overview', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    CertificateController.getCertificateStats
);

// Tìm kiếm chứng chỉ
router.get('/search/query', 
    AuthMiddleware.authenticate,
    searchValidation,
    CertificateController.searchCertificates
);

// Cập nhật cài đặt nhắc nhở (chỉ department_header và manager)
router.put('/:id/reminder-settings', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
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

// Gia hạn chứng chỉ (chỉ department_header và manager)
router.post('/:id/renew', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
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

// Kiểm tra trùng lặp chứng chỉ
router.get('/check/duplicate',
    AuthMiddleware.authenticate,
    [
        query('certificateName')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Tên chứng chỉ không được vượt quá 200 ký tự'),
        query('certificateCode')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Mã chứng chỉ không được vượt quá 50 ký tự')
    ],
    CertificateController.checkDuplicate
);

// Tạo báo cáo chứng chỉ
router.get('/reports/generate',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    searchValidation,
    CertificateController.generateReport
);

// Xuất dữ liệu chứng chỉ
router.get('/export/data',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    CertificateController.exportCertificates
);

// Lấy tóm tắt chứng chỉ
router.get('/:id/summary',
    AuthMiddleware.authenticate,
    idValidation,
    CertificateController.getCertificateSummary
);

// ========== USER CERTIFICATE ROUTES ==========

// Get all user certificates
router.get('/user-certificates/list',
    AuthMiddleware.authenticate,
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Trang phải là số nguyên dương'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Giới hạn phải từ 1 đến 100'),
        query('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'SUSPENDED'])
            .withMessage('Trạng thái không hợp lệ')
    ],
    UserCertificateController.getUserCertificates
);

// Get user certificates by department
router.get('/user-certificates/department/:departmentId',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    [
        param('departmentId')
            .isMongoId()
            .withMessage('ID phòng ban không hợp lệ'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Trang phải là số nguyên dương'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Giới hạn phải từ 1 đến 100')
    ],
    UserCertificateController.getUserCertificatesByDepartment
);

// Get user certificate by ID
router.get('/user-certificates/:id',
    AuthMiddleware.authenticate,
    [
        param('id')
            .isMongoId()
            .withMessage('ID chứng chỉ cá nhân không hợp lệ')
    ],
    UserCertificateController.getUserCertificateById
);

// Ghi nhận chứng chỉ cá nhân cho người dùng (manager và employee trong phòng ban)
router.post('/user-certificates/assign',
    (req, res, next) => {
        console.log('🔍 POST /user-certificates/assign route matched');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
        next();
    },
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    [
        body('userIds')
            .isArray({ min: 1 })
            .withMessage('Danh sách người dùng phải là mảng và có ít nhất 1 phần tử'),
        body('userIds.*')
            .isMongoId()
            .withMessage('ID người dùng không hợp lệ'),
        body('certificateInfo.certificateName')
            .notEmpty()
            .withMessage('Tên chứng chỉ là bắt buộc')
            .isLength({ max: 200 })
            .withMessage('Tên chứng chỉ không được vượt quá 200 ký tự'),
        body('certificateInfo.issuingAuthority')
            .notEmpty()
            .withMessage('Cơ quan cấp là bắt buộc')
            .isLength({ max: 500 })
            .withMessage('Cơ quan cấp không được vượt quá 500 ký tự'),
        body('certificateInfo.certificateCode')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Mã chứng chỉ không được vượt quá 50 ký tự'),
        body('certificateInfo.description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Mô tả không được vượt quá 1000 ký tự'),
        body('certificateInfo.category')
            .optional()
            .isIn(['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'])
            .withMessage('Danh mục không hợp lệ'),
        body('certificateInfo.certificateNumber')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Số chứng chỉ không được vượt quá 100 ký tự'),
        body('certificateInfo.issueDate')
            .optional()
            .isISO8601()
            .withMessage('Ngày cấp không hợp lệ'),
        body('certificateInfo.expiryDate')
            .optional()
            .isISO8601()
            .withMessage('Ngày hết hạn không hợp lệ'),
        body('certificateInfo.level')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Mức độ không được vượt quá 50 ký tự'),
        body('certificateInfo.duration')
            .optional()
            .isInt({ min: 1, max: 120 })
            .withMessage('Thời hạn phải từ 1 đến 120 tháng'),
        body('certificateInfo.status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'SUSPENDED'])
            .withMessage('Trạng thái không hợp lệ')
    ],
    UserCertificateController.assignCertificate
);

// Update user certificate
router.put('/user-certificates/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header', 'manager']),
    [
        param('id')
            .isMongoId()
            .withMessage('ID chứng chỉ cá nhân không hợp lệ'),
        body('personalCertificateNumber')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Số chứng chỉ cá nhân không được vượt quá 100 ký tự'),
        body('personalIssueDate')
            .optional()
            .isISO8601()
            .withMessage('Ngày cấp không hợp lệ'),
        body('personalExpiryDate')
            .optional()
            .isISO8601()
            .withMessage('Ngày hết hạn không hợp lệ'),
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'SUSPENDED'])
            .withMessage('Trạng thái không hợp lệ')
    ],
    UserCertificateController.updateUserCertificate
);

// Delete user certificate (unassign)
router.delete('/user-certificates/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['department_header']),
    [
        param('id')
            .isMongoId()
            .withMessage('ID chứng chỉ cá nhân không hợp lệ')
    ],
    UserCertificateController.deleteUserCertificate
);

module.exports = router;
