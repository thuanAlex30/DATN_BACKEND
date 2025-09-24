const ppeRepository = require('../repository/PPERepository');
const User = require('../models/user');
const XLSX = require('xlsx');

class PPEService {
  // PPE Categories
  async getAllCategories() {
    try {
      return await ppeRepository.getAllCategories();
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách danh mục PPE: ${error.message}`);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await ppeRepository.getCategoryById(id);
      if (!category) {
        throw new Error('Không tìm thấy danh mục PPE');
      }
      return category;
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh mục PPE: ${error.message}`);
    }
  }

  async createCategory(categoryData) {
    try {
      // Validate required fields
      if (!categoryData.category_name) {
        throw new Error('Tên danh mục là bắt buộc');
      }

      return await ppeRepository.createCategory(categoryData);
    } catch (error) {
      throw new Error(`Lỗi khi tạo danh mục PPE: ${error.message}`);
    }
  }

  async importCategoriesFromExcel(file) {
    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new Error('Excel file is empty or invalid');
      }

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      // Get existing categories for duplicate checking
      const existingCategories = await ppeRepository.getAllCategories();
      const existingCategoryNames = new Set(
        existingCategories.map(cat => cat.category_name.toLowerCase())
      );

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

        try {
          // Validate required fields
          const requiredFields = ['category_name'];
          const missingFields = requiredFields.filter(field => !row[field]);
          
          if (missingFields.length > 0) {
            results.errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`
            });
            continue;
          }

          // Check for duplicate category name
          if (existingCategoryNames.has(row.category_name.toLowerCase())) {
            results.errors.push({
              row: rowNumber,
              error: `Category name "${row.category_name}" already exists`
            });
            continue;
          }

          // Prepare category data
          const categoryData = {
            category_name: row.category_name?.toString().trim(),
            description: row.description?.toString().trim() || '',
            lifespan_months: parseInt(row.lifespan_months) || 12
          };

          // Validate lifespan_months
          if (categoryData.lifespan_months < 1 || categoryData.lifespan_months > 120) {
            results.errors.push({
              row: rowNumber,
              error: `Lifespan months must be between 1 and 120, got: ${categoryData.lifespan_months}`
            });
            continue;
          }

          // Create category
          const createdCategory = await ppeRepository.createCategory(categoryData);
          results.success.push({
            row: rowNumber,
            data: createdCategory
          });

          // Add to existing categories to prevent duplicates in same import
          existingCategoryNames.add(categoryData.category_name.toLowerCase());

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error importing PPE categories: ${error.message}`);
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const category = await ppeRepository.updateCategory(id, categoryData);
      if (!category) {
        throw new Error('Không tìm thấy danh mục PPE để cập nhật');
      }
      return category;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật danh mục PPE: ${error.message}`);
    }
  }

  async deleteCategory(id) {
    try {
      // Validate ObjectId format
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('ID danh mục không hợp lệ');
      }

      // Check if category exists
      const category = await ppeRepository.getCategoryById(id);
      if (!category) {
        throw new Error('Không tìm thấy danh mục PPE để xóa');
      }

      // Check if there are any PPE items using this category
      const itemsUsingCategory = await ppeRepository.getAllItems({ category_id: id });
      if (itemsUsingCategory && itemsUsingCategory.length > 0) {
        throw new Error(`Không thể xóa danh mục này vì còn ${itemsUsingCategory.length} thiết bị PPE đang sử dụng. Vui lòng xóa hoặc chuyển các thiết bị này sang danh mục khác trước.`);
      }

      const deleted = await ppeRepository.deleteCategory(id);
      if (!deleted) {
        throw new Error('Không thể xóa danh mục PPE');
      }
      return { message: 'Xóa danh mục PPE thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa danh mục PPE: ${error.message}`);
    }
  }

  async importItems(file) {
    try {
      const result = await ppeRepository.importItems(file);
      return result;
    } catch (error) {
      throw new Error(`Lỗi khi import thiết bị PPE: ${error.message}`);
    }
  }

  // PPE Items
  async getAllItems(filters = {}) {
    try {
      return await ppeRepository.getAllItems(filters);
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách thiết bị PPE: ${error.message}`);
    }
  }

  async getItemById(id) {
    try {
      const item = await ppeRepository.getItemById(id);
      if (!item) {
        throw new Error('Không tìm thấy thiết bị PPE');
      }
      return item;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thiết bị PPE: ${error.message}`);
    }
  }

  async createItem(itemData) {
    try {
      // Validate required fields
      if (!itemData.item_code || !itemData.item_name || !itemData.category_id) {
        throw new Error('Mã thiết bị, tên thiết bị và danh mục là bắt buộc');
      }

      // Check if item code already exists
      const existingItem = await ppeRepository.getAllItems({ 
        search: itemData.item_code 
      });
      if (existingItem.length > 0) {
        throw new Error('Mã thiết bị đã tồn tại');
      }

      return await ppeRepository.createItem(itemData);
    } catch (error) {
      throw new Error(`Lỗi khi tạo thiết bị PPE: ${error.message}`);
    }
  }

  async updateItem(id, itemData) {
    try {
      const item = await ppeRepository.updateItem(id, itemData);
      if (!item) {
        throw new Error('Không tìm thấy thiết bị PPE để cập nhật');
      }
      return item;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật thiết bị PPE: ${error.message}`);
    }
  }

  async deleteItem(id) {
    try {
      const deleted = await ppeRepository.deleteItem(id);
      if (!deleted) {
        throw new Error('Không tìm thấy thiết bị PPE để xóa');
      }
      return { message: 'Xóa thiết bị PPE thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa thiết bị PPE: ${error.message}`);
    }
  }

  // PPE Items with quantity management
  async updateItemQuantity(id, quantityData) {
    try {
      const item = await ppeRepository.updateItemQuantity(id, quantityData);
      if (!item) {
        throw new Error('Không tìm thấy thiết bị PPE để cập nhật số lượng');
      }
      return item;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật số lượng thiết bị: ${error.message}`);
    }
  }

  // PPE Issuances
  async getAllIssuances(filters = {}) {
    try {
      return await ppeRepository.getAllIssuances(filters);
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách phát PPE: ${error.message}`);
    }
  }

  async getIssuanceById(id) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        throw new Error('Không tìm thấy bản ghi phát PPE');
      }
      return issuance;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thông tin phát PPE: ${error.message}`);
    }
  }

  async createIssuance(issuanceData) {
    try {
      // Validate required fields
      if (!issuanceData.user_id || !issuanceData.item_id || !issuanceData.quantity || 
          !issuanceData.issued_date || !issuanceData.expected_return_date || !issuanceData.issued_by) {
        throw new Error('Tất cả các trường bắt buộc phải được điền');
      }

      // Check if enough stock is available
      const item = await ppeRepository.getItemById(issuanceData.item_id);
      if (!item) {
        throw new Error('Không tìm thấy thiết bị PPE');
      }
      
      if (item.quantity_available < issuanceData.quantity) {
        throw new Error(`Không đủ tồn kho để phát. Hiện có: ${item.quantity_available}, cần phát: ${issuanceData.quantity}`);
      }

      // Create issuance
      const issuance = await ppeRepository.createIssuance(issuanceData);

      // Update item quantity - allocate the quantity
      await ppeRepository.updateItemQuantity(issuanceData.item_id, {
        quantity_available: item.quantity_available - issuanceData.quantity,
        quantity_allocated: item.quantity_allocated + issuanceData.quantity
      });

      return issuance;
    } catch (error) {
      throw new Error(`Lỗi khi phát PPE: ${error.message}`);
    }
  }

  async updateIssuance(id, issuanceData) {
    try {
      const issuance = await ppeRepository.updateIssuance(id, issuanceData);
      if (!issuance) {
        throw new Error('Không tìm thấy bản ghi phát PPE để cập nhật');
      }
      return issuance;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật phát PPE: ${error.message}`);
    }
  }

  async returnIssuance(id, returnData) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        throw new Error('Không tìm thấy bản ghi phát PPE');
      }

      if (issuance.status === 'returned') {
        throw new Error('PPE đã được trả về');
      }

      // Update issuance status
      await ppeRepository.updateIssuance(id, {
        status: 'returned',
        actual_return_date: returnData.actual_return_date || new Date()
      });

      // Update item quantity - deallocate the quantity
      const item = await ppeRepository.getItemById(issuance.item_id);
      if (item) {
        await ppeRepository.updateItemQuantity(issuance.item_id, {
          quantity_available: item.quantity_available + issuance.quantity,
          quantity_allocated: item.quantity_allocated - issuance.quantity
        });
      }

      return { message: 'Trả PPE thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi trả PPE: ${error.message}`);
    }
  }

  async deleteIssuance(id) {
    try {
      const deleted = await ppeRepository.deleteIssuance(id);
      if (!deleted) {
        throw new Error('Không tìm thấy bản ghi phát PPE để xóa');
      }
      return { message: 'Xóa bản ghi phát PPE thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa bản ghi phát PPE: ${error.message}`);
    }
  }

  // Get PPE issuances for a specific user
  async getIssuancesByUser(userId) {
    try {
      const issuances = await ppeRepository.getAllIssuances({ user_id: userId });
      return issuances;
    } catch (error) {
      throw new Error(`Lỗi khi lấy PPE của nhân viên: ${error.message}`);
    }
  }

  // Get active PPE issuances (not returned)
  async getActiveIssuances() {
    try {
      const issuances = await ppeRepository.getAllIssuances({ status: 'issued' });
      return issuances;
    } catch (error) {
      throw new Error(`Lỗi khi lấy PPE đang sử dụng: ${error.message}`);
    }
  }

  // Get PPE issuances that are expiring soon (within 7 days)
  async getExpiringIssuances() {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const issuances = await ppeRepository.getAllIssuances({
        status: 'issued',
        expected_return_date: { $lte: sevenDaysFromNow }
      });
      return issuances;
    } catch (error) {
      throw new Error(`Lỗi khi lấy PPE sắp hết hạn: ${error.message}`);
    }
  }

  // Get overdue PPE issuances
  async getOverdueIssuances() {
    try {
      const now = new Date();
      const issuances = await ppeRepository.getAllIssuances({
        status: 'issued',
        expected_return_date: { $lt: now }
      });
      return issuances;
    } catch (error) {
      throw new Error(`Lỗi khi lấy PPE quá hạn: ${error.message}`);
    }
  }


  // Statistics and Reports
  async getStockStatus() {
    try {
      return await ppeRepository.getStockStatus();
    } catch (error) {
      throw new Error(`Lỗi khi lấy trạng thái tồn kho: ${error.message}`);
    }
  }

  async getOverdueIssuances() {
    try {
      return await ppeRepository.getOverdueIssuances();
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách PPE quá hạn: ${error.message}`);
    }
  }

  async getLowStockItems() {
    try {
      return await ppeRepository.getLowStockItems();
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách thiết bị sắp hết: ${error.message}`);
    }
  }

  async getIssuanceStatistics() {
    try {
      return await ppeRepository.getIssuanceStats();
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê phát PPE: ${error.message}`);
    }
  }

  // Get comprehensive quantity statistics
  async getQuantityStatistics() {
    try {
      return await ppeRepository.getQuantityStatistics();
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê số lượng: ${error.message}`);
    }
  }

  // Get all users for PPE assignment
  async getAllUsers() {
    try {
      const users = await User.find({}, 'id full_name email department_id position')
        .populate('department_id', 'department_name')
        .sort({ full_name: 1 });
      return users;
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách nhân viên: ${error.message}`);
    }
  }
}

module.exports = new PPEService();
