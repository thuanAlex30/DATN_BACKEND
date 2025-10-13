const ppeService = require('../services/ppeService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const websocketService = require('../services/websocketService');
const PPEEvents = require('../events/ppeEvents');

class PPEController {
  // PPE Categories
  static getAllCategories = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getAllCategories();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getCategoryById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getCategoryById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createCategory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const categoryData = req.body;
    const result = await ppeService.createCategory(categoryData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static importCategories = ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    console.log(`📁 Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    const result = await ppeService.importCategoriesFromExcel(req.file);
    console.log(`✅ Import completed: ${result.success.length} success, ${result.errors.length} errors`);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static updateCategory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const categoryData = req.body;
    const result = await ppeService.updateCategory(id, categoryData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteCategory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.deleteCategory(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static importItems = ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'Không có file được tải lên', 400);
    }

    console.log('Importing PPE items from file:', req.file.originalname);
    const result = await ppeService.importItems(req.file);
    console.log('Import result:', result);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // PPE Items
  static getAllItems = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const filters = {
        category_id: req.query.category_id,
        search: req.query.search
      };
      
      const result = await ppeService.getAllItems(filters);
      
      if (result.success) {
        // Additional safety check for BSON errors
        try {
          return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } catch (bsonError) {
          console.error('BSON serialization error in getAllItems:', bsonError);
          // Return empty data if BSON error occurs
          return ApiResponse.success(res, [], 'Lấy danh sách thiết bị PPE thành công (dữ liệu rỗng do lỗi ObjectId)', 200);
        }
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getAllItems:', error);
      return ApiResponse.error(res, 'Internal server error while fetching items', 500, { error: error.message });
    }
  });

  static getItemById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getItemById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const itemData = req.body;
    const result = await ppeService.createItem(itemData);
    
    // Emit Kafka event for PPE item created
    if (result.success && result.data) {
      try {
        await PPEEvents.emitPPEItemCreated(result.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
      } catch (eventError) {
        console.error('Failed to emit PPE item created event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const itemData = req.body;
    const result = await ppeService.updateItem(id, itemData);
    
    // Emit Kafka event for PPE item updated
    if (result.success && result.data) {
      try {
        const changes = {};
        Object.keys(itemData).forEach(key => {
          changes[key] = itemData[key];
        });
        await PPEEvents.emitPPEItemUpdated(result.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, changes);
      } catch (eventError) {
        console.error('Failed to emit PPE item updated event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateItemQuantity = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const quantityData = req.body; // { quantity_available, quantity_allocated }
    const result = await ppeService.updateItemQuantity(id, quantityData);
    
    // Emit Kafka event for PPE item stock updated
    if (result.success && result.data) {
      try {
        const stockChange = {
          type: 'quantity_update',
          previous_stock: quantityData.previous_quantity,
          new_stock: quantityData.quantity_available,
          change_quantity: quantityData.quantity_available - (quantityData.previous_quantity || 0),
          change_reason: quantityData.reason || 'Manual update'
        };
        await PPEEvents.emitPPEItemStockUpdated(result.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, stockChange);
      } catch (eventError) {
        console.error('Failed to emit PPE item stock updated event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get item data before deletion for event
    const itemData = await ppeService.getItemById(id);
    
    const result = await ppeService.deleteItem(id);
    
    // Emit Kafka event for PPE item deleted
    if (result.success && itemData.success) {
      try {
        await PPEEvents.emitPPEItemDeleted(itemData.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
      } catch (eventError) {
        console.error('Failed to emit PPE item deleted event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getItemStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getItemStats(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  // PPE Inventory
  static getAllInventory = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const filters = {
        item_id: req.query.item_id,
        site_id: req.query.site_id,
        status: req.query.status,
        search: req.query.search
      };
      
      const result = await ppeService.getAllInventory(filters);
      
      if (result.success) {
        // Additional safety check for BSON errors
        try {
          return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } catch (bsonError) {
          console.error('BSON serialization error in getAllInventory:', bsonError);
          // Return empty data if BSON error occurs
          return ApiResponse.success(res, [], 'Lấy danh sách tồn kho PPE thành công (dữ liệu rỗng do lỗi ObjectId)', 200);
        }
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getAllInventory:', error);
      return ApiResponse.error(res, 'Internal server error while fetching inventory', 500, { error: error.message });
    }
  });

  static getInventoryById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getInventoryById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createInventory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const inventoryData = req.body;
    const result = await ppeService.createInventory(inventoryData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateInventory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const inventoryData = req.body;
    const result = await ppeService.updateInventory(id, inventoryData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteInventory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.deleteInventory(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getInventoryStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getInventoryStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // PPE Assignments
  static getAllAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      user_id: req.query.user_id,
      item_id: req.query.item_id,
      status: req.query.status,
      search: req.query.search
    };
    
    const result = await ppeService.getAllAssignments(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getAssignmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getAssignmentById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const assignmentData = req.body;
    const result = await ppeService.createAssignment(assignmentData);
    
    // Emit Kafka event for PPE item assigned
    if (result.success && result.data) {
      try {
        const User = require('../models/user');
        const assignee = await User.findById(assignmentData.user_id);
        const item = await ppeService.getItemById(assignmentData.item_id);
        
        if (assignee && item.success) {
          await PPEEvents.emitPPEItemAssigned(item.data, assignee, req.user || { _id: 'system', role: 'admin', full_name: 'System' });
        }
      } catch (eventError) {
        console.error('Failed to emit PPE item assigned event:', eventError);
      }
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const assignmentData = req.body;
    const result = await ppeService.updateAssignment(id, assignmentData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.deleteAssignment(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getUserAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await ppeService.getUserAssignments(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static returnAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const returnData = req.body;
    const result = await ppeService.returnAssignment(id, returnData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // PPE Maintenance
  static getAllMaintenance = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const filters = {
        item_id: req.query.item_id,
        status: req.query.status,
        search: req.query.search
      };
      
      const result = await ppeService.getAllMaintenance(filters);
      
      if (result.success) {
        return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getAllMaintenance:', error);
      return ApiResponse.error(res, 'Internal server error while fetching maintenance records', 500, { error: error.message });
    }
  });

  static getMaintenanceById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getMaintenanceById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createMaintenance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const maintenanceData = req.body;
    const result = await ppeService.createMaintenance(maintenanceData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateMaintenance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const maintenanceData = req.body;
    const result = await ppeService.updateMaintenance(id, maintenanceData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteMaintenance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.deleteMaintenance(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getMaintenanceStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getMaintenanceStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // PPE Reports
  static getInventoryReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const filters = {
        site_id: req.query.site_id,
        category_id: req.query.category_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };
      
      const result = await ppeService.getInventoryReport(filters);
      
      if (result.success) {
        // Additional safety check for BSON errors
        try {
          return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } catch (bsonError) {
          console.error('BSON serialization error in getInventoryReport:', bsonError);
          // Return empty data if BSON error occurs
          return ApiResponse.success(res, [], 'Lấy báo cáo tồn kho PPE thành công (dữ liệu rỗng do lỗi ObjectId)', 200);
        }
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getInventoryReport:', error);
      return ApiResponse.error(res, 'Internal server error while fetching inventory report', 500, { error: error.message });
    }
  });

  static getAssignmentReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      user_id: req.query.user_id,
      item_id: req.query.item_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    const result = await ppeService.getAssignmentReport(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getMaintenanceReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = {
      item_id: req.query.item_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    const result = await ppeService.getMaintenanceReport(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // PPE Dashboard
  static getDashboardStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const result = await ppeService.getDashboardStats();
      
      if (result.success) {
        return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return ApiResponse.error(res, 'Internal server error while fetching dashboard stats', 500, { error: error.message });
    }
  });

  // PPE Issuances
  static getAllIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await ppeService.getAllIssuances(filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getMyIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await ppeService.getIssuancesByUser(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getIssuanceById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.getIssuanceById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static getIssuancesByUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await ppeService.getIssuancesByUser(userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getActiveIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getActiveIssuances();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getExpiringIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getExpiringIssuances();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static createIssuance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const issuanceData = req.body;
    const result = await ppeService.createIssuance(issuanceData);
    
    if (result.success) {
      // Emit WebSocket notification for PPE issued
      try {
        const { issuance, issuer, recipient } = result.data;
        websocketService.emitPPEIssued(issuance, issuer, recipient);
        console.log(`🛡️ PPE issuance WebSocket notification sent for user: ${recipient._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE issued WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateIssuance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const issuanceData = req.body;
    const result = await ppeService.updateIssuance(id, issuanceData);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static returnIssuance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const returnData = req.body;
    const result = await ppeService.returnIssuance(id, returnData);
    
    if (result.success) {
      // Emit WebSocket notification for PPE returned
      try {
        const { issuance, returner } = result.data;
        websocketService.emitPPEReturned(issuance, returner);
        console.log(`🛡️ PPE return WebSocket notification sent for user: ${returner._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE returned WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteIssuance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ppeService.deleteIssuance(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static returnIssuanceEmployee = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const returnData = req.body;
    const employeeId = req.user.id;
    const result = await ppeService.returnIssuanceEmployee(id, returnData, employeeId);
    
    if (result.success) {
      // Emit WebSocket notification for PPE returned by employee
      try {
        const { issuance, returner } = result.data;
        websocketService.emitPPEReturned(issuance, returner);
        console.log(`🛡️ PPE employee return WebSocket notification sent for user: ${returner._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE employee return WebSocket notification:', wsError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static reportIssuanceEmployee = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reportData = req.body;
    const employeeId = req.user.id;
    const result = await ppeService.reportIssuanceEmployee(id, reportData, employeeId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // Statistics and Reports
  static getStockStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getInventoryStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getOverdueIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getOverdueIssuances();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getLowStockItems = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getLowStockItems();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getIssuanceStatistics = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getIssuanceStatistics();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getQuantityStatistics = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getQuantityStatistics();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getDashboardData = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getDashboardStats();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getAllUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const result = await ppeService.getAllUsers();
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });
}

module.exports = PPEController;