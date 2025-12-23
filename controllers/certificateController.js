const Certificate = require('../models/certificate');
const User = require('../models/user');
const certificateService = require('../services/certificateService');
const websocketService = require('../services/websocketService');
const CertificateEvents = require('../events/certificateEvents');
const { validationResult } = require('express-validator');

class CertificateController {
    // Tạo chứng chỉ mới
    static async createCertificate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors.array()
                });
            }

            const tenantId = req.user?.tenant_id;
            const userRole = req.user?.role || {};
            const roleName = userRole.role_name || userRole.role_code || null;

            const certificateData = {
                ...req.body,
                createdBy: req.user.id
            };

            const result = await certificateService.createCertificate(certificateData, req.user.id, userRole, tenantId);
            
            // Emit Kafka event for certificate created
            if (result.statusCode < 400 && result.data) {
                try {
                    const creator = await User.findById(req.user.id).select('_id role full_name');
                    if (creator) {
                        await CertificateEvents.emitCertificateCreated(result.data, creator);
                        console.log(`📜 Certificate created Kafka event emitted for user: ${creator._id}`);
                    }
                } catch (kafkaError) {
                    console.error('Failed to emit certificate created Kafka event:', kafkaError);
                }
            }

            // Emit WebSocket notification for certificate created
            if (result.statusCode < 400 && result.data) {
                try {
                    const creator = await User.findById(req.user.id).select('_id role full_name');
                    if (creator) {
                        websocketService.emitCertificateCreated(result.data, creator);
                        console.log(`📜 Certificate created WebSocket notification sent for user: ${creator._id}`);
                    }
                } catch (wsError) {
                    console.error('Failed to emit certificate created WebSocket notification:', wsError);
                }
            }
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error creating certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi tạo chứng chỉ',
                error: error.message
            });
        }
    }

    // Lấy danh sách chứng chỉ (role-based)
    static async getCertificates(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            const userRole = req.user?.role || {};
            const roleName = userRole.role_name || userRole.role_code || null;
            
            // Separate filters from options
            const { page, limit, q, category, status, priority, ...otherFilters } = req.query;
            
            // Build filters (excluding pagination and search)
            const filters = {};
            if (q) filters.q = q; // Search query
            if (category) filters.category = category;
            if (status) filters.status = status;
            if (priority) filters.priority = priority;
            // Add other filters if needed (but exclude known non-filter fields)
            // Remove any undefined/null values from otherFilters
            Object.keys(otherFilters).forEach(key => {
                if (otherFilters[key] !== undefined && otherFilters[key] !== null && otherFilters[key] !== '') {
                    filters[key] = otherFilters[key];
                }
            });
            
            // Build options for pagination
            const options = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
                sort: { createdAt: -1 }
            };
            
            // Ensure page and limit are positive numbers
            if (isNaN(options.page) || options.page < 1) options.page = 1;
            if (isNaN(options.limit) || options.limit < 1) options.limit = 10;
            
            console.log('🔍 CertificateController.getCertificates:', {
                query: req.query,
                filters,
                options,
                tenantId,
                userRole: roleName
            });
            
            const result = await certificateService.getAllCertificates(filters, options, userRole, tenantId);
            
            console.log('✅ CertificateController result:', {
                statusCode: result.statusCode,
                dataCount: result.data?.data?.length || 0,
                total: result.data?.pagination?.total || 0
            });
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error getting certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách chứng chỉ'
            });
        }
    }

    // Lấy chi tiết chứng chỉ
    static async getCertificateById(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.getCertificateById(id, tenantId);
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error getting certificate by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thông tin chứng chỉ'
            });
        }
    }

    // Cập nhật chứng chỉ
    static async updateCertificate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const tenantId = req.user?.tenant_id;
            const updateData = {
                ...req.body,
                updatedBy: req.user.id
            };

            const result = await certificateService.updateCertificate(id, updateData, tenantId);
            
            // Emit Kafka event for certificate updated
            if (result.statusCode < 400 && result.data) {
                try {
                    const updater = await User.findById(req.user.id).select('_id role full_name');
                    if (updater) {
                        await CertificateEvents.emitCertificateUpdated(result.data, updater, updateData);
                        console.log(`📜 Certificate updated Kafka event emitted for user: ${updater._id}`);
                    }
                } catch (kafkaError) {
                    console.error('Failed to emit certificate updated Kafka event:', kafkaError);
                }
            }

            // Emit WebSocket notification for certificate updated
            if (result.statusCode < 400 && result.data) {
                try {
                    const updater = await User.findById(req.user.id).select('_id role full_name');
                    if (updater) {
                        websocketService.emitCertificateUpdated(result.data, updater);
                        console.log(`📜 Certificate updated WebSocket notification sent for user: ${updater._id}`);
                    }
                } catch (wsError) {
                    console.error('Failed to emit certificate updated WebSocket notification:', wsError);
                }
            }
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error updating certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi cập nhật chứng chỉ',
                error: error.message
            });
        }
    }

    // Xóa chứng chỉ
    static async deleteCertificate(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenant_id;
            
            // Get certificate data before deletion for events
            const certificate = await Certificate.findById(id).lean();
            
            const result = await certificateService.deleteCertificate(id, tenantId);
            
            // Emit Kafka event for certificate deleted
            if (result.statusCode < 400 && certificate) {
                try {
                    const deleter = await User.findById(req.user.id).select('_id role full_name');
                    if (deleter) {
                        await CertificateEvents.emitCertificateDeleted(certificate, deleter);
                        console.log(`📜 Certificate deleted Kafka event emitted for user: ${deleter._id}`);
                    }
                } catch (kafkaError) {
                    console.error('Failed to emit certificate deleted Kafka event:', kafkaError);
                }
            }

            // Emit WebSocket notification for certificate deleted
            if (result.statusCode < 400 && certificate) {
                try {
                    const deleter = await User.findById(req.user.id).select('_id role full_name');
                    if (deleter) {
                        websocketService.emitCertificateDeleted(certificate, deleter);
                        console.log(`📜 Certificate deleted WebSocket notification sent for user: ${deleter._id}`);
                    }
                } catch (wsError) {
                    console.error('Failed to emit certificate deleted WebSocket notification:', wsError);
                }
            }
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message
            });
        } catch (error) {
            console.error('Error deleting certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi xóa chứng chỉ'
            });
        }
    }

    // Lấy chứng chỉ theo danh mục
    static async getCertificatesByCategory(req, res) {
        try {
            const { category } = req.params;
            const { subCategory } = req.query;
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.getCertificatesByCategory(category, subCategory, tenantId);
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error getting certificates by category:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy chứng chỉ theo danh mục'
            });
        }
    }

    // Lấy chứng chỉ sắp hết hạn
    static async getExpiringCertificates(req, res) {
        try {
            const { days = 30 } = req.query;
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.getExpiringCertificates(parseInt(days), tenantId);
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error getting expiring certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy chứng chỉ sắp hết hạn'
            });
        }
    }

    // Lấy thống kê chứng chỉ
    static async getCertificateStats(req, res) {
        try {
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.getCertificateStats(tenantId);
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error getting certificate statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thống kê chứng chỉ'
            });
        }
    }

    // Tìm kiếm chứng chỉ
    static async searchCertificates(req, res) {
        try {
            const { q: query, category, tags, page = 1, limit = 10 } = req.query;
            const tenantId = req.user?.tenant_id;
            const filters = {};
            if (category) filters.category = category;
            if (tags) filters.tags = tags;

            const result = await certificateService.searchCertificates(query, filters, {
                page: parseInt(page),
                limit: parseInt(limit)
            }, tenantId);
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error searching certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi tìm kiếm chứng chỉ'
            });
        }
    }

    // Cập nhật cài đặt nhắc nhở
    static async updateReminderSettings(req, res) {
        try {
            const { id } = req.params;
            const { reminderSettings } = req.body;
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.updateReminderSettings(id, reminderSettings, tenantId);
            
            // Emit Kafka event for reminder settings updated
            if (result.statusCode < 400 && result.data) {
                try {
                    const updater = await User.findById(req.user.id).select('_id role full_name');
                    if (updater) {
                        await CertificateEvents.emitReminderSettingsUpdated(result.data, updater, reminderSettings);
                        console.log(`📜 Certificate reminder settings updated Kafka event emitted for user: ${updater._id}`);
                    }
                } catch (kafkaError) {
                    console.error('Failed to emit certificate reminder settings updated Kafka event:', kafkaError);
                }
            }

            // Emit WebSocket notification for reminder settings updated
            if (result.statusCode < 400 && result.data) {
                try {
                    const updater = await User.findById(req.user.id).select('_id role full_name');
                    if (updater) {
                        websocketService.emitCertificateReminderSettingsUpdated(result.data, updater);
                        console.log(`📜 Certificate reminder settings updated WebSocket notification sent for user: ${updater._id}`);
                    }
                } catch (wsError) {
                    console.error('Failed to emit certificate reminder settings updated WebSocket notification:', wsError);
                }
            }
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error updating reminder settings:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi cập nhật cài đặt nhắc nhở'
            });
        }
    }

    // Gia hạn chứng chỉ
    static async renewCertificate(req, res) {
        try {
            const { id } = req.params;
            const { renewalDate, notes } = req.body;
            const tenantId = req.user?.tenant_id;
            
            const result = await certificateService.renewCertificate(id, { renewalDate, notes }, tenantId);
            
            // Emit Kafka event for certificate renewed
            if (result.statusCode < 400 && result.data) {
                try {
                    const renewer = await User.findById(req.user.id).select('_id role full_name');
                    if (renewer) {
                        await CertificateEvents.emitCertificateRenewed(result.data, renewer, { renewalDate, notes });
                        console.log(`📜 Certificate renewed Kafka event emitted for user: ${renewer._id}`);
                    }
                } catch (kafkaError) {
                    console.error('Failed to emit certificate renewed Kafka event:', kafkaError);
                }
            }

            // Emit WebSocket notification for certificate renewed
            if (result.statusCode < 400 && result.data) {
                try {
                    const renewer = await User.findById(req.user.id).select('_id role full_name');
                    if (renewer) {
                        websocketService.emitCertificateRenewed(result.data, renewer);
                        console.log(`📜 Certificate renewed WebSocket notification sent for user: ${renewer._id}`);
                    }
                } catch (wsError) {
                    console.error('Failed to emit certificate renewed WebSocket notification:', wsError);
                }
            }
            
            res.status(result.statusCode).json({
                success: result.statusCode < 400,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('Error renewing certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi gia hạn chứng chỉ'
            });
        }
    }

    // Tạo báo cáo chứng chỉ
    static async generateReport(req, res) {
        try {
            const { format = 'json', category, status, dateFrom, dateTo } = req.query;
            const filters = {};
            if (category) filters.category = category;
            if (status) filters.status = status;
            if (dateFrom || dateTo) {
                filters.createdAt = {};
                if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filters.createdAt.$lte = new Date(dateTo);
            }

            const result = await certificateService.getAllCertificates(filters);
            if (result.statusCode < 400) {
                // Generate report data
                const reportData = {
                    summary: {
                        total: result.data.data.length,
                        active: result.data.data.filter(c => c.status === 'ACTIVE').length,
                        inactive: result.data.data.filter(c => c.status === 'INACTIVE').length,
                        expired: result.data.data.filter(c => c.status === 'EXPIRED').length,
                        expiringSoon: result.data.data.filter(c => certificateService.isExpiringSoon(c.expiryDate)).length
                    },
                    certificates: result.data.data
                };
                res.json({
                    success: true,
                    message: 'Tạo báo cáo chứng chỉ thành công',
                    data: reportData
                });
            } else {
                res.status(result.statusCode).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error generating certificate report:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi tạo báo cáo chứng chỉ'
            });
        }
    }

    // Xuất dữ liệu chứng chỉ (được scope theo tenant hoặc global nếu là System Admin)
    static async exportCertificates(req, res) {
        try {
            const { format = 'json' } = req.query;

            const currentUser = req.user;
            const tenantId = currentUser?.tenant_id || null;
            const userRole = currentUser?.role || {};
            const isSystemAdmin =
                userRole.role_code === 'system_admin' ||
                userRole.role_level === 100 ||
                userRole.scope_rules?.tenant_scope === 'global';

            // Chỉ System Admin mới được export toàn bộ certificates (global)
            const filters = {};
            if (!isSystemAdmin) {
                if (!tenantId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tenant ID not found in user context'
                    });
                }
                filters.tenant_id = tenantId;
            }

            const result = await certificateService.getAllCertificates({
                limit: 1000,
                filters
            });

            if (result.statusCode < 400) {
                res.json({
                    success: true,
                    message: 'Xuất dữ liệu chứng chỉ thành công',
                    data: result.data.data,
                    format,
                    scope: isSystemAdmin ? 'global' : 'tenant',
                    tenant_id: isSystemAdmin ? null : tenantId
                });
            } else {
                res.status(result.statusCode).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error exporting certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi xuất dữ liệu chứng chỉ'
            });
        }
    }

    // Lấy tóm tắt chứng chỉ
    static async getCertificateSummary(req, res) {
        try {
            const { id } = req.params;
            const result = await certificateService.getCertificateById(id);
            if (result.statusCode < 400) {
                const summary = {
                    id: result.data._id,
                    name: result.data.certificateName,
                    code: result.data.certificateCode,
                    category: result.data.category,
                    status: result.data.status,
                    issueDate: result.data.issueDate,
                    expiryDate: result.data.expiryDate,
                    daysUntilExpiry: certificateService.getDaysUntilExpiry ? certificateService.getDaysUntilExpiry(result.data.expiryDate) : 0,
                    isExpiringSoon: certificateService.isExpiringSoon(result.data.expiryDate),
                    isExpired: certificateService.isExpired(result.data.expiryDate),
                    priority: result.data.priority,
                    issuingAuthority: result.data.issuingAuthority
                };
                res.json({
                    success: true,
                    message: 'Lấy tóm tắt chứng chỉ thành công',
                    data: summary
                });
            } else {
                res.status(result.statusCode).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error getting certificate summary:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy tóm tắt chứng chỉ'
            });
        }
    }

    // Kiểm tra trùng lặp chứng chỉ
    static async checkDuplicate(req, res) {
        try {
            const { certificateName, certificateCode } = req.query;
            if (!certificateName && !certificateCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên hoặc mã chứng chỉ là bắt buộc'
                });
            }

            const tenantId = req.user?.tenant_id;
            let isDuplicate = false;
            let duplicateInfo = null;

            if (certificateName) {
                const existing = await certificateService.findByName(certificateName, tenantId);
                if (existing) {
                    isDuplicate = true;
                    duplicateInfo = { field: 'certificateName', value: certificateName };
                }
            }

            if (certificateCode && !isDuplicate) {
                const existing = await certificateService.findByCode(certificateCode, tenantId);
                if (existing) {
                    isDuplicate = true;
                    duplicateInfo = { field: 'certificateCode', value: certificateCode };
                }
            }

            res.json({
                success: true,
                message: isDuplicate ? 'Chứng chỉ đã tồn tại' : 'Chứng chỉ chưa tồn tại',
                data: {
                    isDuplicate,
                    duplicateInfo
                }
            });
        } catch (error) {
            console.error('Error checking certificate duplicate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi kiểm tra trùng lặp chứng chỉ'
            });
        }
    }
}

module.exports = CertificateController;