const Notification = require('../models/notification');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const mongoose = require('mongoose');
const websocketService = require('../services/websocketService');
const NotificationEvents = require('../events/notificationEvents');

class NotificationController {
    // Get notifications for current user
    static getNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            console.log('📥 Getting notifications for user...');
            console.log('req.user:', JSON.stringify(req.user, null, 2));
            
            const userId = req.user._id || req.user.id;
            console.log('userId extracted:', userId);
            
            if (!userId) {
                console.log('❌ No user ID found, returning empty notifications');
                return ApiResponse.success(res, {
                    notifications: [],
                    pagination: {
                        current_page: 1,
                        total_pages: 0,
                        total_items: 0,
                        items_per_page: 10
                    }
                }, 'No notifications found');
            }
            
            const {
                page = 1,
                limit = 10,
                type,
                is_read,
                search
            } = req.query;

            console.log('Query params:', { page, limit, type, is_read, search });

            // Simple timeout wrapper - reduced to 5 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 5000);
            });

            const resultPromise = Notification.getNotifications(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                is_read,
                search
            });

            const result = await Promise.race([resultPromise, timeoutPromise]);
            
            console.log('✅ Notifications retrieved successfully:', result.notifications?.length || 0);
            ApiResponse.success(res, result, 'Lấy danh sách thông báo thành công');
        } catch (error) {
            console.error('❌ Error getting notifications:', error);
            if (error.message === 'Request timeout') {
                console.log('⏰ Request timeout, returning empty notifications');
                return ApiResponse.success(res, {
                    notifications: [],
                    pagination: {
                        current_page: 1,
                        total_pages: 0,
                        total_items: 0,
                        items_per_page: 10
                    }
                }, 'No notifications found (timeout)');
            } else {
                ApiResponse.error(res, 'Lỗi khi lấy danh sách thông báo', 500, error.message);
            }
        }
    });

    // Get all notifications (public access)
    static getPublicNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                type,
                is_read,
                search
            } = req.query;

            const filters = {};
            
            if (type) filters.type = type;
            if (is_read !== undefined) filters.is_read = is_read === 'true';
            if (search) filters.search = search;

            // Add timeout wrapper
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
            });

            const resultPromise = Notification.getPublicNotifications({
                page: parseInt(page),
                limit: parseInt(limit),
                ...filters
            });

            const result = await Promise.race([resultPromise, timeoutPromise]);
            
            ApiResponse.success(res, result, 'Lấy danh sách thông báo công khai thành công');
        } catch (error) {
            console.error('Error getting public notifications:', error);
            if (error.message === 'Request timeout') {
                ApiResponse.error(res, 'Yêu cầu quá thời gian chờ', 408, 'Timeout');
            } else {
                ApiResponse.error(res, 'Lỗi khi lấy danh sách thông báo công khai', 500, error.message);
            }
        }
    });

    // Get notification by ID
    static getNotificationById = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.user.id;
            
            const notification = await Notification.findOne({
                _id: id,
                user_id: userId
            });
            
            if (!notification) {
                return ApiResponse.error(res, 'Không tìm thấy thông báo', 404);
            }
            
            ApiResponse.success(res, notification, 'Lấy thông tin thông báo thành công');
        } catch (error) {
            console.error('Error getting notification by ID:', error);
            ApiResponse.error(res, 'Lỗi khi lấy thông tin thông báo', 500, error.message);
        }
    });

    // Create new notification
    static createNotification = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            console.log('Create notification request body:', req.body);
            
            const {
                user_id,
                title,
                message,
                type,
                priority,
                category,
                action_url,
                expires_at
            } = req.body;

            // Validate required fields
            if (!user_id || !title || !message) {
                return ApiResponse.validationError(res, {
                    user_id: !user_id ? 'ID người dùng là bắt buộc' : undefined,
                    title: !title ? 'Tiêu đề là bắt buộc' : undefined,
                    message: !message ? 'Nội dung là bắt buộc' : undefined
                });
            }

            const notificationData = {
                user_id,
                title,
                message,
                type: type || 'info',
                priority: priority || 'medium',
                category: category || 'system',
                action_url: action_url || null,
                expires_at: expires_at || null
            };

            console.log('Creating notification with data:', notificationData);
            
            // Check database connection
            if (!mongoose.connection.readyState) {
                console.error('Database not connected');
                return ApiResponse.error(res, 'Database connection error', 500, 'Database not connected');
            }
            
            const notification = await Notification.createNotification(notificationData);
            console.log('Notification created successfully:', notification._id);
            
            // Emit WebSocket event for notification created
            websocketService.emitNotificationCreated(notification);
            
            // Emit Kafka event for notification sent
            try {
                await NotificationEvents.emitNotificationSent(notification, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
            } catch (eventError) {
                console.error('Failed to emit notification sent event:', eventError);
            }
            
            ApiResponse.success(res, notification, 'Tạo thông báo thành công', 201);
        } catch (error) {
            console.error('Error creating notification:', error);
            ApiResponse.error(res, 'Lỗi khi tạo thông báo', 500, error.message);
        }
    });

    // Mark notification as read
    static markAsRead = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.user.id;
            
            const notification = await Notification.markAsRead(id, userId);
            
            // Emit WebSocket event for notification read
            websocketService.emitNotificationRead(notification, req.user);
            
            // Emit Kafka event for notification read
            try {
                await NotificationEvents.emitNotificationRead(notification, req.user);
            } catch (eventError) {
                console.error('Failed to emit notification read event:', eventError);
            }
            
            ApiResponse.success(res, notification, 'Đánh dấu thông báo đã đọc thành công');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            ApiResponse.error(res, 'Lỗi khi đánh dấu thông báo đã đọc', 500, error.message);
        }
    });

    // Mark all notifications as read
    static markAllAsRead = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            
            const result = await Notification.markAllAsRead(userId);
            
            ApiResponse.success(res, {
                modified_count: result.modifiedCount
            }, `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            ApiResponse.error(res, 'Lỗi khi đánh dấu tất cả thông báo đã đọc', 500, error.message);
        }
    });

    // Delete notification
    static deleteNotification = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.user.id;
            
            const notification = await Notification.findOneAndDelete({
                _id: id,
                user_id: userId
            });
            
            if (!notification) {
                return ApiResponse.error(res, 'Không tìm thấy thông báo', 404);
            }
            
            ApiResponse.success(res, null, 'Xóa thông báo thành công');
        } catch (error) {
            console.error('Error deleting notification:', error);
            ApiResponse.error(res, 'Lỗi khi xóa thông báo', 500, error.message);
        }
    });

    // Get notification statistics
    static getNotificationStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            
            const stats = await Notification.getNotificationStats(userId);
            
            ApiResponse.success(res, stats, 'Lấy thống kê thông báo thành công');
        } catch (error) {
            console.error('Error getting notification stats:', error);
            ApiResponse.error(res, 'Lỗi khi lấy thống kê thông báo', 500, error.message);
        }
    });

    // Create bulk notifications
    static createBulkNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const { notifications } = req.body;
            
            if (!Array.isArray(notifications) || notifications.length === 0) {
                return ApiResponse.validationError(res, {
                    notifications: 'Danh sách thông báo không hợp lệ'
                });
            }

            const createdNotifications = [];
            
            for (const notificationData of notifications) {
                const {
                    user_id,
                    title,
                    message,
                    type
                } = notificationData;

                if (!user_id || !title || !message) {
                    continue; // Skip invalid notifications
                }

                const notification = await Notification.createNotification({
                    user_id,
                    title,
                    message,
                    type: type || 'info'
                });

                createdNotifications.push(notification);
                
                // Emit WebSocket event for each notification
                websocketService.emitNotificationCreated(notification);
                
                // Emit Kafka event for each notification
                try {
                    await NotificationEvents.emitNotificationSent(notification, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
                } catch (eventError) {
                    console.error('Failed to emit notification sent event:', eventError);
                }
            }
            
            ApiResponse.success(res, {
                created_count: createdNotifications.length,
                notifications: createdNotifications
            }, `Đã tạo ${createdNotifications.length} thông báo thành công`, 201);
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            ApiResponse.error(res, 'Lỗi khi tạo thông báo hàng loạt', 500, error.message);
        }
    });

    // Get notification types
    static getNotificationTypes = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const types = [
                { value: 'info', label: 'Thông tin', color: '#3498db' },
                { value: 'warning', label: 'Cảnh báo', color: '#f39c12' },
                { value: 'error', label: 'Lỗi', color: '#e74c3c' },
                { value: 'success', label: 'Thành công', color: '#2ecc71' }
            ];
            
            ApiResponse.success(res, types, 'Lấy danh sách loại thông báo thành công');
        } catch (error) {
            console.error('Error getting notification types:', error);
            ApiResponse.error(res, 'Lỗi khi lấy danh sách loại thông báo', 500, error.message);
        }
    });

    // Get notification categories
    static getNotificationCategories = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const categories = [
                { value: 'system', label: 'Hệ thống' },
                { value: 'training', label: 'Đào tạo' },
                { value: 'safety', label: 'An toàn' },
                { value: 'ppe', label: 'PPE' },
                { value: 'project', label: 'Dự án' },
                { value: 'user', label: 'Người dùng' },
                { value: 'general', label: 'Chung' }
            ];
            
            ApiResponse.success(res, categories, 'Lấy danh sách danh mục thông báo thành công');
        } catch (error) {
            console.error('Error getting notification categories:', error);
            ApiResponse.error(res, 'Lỗi khi lấy danh sách danh mục thông báo', 500, error.message);
        }
    });

    // Clean up expired notifications
    static cleanupExpiredNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const result = await Notification.deleteMany({
                expires_at: { $lt: new Date() }
            });
            
            ApiResponse.success(res, {
                deleted_count: result.deletedCount
            }, `Đã xóa ${result.deletedCount} thông báo hết hạn`);
        } catch (error) {
            console.error('Error cleaning up expired notifications:', error);
            ApiResponse.error(res, 'Lỗi khi dọn dẹp thông báo hết hạn', 500, error.message);
        }
    });

    // Bulk delete notifications
    static bulkDeleteNotifications = ErrorMiddleware.asyncHandler(async (req, res) => {
        try {
            const { notification_ids } = req.body;
            const userId = req.user._id || req.user.id;
            
            if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
                return ApiResponse.validationError(res, {
                    notification_ids: 'Danh sách ID thông báo không hợp lệ'
                });
            }
            
            const result = await Notification.deleteMany({
                _id: { $in: notification_ids },
                user_id: userId
            });
            
            ApiResponse.success(res, {
                deleted_count: result.deletedCount,
                requested_count: notification_ids.length
            }, `Đã xóa ${result.deletedCount}/${notification_ids.length} thông báo`);
        } catch (error) {
            console.error('Error bulk deleting notifications:', error);
            ApiResponse.error(res, 'Lỗi khi xóa nhiều thông báo', 500, error.message);
        }
    });

    // Get notification settings
    static getNotificationSettings = ErrorMiddleware.asyncHandler(async (req, res) => {
        console.log('📥 [NotificationSettings] Request received');
        console.log('📥 [NotificationSettings] User:', req.user?.username || req.user?._id || 'Unknown');
        
        const settings = {
            types: [
                { value: 'info', label: 'Thông tin', color: '#3498db', enabled: true },
                { value: 'warning', label: 'Cảnh báo', color: '#f39c12', enabled: true },
                { value: 'error', label: 'Lỗi', color: '#e74c3c', enabled: true },
                { value: 'success', label: 'Thành công', color: '#2ecc71', enabled: true }
            ],
            categories: [
                { value: 'system', label: 'Hệ thống', enabled: true },
                { value: 'training', label: 'Đào tạo', enabled: true },
                { value: 'safety', label: 'An toàn', enabled: true },
                { value: 'ppe', label: 'PPE', enabled: true },
                { value: 'project', label: 'Dự án', enabled: true },
                { value: 'user', label: 'Người dùng', enabled: true },
                { value: 'general', label: 'Chung', enabled: true }
            ],
            priorities: [
                { value: 'low', label: 'Thấp', color: '#95a5a6', enabled: true },
                { value: 'medium', label: 'Trung bình', color: '#f39c12', enabled: true },
                { value: 'high', label: 'Cao', color: '#e74c3c', enabled: true },
                { value: 'urgent', label: 'Khẩn cấp', color: '#8e44ad', enabled: true }
            ],
            auto_cleanup: {
                enabled: true,
                days: 30
            },
            real_time: {
                enabled: true,
                interval: 30
            }
        };
        
        console.log('✅ [NotificationSettings] Returning settings');
        return ApiResponse.success(res, settings, 'Lấy cài đặt thông báo thành công');
    });

    // Update notification settings
    static updateNotificationSettings = ErrorMiddleware.asyncHandler(async (req, res) => {
        console.log('📥 [UpdateNotificationSettings] Request received');
        console.log('📥 [UpdateNotificationSettings] User:', req.user?.username || req.user?._id || 'Unknown');
        console.log('📥 [UpdateNotificationSettings] Body:', JSON.stringify(req.body, null, 2));
        
        try {
            const { settings } = req.body;
            
            if (!settings) {
                console.warn('⚠️ [UpdateNotificationSettings] No settings in body');
                return ApiResponse.error(res, 'Thiếu dữ liệu cài đặt', 400);
            }
            
            // In a real application, you would save these settings to a database
            // For now, we'll just return success
            
            console.log('✅ [UpdateNotificationSettings] Returning success');
            return ApiResponse.success(res, settings, 'Cập nhật cài đặt thông báo thành công');
        } catch (error) {
            console.error('❌ [UpdateNotificationSettings] Error:', error);
            console.error('❌ [UpdateNotificationSettings] Error stack:', error.stack);
            return ApiResponse.error(res, 'Lỗi khi cập nhật cài đặt thông báo', 500, error.message);
        }
    });
}

module.exports = NotificationController;
