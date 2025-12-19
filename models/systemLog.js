const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    module: {
        type: String,
        required: true,
        enum: ['auth', 'user', 'training', 'safety', 'ppe', 'project', 'system', 'role', 'department', 'position'],
        trim: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip_address: {
        type: String,
        required: true,
        trim: true
    },
    user_agent: {
        type: String,
        trim: true
    },
    severity: {
        type: String,
        required: true,
        enum: ['info', 'success', 'warning', 'error', 'critical'],
        default: 'info'
    },
    session_id: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'system_logs'
});

// Indexes for better performance
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ tenant_id: 1 });
systemLogSchema.index({ user_id: 1 });
systemLogSchema.index({ module: 1 });
systemLogSchema.index({ severity: 1 });
systemLogSchema.index({ action: 'text' });

// Virtual for formatted timestamp
systemLogSchema.virtual('formatted_timestamp').get(function() {
    return this.timestamp.toLocaleString('vi-VN');
});

// Static method to create log entry
systemLogSchema.statics.createLog = async function(logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        throw error;
    }
};

// Static method to get logs with filters
systemLogSchema.statics.getLogs = async function(filters = {}, page = 1, limit = 10, currentUserRoleLevel = 100) {
    try {
        const query = {};
        
        // Apply filters
        if (filters.user_id) query.user_id = filters.user_id;
        if (filters.tenant_id) query.tenant_id = filters.tenant_id;
        if (filters.module) query.module = filters.module;
        if (filters.severity) query.severity = filters.severity;
        if (filters.action) query.action = new RegExp(filters.action, 'i');
        if (filters.ip_address) query.ip_address = new RegExp(filters.ip_address, 'i');
        if (filters.start_date || filters.end_date) {
            query.timestamp = {};
            if (filters.start_date) {
                query.timestamp.$gte = new Date(filters.start_date);
            }
            if (filters.end_date) {
                query.timestamp.$lte = new Date(filters.end_date);
            }
        }
        if (filters.search) {
            const searchRegex = new RegExp(filters.search, 'i');
            query.$or = [
                { action: searchRegex },
                { module: searchRegex },
                { ip_address: searchRegex }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        // Populate user with role information
        let logs = await this.find(query)
            .populate({
                path: 'user_id',
                select: 'full_name username role_id',
                populate: {
                    path: 'role_id',
                    select: 'role_name role_code role_level'
                }
            })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit * 2); // Get more to filter by role level
            
        // Filter logs by user role level if needed
        if (filters.max_role_level !== undefined && currentUserRoleLevel < 100) {
            logs = logs.filter(log => {
                if (!log.user_id || !log.user_id.role_id) return false;
                const userRoleLevel = log.user_id.role_id.role_level || 0;
                return userRoleLevel <= filters.max_role_level;
            });
        }
        
        // Limit to requested number after filtering
        logs = logs.slice(0, limit);
            
        // Count total with role level filter
        let countQuery = { ...query };
        // Note: MongoDB aggregation would be needed for proper role_level filtering in count
        // For now, we'll use a simpler approach
        const total = await this.countDocuments(countQuery);
        
        return {
            logs,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        };
    } catch (error) {
        throw error;
    }
};

// Static method to get statistics
systemLogSchema.statics.getStats = async function(timeRange = 'today', tenantId = null) {
    try {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        const matchStage = {
            timestamp: { $gte: startDate }
        };
        if (tenantId) {
            matchStage.tenant_id = tenantId;
        }

        const stats = await this.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: null,
                    total_logs: { $sum: 1 },
                    error_logs: {
                        $sum: {
                            $cond: [
                                { $in: ['$severity', ['error', 'critical']] },
                                1,
                                0
                            ]
                        }
                    },
                    unique_users: { $addToSet: '$user_id' },
                    module_stats: {
                        $push: '$module'
                    }
                }
            },
            {
                $project: {
                    total_logs: 1,
                    error_logs: 1,
                    active_users: { $size: '$unique_users' },
                    most_active_module: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: {
                                        $slice: [
                                            {
                                                $sortArray: {
                                                    input: {
                                                        $map: {
                                                            input: {
                                                                $setUnion: '$module_stats'
                                                            },
                                                            as: 'module',
                                                            in: {
                                                                module: '$$module',
                                                                count: {
                                                                    $size: {
                                                                        $filter: {
                                                                            input: '$module_stats',
                                                                            cond: { $eq: ['$$this', '$$module'] }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    },
                                                    sortBy: { count: -1 }
                                                }
                                            },
                                            1
                                        ]
                                    },
                                    as: 'item',
                                    in: '$$item.module'
                                }
                            },
                            0
                        ]
                    }
                }
            }
        ]);
        
        return stats[0] || {
            total_logs: 0,
            error_logs: 0,
            active_users: 0,
            most_active_module: 'system'
        };
    } catch (error) {
        throw error;
    }
};

// Static method to get detailed statistics for export
systemLogSchema.statics.getDetailedStats = async function(tenantId = null) {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const baseFilter = tenantId ? { tenant_id: tenantId } : {};

        const [totalLogs, todayLogs, weekLogs, monthLogs, moduleStats, severityStats] = await Promise.all([
            this.countDocuments(baseFilter),
            this.countDocuments({ ...baseFilter, timestamp: { $gte: todayStart } }),
            this.countDocuments({ ...baseFilter, timestamp: { $gte: weekStart } }),
            this.countDocuments({ ...baseFilter, timestamp: { $gte: monthStart } }),
            this.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$module', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]),
            this.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$severity', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ])
        ]);
        
        return {
            total_logs: totalLogs,
            today_logs: todayLogs,
            week_logs: weekLogs,
            month_logs: monthLogs,
            most_active_module: moduleStats[0]?._id || 'N/A',
            most_common_severity: severityStats[0]?._id || 'N/A'
        };
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('SystemLog', systemLogSchema);
