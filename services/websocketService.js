const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');
const kafkaProducer = require('./kafkaProducer');
const kafkaConsumer = require('./kafkaConsumer');
const ProjectEvents = require('../events/projectEvents');
const TaskEvents = require('../events/taskEvents');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId mapping
        this.userRooms = new Map(); // userId -> [room1, room2, ...]
        this.roomUsers = new Map(); // room -> [userId1, userId2, ...]
    }

    /**
     * Initialize Socket.IO server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        const { Server } = require('socket.io');
        const cors = require('cors');

        this.io = new Server(server, {
            cors: {
                origin: [
                    process.env.FRONTEND_URL || "http://localhost:3000",
                    "http://localhost:3000",
                    "http://localhost:3001", 
                    "http://localhost:5173",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:3001",
                    "http://127.0.0.1:5173"
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        
        // Initialize Kafka services
        this.initializeKafkaServices();
        
        console.log('🔌 WebSocket server initialized');
    }

    /**
     * Initialize Kafka services
     */
    async initializeKafkaServices() {
        try {
            console.log('🔄 Initializing Kafka services...');
            
            // Initialize Kafka Producer
            await kafkaProducer.initialize();
            
            // Initialize Kafka Consumer
            await kafkaConsumer.initialize();
            
            // Start consuming events
            await kafkaConsumer.startConsuming();
            
            console.log('✅ Kafka services initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Kafka services:', error);
            return false;
        }
    }

    /**
     * Setup authentication middleware
     */
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                console.log('🔐 WebSocket auth token received:', token ? `${token.substring(0, 20)}...` : 'No token');
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_2024_safety_management_system');
                console.log('🔐 JWT decoded successfully for user:', decoded.userId);
                console.log('🔍 Looking for user in database...');
                const user = await User.findById(decoded.userId).populate('role_id');
                console.log('👤 User found:', user ? `${user.full_name} (${user.email})` : 'Not found');
                
                if (!user || !user.is_active) {
                    return next(new Error('User not found or inactive'));
                }

                socket.userId = user._id.toString();
                socket.user = user;
                next();
            } catch (error) {
                console.error('WebSocket auth error:', error.message);
                next(new Error('Authentication failed'));
            }
        });
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`👤 User ${socket.userId} connected via WebSocket`);
            console.log(`🔍 Socket ID: ${socket.id}`);
            
            // Store user connection (ensure userId is string)
            const userIdString = socket.userId.toString();
            this.connectedUsers.set(userIdString, socket.id);
            console.log(`🔍 Stored connection: ${userIdString} -> ${socket.id}`);
            console.log(`🔍 Current connected users:`, Object.fromEntries(this.connectedUsers));
            
            // Join user to their personal room
            socket.join(`user_${socket.userId}`);
            
            // Join user to role-based rooms
            this.joinRoleBasedRooms(socket);
            
            // Join user to department room
            if (socket.user.department_id) {
                socket.join(`dept_${socket.user.department_id}`);
            }

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`👋 User ${socket.userId} disconnected`);
                this.handleDisconnect(socket);
            });

            // Handle joining specific rooms
            socket.on('join_room', (roomName) => {
                this.joinRoom(socket, roomName);
            });

            // Handle leaving rooms
            socket.on('leave_room', (roomName) => {
                this.leaveRoom(socket, roomName);
            });

            // Handle typing indicators
            socket.on('typing_start', (data) => {
                socket.to(data.room).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.user.full_name,
                    isTyping: true
                });
            });

            socket.on('typing_stop', (data) => {
                socket.to(data.room).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.user.full_name,
                    isTyping: false
                });
            });
        });
    }

    /**
     * Join user to role-based rooms
     */
    async joinRoleBasedRooms(socket) {
        try {
            const userRole = socket.user.role_id;
            if (userRole) {
                // Join role-based room
                socket.join(`role_${userRole._id}`);
                
                // Join specific role rooms based on permissions
                if (userRole.role_name === 'admin' || userRole.role_name === 'super_admin') {
                    socket.join('admin_room');
                }
                
                if (userRole.role_name === 'safety_officer') {
                    socket.join('safety_officer_room');
                }
                
                if (userRole.role_name === 'manager') {
                    socket.join('manager_room');
                }
            }
        } catch (error) {
            console.error('Error joining role-based rooms:', error);
        }
    }

    /**
     * Handle user disconnect
     */
    handleDisconnect(socket) {
        const userIdString = socket.userId.toString();
        console.log(`🔍 Removing user ${userIdString} from connected users`);
        console.log(`🔍 Before removal:`, Object.fromEntries(this.connectedUsers));
        
        this.connectedUsers.delete(userIdString);
        
        console.log(`🔍 After removal:`, Object.fromEntries(this.connectedUsers));
        
        // Remove user from all rooms
        if (this.userRooms.has(userIdString)) {
            const rooms = this.userRooms.get(userIdString);
            rooms.forEach(room => {
                this.removeUserFromRoom(userIdString, room);
            });
            this.userRooms.delete(userIdString);
        }
    }

    /**
     * Join a specific room
     */
    joinRoom(socket, roomName) {
        socket.join(roomName);
        this.addUserToRoom(socket.userId, roomName);
        console.log(`👤 User ${socket.userId} joined room: ${roomName}`);
    }

    /**
     * Leave a specific room
     */
    leaveRoom(socket, roomName) {
        socket.leave(roomName);
        this.removeUserFromRoom(socket.userId, roomName);
        console.log(`👤 User ${socket.userId} left room: ${roomName}`);
    }

    /**
     * Add user to room tracking
     */
    addUserToRoom(userId, roomName) {
        const userIdString = userId.toString();
        if (!this.userRooms.has(userIdString)) {
            this.userRooms.set(userIdString, []);
        }
        
        if (!this.userRooms.get(userIdString).includes(roomName)) {
            this.userRooms.get(userIdString).push(roomName);
        }
        
        if (!this.roomUsers.has(roomName)) {
            this.roomUsers.set(roomName, []);
        }
        
        if (!this.roomUsers.get(roomName).includes(userIdString)) {
            this.roomUsers.get(roomName).push(userIdString);
        }
    }

    /**
     * Remove user from room tracking
     */
    removeUserFromRoom(userId, roomName) {
        const userIdString = userId.toString();
        if (this.userRooms.has(userIdString)) {
            const rooms = this.userRooms.get(userIdString);
            const index = rooms.indexOf(roomName);
            if (index > -1) {
                rooms.splice(index, 1);
            }
        }
        
        if (this.roomUsers.has(roomName)) {
            const users = this.roomUsers.get(roomName);
            const index = users.indexOf(userIdString);
            if (index > -1) {
                users.splice(index, 1);
            }
        }
    }

    // ==================== EMIT METHODS ====================

    /**
     * Emit to specific user
     */
    emitToUser(userId, event, data) {
        // Handle undefined userId
        if (!userId) {
            console.log(`⚠️ Cannot emit ${event}: userId is undefined`);
            return;
        }
        
        // Convert ObjectId to string for map lookup
        const userIdString = userId.toString();
        const socketId = this.connectedUsers.get(userIdString);
        
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            console.log(`📤 Emitted ${event} to user ${userIdString} (socket: ${socketId})`);
        } else {
            console.log(`⚠️ User ${userIdString} not connected`);
        }
    }

    /**
     * Emit to specific room
     */
    emitToRoom(roomName, event, data) {
        this.io.to(roomName).emit(event, data);
        console.log(`📤 Emitted ${event} to room ${roomName}`);
    }

    /**
     * Emit to multiple users
     */
    emitToUsers(userIds, event, data) {
        userIds.forEach(userId => {
            this.emitToUser(userId, event, data);
        });
    }

    /**
     * Emit to all connected users
     */
    emitToAll(event, data) {
        this.io.emit(event, data);
        console.log(`📤 Emitted ${event} to all users`);
    }

    /**
     * Emit to users by role, excluding admin users
     */
    emitToRoleExcludingAdmin(roleName, event, data) {
        // Get all sockets in the role room
        const roleRoom = this.io.sockets.adapter.rooms.get(`role_${roleName}`);
        if (!roleRoom) {
            console.log(`📤 No users found in role ${roleName}`);
            return;
        }

        // Filter out admin users
        const nonAdminSockets = Array.from(roleRoom).filter(socketId => {
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket || !socket.user) return false;
            
            const userRole = socket.user.role_id;
            const isAdmin = userRole && (
                userRole.role_name === 'admin' || 
                userRole.role_name === 'super_admin'
            );
            
            return !isAdmin;
        });

        // Emit to non-admin users
        nonAdminSockets.forEach(socketId => {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit(event, data);
            }
        });

        console.log(`📤 Emitted ${event} to ${nonAdminSockets.length} non-admin users in role ${roleName}`);
    }

    /**
     * Emit to users by role
     */
    emitToRole(roleName, event, data) {
        if (!roleName) {
            console.log('⚠️ Cannot emit to role: roleName is undefined');
            return;
        }
        
        const roomName = `role_${roleName}`;
        this.io.to(roomName).emit(event, data);
        console.log(`📤 Emitted ${event} to role ${roleName}`);
    }

    /**
     * Emit to department
     */
    emitToDepartment(departmentId, event, data) {
        this.io.to(`dept_${departmentId}`).emit(event, data);
        console.log(`📤 Emitted ${event} to department ${departmentId}`);
    }

    // ==================== INCIDENT EVENTS ====================

    /**
     * Emit incident reported event
     */
    emitIncidentReported(incident, reporter) {
        const eventData = {
            incident,
            reporter: {
                id: reporter._id,
                name: reporter.full_name,
                email: reporter.email
            },
            timestamp: new Date()
        };

        // Notify safety officers and managers
        this.emitToRole('safety_officer', 'incident_reported', eventData);
        this.emitToRole('manager', 'incident_reported', eventData);
        this.emitToRoom('admin_room', 'incident_reported', eventData);
        
        // Notify reporter
        this.emitToUser(reporter._id, 'incident_reported_confirmation', {
            incidentId: incident._id,
            message: 'Sự cố đã được báo cáo thành công'
        });
    }

    /**
     * Emit incident classified event
     */
    emitIncidentClassified(incident, classifier) {
        const eventData = {
            incident,
            classifier: {
                id: classifier._id,
                name: classifier.full_name
            },
            timestamp: new Date()
        };

        // Notify all relevant parties
        this.emitToRoom(`incident_${incident._id}`, 'incident_classified', eventData);
        this.emitToRole('safety_officer', 'incident_classified', eventData);
        this.emitToRole('manager', 'incident_classified', eventData);
    }

    /**
     * Emit incident assigned event
     */
    emitIncidentAssigned(incident, assignee, assigner) {
        const eventData = {
            incident,
            assignee: {
                id: assignee._id,
                name: assignee.full_name,
                email: assignee.email
            },
            assigner: {
                id: assigner._id,
                name: assigner.full_name
            },
            timestamp: new Date()
        };

        // Notify assignee
        this.emitToUser(assignee._id, 'incident_assigned', eventData);
        
        // Notify others
        this.emitToRoom(`incident_${incident._id}`, 'incident_assigned', eventData);
        this.emitToRole('safety_officer', 'incident_assigned', eventData);
    }

    /**
     * Emit incident progress updated event
     */
    emitIncidentProgressUpdated(incident, updater) {
        const eventData = {
            incident,
            updater: {
                id: updater._id,
                name: updater.full_name
            },
            timestamp: new Date()
        };

        this.emitToRoom(`incident_${incident._id}`, 'incident_progress_updated', eventData);
        this.emitToRole('safety_officer', 'incident_progress_updated', eventData);
        this.emitToRole('manager', 'incident_progress_updated', eventData);
    }

    /**
     * Emit incident closed event
     */
    emitIncidentClosed(incident, closer) {
        const eventData = {
            incident,
            closer: {
                id: closer._id,
                name: closer.full_name
            },
            timestamp: new Date()
        };

        this.emitToRoom(`incident_${incident._id}`, 'incident_closed', eventData);
        this.emitToRole('safety_officer', 'incident_closed', eventData);
        this.emitToRole('manager', 'incident_closed', eventData);
        this.emitToRoom('admin_room', 'incident_closed', eventData);
    }

    // ==================== TRAINING EVENTS ====================

    /**
     * Emit training session created event
     */
    emitTrainingSessionCreated(session, creator) {
        const eventData = {
            session,
            creator: {
                id: creator._id,
                name: creator.full_name
            },
            timestamp: new Date()
        };

        // Notify all employees
        this.emitToAll('training_session_created', eventData);
    }

    /**
     * Emit training enrollment event
     */
    emitTrainingEnrolled(enrollment, user) {
        const eventData = {
            enrollment,
            user: {
                id: user._id,
                name: user.full_name
            },
            timestamp: new Date()
        };

        // Notify user
        this.emitToUser(user._id, 'training_enrolled', eventData);
        
        // Notify managers
        this.emitToRole('manager', 'training_enrolled', eventData);
    }

    /**
     * Emit training started event
     */
    emitTrainingStarted(session, user) {
        const eventData = {
            session,
            user: {
                id: user._id,
                name: user.full_name
            },
            timestamp: new Date()
        };

        this.emitToUser(user._id, 'training_started', eventData);
        this.emitToRole('manager', 'training_started', eventData);
    }

    /**
     * Emit training submitted event
     */
    emitTrainingSubmitted(enrollment, user) {
        const eventData = {
            enrollment,
            user: {
                id: user._id,
                name: user.full_name
            },
            timestamp: new Date()
        };

        this.emitToUser(user._id, 'training_submitted', eventData);
        this.emitToRole('manager', 'training_submitted', eventData);
    }

    /**
     * Emit training completed event
     */
    emitTrainingCompleted(enrollment, user) {
        const eventData = {
            enrollment,
            user: {
                id: user._id,
                name: user.full_name
            },
            timestamp: new Date()
        };

        this.emitToUser(user._id, 'training_completed', eventData);
        this.emitToRole('manager', 'training_completed', eventData);
    }

    // ==================== PPE EVENTS ====================

    /**
     * Emit PPE issued event
     */
    emitPPEIssued(issuance, issuer, recipient) {
        const eventData = {
            issuance,
            issuer: {
                id: issuer._id,
                name: issuer.full_name
            },
            recipient: {
                id: recipient._id,
                name: recipient.full_name
            },
            timestamp: new Date()
        };

        console.log(`🛡️ Emitting PPE issued event for recipient: ${recipient._id} (${recipient.full_name})`);
        
        // Notify recipient (employee)
        this.emitToUser(recipient._id, 'ppe_issued', eventData);
        
        // Notify warehouse staff and managers, but exclude admin users
        this.emitToRoleExcludingAdmin('warehouse_staff', 'ppe_issued', eventData);
        this.emitToRoleExcludingAdmin('manager', 'ppe_issued', eventData);
    }

    /**
     * Emit PPE returned event
     */
    emitPPEReturned(issuance, returner) {
        // Check if issuance has user_id
        if (!issuance || !issuance.user_id) {
            console.log('⚠️ Cannot emit PPE returned: issuance or user_id is missing');
            return;
        }
        
        const eventData = {
            issuance,
            returner: {
                id: returner._id,
                name: returner.full_name
            },
            timestamp: new Date()
        };

        // Handle both populated and non-populated user_id
        const userId = issuance.user_id._id || issuance.user_id.id || issuance.user_id;
        
        if (!userId) {
            console.log('⚠️ Cannot emit PPE returned: userId is undefined');
            return;
        }
        
        console.log(`🛡️ Emitting PPE returned event for user: ${userId} (${returner.full_name})`);
        console.log(`🛡️ Event data:`, JSON.stringify(eventData, null, 2));
        
        // Notify the user who returned the PPE
        this.emitToUser(userId, 'ppe_returned', eventData);
        
        // Notify admin users (only once, avoid duplicates)
        this.emitToRoom('admin_room', 'ppe_returned', eventData);
    }

    /**
     * Emit PPE report event
     */
    emitPPEReport(issuance, reporter) {
        // Check if issuance has user_id
        if (!issuance || !issuance.user_id) {
            console.log('⚠️ Cannot emit PPE report: issuance or user_id is missing');
            return;
        }
        
        const eventData = {
            issuance,
            reporter: {
                id: reporter._id,
                name: reporter.full_name
            },
            timestamp: new Date()
        };

        // Handle both populated and non-populated user_id
        const userId = issuance.user_id._id || issuance.user_id.id || issuance.user_id;
        
        if (!userId) {
            console.log('⚠️ Cannot emit PPE report: userId is undefined');
            return;
        }
        
        console.log(`📢 Emitting PPE report event for user: ${userId} (${reporter.full_name})`);
        console.log(`📢 Event data:`, JSON.stringify(eventData, null, 2));
        
        // Notify the user who reported the PPE issue
        this.emitToUser(userId, 'ppe_reported', eventData);
        
        // Notify admin users (only once, avoid duplicates)
        this.emitToRoom('admin_room', 'ppe_reported', eventData);
        
        // Send confirmation to reporter
        this.emitToUser(userId, 'ppe_reported_confirmation', {
            issuanceId: issuance._id,
            message: 'Báo cáo PPE thành công'
        });
    }

    /**
     * Emit PPE expiring event
     */
    emitPPEExpiring(issuances) {
        const eventData = {
            issuances,
            timestamp: new Date()
        };

        // Notify users whose PPE is expiring
        issuances.forEach(issuance => {
            this.emitToUser(issuance.user_id, 'ppe_expiring', {
                issuance,
                timestamp: new Date()
            });
        });

        // Notify warehouse staff
        this.emitToRole('warehouse_staff', 'ppe_expiring_bulk', eventData);
    }

    /**
     * Emit PPE low stock event
     */
    emitPPELowStock(items) {
        const eventData = {
            items,
            timestamp: new Date()
        };

        this.emitToRole('warehouse_staff', 'ppe_low_stock', eventData);
        this.emitToRole('manager', 'ppe_low_stock', eventData);
    }

    // ==================== NOTIFICATION EVENTS ====================

    /**
     * Emit notification created event
     */
    emitNotificationCreated(notification) {
        const eventData = {
            notification,
            timestamp: new Date()
        };

        if (notification.target_users && notification.target_users.length > 0) {
            // Send to specific users
            notification.target_users.forEach(userId => {
                this.emitToUser(userId, 'notification_created', eventData);
            });
        } else if (notification.target_roles && notification.target_roles.length > 0) {
            // Send to specific roles
            notification.target_roles.forEach(roleId => {
                this.emitToRole(roleId, 'notification_created', eventData);
            });
        } else if (notification.user_id) {
            // Send to specific user (for individual notifications)
            this.emitToUser(notification.user_id, 'notification_created', eventData);
        } else {
            // Send to all users (only for system-wide notifications)
            this.emitToAll('notification_created', eventData);
        }
    }

    /**
     * Emit notification read event
     */
    emitNotificationRead(notification, user) {
        const eventData = {
            notification,
            user: {
                id: user._id,
                name: user.full_name
            },
            timestamp: new Date()
        };

        this.emitToRoom(`notification_${notification._id}`, 'notification_read', eventData);
    }

    // ==================== PROJECT EVENTS ====================

    /**
     * Emit project created event
     */
    async emitProjectCreated(project, creator, metadata = {}) {
        try {
            // Emit to Kafka
            await ProjectEvents.emitProjectCreated(project, creator, metadata);
            
            // Also emit to WebSocket for immediate feedback
            const eventData = {
                project,
                creator: {
                    id: creator._id,
                    name: creator.full_name
                },
                timestamp: new Date()
            };

            this.emitToRole('manager', 'project_created', eventData);
            this.emitToRoom('admin_room', 'project_created', eventData);
            
        } catch (error) {
            console.error('❌ Failed to emit project created event:', error);
            // Fallback to WebSocket only
            const eventData = {
                project,
                creator: {
                    id: creator._id,
                    name: creator.full_name
                },
                timestamp: new Date()
            };

            this.emitToRole('manager', 'project_created', eventData);
            this.emitToRoom('admin_room', 'project_created', eventData);
        }
    }

    /**
     * Emit project progress updated event
     */
    async emitProjectProgressUpdated(project, updater, metadata = {}) {
        try {
            // Emit to Kafka
            await ProjectEvents.emitProjectProgressUpdated(project, updater, metadata);
            
            // Also emit to WebSocket for immediate feedback
            const eventData = {
                project,
                updater: {
                    id: updater._id,
                    name: updater.full_name
                },
                timestamp: new Date()
            };

            this.emitToRoom(`project_${project._id}`, 'project_progress_updated', eventData);
            this.emitToRole('manager', 'project_progress_updated', eventData);
            
        } catch (error) {
            console.error('❌ Failed to emit project progress updated event:', error);
            // Fallback to WebSocket only
            const eventData = {
                project,
                updater: {
                    id: updater._id,
                    name: updater.full_name
                },
                timestamp: new Date()
            };

            this.emitToRoom(`project_${project._id}`, 'project_progress_updated', eventData);
            this.emitToRole('manager', 'project_progress_updated', eventData);
        }
    }

    /**
     * Emit project assignment event
     */
    async emitProjectAssigned(assignment, assignee, assigner, metadata = {}) {
        try {
            // Emit to Kafka
            await ProjectEvents.emitProjectAssigned(assignment, assignee, assigner, metadata);
            
            // Also emit to WebSocket for immediate feedback
            const eventData = {
                assignment,
                assignee: {
                    id: assignee._id,
                    name: assignee.full_name
                },
                assigner: {
                    id: assigner._id,
                    name: assigner.full_name
                },
                timestamp: new Date()
            };

            this.emitToUser(assignee._id, 'project_assigned', eventData);
            this.emitToRole('manager', 'project_assigned', eventData);
            
        } catch (error) {
            console.error('❌ Failed to emit project assigned event:', error);
            // Fallback to WebSocket only
            const eventData = {
                assignment,
                assignee: {
                    id: assignee._id,
                    name: assignee.full_name
                },
                assigner: {
                    id: assigner._id,
                    name: assigner.full_name
                },
                timestamp: new Date()
            };

            this.emitToUser(assignee._id, 'project_assigned', eventData);
            this.emitToRole('manager', 'project_assigned', eventData);
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get connected users count
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    /**
     * Get connected users list
     */
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }

    /**
     * Get users in room
     */
    getUsersInRoom(roomName) {
        return this.roomUsers.get(roomName) || [];
    }

    /**
     * Check if user is connected
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId.toString());
    }

    /**
     * Get user's rooms
     */
    getUserRooms(userId) {
        return this.userRooms.get(userId.toString()) || [];
    }

    /**
     * Setup test event handlers
     */
    setupTestHandlers() {
        this.io.on('connection', (socket) => {
            // Test notification handler
            socket.on('test_notification', (data) => {
                console.log('🧪 Test notification received:', data);
                
                // Send notification to all connected users
                this.io.emit('notification_created', {
                    notification: {
                        _id: `test_${Date.now()}`,
                        title: data.title || 'Test Notification',
                        message: data.message || 'This is a test notification',
                        type: data.type || 'info',
                        category: data.category || 'general',
                        priority: data.priority || 'medium',
                        created_at: new Date().toISOString()
                    }
                });
                
                console.log('✅ Test notification broadcasted to all users');
            });
        });
    }

    // ==================== CERTIFICATE EVENTS ====================

    /**
     * Emit certificate created event
     */
    emitCertificateCreated(certificate, creator) {
        const eventData = {
            certificate,
            creator: {
                id: creator._id,
                name: creator.full_name
            },
            timestamp: new Date().toISOString()
        };

        // Notify all users about new certificate
        this.emitToAll('certificate_created', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_created', eventData);
        this.emitToRole('manager', 'certificate_created', eventData);
        this.emitToRoom('admin_room', 'certificate_created', eventData);
    }

    /**
     * Emit certificate updated event
     */
    emitCertificateUpdated(certificate, updater) {
        const eventData = {
            certificate,
            updater: {
                id: updater._id,
                name: updater.full_name
            },
            timestamp: new Date().toISOString()
        };

        // Notify users interested in this certificate
        this.emitToAll('certificate_updated', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_updated', eventData);
        this.emitToRole('manager', 'certificate_updated', eventData);
        this.emitToRoom('admin_room', 'certificate_updated', eventData);
    }

    /**
     * Emit certificate deleted event
     */
    emitCertificateDeleted(certificate, deleter) {
        const eventData = {
            certificate,
            deleter: {
                id: deleter._id,
                name: deleter.full_name
            },
            timestamp: new Date().toISOString()
        };

        // Notify all users about certificate deletion
        this.emitToAll('certificate_deleted', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_deleted', eventData);
        this.emitToRole('manager', 'certificate_deleted', eventData);
        this.emitToRoom('admin_room', 'certificate_deleted', eventData);
    }

    /**
     * Emit certificate renewed event
     */
    emitCertificateRenewed(certificate, renewer) {
        const eventData = {
            certificate,
            renewer: {
                id: renewer._id,
                name: renewer.full_name
            },
            timestamp: new Date().toISOString()
        };

        // Notify users about certificate renewal
        this.emitToAll('certificate_renewed', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_renewed', eventData);
        this.emitToRole('manager', 'certificate_renewed', eventData);
        this.emitToRoom('admin_room', 'certificate_renewed', eventData);
    }

    /**
     * Emit certificate expiring soon event
     */
    emitCertificateExpiringSoon(certificate, daysUntilExpiry) {
        const eventData = {
            certificate,
            daysUntilExpiry,
            timestamp: new Date().toISOString(),
            priority: certificate.priority || 'MEDIUM'
        };

        // Notify certificate owner if assigned
        if (certificate.assignedTo) {
            this.emitToUser(certificate.assignedTo, 'certificate_expiring_soon', eventData);
        }

        // Notify safety officers and managers
        this.emitToRole('safety_officer', 'certificate_expiring_soon', eventData);
        this.emitToRole('manager', 'certificate_expiring_soon', eventData);
        this.emitToRoom('admin_room', 'certificate_expiring_soon', eventData);
    }

    /**
     * Emit certificate expired event
     */
    emitCertificateExpired(certificate) {
        const eventData = {
            certificate,
            timestamp: new Date().toISOString(),
            priority: 'HIGH'
        };

        // Notify certificate owner if assigned
        if (certificate.assignedTo) {
            this.emitToUser(certificate.assignedTo, 'certificate_expired', eventData);
        }

        // Notify safety officers and managers with high priority
        this.emitToRole('safety_officer', 'certificate_expired', eventData);
        this.emitToRole('manager', 'certificate_expired', eventData);
        this.emitToRoom('admin_room', 'certificate_expired', eventData);
    }

    /**
     * Emit certificate reminder settings updated event
     */
    emitCertificateReminderSettingsUpdated(certificate, updater) {
        const eventData = {
            certificate,
            updater: {
                id: updater._id,
                name: updater.full_name
            },
            timestamp: new Date().toISOString()
        };

        // Notify certificate owner if assigned
        if (certificate.assignedTo) {
            this.emitToUser(certificate.assignedTo, 'certificate_reminder_settings_updated', eventData);
        }

        // Notify safety officers and managers
        this.emitToRole('safety_officer', 'certificate_reminder_settings_updated', eventData);
        this.emitToRole('manager', 'certificate_reminder_settings_updated', eventData);
    }

    /**
     * Emit certificate status changed event
     */
    emitCertificateStatusChanged(certificate, updater, oldStatus, newStatus) {
        const eventData = {
            certificate,
            updater: {
                id: updater._id,
                name: updater.full_name
            },
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString()
        };

        // Notify all users about status change
        this.emitToAll('certificate_status_changed', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_status_changed', eventData);
        this.emitToRole('manager', 'certificate_status_changed', eventData);
        this.emitToRoom('admin_room', 'certificate_status_changed', eventData);
    }

    /**
     * Emit certificate bulk operation event
     */
    emitCertificateBulkOperation(operation, certificates, operator) {
        const eventData = {
            operation,
            certificates,
            operator: {
                id: operator._id,
                name: operator.full_name
            },
            count: certificates.length,
            timestamp: new Date().toISOString()
        };

        // Notify all users about bulk operation
        this.emitToAll('certificate_bulk_operation', eventData);
        
        // Notify specific roles
        this.emitToRole('safety_officer', 'certificate_bulk_operation', eventData);
        this.emitToRole('manager', 'certificate_bulk_operation', eventData);
        this.emitToRoom('admin_room', 'certificate_bulk_operation', eventData);
    }
}

// Export singleton instance
module.exports = new WebSocketService();
