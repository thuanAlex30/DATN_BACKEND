/**
 * WebSocket Service
 * Handles real-time notifications for PPE system
 */

const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userRoles = new Map(); // userId -> role
  }

  /**
   * Initialize WebSocket service with Socket.IO instance
   * @param {Object} io - Socket.IO instance
   */
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('User connected', { socketId: socket.id });

      // Handle authentication from Socket.IO auth object
      if (socket.handshake.auth && socket.handshake.auth.token) {
        try {
          const jwt = require('jsonwebtoken');
          const token = socket.handshake.auth.token;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          const userId = decoded.id || decoded.userId;
          const role = decoded.role || 'user';
          
          this.connectedUsers.set(userId, socket.id);
          this.userRoles.set(userId, role);
          socket.userId = userId;
          socket.role = role;
          
          logger.info('User authenticated via WebSocket', { userId, role, socketId: socket.id });
          
          socket.emit('authenticated', { success: true, userId, role });
        } catch (error) {
          logger.error('WebSocket authentication error', { error: error.message });
          socket.emit('authentication_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      } else {
        logger.warn('No authentication token provided', { socketId: socket.id });
        socket.emit('authentication_error', { message: 'No authentication token provided' });
        socket.disconnect();
      }

      // Handle legacy authenticate event (for backward compatibility)
      socket.on('authenticate', (data) => {
        try {
          const { userId, role } = data;
          this.connectedUsers.set(userId, socket.id);
          this.userRoles.set(userId, role);
          socket.userId = userId;
          socket.role = role;
          
          logger.info('User authenticated via WebSocket (legacy)', { userId, role, socketId: socket.id });
          
          socket.emit('authenticated', { success: true, userId, role });
        } catch (error) {
          logger.error('WebSocket authentication error', { error: error.message });
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userRoles.delete(socket.userId);
          logger.info('User disconnected', { userId: socket.userId, socketId: socket.id });
        }
      });

      // Handle PPE status updates
      socket.on('ppe_status_update', (data) => {
        this.handlePPEStatusUpdate(socket, data);
      });

      // Handle batch processing status
      socket.on('batch_status_request', (data) => {
        this.handleBatchStatusRequest(socket, data);
      });
    });
  }

  /**
   * Emit to specific user
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      logger.debug('Emitted to user', { userId, event, socketId });
    } else {
      logger.warn('User not connected', { userId, event });
    }
  }

  /**
   * Emit to all users with specific role
   * @param {string} role - User role
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToRole(role, event, data) {
    if (!this.io) return;

    this.userRoles.forEach((userRole, userId) => {
      if (userRole === role) {
        this.emitToUser(userId, event, data);
      }
    });

    logger.debug('Emitted to role', { role, event, userCount: this.getUserCountByRole(role) });
  }

  /**
   * Emit to all connected users
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.debug('Emitted to all users', { event, userCount: this.connectedUsers.size });
    }
  }

  /**
   * Get user count by role
   * @param {string} role - User role
   * @returns {number} User count
   */
  getUserCountByRole(role) {
    let count = 0;
    this.userRoles.forEach((userRole) => {
      if (userRole === role) count++;
    });
    return count;
  }

  /**
   * Get total connected users
   * @returns {number} Total user count
   */
  getTotalConnectedUsers() {
    return this.connectedUsers.size;
  }

  // ========================================
  // PPE SPECIFIC NOTIFICATIONS
  // ========================================

  /**
   * Emit PPE quantity update
   * @param {Object} ppeItem - PPE item data
   * @param {Object} updateData - Update data
   */
  emitPPEQuantityUpdate(ppeItem, updateData) {
    const notification = {
      type: 'ppe_quantity_update',
      title: 'PPE Quantity Updated',
      message: `PPE item "${ppeItem.item_name}" quantity has been updated`,
      data: {
        itemId: ppeItem._id,
        itemName: ppeItem.item_name,
        itemCode: ppeItem.item_code,
        previousQuantity: updateData.previousQuantity,
        newQuantity: updateData.newQuantity,
        operation: updateData.operation,
        updatedBy: updateData.updatedBy,
        timestamp: new Date()
      }
    };

    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE condition update
   * @param {Object} ppeItem - PPE item data
   * @param {string} newCondition - New condition
   * @param {string} updatedBy - Updated by user
   */
  emitPPEConditionUpdate(ppeItem, newCondition, updatedBy) {
    const notification = {
      type: 'ppe_condition_update',
      title: 'PPE Condition Updated',
      message: `PPE item "${ppeItem.item_name}" condition changed to ${newCondition}`,
      data: {
        itemId: ppeItem._id,
        itemName: ppeItem.item_name,
        itemCode: ppeItem.item_code,
        newCondition,
        updatedBy,
        timestamp: new Date()
      }
    };

    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE issuance notification
   * @param {Object} issuance - PPE issuance data
   */
  emitPPEIssuance(issuance) {
    const notification = {
      type: 'ppe_issuance',
      title: 'PPE Issued',
      message: `PPE has been issued to ${issuance.user_id.full_name}`,
      data: {
        issuanceId: issuance._id,
        itemName: issuance.item_id.item_name,
        quantity: issuance.quantity,
        issuedTo: issuance.user_id.full_name,
        issuedBy: issuance.issued_by,
        issuedDate: issuance.issued_date,
        expectedReturnDate: issuance.expected_return_date
      }
    };

    // Notify the user who received the PPE
    this.emitToUser(issuance.user_id._id, 'ppe_notification', notification);
    
    // Notify managers and admins
    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE return notification
   * @param {Object} issuance - PPE issuance data
   */
  emitPPEReturn(issuance) {
    const notification = {
      type: 'ppe_return',
      title: 'PPE Returned',
      message: `PPE has been returned by ${issuance.user_id.full_name}`,
      data: {
        issuanceId: issuance._id,
        itemName: issuance.item_id.item_name,
        quantity: issuance.quantity,
        returnedBy: issuance.user_id.full_name,
        returnedDate: issuance.returned_date,
        condition: issuance.returned_condition
      }
    };

    // Notify the user who returned the PPE
    this.emitToUser(issuance.user_id._id, 'ppe_notification', notification);
    
    // Notify managers and admins
    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE issued to employee notification
   * @param {Object} issuance - PPE issuance data
   * @param {Object} issuer - Issuer (Manager) information
   * @param {Object} recipient - Recipient (Employee) information
   */
  emitPPEIssuedToEmployee(issuance, issuer, recipient) {
    const notification = {
      type: 'ppe_issued_to_employee',
      title: 'PPE Issued to Employee',
      message: `PPE "${issuance.item_id.item_name}" has been issued to ${recipient.full_name}`,
      data: {
        issuanceId: issuance._id,
        itemName: issuance.item_id.item_name,
        itemCode: issuance.item_id.item_code,
        quantity: issuance.quantity,
        issuedTo: recipient.full_name,
        issuedToId: recipient._id,
        issuedBy: issuer.full_name,
        issuedById: issuer._id,
        issuedDate: issuance.issued_date,
        expectedReturnDate: issuance.expected_return_date,
        managerId: issuance.manager_id
      }
    };

    // Notify the employee who received the PPE
    this.emitToUser(recipient._id, 'ppe_notification', notification);
    
    // Notify the manager who issued the PPE
    this.emitToUser(issuer._id, 'ppe_notification', notification);
    
    // Notify all managers and admins for quantity updates
    this.emitToRole('manager', 'ppe_quantity_update', {
      type: 'ppe_quantity_update',
      title: 'PPE Quantity Updated',
      message: `PPE "${issuance.item_id.item_name}" quantity updated after issuance`,
      data: {
        itemId: issuance.item_id._id,
        itemName: issuance.item_id.item_name,
        itemCode: issuance.item_id.item_code,
        quantityIssued: issuance.quantity,
        issuedTo: recipient.full_name,
        issuedBy: issuer.full_name,
        managerId: issuance.manager_id,
        timestamp: new Date()
      }
    });
    
    this.emitToRole('admin', 'ppe_quantity_update', {
      type: 'ppe_quantity_update',
      title: 'PPE Quantity Updated',
      message: `PPE "${issuance.item_id.item_name}" quantity updated after issuance`,
      data: {
        itemId: issuance.item_id._id,
        itemName: issuance.item_id.item_name,
        itemCode: issuance.item_id.item_code,
        quantityIssued: issuance.quantity,
        issuedTo: recipient.full_name,
        issuedBy: issuer.full_name,
        managerId: issuance.manager_id,
        timestamp: new Date()
      }
    });
  }

  /**
   * Emit PPE confirmation notification
   * @param {Object} issuance - PPE issuance data
   * @param {Object} employee - Employee information
   * @param {Object} manager - Manager information
   */
  emitPPEConfirmed(issuance, employee, manager) {
    const notification = {
      type: 'ppe_confirmed',
      title: 'PPE Confirmed Received',
      message: `${employee.full_name} đã xác nhận nhận PPE "${issuance.item_id.item_name}"`,
      data: {
        issuanceId: issuance._id,
        itemName: issuance.item_id.item_name,
        itemCode: issuance.item_id.item_code,
        quantity: issuance.quantity,
        confirmedBy: employee.full_name,
        confirmedById: employee._id,
        managerId: manager._id,
        managerName: manager.full_name,
        confirmedDate: issuance.confirmed_date,
        confirmationNotes: issuance.confirmation_notes,
        timestamp: new Date()
      }
    };

    // Notify the manager who issued the PPE
    this.emitToUser(manager._id, 'ppe_notification', notification);
    
    // Notify all managers and admins
    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
    
    // Notify the employee about successful confirmation
    this.emitToUser(employee._id, 'ppe_notification', {
      type: 'ppe_confirmation_success',
      title: 'PPE Confirmed Successfully',
      message: `Bạn đã xác nhận nhận PPE "${issuance.item_id.item_name}" thành công`,
      data: {
        issuanceId: issuance._id,
        itemName: issuance.item_id.item_name,
        confirmedDate: issuance.confirmed_date,
        timestamp: new Date()
      }
    });
  }

  // ========================================
  // BATCH PROCESSING NOTIFICATIONS
  // ========================================

  /**
   * Emit batch processing started
   * @param {Object} batch - Batch data
   */
  emitBatchProcessingStarted(batch) {
    const notification = {
      type: 'batch_processing_started',
      title: 'Batch Processing Started',
      message: `Batch "${batch.batch_name}" processing has started`,
      data: {
        batchId: batch.batch_id,
        batchName: batch.batch_name,
        totalItems: batch.items.length,
        startedAt: new Date(),
        issuedBy: batch.issued_by
      }
    };

    this.emitToRole('manager', 'batch_notification', notification);
    this.emitToRole('admin', 'batch_notification', notification);
  }

  /**
   * Emit batch processing progress
   * @param {Object} batch - Batch data
   * @param {Object} progress - Progress data
   */
  emitBatchProcessingProgress(batch, progress) {
    const notification = {
      type: 'batch_processing_progress',
      title: 'Batch Processing Progress',
      message: `Batch "${batch.batch_name}" progress: ${progress.percentage}%`,
      data: {
        batchId: batch.batch_id,
        batchName: batch.batch_name,
        progress: progress.percentage,
        processedItems: progress.processedItems,
        totalItems: progress.totalItems,
        successfulItems: progress.successfulItems,
        failedItems: progress.failedItems
      }
    };

    this.emitToRole('manager', 'batch_notification', notification);
    this.emitToRole('admin', 'batch_notification', notification);
  }

  /**
   * Emit batch processing complete
   * @param {Object} batch - Batch data
   * @param {Object} results - Processing results
   */
  emitBatchProcessingComplete(batch, results) {
    const notification = {
      type: 'batch_processing_complete',
      title: 'Batch Processing Complete',
      message: `Batch "${batch.batch_name}" processing completed`,
      data: {
        batchId: batch.batch_id,
        batchName: batch.batch_name,
        status: batch.status,
        totalItems: batch.items.length,
        successfulItems: results.successful.length,
        failedItems: results.failed.length,
        completedAt: new Date(),
        errorSummary: batch.error_summary
      }
    };

    this.emitToRole('manager', 'batch_notification', notification);
    this.emitToRole('admin', 'batch_notification', notification);
  }

  // ========================================
  // EXPIRY MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Emit PPE expired notification
   * @param {Object} tracking - Tracking data
   */
  emitPPEExpired(tracking) {
    const notification = {
      type: 'ppe_expired',
      title: 'PPE Expired',
      message: `PPE item "${tracking.ppe_item_id.item_name}" has expired`,
      data: {
        trackingId: tracking._id,
        itemName: tracking.ppe_item_id.item_name,
        expiryDate: tracking.expiry_date,
        userId: tracking.user_id?._id,
        batchNumber: tracking.batch_number,
        serialNumber: tracking.serial_number
      }
    };

    // Notify the user who has the expired PPE
    if (tracking.user_id) {
      this.emitToUser(tracking.user_id._id, 'ppe_notification', notification);
    }
    
    // Notify managers and admins
    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE replaced notification
   * @param {Object} tracking - Tracking data
   * @param {Object} replacementData - Replacement data
   */
  emitPPEReplaced(tracking, replacementData) {
    const notification = {
      type: 'ppe_replaced',
      title: 'PPE Replaced',
      message: `PPE item "${tracking.ppe_item_id.item_name}" has been replaced`,
      data: {
        trackingId: tracking._id,
        itemName: tracking.ppe_item_id.item_name,
        replacementItemId: replacementData.replacement_item_id,
        replacementDate: replacementData.replacement_date,
        replacementReason: replacementData.replacement_reason,
        userId: tracking.user_id?._id
      }
    };

    // Notify the user who has the replaced PPE
    if (tracking.user_id) {
      this.emitToUser(tracking.user_id._id, 'ppe_notification', notification);
    }
    
    // Notify managers and admins
    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  /**
   * Emit PPE disposed notification
   * @param {Object} tracking - Tracking data
   * @param {Object} disposalData - Disposal data
   */
  emitPPEDisposed(tracking, disposalData) {
    const notification = {
      type: 'ppe_disposed',
      title: 'PPE Disposed',
      message: `PPE item "${tracking.ppe_item_id.item_name}" has been disposed`,
      data: {
        trackingId: tracking._id,
        itemName: tracking.ppe_item_id.item_name,
        disposalMethod: disposalData.disposal_method,
        disposalDate: disposalData.disposal_date,
        disposalCertificate: disposalData.disposal_certificate
      }
    };

    this.emitToRole('manager', 'ppe_notification', notification);
    this.emitToRole('admin', 'ppe_notification', notification);
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle PPE status update
   * @param {Object} socket - Socket instance
   * @param {Object} data - Update data
   */
  handlePPEStatusUpdate(socket, data) {
    try {
      logger.info('PPE status update received', {
        userId: socket.userId,
        data
      });

      // Broadcast to relevant users
      this.emitToRole('manager', 'ppe_status_update', {
        ...data,
        updatedBy: socket.userId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error handling PPE status update', {
        error: error.message,
        userId: socket.userId
      });
    }
  }

  /**
   * Handle batch status request
   * @param {Object} socket - Socket instance
   * @param {Object} data - Request data
   */
  handleBatchStatusRequest(socket, data) {
    try {
      logger.info('Batch status request received', {
        userId: socket.userId,
        batchId: data.batchId
      });

      // Emit current batch status
      socket.emit('batch_status_response', {
        batchId: data.batchId,
        status: 'processing', // This would come from actual batch service
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error handling batch status request', {
        error: error.message,
        userId: socket.userId
      });
    }
  }
}

module.exports = new WebSocketService();