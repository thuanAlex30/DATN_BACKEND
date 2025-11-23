const express = require('express');
const SystemLogController = require('../controllers/SystemLogController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const { body, query, param } = require('express-validator');

const router = express.Router();

const createLogValidation = [
    body('action').notEmpty().withMessage('Hành động là bắt buộc'),
    body('module').isIn(['auth', 'user', 'training', 'safety', 'ppe', 'project', 'system', 'role', 'department', 'position'])
        .withMessage('Module không hợp lệ'),
    body('ip_address').isIP().withMessage('Địa chỉ IP không hợp lệ'),
    body('severity').optional().isIn(['info', 'success', 'warning', 'error', 'critical'])
        .withMessage('Mức độ nghiêm trọng không hợp lệ'),
    body('details').optional().isObject().withMessage('Chi tiết phải là object')
];

const getLogsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn phải từ 1 đến 100'),
    query('module').optional().isIn(['auth', 'user', 'training', 'safety', 'ppe', 'project', 'system', 'role', 'department', 'position'])
        .withMessage('Module không hợp lệ'),
    query('severity').optional().isIn(['info', 'success', 'warning', 'error', 'critical'])
        .withMessage('Mức độ nghiêm trọng không hợp lệ'),
    query('start_date').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('end_date').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ')
];

const getLogByIdValidation = [
    param('id').isMongoId().withMessage('ID không hợp lệ')
];

const exportLogsValidation = [
    query('format').optional().isIn(['json', 'csv']).withMessage('Định dạng xuất không hợp lệ'),
    query('start_date').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('end_date').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ')
];

const deleteOldLogsValidation = [
    body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Số ngày phải từ 1 đến 365')
];

const bulkDeleteValidation = [
    body('log_ids').isArray({ min: 1 }).withMessage('Danh sách ID log là bắt buộc'),
    body('log_ids.*').isMongoId().withMessage('ID log không hợp lệ')
];

const exportSelectedValidation = [
    body('log_ids').isArray({ min: 1 }).withMessage('Danh sách ID log là bắt buộc'),
    body('log_ids.*').isMongoId().withMessage('ID log không hợp lệ'),
    body('format').optional().isIn(['json', 'csv']).withMessage('Định dạng xuất không hợp lệ')
];

const frontendLogsValidation = [
    body('logs').isArray({ min: 1 }).withMessage('Danh sách logs là bắt buộc'),
    body('logs.*.action').notEmpty().withMessage('Hành động là bắt buộc'),
    body('logs.*.module').notEmpty().withMessage('Module là bắt buộc'),
    body('logs.*.timestamp').optional().isISO8601().withMessage('Timestamp không hợp lệ'),
    body('logs.*.details').optional().isObject().withMessage('Chi tiết phải là object')
];

// Routes
/**
 * @route GET /api/v1/system-logs
 * @desc Get all system logs with filters and pagination
 * @access Private (Admin only)
 */
router.get('/', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    getLogsValidation,
    SystemLogController.getLogs
);

/**
 * @route GET /api/v1/system-logs/stats
 * @desc Get system statistics
 * @access Private (Admin only)
 */
router.get('/stats',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getStats
);

/**
 * @route GET /api/v1/system-logs/detailed-stats
 * @desc Get detailed statistics for export
 * @access Private (Admin only)
 */
router.get('/detailed-stats',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getDetailedStats
);

/**
 * @route GET /api/v1/system-logs/modules
 * @desc Get available modules
 * @access Private
 */
router.get('/modules',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getModules
);

/**
 * @route GET /api/v1/system-logs/severity-levels
 * @desc Get severity levels
 * @access Private
 */
router.get('/severity-levels',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getSeverityLevels
);

/**
 * @route GET /api/v1/system-logs/recent
 * @desc Get recent system logs
 * @access Private (Admin only)
 */
router.get('/recent',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getLogs
);

/**
 * @route GET /api/v1/system-logs/analytics
 * @desc Get analytics data
 * @access Private (Admin only)
 */
router.get('/analytics',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getAnalytics
);

/**
 * @route GET /api/v1/system-logs/export
 * @desc Export logs to CSV or JSON
 * @access Private (Admin only)
 */
router.get('/export',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    exportLogsValidation,
    SystemLogController.exportLogs
);

/**
 * @route GET /api/v1/system-logs/:id
 * @desc Get system log by ID
 * @access Private (Admin only)
 */
router.get('/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    getLogByIdValidation,
    SystemLogController.getLogById
);

/**
 * @route POST /api/v1/system-logs
 * @desc Create new system log
 * @access Private (Admin only)
 */
router.post('/',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    createLogValidation,
    SystemLogController.createLog
);

/**
 * @route DELETE /api/v1/system-logs/cleanup
 * @desc Delete old logs
 * @access Private (Admin and Super Admin only)
 */
router.delete('/cleanup',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    deleteOldLogsValidation,
    SystemLogController.deleteOldLogs
);

/**
 * @route DELETE /api/v1/system-logs/bulk
 * @desc Delete multiple logs
 * @access Private (Admin only)
 */
router.delete('/bulk',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    bulkDeleteValidation,
    SystemLogController.bulkDeleteLogs
);

/**
 * @route GET /api/v1/system-logs/analytics
 * @desc Get log analytics data
 * @access Private (Admin only)
 */
router.get('/analytics',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getAnalytics
);

/**
 * @route GET /api/v1/system-logs/notifications
 * @desc Get system notifications
 * @access Private (Admin only)
 */
router.get('/notifications',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    SystemLogController.getNotifications
);

/**
 * @route POST /api/v1/system-logs/frontend
 * @desc Receive frontend activity logs
 * @access Private (Authenticated users)
 */
router.post('/frontend',
    AuthMiddleware.authenticate,
    ValidationMiddleware.validate(frontendLogsValidation),
    SystemLogController.receiveFrontendLogs
);

/**
 * @route DELETE /api/v1/system-logs/bulk-delete
 * @desc Delete multiple logs by IDs
 * @access Private (Admin only)
 */
router.delete('/bulk-delete',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    bulkDeleteValidation,
    SystemLogController.bulkDeleteLogs
);

/**
 * @route POST /api/v1/system-logs/cleanup-old
 * @desc Clean up old logs
 * @access Private (Admin and Super Admin only)
 */
router.post('/cleanup-old',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    deleteOldLogsValidation,
    SystemLogController.deleteOldLogs
);

/**
 * @route GET /api/v1/system-logs/export-selected
 * @desc Export selected logs
 * @access Private (Admin only)
 */
router.post('/export-selected',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeScope({ minRoleLevel: 90, tenantScope: 'tenant' }),
    exportSelectedValidation,
    ValidationMiddleware.validate,
    SystemLogController.exportSelectedLogs
);

module.exports = router;
