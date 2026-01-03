const ppeService = require('../services/ppeService');
const { ApiResponse } = require('../utils/response');
const EnhancedApiResponse = require('../utils/enhancedResponse');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const websocketService = require('../services/websocketService');
const PPEEvents = require('../events/ppeEvents');
const { uploadImageBuffer } = require('../utils/cloudinaryHelper');

class PPEController {
  // PPE Categories
  static getAllCategories = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getAllCategories(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getCategoryById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getCategoryById(id, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createCategory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const categoryData = req.body;
    if (req.file) {
      try {
        const folder = process.env.CLOUDINARY_PPE_FOLDER || 'ppe';
        const uploadRes = await uploadImageBuffer(req.file.buffer, req.file.originalname, folder);
        categoryData.image_url = uploadRes.secureUrl;
      } catch (err) {
        return ApiResponse.error(res, `Upload ảnh lên Cloudinary thất bại: ${err.message}`, 500);
      }
    }
    const tenantId = req.user.tenant_id;
    const result = await ppeService.createCategory(categoryData, tenantId);
    
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
    const tenantId = req.user.tenant_id;
    const result = await ppeService.importCategoriesFromExcel(req.file, tenantId);
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
    if (req.file) {
      try {
        const folder = process.env.CLOUDINARY_PPE_FOLDER || 'ppe';
        const uploadRes = await uploadImageBuffer(req.file.buffer, req.file.originalname, folder);
        categoryData.image_url = uploadRes.secureUrl;
      } catch (err) {
        return ApiResponse.error(res, `Upload ảnh lên Cloudinary thất bại: ${err.message}`, 500);
      }
    }
    const tenantId = req.user.tenant_id;
    const result = await ppeService.updateCategory(id, categoryData, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteCategory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.deleteCategory(id, tenantId);
    
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
        search: req.query.search,
        include_inactive: req.query.include_inactive === 'true' || req.query.include_inactive === true
      };
      
      const tenantId = req.user.tenant_id;
      console.log('getAllItems - filters:', filters, 'tenantId:', tenantId);
      const result = await ppeService.getAllItems(filters, tenantId);
      console.log('getAllItems - result:', result.success, 'items count:', result.data?.length || 0);
      
      if (result.success) {
        // Use enhanced response handler with BSON error recovery
        return EnhancedApiResponse.success(res, result.data, result.message, result.statusCode, {
          fallbackStrategy: 'replace',
          logErrors: true,
          maxRetries: 3
        });
      } else {
        return EnhancedApiResponse.error(res, result.message, result.statusCode || 500, result.data);
      }
    } catch (error) {
      console.error('Error in getAllItems:', error);
      return ApiResponse.error(res, 'Internal server error while fetching items', 500, { error: error.message });
    }
  });

  static getItemById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getItemById(id, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const itemData = req.body;
    if (req.file) {
      try {
        const folder = process.env.CLOUDINARY_PPE_FOLDER || 'ppe';
        const uploadRes = await uploadImageBuffer(req.file.buffer, req.file.originalname, folder);
        itemData.image_url = uploadRes.secureUrl;
      } catch (err) {
        return ApiResponse.error(res, `Upload ảnh lên Cloudinary thất bại: ${err.message}`, 500);
      }
    }
    const tenantId = req.user.tenant_id;
    const result = await ppeService.createItem(itemData, tenantId);
    
    // Emit Kafka event for PPE item created (non-blocking with timeout)
    if (result.success && result.data) {
      // Don't await - fire and forget to avoid blocking the request
      setImmediate(async () => {
        try {
          // Add timeout to prevent hanging
          await Promise.race([
            PPEEvents.emitPPEItemCreated(result.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 3000)
            )
          ]).catch(error => {
            console.warn('⚠️ Event emission failed (non-critical):', error.message);
          });
        } catch (error) {
          console.error('❌ Error emitting PPE item created event:', error);
          // Don't fail the request if event emission fails
        }
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static generateSerialsForItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { count } = req.body;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.generateSerialsForItem(id, count, tenantId);

    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const itemData = req.body;
    if (req.file) {
      try {
        const folder = process.env.CLOUDINARY_PPE_FOLDER || 'ppe';
        const uploadRes = await uploadImageBuffer(req.file.buffer, req.file.originalname, folder);
        itemData.image_url = uploadRes.secureUrl;
      } catch (err) {
        return ApiResponse.error(res, `Upload ảnh lên Cloudinary thất bại: ${err.message}`, 500);
      }
    }
    const tenantId = req.user.tenant_id;
    const result = await ppeService.updateItem(id, itemData, tenantId);
    
    // Emit Kafka event for PPE item updated (non-blocking with timeout)
    if (result.success && result.data) {
      // Don't await - fire and forget to avoid blocking the request
      setImmediate(async () => {
        try {
          const changes = {};
          Object.keys(itemData).forEach(key => {
            changes[key] = itemData[key];
          });
          // Add timeout to prevent hanging
          await Promise.race([
            PPEEvents.emitPPEItemUpdated(result.data, req.user || { _id: 'system', role: 'admin', full_name: 'System' }, changes),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event emission timeout')), 3000)
            )
          ]).catch(error => {
            console.warn('⚠️ Event emission failed (non-critical):', error.message);
          });
        } catch (error) {
          console.error('❌ Error emitting PPE item updated event:', error);
          // Don't fail the request if event emission fails
        }
      });
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
    const tenantId = req.user.tenant_id;
    const result = await ppeService.updateItemQuantity(id, quantityData, tenantId);
    
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
    const tenantId = req.user.tenant_id;
    const itemData = await ppeService.getItemById(id, tenantId);
    
    const result = await ppeService.deleteItem(id, tenantId);
    
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
        // Use enhanced response handler with BSON error recovery
        return EnhancedApiResponse.success(res, result.data, result.message, result.statusCode, {
          fallbackStrategy: 'replace',
          logErrors: true,
          maxRetries: 3
        });
      } else {
        return EnhancedApiResponse.error(res, result.message, result.statusCode || 500, result.data);
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
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getAllIssuances(filters, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getMyIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getIssuancesByUser(userId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getIssuanceById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getIssuanceById(id, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static getIssuancesByUser = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getIssuancesByUser(userId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getActiveIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getActiveIssuances(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getExpiringIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getExpiringIssuances(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // Admin phát PPE cho Manager
  static issueToManager = ErrorMiddleware.asyncHandler(async (req, res) => {
    const issuanceData = {
      ...req.body,
      issuance_level: 'admin_to_manager',
      issued_by: req.user.id
    };
    
    const tenantId = req.user.tenant_id;
    const result = await ppeService.createIssuance({ ...issuanceData, tenant_id: tenantId });
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE issued to manager
      try {
        const { issuance, issuer, recipient } = result.data;
        
        // Ensure issuance has populated item_id before sending notification
        const PPEIssuance = require('../models/ppeIssuance');
        const populatedIssuance = await PPEIssuance.findById(issuance._id || issuance.id)
          .populate('item_id', 'item_name item_code')
          .lean();
        
        const issuanceWithItem = populatedIssuance || issuance;
        
        const PPENotificationService = require('../services/ppeNotificationService');
        await PPENotificationService.notifyPPEIssuedToManager({
          issuance: issuanceWithItem,
          issuer,
          recipient,
          tenantId
        });
        console.log(`🛡️ PPE issued to manager notification sent (realtime + database) for user: ${recipient._id}, tenant: ${tenantId}`);
      } catch (notifError) {
        console.error('Failed to send PPE issued to manager notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // Manager phát PPE cho Employee
  static issueToEmployee = ErrorMiddleware.asyncHandler(async (req, res) => {
    console.log('🔍 issueToEmployee - req.user:', req.user);
    console.log('🔍 issueToEmployee - req.body:', req.body);
    console.log('🔍 issueToEmployee - req.body.issued_by:', req.body.issued_by);
    
    const issuanceData = {
      ...req.body,
      issued_by: req.body.issued_by || req.user?.id || req.user?._id,
      issuance_level: 'manager_to_employee',
      manager_id: req.user?.id || req.user?._id
    };
    
    console.log('🔍 issueToEmployee - issuanceData:', issuanceData);
    
    try {
      const tenantId = req.user.tenant_id;
      const result = await ppeService.createIssuanceToEmployee(issuanceData, tenantId);
      console.log('🔍 issueToEmployee - result:', result);
      
      if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE issued to employee
      try {
        const { issuance, issuer, recipient } = result.data;
        const PPENotificationService = require('../services/ppeNotificationService');
        await PPENotificationService.notifyPPEIssuedToEmployee({
          issuance,
          issuer,
          recipient,
          tenantId
        });
        console.log(`🛡️ PPE issued to employee notification sent (realtime + database) for user: ${recipient._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE issued to employee notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
    } catch (error) {
      console.error('❌ issueToEmployee - Error:', error);
      return ApiResponse.error(res, error.message, 400, { error: error.message });
    }
  });

  // Employee xác nhận nhận PPE từ Manager
  static confirmReceivedPPE = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const confirmationData = {
      ...req.body,
      confirmed_by: req.user.id || req.user._id
    };
    
    console.log('🔍 confirmReceivedPPE - id:', id);
    console.log('🔍 confirmReceivedPPE - confirmationData:', confirmationData);
    
    try {
      const tenantId = req.user.tenant_id;
      const result = await ppeService.confirmReceivedPPE(id, confirmationData, tenantId);
      console.log('🔍 confirmReceivedPPE - result:', result);
      
      if (result.success) {
        // Send realtime notification (WebSocket + Database) for PPE confirmation
        try {
          const { issuance, employee, manager } = result.data;
          const PPENotificationService = require('../services/ppeNotificationService');
          await PPENotificationService.notifyPPEConfirmed({
            issuance,
            employee,
            manager,
            tenantId
          });
          console.log(`🛡️ PPE confirmed notification sent (realtime + database) for manager: ${manager._id}`);
        } catch (notifError) {
          console.error('Failed to send PPE confirmed notification:', notifError);
        }
        
        return ApiResponse.success(res, result.data, result.message, result.statusCode);
      } else {
        return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
      }
    } catch (error) {
      console.error('❌ confirmReceivedPPE - Error:', error);
      return ApiResponse.error(res, error.message, 400, { error: error.message });
    }
  });

  // Employee trả PPE cho Manager
  static returnToManager = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const returnData = {
      ...req.body,
      returned_by: req.user.id
    };
    
    const tenantId = req.user.tenant_id;
    const result = await ppeService.returnIssuanceToManager(id, returnData, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE returned to manager
      try {
        const { issuance, returner, manager } = result.data;
        const PPENotificationService = require('../services/ppeNotificationService');
        await PPENotificationService.notifyPPEReturnedToManager({
          issuance,
          employee: returner,
          manager,
          tenantId
        });
        console.log(`🛡️ PPE returned to manager notification sent (realtime + database) for user: ${manager._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE returned to manager notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // Manager trả PPE cho Admin
  static returnToAdmin = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const returnData = {
      ...req.body,
      returned_by: req.user.id
    };
    
    const tenantId = req.user.tenant_id;
    const result = await ppeService.returnIssuanceToAdmin(id, returnData, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE returned to admin
      try {
        const { issuance, returner } = result.data;
        const PPENotificationService = require('../services/ppeNotificationService');
        await PPENotificationService.notifyPPEReturnedToAdmin({
          issuance,
          manager: returner,
          tenantId
        });
        console.log(`🛡️ PPE returned to admin notification sent (realtime + database) for user: ${returner._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE returned to admin notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // Manager xác nhận nhận PPE từ Employee
  static confirmEmployeeReturn = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.id;
    
    const tenantId = req.user.tenant_id;
    const result = await ppeService.confirmEmployeeReturn(id, managerId, tenantId);
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE return confirmed
      try {
        const { issuance, employee, manager } = result.data;
        const PPENotificationService = require('../services/ppeNotificationService');
        await PPENotificationService.notifyPPEReturnConfirmed({
          issuance,
          employee,
          manager,
          tenantId
        });
        console.log(`🛡️ PPE employee return confirmed notification sent (realtime + database) for manager: ${manager._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE return confirmation notification:', notifError);
      }
      
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // Lấy danh sách PPE của Manager
  static getManagerPPE = ErrorMiddleware.asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getManagerPPE(managerId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // Lấy danh sách PPE của Employee
  static getEmployeePPE = ErrorMiddleware.asyncHandler(async (req, res) => {
    const employeeId = req.user.id;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getEmployeePPE(employeeId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // Lấy danh sách PPE của Employees trong department (dành cho manager)
  static getDepartmentEmployeesPPE = ErrorMiddleware.asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    console.log('🔍 PPE Controller Debug:', {
      managerId,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        department_id: req.user.department_id
      } : null
    });
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getDepartmentEmployeesPPE(managerId, tenantId);

    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // Lấy danh sách serial numbers khả dụng cho manager
  static getAvailableSerialNumbersForManager = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const managerId = req.user.id;

    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return ApiResponse.error(res, 'ID thiết bị không hợp lệ', 400);
    }

    const serialNumbers = await ppeService.getAvailableSerialNumbersForManager(managerId, itemId);

    return ApiResponse.success(res, {
      item_id: itemId,
      available_serial_numbers: serialNumbers,
      count: serialNumbers.length
    }, 'Lấy danh sách serial numbers khả dụng thành công');
  });

  // Lấy danh sách serial numbers khả dụng cho admin
  static getAvailableSerialNumbersForAdmin = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return ApiResponse.error(res, 'ID thiết bị không hợp lệ', 400);
    }

    const serialNumbers = await ppeService.getAvailableSerialNumbersForAdmin(itemId);

    return ApiResponse.success(res, {
      item_id: itemId,
      available_serial_numbers: serialNumbers,
      count: serialNumbers.length
    }, 'Lấy danh sách serial numbers khả dụng thành công');
  });

  // Lấy lịch sử PPE của Manager
  static getManagerPPEHistory = ErrorMiddleware.asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getManagerPPEHistory(managerId, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  // Legacy method - giữ lại để tương thích
  static createIssuance = ErrorMiddleware.asyncHandler(async (req, res) => {
    const issuanceData = req.body;
    const tenantId = req.user.tenant_id;
    const result = await ppeService.createIssuance({ ...issuanceData, tenant_id: tenantId });
    
    if (result.success) {
      // Send realtime notification (WebSocket + Database) for PPE issued
      try {
        const { issuance, issuer, recipient } = result.data;
        const PPENotificationService = require('../services/ppeNotificationService');
        // Determine notification type based on issuance level
        if (issuance.issuance_level === 'admin_to_manager') {
          await PPENotificationService.notifyPPEIssuedToManager({
            issuance,
            issuer,
            recipient,
            tenantId
          });
        } else if (issuance.issuance_level === 'manager_to_employee') {
          await PPENotificationService.notifyPPEIssuedToEmployee({
            issuance,
            issuer,
            recipient,
            tenantId
          });
        }
        console.log(`🛡️ PPE issuance notification sent (realtime + database) for user: ${recipient._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE issued notification:', notifError);
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
      // Send realtime notification (WebSocket + Database) for PPE returned
      try {
        const { issuance, returner } = result.data;
        const RealtimeNotificationService = require('../services/realtimeNotificationService');
        await RealtimeNotificationService.sendToUser({
          userId: returner._id || returner.id,
          title: 'PPE đã được trả lại',
          message: `PPE "${issuance.item_id?.item_name || issuance.itemName}" đã được trả lại`,
          type: 'info',
          category: 'ppe',
          priority: 'low',
          tenantId: req.user.tenant_id,
          data: {
            issuanceId: issuance._id,
            itemName: issuance.item_id?.item_name || issuance.itemName,
            returnedDate: issuance.returned_date || new Date()
          },
          eventName: 'ppe_notification',
          saveToDatabase: true,
          sendWebSocket: true
        });
        console.log(`🛡️ PPE return notification sent (realtime + database) for user: ${returner._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE returned notification:', notifError);
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
      // Send realtime notification (WebSocket + Database) for PPE returned by employee
      try {
        const { issuance, returner } = result.data;
        const RealtimeNotificationService = require('../services/realtimeNotificationService');
        await RealtimeNotificationService.sendToUser({
          userId: returner._id || returner.id,
          title: 'PPE đã được trả lại',
          message: `Bạn đã trả PPE "${issuance.item_id?.item_name || issuance.itemName}"`,
          type: 'info',
          category: 'ppe',
          priority: 'low',
          tenantId: req.user.tenant_id,
          data: {
            issuanceId: issuance._id,
            itemName: issuance.item_id?.item_name || issuance.itemName,
            returnedDate: issuance.returned_date || new Date()
          },
          eventName: 'ppe_notification',
          saveToDatabase: true,
          sendWebSocket: true
        });
        console.log(`🛡️ PPE employee return notification sent (realtime + database) for user: ${returner._id}`);
      } catch (notifError) {
        console.error('Failed to send PPE employee return notification:', notifError);
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
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getInventoryStats(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getOverdueIssuances = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getOverdueIssuances(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getLowStockItems = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getLowStockItems(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getIssuanceStatistics = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getIssuanceStatistics(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getQuantityStatistics = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getQuantityStatistics(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getDashboardData = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;
    const result = await ppeService.getDashboardStats(tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });

  static getAllUsers = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { managerId } = req.query;
    const result = await ppeService.getAllUsers(managerId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
    }
  });
}

module.exports = PPEController;