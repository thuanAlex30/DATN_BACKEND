const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notification_id: {
        type: Number,
        unique: true,
        required: false, // Make it optional
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    category: {
        type: String,
        enum: ['system', 'training', 'safety', 'ppe', 'project', 'user', 'general'],
        default: 'system',
        index: true
    },
    action_url: {
        type: String,
        default: null
    },
    expires_at: {
        type: Date,
        default: null,
        index: true
    },
    is_read: {
        type: Boolean,
        default: false,
        index: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false, // Disable automatic timestamps since we have created_at
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, type: 1 });
notificationSchema.index({ user_id: 1, type: 1, is_read: 1 }); // Compound index
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ created_at: -1 }); // For sorting

// Virtual for relative time
notificationSchema.virtual('relative_time').get(function() {
    const now = new Date();
    const diff = now - this.created_at;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
});

// Static methods
notificationSchema.statics.getRelativeTime = function(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
};

notificationSchema.statics.formatDateTime = function(date) {
    return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

notificationSchema.statics.getNotifications = async function(userId, filters = {}) {
    try {
        console.log('getNotifications called with userId:', userId, 'filters:', filters);
        
        if (!userId) {
            throw new Error('User ID is required');
        }

        const {
            page = 1,
            limit = 10,
            type,
            is_read,
            search
        } = filters;

        // Build query
        const query = { user_id: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId };

        if (type) query.type = type;
        if (is_read !== undefined) query.is_read = is_read;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('Final query:', JSON.stringify(query, null, 2));

        // Optimize query - remove populate for better performance
        const notifications = await this.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean()
            .maxTimeMS(10000); // 10 second timeout

        const total = await this.countDocuments(query).maxTimeMS(5000); // 5 second timeout

        console.log('Found notifications:', notifications.length, 'Total:', total);

        return {
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error in getNotifications:', error);
        throw error;
    }
};

// Get all notifications (public access)
notificationSchema.statics.getPublicNotifications = async function(filters = {}) {
    try {
        console.log('getPublicNotifications called with filters:', filters);
        
        const {
            page = 1,
            limit = 10,
            type,
            is_read,
            search
        } = filters;

        const query = {};
        
        // Apply filters
        if (type) query.type = type;
        if (is_read !== undefined) query.is_read = is_read;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get notifications without user population to avoid errors
        const notifications = await this.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count
        const totalCount = await this.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // Format notifications
        const formatRelativeTime = (date) => {
            const now = new Date();
            const diff = now - date;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} ngày trước`;
            if (hours > 0) return `${hours} giờ trước`;
            if (minutes > 0) return `${minutes} phút trước`;
            return 'Vừa xong';
        };

        const formatDateTime = (date) => {
            return new Date(date).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        const formattedNotifications = notifications.map(notification => ({
            ...notification,
            relative_time: formatRelativeTime(notification.created_at),
            formatted_created_at: formatDateTime(notification.created_at)
        }));

        return {
            notifications: formattedNotifications,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_items: totalCount,
                items_per_page: limit
            }
        };
    } catch (error) {
        console.error('Error in getPublicNotifications:', error);
        throw error;
    }
};

notificationSchema.statics.getNotificationStats = async function(userId) {
    try {
        console.log('getNotificationStats called with userId:', userId);
        
        if (!userId) {
            throw new Error('User ID is required');
        }

        const stats = await this.aggregate([
            {
                $match: {
                    user_id: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
                }
            },
            {
                $group: {
                    _id: null,
                    total_notifications: { $sum: 1 },
                    unread_notifications: {
                        $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                    },
                    type_breakdown: {
                        $push: {
                            type: '$type',
                            is_read: '$is_read'
                        }
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return {
                total_notifications: 0,
                unread_notifications: 0,
                type_breakdown: {
                    info: 0,
                    warning: 0,
                    error: 0,
                    success: 0
                }
            };
        }

        const result = stats[0];
        const typeBreakdown = {
            info: 0,
            warning: 0,
            error: 0,
            success: 0
        };

        result.type_breakdown.forEach(item => {
            if (typeBreakdown.hasOwnProperty(item.type)) {
                typeBreakdown[item.type]++;
            }
        });

        return {
            total_notifications: result.total_notifications,
            unread_notifications: result.unread_notifications,
            type_breakdown: typeBreakdown
        };
    } catch (error) {
        console.error('Error in getNotificationStats:', error);
        throw error;
    }
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
    try {
        const notification = await this.findOneAndUpdate(
            { 
                _id: notificationId, 
                user_id: userId,
                is_read: false 
            },
            { 
                is_read: true
            },
            { new: true }
        );

        if (!notification) {
            throw new Error('Notification not found or already read');
        }

        return notification;
    } catch (error) {
        console.error('Error in markAsRead:', error);
        throw error;
    }
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    try {
        const result = await this.updateMany(
            { 
                user_id: userId,
                is_read: false 
            },
            { 
                is_read: true
            }
        );

        return result;
    } catch (error) {
        console.error('Error in markAllAsRead:', error);
        throw error;
    }
};

notificationSchema.statics.deleteNotification = async function(notificationId, userId) {
    try {
        const notification = await this.findOneAndDelete({
            _id: notificationId,
            user_id: userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        throw error;
    }
};

notificationSchema.statics.createNotification = async function(notificationData) {
    try {
        console.log('createNotification called with data:', notificationData);
        
        // Auto-generate notification_id if not provided
        if (!notificationData.notification_id) {
            // First, try to find the highest notification_id
            const lastNotification = await this.findOne({ notification_id: { $exists: true } }, {}, { sort: { notification_id: -1 } });
            
            if (lastNotification && lastNotification.notification_id) {
                notificationData.notification_id = lastNotification.notification_id + 1;
            } else {
                // If no notification_id exists, start from 1
                notificationData.notification_id = 1;
            }
        }
        
        // Validate required fields
        if (!notificationData.user_id || !notificationData.title || !notificationData.message) {
            throw new Error('Missing required fields: user_id, title, message');
        }
        
        const notification = new this(notificationData);
        await notification.save();
        
        console.log('Notification created successfully:', notification._id);
        return notification;
    } catch (error) {
        console.error('Error in createNotification:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
        });
        throw error;
    }
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
    this.is_read = true;
    return this.save();
};

notificationSchema.methods.isExpired = function() {
    return false; // ERD doesn't have expiration, so always return false
};

module.exports = mongoose.model('Notification', notificationSchema);
