const ppeService = require('../services/ppeService');
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
