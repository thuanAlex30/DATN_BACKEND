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
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false,
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
notificationSchema.index({ tenant_id: 1 });
notificationSchema.index({ tenant_id: 1, created_at: -1 });
// Compound index for user_id + tenant_id queries (most common case)
notificationSchema.index({ user_id: 1, tenant_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, tenant_id: 1, is_read: 1 });
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
        console.log('🔍 getNotifications called with userId:', userId, 'filters:', filters);
        
        if (!userId) {
            console.log('❌ No userId provided, returning empty result');
            return {
                notifications: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0
                }
            };
        }

        const {
            page = 1,
            limit = 10,
            type,
            is_read,
            search,
            tenant_id
        } = filters;

        // Build query - optimized for compound index: { user_id: 1, tenant_id: 1, created_at: -1 }
        const userIdObj = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        const query = { user_id: userIdObj };

        // Always include tenant_id in query if provided (for better index usage)
        if (tenant_id) {
            query.tenant_id = mongoose.isValidObjectId(tenant_id) ? new mongoose.Types.ObjectId(tenant_id) : tenant_id;
        }

        if (type) query.type = type;
        if (is_read !== undefined) query.is_read = is_read;
        
        // Search is expensive - only use if necessary
        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { message: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        console.log('🔍 Final query:', JSON.stringify(query, null, 2));

        // Optimize query - use lean() and proper indexes
        // Sort order matches compound index: { user_id: 1, tenant_id: 1, created_at: -1 }
        const queryBuilder = this.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean()
            .maxTimeMS(5000); // Increased to 5 seconds
        
        // Force use of compound index if tenant_id is in query
        if (tenant_id) {
            queryBuilder.hint({ user_id: 1, tenant_id: 1, created_at: -1 });
        }
        
        const notifications = await queryBuilder;

        // Optimize countDocuments - skip if not needed or use estimated count
        let total = 0;
        if (page === 1 || notifications.length > 0) {
            // Only count on first page or if we have results
            try {
                // Use countDocuments with same query but without expensive operations
                const countQuery = { user_id: userIdObj };
                if (tenant_id) {
                    countQuery.tenant_id = mongoose.isValidObjectId(tenant_id) ? new mongoose.Types.ObjectId(tenant_id) : tenant_id;
                }
                if (type) countQuery.type = type;
                if (is_read !== undefined) countQuery.is_read = is_read;
                // Skip search in count for performance
                
                total = await this.countDocuments(countQuery).maxTimeMS(3000);
            } catch (countError) {
                console.warn('CountDocuments timeout or error, using estimated count:', countError.message);
                // If count fails, estimate based on current results
                total = notifications.length >= limit ? (page * limit) + 1 : (page - 1) * limit + notifications.length;
            }
        } else {
            // For pages beyond first, if no results, total is likely 0
            total = (page - 1) * limit;
        }

        console.log('✅ Found notifications:', notifications.length, 'Total:', total);

        return {
            notifications,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        console.error('❌ Error in getNotifications:', error);
        // Return empty result instead of throwing error
        return {
            notifications: [],
            pagination: {
                current_page: 1,
                total_pages: 0,
                total_items: 0,
                items_per_page: 10
            }
        };
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
            search,
            tenant_id
        } = filters;

        const query = {};
        
        // Apply filters
        if (type) query.type = type;
        if (is_read !== undefined) query.is_read = is_read;
        if (tenant_id) query.tenant_id = mongoose.isValidObjectId(tenant_id) ? new mongoose.Types.ObjectId(tenant_id) : tenant_id;
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
