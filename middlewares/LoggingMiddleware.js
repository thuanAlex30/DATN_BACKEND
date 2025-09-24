const SystemLog = require('../models/systemLog');

class LoggingMiddleware {
    /**
     * Middleware để tự động ghi log các hoạt động của người dùng
     * @param {Object} options - Cấu hình logging
     * @param {string} options.module - Module của action (auth, user, training, etc.)
     * @param {string} options.action - Mô tả action (optional, sẽ tự động tạo từ method + route)
     * @param {string} options.severity - Mức độ nghiêm trọng (default: 'info')
     * @param {boolean} options.logRequestBody - Có ghi request body không (default: false)
     * @param {boolean} options.logResponseBody - Có ghi response body không (default: false)
     */
    static createLoggingMiddleware(options = {}) {
        return async (req, res, next) => {
            const startTime = Date.now();
            const originalSend = res.send;
            
            // Capture response data
            let responseBody = null;
            res.send = function(data) {
                responseBody = data;
                return originalSend.call(this, data);
            };

            // Execute the request
            await next();

            try {
                // Skip logging for certain routes (reduced list for better coverage)
                const skipRoutes = [
                    '/api/v1/auth/refresh-token',
                    '/api/v1/health'
                ];
                
                if (skipRoutes.some(route => req.path.startsWith(route))) {
                    return;
                }

                // Determine action from method and route with more detail
                let action = options.action;
                if (!action) {
                    // Create more descriptive action based on method and route
                    const method = req.method.toUpperCase();
                    const path = req.path;
                    
                    if (method === 'GET') {
                        if (path.includes('/stats')) action = `Xem thống kê ${path.split('/')[2] || 'hệ thống'}`;
                        else if (path.includes('/all')) action = `Lấy danh sách ${path.split('/')[2] || 'dữ liệu'}`;
                        else if (path.includes('/active')) action = `Lấy danh sách ${path.split('/')[2] || 'dữ liệu'} hoạt động`;
                        else if (path.includes('/options')) action = `Lấy tùy chọn ${path.split('/')[2] || 'dữ liệu'}`;
                        else if (path.includes('/summary')) action = `Xem tóm tắt ${path.split('/')[2] || 'dữ liệu'}`;
                        else action = `Xem ${path.split('/')[2] || 'dữ liệu'}`;
                    } else if (method === 'POST') {
                        if (path.includes('/login')) action = 'Đăng nhập hệ thống';
                        else if (path.includes('/register')) action = 'Đăng ký tài khoản';
                        else if (path.includes('/import')) action = `Nhập dữ liệu ${path.split('/')[2] || ''}`;
                        else if (path.includes('/create')) action = `Tạo ${path.split('/')[2] || 'dữ liệu'}`;
                        else action = `Tạo ${path.split('/')[2] || 'dữ liệu'}`;
                    } else if (method === 'PUT') {
                        action = `Cập nhật ${path.split('/')[2] || 'dữ liệu'}`;
                    } else if (method === 'DELETE') {
                        action = `Xóa ${path.split('/')[2] || 'dữ liệu'}`;
                    } else if (method === 'PATCH') {
                        action = `Cập nhật một phần ${path.split('/')[2] || 'dữ liệu'}`;
                    } else {
                        action = `${method} ${path}`;
                    }
                }

                // Determine module from route or options
                let module = options.module;
                if (!module) {
                    if (req.path.includes('/auth/')) module = 'auth';
                    else if (req.path.includes('/users/')) module = 'user';
                    else if (req.path.includes('/training/')) module = 'training';
                    else if (req.path.includes('/safety/')) module = 'safety';
                    else if (req.path.includes('/ppe/')) module = 'ppe';
                    else if (req.path.includes('/projects/')) module = 'project';
                    else if (req.path.includes('/roles/')) module = 'role';
                    else if (req.path.includes('/departments/')) module = 'department';
                    else if (req.path.includes('/positions/')) module = 'position';
                    else module = 'system';
                }

                // Determine severity based on status code
                let severity = options.severity || 'info';
                if (res.statusCode >= 500) severity = 'critical';
                else if (res.statusCode >= 400) severity = 'error';
                else if (res.statusCode >= 300) severity = 'warning';
                else if (res.statusCode >= 200) severity = 'success';

                // Prepare log details with more information
                const details = {
                    method: req.method,
                    url: req.originalUrl,
                    status_code: res.statusCode,
                    response_time: Date.now() - startTime,
                    user_agent: req.get('User-Agent'),
                    referer: req.get('Referer'),
                    content_type: req.get('Content-Type'),
                    content_length: req.get('Content-Length'),
                    accept: req.get('Accept'),
                    x_forwarded_for: req.get('X-Forwarded-For'),
                    x_real_ip: req.get('X-Real-IP'),
                    timestamp: new Date().toISOString(),
                    query_params: Object.keys(req.query).length > 0 ? req.query : undefined,
                    route_params: Object.keys(req.params).length > 0 ? req.params : undefined
                };

                // Add request body if enabled and not sensitive
                if (options.logRequestBody && !this.isSensitiveRoute(req.path)) {
                    details.request_body = req.body;
                }

                // Add response body if enabled and not sensitive
                if (options.logResponseBody && !this.isSensitiveRoute(req.path)) {
                    details.response_body = responseBody;
                }

                // Get user info if authenticated
                const userId = req.user ? req.user.id : null;

                // Get IP address
                const ipAddress = req.ip || 
                                req.connection.remoteAddress || 
                                req.socket.remoteAddress ||
                                (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                                req.headers['x-forwarded-for']?.split(',')[0] ||
                                '127.0.0.1';

                // Create log entry
                const logData = {
                    user_id: userId,
                    action,
                    module,
                    details,
                    ip_address: ipAddress,
                    user_agent: req.get('User-Agent'),
                    severity,
                    session_id: req.sessionID || null
                };

                // Save log asynchronously (don't block response)
                SystemLog.createLog(logData).catch(error => {
                    console.error('Error creating system log:', error);
                });

            } catch (error) {
                console.error('Error in logging middleware:', error);
            }
        };
    }

    /**
     * Kiểm tra route có chứa thông tin nhạy cảm không
     */
    static isSensitiveRoute(path) {
        const sensitiveRoutes = [
            '/auth/login',
            '/auth/register',
            '/auth/change-password',
            '/auth/reset-password',
            '/users/change-password'
        ];
        
        return sensitiveRoutes.some(route => path.includes(route));
    }

    /**
     * Middleware đơn giản để ghi log tất cả requests
     */
    static logAllRequests = LoggingMiddleware.createLoggingMiddleware({
        severity: 'info'
    });

    /**
     * Middleware để ghi log các hoạt động authentication
     */
    static logAuthActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'auth',
        severity: 'info',
        logRequestBody: false,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động user management
     */
    static logUserActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'user',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động PPE management
     */
    static logPPEActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'ppe',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động training
     */
    static logTrainingActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'training',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động safety
     */
    static logSafetyActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'safety',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động project
     */
    static logProjectActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'project',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động frontend (navigation, tab switching, etc.)
     */
    static logFrontendActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'frontend',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động dashboard
     */
    static logDashboardActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'dashboard',
        severity: 'info',
        logRequestBody: false,
        logResponseBody: false
    });

    /**
     * Middleware để ghi log các hoạt động system settings
     */
    static logSystemSettingsActions = LoggingMiddleware.createLoggingMiddleware({
        module: 'system',
        severity: 'info',
        logRequestBody: true,
        logResponseBody: false
    });
}

module.exports = LoggingMiddleware;
