const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const { body, query, param } = require('express-validator');

const router = express.Router();

// Validation rules
const createNotificationValidation = [
    body('user_id').notEmpty().withMessage('ID người dùng là bắt buộc'),
    body('title').notEmpty().isLength({ max: 200 }).withMessage('Tiêu đề là bắt buộc và không quá 200 ký tự'),
    body('message').notEmpty().isLength({ max: 1000 }).withMessage('Nội dung là bắt buộc và không quá 1000 ký tự'),
    body('type').optional().isIn(['info', 'warning', 'error', 'success'])
        .withMessage('Loại thông báo không hợp lệ'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Mức độ ưu tiên không hợp lệ'),
    body('category').optional().isIn(['system', 'training', 'safety', 'ppe', 'project', 'user', 'general'])
        .withMessage('Danh mục không hợp lệ'),
    body('action_url').optional().isURL().withMessage('URL hành động không hợp lệ'),
    body('expires_at').optional().isISO8601().withMessage('Ngày hết hạn không hợp lệ')
];

const getNotificationsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn phải từ 1 đến 100'),
    query('type').optional().isIn(['info', 'warning', 'error', 'success'])
        .withMessage('Loại thông báo không hợp lệ'),
    query('category').optional().isIn(['system', 'training', 'safety', 'ppe', 'project', 'user', 'general'])
        .withMessage('Danh mục không hợp lệ'),
    query('is_read').optional().isBoolean().withMessage('Trạng thái đọc không hợp lệ'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Mức độ ưu tiên không hợp lệ')
];

const getNotificationByIdValidation = [
    param('id').isMongoId().withMessage('ID không hợp lệ')
];

const markAsReadValidation = [
    param('id').isMongoId().withMessage('ID không hợp lệ')
];

const deleteNotificationValidation = [
    param('id').isMongoId().withMessage('ID không hợp lệ')
];

const createBulkNotificationsValidation = [
    body('notifications').isArray({ min: 1 }).withMessage('Danh sách thông báo không hợp lệ'),
    body('notifications.*.user_id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('notifications.*.title').notEmpty().isLength({ max: 200 })
        .withMessage('Tiêu đề là bắt buộc và không quá 200 ký tự'),
    body('notifications.*.message').notEmpty().isLength({ max: 1000 })
        .withMessage('Nội dung là bắt buộc và không quá 1000 ký tự'),
    body('notifications.*.type').optional().isIn(['info', 'warning', 'error', 'success'])
        .withMessage('Loại thông báo không hợp lệ'),
    body('notifications.*.priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Mức độ ưu tiên không hợp lệ'),
    body('notifications.*.category').optional().isIn(['system', 'training', 'safety', 'ppe', 'project', 'user', 'general'])
        .withMessage('Danh mục không hợp lệ')
];

const bulkDeleteNotificationsValidation = [
    body('notification_ids').isArray({ min: 1 }).withMessage('Danh sách ID thông báo là bắt buộc'),
    body('notification_ids.*').isMongoId().withMessage('ID thông báo không hợp lệ')
];

const updateSettingsValidation = [
    body('settings').isObject().withMessage('Cài đặt phải là object'),
    body('settings.types').optional().isArray().withMessage('Danh sách loại phải là array'),
    body('settings.categories').optional().isArray().withMessage('Danh sách danh mục phải là array'),
    body('settings.priorities').optional().isArray().withMessage('Danh sách mức độ ưu tiên phải là array'),
    body('settings.auto_cleanup').optional().isObject().withMessage('Cài đặt tự động dọn dẹp phải là object'),
    body('settings.real_time').optional().isObject().withMessage('Cài đặt thời gian thực phải là object')
];

// Routes
/**
 * @route GET /api/v1/notifications/test
 * @desc Test notifications endpoint
 * @access Public
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Notifications endpoint is working',
        data: {
            notifications: [],
            pagination: {
                current_page: 1,
                total_pages: 0,
                total_items: 0,
                items_per_page: 10
            }
        }
    });
});

/**
 * @route GET /api/v1/notifications
 * @desc Get notifications for current user
 * @access Private
 */
router.get('/',
    AuthMiddleware.authenticate,
    getNotificationsValidation,
    ValidationMiddleware.validate,
    NotificationController.getNotifications
);

/**
 * @route GET /api/v1/notifications/public
 * @desc Get all notifications (public access)
 * @access Public
 */
router.get('/public',
    getNotificationsValidation,
    // ValidationMiddleware.validate,
    NotificationController.getPublicNotifications
);

/**
 * @route GET /api/v1/notifications/stats
 * @desc Get notification statistics for current user
 * @access Private
 */
router.get('/stats',
    AuthMiddleware.authenticate,
    NotificationController.getNotificationStats
);

/**
 * @route GET /api/v1/notifications/types
 * @desc Get notification types
 * @access Private
 */
router.get('/types',
    AuthMiddleware.authenticate,
    NotificationController.getNotificationTypes
);

/**
 * @route GET /api/v1/notifications/categories
 * @desc Get notification categories
 * @access Private
 */
router.get('/categories',
    AuthMiddleware.authenticate,
    NotificationController.getNotificationCategories
);

/**
 * @route GET /api/v1/notifications/:id
 * @desc Get notification by ID
 * @access Private
 */
router.get('/:id',
    AuthMiddleware.authenticate,
    getNotificationByIdValidation,
    ValidationMiddleware.validate,
    NotificationController.getNotificationById
);

/**
 * @route POST /api/v1/notifications
 * @desc Create new notification
 * @access Private (Admin only)
 */
router.post('/',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'super_admin']),
    createNotificationValidation,
    NotificationController.createNotification
);

/**
 * @route POST /api/v1/notifications/bulk
 * @desc Create bulk notifications
 * @access Private (Admin only)
 */
router.post('/bulk',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'super_admin']),
    createBulkNotificationsValidation,
    NotificationController.createBulkNotifications
);

/**
 * @route PUT /api/v1/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read',
    AuthMiddleware.authenticate,
    markAsReadValidation,
    ValidationMiddleware.validate,
    NotificationController.markAsRead
);

/**
 * @route PUT /api/v1/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/mark-all-read',
    AuthMiddleware.authenticate,
    NotificationController.markAllAsRead
);

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id',
    AuthMiddleware.authenticate,
    deleteNotificationValidation,
    ValidationMiddleware.validate,
    NotificationController.deleteNotification
);

/**
 * @route DELETE /api/v1/notifications/cleanup/expired
 * @desc Clean up expired notifications
 * @access Private (Admin only)
 */
router.delete('/cleanup/expired',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'super_admin']),
    NotificationController.cleanupExpiredNotifications
);

/**
 * @route DELETE /api/v1/notifications/bulk-delete
 * @desc Delete multiple notifications
 * @access Private
 */
router.delete('/bulk-delete',
    AuthMiddleware.authenticate,
    bulkDeleteNotificationsValidation,
    ValidationMiddleware.validate,
    NotificationController.bulkDeleteNotifications
);

/**
 * @route GET /api/v1/notifications/settings
 * @desc Get notification settings
 * @access Private
 */
router.get('/settings',
    AuthMiddleware.authenticate,
    NotificationController.getNotificationSettings
);

/**
 * @route PUT /api/v1/notifications/settings
 * @desc Update notification settings
 * @access Private (Admin only)
 */
router.put('/settings',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorizeRole(['admin', 'super_admin']),
    updateSettingsValidation,
    ValidationMiddleware.validate,
    NotificationController.updateNotificationSettings
);

module.exports = router;
