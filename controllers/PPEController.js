const ppeService = require('../services/ppeService');
const { ApiResponse } = require('../utils/response');
const websocketService = require('../services/websocketService');

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
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

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
    try {
      const filters = {
        category_id: req.query.category_id,
        search: req.query.search
      };
      
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
      
      // Emit WebSocket event for PPE item created
      websocketService.emitToAll('ppe_item_created', {
        item,
        timestamp: new Date()
      });
      
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
      
      // Emit WebSocket event for PPE item updated
      websocketService.emitToAll('ppe_item_updated', {
        item,
        timestamp: new Date()
      });
      
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
      
      // Emit WebSocket event for low stock if quantity is low
      if (item && item.quantity <= item.minimum_stock) {
        websocketService.emitPPELowStock([item]);
      }
      
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
      
      // Emit WebSocket event for PPE issued
      if (issuance) {
        // Get issuer and recipient info for WebSocket notification
        const User = require('../models/user');
        const Notification = require('../models/notification');
        const issuer = await User.findById(issuanceData.issued_by);
        const recipient = await User.findById(issuanceData.user_id);
        
        if (issuer && recipient) {
          // Get item details for notification
          const PPEItem = require('../models/ppeItem');
          const item = await PPEItem.findById(issuance.item_id);
          
          // Create notification in database
          const notificationData = {
            user_id: recipient._id,
            title: 'PPE được phát mới',
            message: `Bạn đã được phát ${issuance.quantity} ${item?.item_name || 'thiết bị PPE'} bởi ${issuer.full_name}. Ngày trả dự kiến: ${new Date(issuance.expected_return_date).toLocaleDateString('vi-VN')}`,
            type: 'info',
            priority: 'medium',
            category: 'ppe',
            action_url: '/ppe/my-ppe'
          };
          
          const notification = await Notification.createNotification(notificationData);
          console.log(`📝 Created PPE notification for user: ${recipient._id}`);
          
          // Emit notification created event (single WebSocket event)
          websocketService.emitNotificationCreated(notification);
        }
      }
      
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
      
      // Emit WebSocket event for PPE returned
      if (result) {
        const User = require('../models/user');
        const returner = await User.findById(req.user.id);
        
        if (returner) {
          websocketService.emitPPEReturned(result, returner);
        }
      }
      
      return ApiResponse.success(res, result, 'Trả PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async returnIssuanceEmployee(req, res) {
    try {
      const { id } = req.params;
      const returnData = req.body;
      
      // Check if req.user exists
      if (!req.user || !req.user.id) {
        return ApiResponse.error(res, 'User authentication required', 401);
      }
      
      // Verify that the employee is returning their own PPE
      const result = await ppeService.returnIssuanceEmployee(id, returnData, req.user.id);
      
      // Emit WebSocket event for PPE returned
      if (result) {
        console.log('🔄 PPE Controller: About to emit PPE returned event');
        const User = require('../models/user');
        const returner = await User.findById(req.user.id);
        
        if (returner) {
          console.log('🔄 PPE Controller: Emitting PPE returned event for:', returner.full_name);
          websocketService.emitPPEReturned(result, returner);
        } else {
          console.log('⚠️ PPE Controller: Returner not found');
        }
      } else {
        console.log('⚠️ PPE Controller: No result to emit');
      }
      
      return ApiResponse.success(res, result, 'Trả PPE thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async reportIssuanceEmployee(req, res) {
    try {
      const { id } = req.params;
      const reportData = req.body;
      
      // Check if req.user exists
      if (!req.user || !req.user.id) {
        return ApiResponse.error(res, 'User authentication required', 401);
      }
      
      // Verify that the employee is reporting their own PPE
      const result = await ppeService.reportIssuanceEmployee(id, reportData, req.user.id);
      
      // Emit WebSocket event for PPE report
      if (result) {
        console.log('📢 PPE Controller: About to emit PPE report event');
        const User = require('../models/user');
        const reporter = await User.findById(req.user.id);
        
        if (reporter) {
          console.log('📢 PPE Controller: Emitting PPE report event for:', reporter.full_name);
          websocketService.emitPPEReport(result, reporter);
        } else {
          console.log('⚠️ PPE Controller: Reporter not found');
        }
      } else {
        console.log('⚠️ PPE Controller: No result to emit');
      }
      
      return ApiResponse.success(res, result, 'Báo cáo PPE thành công');
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
  // Get PPE issuances for current user (employee)
  async getMyIssuances(req, res) {
    try {
      const userId = req.user.id;
      const issuances = await ppeService.getIssuancesByUser(userId);
      return ApiResponse.success(res, issuances, 'Lấy PPE của bạn thành công');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

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
