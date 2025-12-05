const ppeService = require('../services/ppeService');
<<<<<<< HEAD
const ApiResponse = require('../utils/response');

class PPEController {
  // PPE Categories
  async getAllCategories(req, res) {
    try {
      const categories = await ppeService.getAllCategories();
      return ApiResponse.success(res, categories, 'Lấy danh sách danh mục PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await ppeService.getCategoryById(id);
      return ApiResponse.success(res, category, 'Lấy thông tin danh mục PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 404);
    }
  }

  async createCategory(req, res) {
    try {
      const categoryData = req.body;
      const category = await ppeService.createCategory(categoryData);
      return ApiResponse.success(res, category, 'Tạo danh mục PPE thành công', 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async importCategories(req, res) {
=======
const { ApiResponse } = require('../utils/response');
const EnhancedApiResponse = require('../utils/enhancedResponse');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const websocketService = require('../services/websocketService');
const PPEEvents = require('../events/ppeEvents');

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
    const tenantId = req.user.tenant_id;
    const result = await ppeService.createCategory(categoryData, tenantId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static importCategories = ErrorMiddleware.asyncHandler(async (req, res) => {
>>>>>>> origin/main
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

<<<<<<< HEAD
    try {
      console.log(`📁 Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
      const result = await ppeService.importCategoriesFromExcel(req.file);
      console.log(`✅ Import completed: ${result.success.length} success, ${result.errors.length} errors`);
      return ApiResponse.success(res, result, 'PPE categories imported successfully');
    } catch (error) {
      console.error('❌ Import error:', error.message);
      return ApiResponse.error(res, `Import failed: ${error.message}`, 500);
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      const category = await ppeService.updateCategory(id, categoryData);
      return ApiResponse.success(res, category, 'Cập nhật danh mục PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const result = await ppeService.deleteCategory(id);
      return ApiResponse.success(res, result, 'Xóa danh mục PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async importItems(req, res) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'Không có file được tải lên', 400);
      }

      console.log('Importing PPE items from file:', req.file.originalname);
      const result = await ppeService.importItems(req.file);
      console.log('Import result:', result);
      return ApiResponse.success(res, result, 'Import thiết bị PPE thành công');
    } catch (error) {
      console.error('Import items error:', error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // PPE Items
  async getAllItems(req, res) {
=======
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
>>>>>>> origin/main
    try {
      const filters = {
        category_id: req.query.category_id,
        search: req.query.search
      };
      
<<<<<<< HEAD
      const items = await ppeService.getAllItems(filters);
      return ApiResponse.success(res, items, 'Lấy danh sách thiết bị PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await ppeService.getItemById(id);
      return ApiResponse.success(res, item, 'Lấy thông tin thiết bị PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 404);
    }
  }

  async createItem(req, res) {
    try {
      const itemData = req.body;
      const item = await ppeService.createItem(itemData);
      return ApiResponse.success(res, item, 'Tạo thiết bị PPE thành công', 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const itemData = req.body;
      const item = await ppeService.updateItem(id, itemData);
      return ApiResponse.success(res, item, 'Cập nhật thiết bị PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const result = await ppeService.deleteItem(id);
      return ApiResponse.success(res, result, 'Xóa thiết bị PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // PPE Items with quantity management
  async updateItemQuantity(req, res) {
    try {
      const { id } = req.params;
      const quantityData = req.body;
      const item = await ppeService.updateItemQuantity(id, quantityData);
      return ApiResponse.success(res, item, 'Cập nhật số lượng thiết bị thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // PPE Issuances
  async getAllIssuances(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        status: req.query.status,
        item_id: req.query.item_id
      };
      
      const issuances = await ppeService.getAllIssuances(filters);
      return ApiResponse.success(res, issuances, 'Lấy danh sách phát PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getIssuanceById(req, res) {
    try {
      const { id } = req.params;
      const issuance = await ppeService.getIssuanceById(id);
      return ApiResponse.success(res, issuance, 'Lấy thông tin phát PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 404);
    }
  }

  async createIssuance(req, res) {
    try {
      const issuanceData = req.body;
      const issuance = await ppeService.createIssuance(issuanceData);
      return ApiResponse.success(res, issuance, 'Phát PPE thành công', 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async updateIssuance(req, res) {
    try {
      const { id } = req.params;
      const issuanceData = req.body;
      const issuance = await ppeService.updateIssuance(id, issuanceData);
      return ApiResponse.success(res, issuance, 'Cập nhật phát PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async returnIssuance(req, res) {
    try {
      const { id } = req.params;
      const returnData = req.body;
      const result = await ppeService.returnIssuance(id, returnData);
      return ApiResponse.success(res, result, 'Trả PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deleteIssuance(req, res) {
    try {
      const { id } = req.params;
      const result = await ppeService.deleteIssuance(id);
      return ApiResponse.success(res, result, 'Xóa bản ghi phát PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Get PPE issuances for a specific user
  async getIssuancesByUser(req, res) {
    try {
      const { userId } = req.params;
      const issuances = await ppeService.getIssuancesByUser(userId);
      return ApiResponse.success(res, issuances, 'Lấy PPE của nhân viên thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Get active PPE issuances (not returned)
  async getActiveIssuances(req, res) {
    try {
      const issuances = await ppeService.getActiveIssuances();
      return ApiResponse.success(res, issuances, 'Lấy PPE đang sử dụng thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Get PPE issuances that are expiring soon
  async getExpiringIssuances(req, res) {
    try {
      const issuances = await ppeService.getExpiringIssuances();
      return ApiResponse.success(res, issuances, 'Lấy PPE sắp hết hạn thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }


  // Statistics and Reports
  async getStockStatus(req, res) {
    try {
      const stockStatus = await ppeService.getStockStatus();
      return ApiResponse.success(res, stockStatus, 'Lấy trạng thái tồn kho thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getOverdueIssuances(req, res) {
    try {
      const overdueIssuances = await ppeService.getOverdueIssuances();
      return ApiResponse.success(res, overdueIssuances, 'Lấy danh sách PPE quá hạn thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getLowStockItems(req, res) {
    try {
      const lowStockItems = await ppeService.getLowStockItems();
      return ApiResponse.success(res, lowStockItems, 'Lấy danh sách thiết bị sắp hết thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getIssuanceStatistics(req, res) {
    try {
      const statistics = await ppeService.getIssuanceStatistics();
      return ApiResponse.success(res, statistics, 'Lấy thống kê phát PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Get comprehensive quantity statistics
  async getQuantityStatistics(req, res) {
    try {
      const statistics = await ppeService.getQuantityStatistics();
      return ApiResponse.success(res, statistics, 'Lấy thống kê số lượng thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Dashboard data
  async getDashboardData(req, res) {
    try {
      const [
        stockStatus,
        overdueIssuances,
        lowStockItems,
        statistics
      ] = await Promise.all([
        ppeService.getStockStatus(),
        ppeService.getOverdueIssuances(),
        ppeService.getLowStockItems(),
        ppeService.getIssuanceStatistics()
      ]);

      const dashboardData = {
        stock_status: stockStatus,
        overdue_issuances: overdueIssuances,
        low_stock_items: lowStockItems,
        statistics: statistics
      };

      return ApiResponse.success(res, dashboardData, 'Lấy dữ liệu dashboard thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Get all users for PPE assignment
  async getAllUsers(req, res) {
    try {
      const users = await ppeService.getAllUsers();
      return ApiResponse.success(res, users, 'Lấy danh sách nhân viên thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new PPEController();
=======
      const tenantId = req.user.tenant_id;
      const result = await ppeService.getAllItems(filters, tenantId);
      
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

  static updateItem = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const itemData = req.body;
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
      // Emit WebSocket notification for PPE issued to manager
      try {
        const { issuance, issuer, recipient } = result.data;
        websocketService.emitPPEIssuedToManager(issuance, issuer, recipient);
        console.log(`🛡️ PPE issued to manager WebSocket notification sent for user: ${recipient._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE issued to manager WebSocket notification:', wsError);
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
      // Emit WebSocket notification for PPE issued to employee
      try {
        const { issuance, issuer, recipient } = result.data;
        websocketService.emitPPEIssuedToEmployee(issuance, issuer, recipient);
        console.log(`🛡️ PPE issued to employee WebSocket notification sent for user: ${recipient._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE issued to employee WebSocket notification:', wsError);
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
        // Emit WebSocket notification for PPE confirmation
        try {
          const { issuance, employee, manager } = result.data;
          websocketService.emitPPEConfirmed(issuance, employee, manager);
          console.log(`🛡️ PPE confirmed WebSocket notification sent for manager: ${manager._id}`);
        } catch (wsError) {
          console.error('Failed to emit PPE confirmed WebSocket notification:', wsError);
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
      // Emit WebSocket notification for PPE returned to manager
      try {
        const { issuance, returner, manager } = result.data;
        websocketService.emitPPEReturnedToManager(issuance, returner, manager);
        console.log(`🛡️ PPE returned to manager WebSocket notification sent for user: ${manager._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE returned to manager WebSocket notification:', wsError);
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
      // Emit WebSocket notification for PPE returned to admin
      try {
        const { issuance, returner } = result.data;
        websocketService.emitPPEReturnedToAdmin(issuance, returner);
        console.log(`🛡️ PPE returned to admin WebSocket notification sent for user: ${returner._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE returned to admin WebSocket notification:', wsError);
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
      // Emit WebSocket notification for PPE return confirmed
      try {
        const { issuance, employee, manager } = result.data;
        websocketService.emitPPEReturnedToManager(issuance, employee, manager);
        console.log(`🛡️ PPE employee return confirmed WebSocket notification sent for manager: ${manager._id}`);
      } catch (wsError) {
        console.error('Failed to emit PPE return confirmation WebSocket notification:', wsError);
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
>>>>>>> origin/main
