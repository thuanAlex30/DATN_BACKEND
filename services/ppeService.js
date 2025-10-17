const ppeRepository = require('../repository/PPERepository');
const UserRepository = require('../repository/UserRepository');
const UserService = require('./userService');
const mongoose = require('mongoose');
const User = require('../models/user');
const PPEIssuance = require('../models/ppeIssuance');
const ExcelJS = require('exceljs');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class PPEService {
  // PPE Categories
  async getAllCategories() {
    try {
      const categories = await ppeRepository.getAllCategories();
      return createResponse(200, 'Lấy danh sách danh mục PPE thành công',
        transformDocumentsId(categories, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error getting PPE categories:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách danh mục PPE', null, error.message);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await ppeRepository.getCategoryById(id);
      if (!category) {
        return createResponse(404, 'Không tìm thấy danh mục PPE');
      }
      return createResponse(200, 'Lấy thông tin danh mục PPE thành công',
        transformDocumentId(category, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error getting PPE category:', error);
      return createResponse(500, 'Lỗi khi lấy danh mục PPE', null, error.message);
    }
  }

  async createCategory(categoryData) {
    try {
      // Validate required fields
      if (!categoryData.category_name) {
        return createResponse(400, 'Tên danh mục là bắt buộc');
      }

      const category = await ppeRepository.createCategory(categoryData);
      return createResponse(201, 'Tạo danh mục PPE thành công',
        transformDocumentId(category, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error creating PPE category:', error);
      return createResponse(500, 'Lỗi khi tạo danh mục PPE', null, error.message);
    }
  }

  async importCategoriesFromExcel(file) {
    try {
      // Read Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);
      const data = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[worksheet.getRow(1).getCell(colNumber).value] = cell.value;
          });
          data.push(rowData);
        }
      });

      if (!data || data.length === 0) {
        return createResponse(400, 'Excel file is empty or invalid');
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

      return createResponse(200, 'Import danh mục PPE thành công', results);
    } catch (error) {
      console.error('Error importing PPE categories:', error);
      return createResponse(500, 'Lỗi khi import danh mục PPE', null, error.message);
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const category = await ppeRepository.updateCategory(id, categoryData);
      if (!category) {
        return createResponse(404, 'Không tìm thấy danh mục PPE để cập nhật');
      }
      return createResponse(200, 'Cập nhật danh mục PPE thành công',
        transformDocumentId(category, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error updating PPE category:', error);
      return createResponse(500, 'Lỗi khi cập nhật danh mục PPE', null, error.message);
    }
  }

  async deleteCategory(id) {
    try {
      // Validate ObjectId format
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return createResponse(400, 'ID danh mục không hợp lệ');
      }

      // Check if category exists
      const category = await ppeRepository.getCategoryById(id);
      if (!category) {
        return createResponse(404, 'Không tìm thấy danh mục PPE để xóa');
      }

      // Check if there are any PPE items using this category
      const itemsUsingCategory = await ppeRepository.getAllItems({ category_id: id });
      if (itemsUsingCategory && itemsUsingCategory.length > 0) {
        return createResponse(400, `Không thể xóa danh mục này vì còn ${itemsUsingCategory.length} thiết bị PPE đang sử dụng. Vui lòng xóa hoặc chuyển các thiết bị này sang danh mục khác trước.`);
      }

      const deleted = await ppeRepository.deleteCategory(id);
      if (!deleted) {
        return createResponse(400, 'Không thể xóa danh mục PPE');
      }
      return createResponse(200, 'Xóa danh mục PPE thành công');
    } catch (error) {
      console.error('Error deleting PPE category:', error);
      return createResponse(500, 'Lỗi khi xóa danh mục PPE', null, error.message);
    }
  }

  async importItems(file) {
    try {
      const result = await ppeRepository.importItems(file);
      return createResponse(200, 'Import thiết bị PPE thành công', result);
    } catch (error) {
      console.error('Error importing PPE items:', error);
      return createResponse(500, 'Lỗi khi import thiết bị PPE', null, error.message);
    }
  }

  // PPE Items
  async getAllItems(filters = {}) {
    try {
      const items = await ppeRepository.getAllItems(filters);
      return createResponse(200, 'Lấy danh sách thiết bị PPE thành công',
        transformDocumentsId(items, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting PPE items:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách thiết bị PPE', null, error.message);
    }
  }

  async getItemById(id) {
    try {
      const item = await ppeRepository.getItemById(id);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE');
      }
      return createResponse(200, 'Lấy thông tin thiết bị PPE thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting PPE item:', error);
      return createResponse(500, 'Lỗi khi lấy thiết bị PPE', null, error.message);
    }
  }

  async createItem(itemData) {
    try {
      // Validate required fields
      if (!itemData.item_code || !itemData.item_name || !itemData.category_id) {
        return createResponse(400, 'Mã thiết bị, tên thiết bị và danh mục là bắt buộc');
      }

      // Check if item code already exists
      const existingItem = await ppeRepository.getAllItems({ 
        search: itemData.item_code 
      });
      if (existingItem.length > 0) {
        return createResponse(400, 'Mã thiết bị đã tồn tại');
      }

      const item = await ppeRepository.createItem(itemData);
      return createResponse(201, 'Tạo thiết bị PPE thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error creating PPE item:', error);
      return createResponse(500, 'Lỗi khi tạo thiết bị PPE', null, error.message);
    }
  }

  async updateItem(id, itemData) {
    try {
      const item = await ppeRepository.updateItem(id, itemData);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE để cập nhật');
      }
      return createResponse(200, 'Cập nhật thiết bị PPE thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error updating PPE item:', error);
      return createResponse(500, 'Lỗi khi cập nhật thiết bị PPE', null, error.message);
    }
  }

  async deleteItem(id) {
    try {
      const deleted = await ppeRepository.deleteItem(id);
      if (!deleted) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE để xóa');
      }
      return createResponse(200, 'Xóa thiết bị PPE thành công');
    } catch (error) {
      console.error('Error deleting PPE item:', error);
      return createResponse(500, 'Lỗi khi xóa thiết bị PPE', null, error.message);
    }
  }

  // PPE Items with quantity management
  async updateItemQuantity(id, quantityData) {
    try {
      const item = await ppeRepository.updateItemQuantity(id, quantityData);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE để cập nhật số lượng');
      }
      return createResponse(200, 'Cập nhật số lượng thiết bị thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error updating item quantity:', error);
      return createResponse(500, 'Lỗi khi cập nhật số lượng thiết bị', null, error.message);
    }
  }

  // PPE Issuances
  async getAllIssuances(filters = {}) {
    try {
      const issuances = await ppeRepository.getAllIssuances(filters);
      return createResponse(200, 'Lấy danh sách phát PPE thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phát PPE', null, error.message);
    }
  }

  async getIssuanceById(id) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }
      return createResponse(200, 'Lấy thông tin phát PPE thành công',
        transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting PPE issuance:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin phát PPE', null, error.message);
    }
  }

  // Manager phát PPE cho Employee
  async createIssuanceToEmployee(issuanceData) {
    const session = await mongoose.startSession();
    
    try {
      console.log('🔍 createIssuanceToEmployee - issuanceData:', issuanceData);
      console.log('🔍 createIssuanceToEmployee - issued_by type:', typeof issuanceData.issued_by);
      console.log('🔍 createIssuanceToEmployee - issued_by value:', issuanceData.issued_by);
      
      let issuance, issuer, recipient, manager;
      await session.withTransaction(async () => {
        // Validate required fields
        if (!issuanceData.user_id || !issuanceData.item_id || !issuanceData.quantity || 
            !issuanceData.issued_date || !issuanceData.expected_return_date || !issuanceData.issued_by) {
          console.log('❌ Validation failed - missing fields:', {
            user_id: !!issuanceData.user_id,
            item_id: !!issuanceData.item_id,
            quantity: !!issuanceData.quantity,
            issued_date: !!issuanceData.issued_date,
            expected_return_date: !!issuanceData.expected_return_date,
            issued_by: !!issuanceData.issued_by
          });
          throw new Error('Tất cả các trường bắt buộc phải được điền');
        }

        // Kiểm tra Manager có đủ PPE không - Sử dụng aggregation để tính toán chính xác
        const managerPPEStats = await ppeRepository.getManagerPPEStats(issuanceData.issued_by, issuanceData.item_id);
        
        if (!managerPPEStats || managerPPEStats.total_received === 0) {
          throw new Error('Manager chưa nhận PPE này từ Admin');
        }

        // Tính số lượng PPE còn lại của Manager (đã trừ đi PPE đã phát cho Employee)
        const availableQuantity = managerPPEStats.total_received - managerPPEStats.total_returned - managerPPEStats.total_issued_to_employees;

        if (availableQuantity < issuanceData.quantity) {
          throw new Error(`Manager không đủ PPE để phát. Hiện có: ${availableQuantity}, cần phát: ${issuanceData.quantity}`);
        }

        // Get issuer and recipient info for WebSocket
        issuer = await User.findById(issuanceData.issued_by);
        recipient = await User.findById(issuanceData.user_id);
        manager = issuer;

        // Create issuance
        issuance = await ppeRepository.createIssuance(issuanceData);
      });
      
      return createResponse(201, 'Manager phát PPE cho Employee thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        issuer: issuer,
        recipient: recipient,
        manager: manager
      });
    } catch (error) {
      console.error('Error creating PPE issuance to employee:', error);
      return createResponse(500, 'Lỗi khi Manager phát PPE cho Employee', null, error.message);
    } finally {
      await session.endSession();
    }
  }

  // Employee trả PPE cho Manager
  async returnIssuanceToManager(id, returnData) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      if (issuance.status === 'returned') {
        return createResponse(400, 'PPE đã được trả về');
      }

      if (issuance.issuance_level !== 'manager_to_employee') {
        return createResponse(400, 'Chỉ có thể trả PPE được phát từ Manager');
      }

      // Get returner and manager info for WebSocket
      const returner = await User.findById(issuance.user_id);
      const manager = await User.findById(issuance.manager_id);

      // Update issuance status
      await ppeRepository.updateIssuance(id, {
        status: 'pending_manager_return',
        actual_return_date: returnData.actual_return_date || new Date(),
        return_condition: returnData.return_condition,
        notes: returnData.notes
      });

      return createResponse(200, 'Employee trả PPE cho Manager thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        returner: returner,
        manager: manager
      });
    } catch (error) {
      console.error('Error returning PPE to manager:', error);
      return createResponse(500, 'Lỗi khi Employee trả PPE cho Manager', null, error.message);
    }
  }

  // Manager trả PPE cho Admin
  async returnIssuanceToAdmin(id, returnData) {
    const session = await mongoose.startSession();
    
    try {
      let issuance, returner, item;
      await session.withTransaction(async () => {
        issuance = await ppeRepository.getIssuanceById(id);
        if (!issuance) {
          throw new Error('Không tìm thấy bản ghi phát PPE');
        }

        if (issuance.status === 'returned') {
          throw new Error('PPE đã được trả về');
        }

        if (issuance.issuance_level !== 'admin_to_manager') {
          throw new Error('Chỉ có thể trả PPE được phát từ Admin');
        }

        // Get returner and item info
        returner = await User.findById(issuance.user_id);
        item = await ppeRepository.getItemById(issuance.item_id);

        // Update issuance status
        await ppeRepository.updateIssuance(id, {
          status: 'returned',
          actual_return_date: returnData.actual_return_date || new Date(),
          return_condition: returnData.return_condition,
          notes: returnData.notes
        });

        // Update item quantity - deallocate the quantity
        await ppeRepository.updateItemQuantity(issuance.item_id, {
          quantity_available: item.quantity_available + issuance.quantity,
          quantity_allocated: item.quantity_allocated - issuance.quantity
        });
      });
      
      return createResponse(200, 'Manager trả PPE cho Admin thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        returner: returner
      });
    } catch (error) {
      console.error('Error returning PPE to admin:', error);
      return createResponse(500, 'Lỗi khi Manager trả PPE cho Admin', null, error.message);
    } finally {
      await session.endSession();
    }
  }

  // Lấy danh sách PPE của Manager - Sử dụng aggregation để tính toán chính xác
  async getManagerPPE(managerId) {
    try {
      // Lấy tất cả PPE items mà Manager đã nhận từ Admin
      const receivedIssuances = await ppeRepository.getIssuancesByUser(managerId, {
        issuance_level: 'admin_to_manager',
        status: { $in: ['issued', 'overdue', 'damaged', 'replacement_needed'] }
      });

      // Group by item và tính toán chính xác
      const ppeSummary = {};
      
      for (const issuance of receivedIssuances) {
        const itemId = issuance.item_id._id || issuance.item_id;
        
        if (!ppeSummary[itemId]) {
          ppeSummary[itemId] = {
            item: issuance.item_id,
            total_received: 0,
            total_returned: 0,
            total_issued_to_employees: 0,
            remaining: 0,
            issuances: []
          };
        }
        
        ppeSummary[itemId].total_received += issuance.quantity;
        ppeSummary[itemId].issuances.push(issuance);
      }

      // Tính toán chính xác cho từng item
      for (const itemId in ppeSummary) {
        const stats = await ppeRepository.getManagerPPEStats(managerId, itemId);
        
        ppeSummary[itemId].total_returned = stats.total_returned;
        ppeSummary[itemId].total_issued_to_employees = stats.total_issued_to_employees;
        ppeSummary[itemId].remaining = stats.total_received - stats.total_returned - stats.total_issued_to_employees;
      }

      return createResponse(200, 'Lấy danh sách PPE của Manager thành công', {
        ppe_summary: Object.values(ppeSummary),
        total_items: Object.keys(ppeSummary).length
      });
    } catch (error) {
      console.error('Error getting manager PPE:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách PPE của Manager', null, error.message);
    }
  }

  // Lấy danh sách PPE của Employee
  async getEmployeePPE(employeeId) {
    try {
      const issuances = await ppeRepository.getIssuancesByUser(employeeId, {
        issuance_level: 'manager_to_employee',
        status: { $in: ['issued', 'overdue', 'damaged', 'replacement_needed', 'pending_manager_return'] }
      });

      return createResponse(200, 'Lấy danh sách PPE của Employee thành công', {
        issuances: transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE),
        total_items: issuances.length
      });
    } catch (error) {
      console.error('Error getting employee PPE:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách PPE của Employee', null, error.message);
    }
  }

  // Lấy danh sách PPE của Employees trong department (dành cho manager)
  async getDepartmentEmployeesPPE(managerId) {
    try {
      // Lấy thông tin manager và department
      const managerResult = await UserService.getUserById(managerId);
      if (!managerResult.success) {
        return createResponse(404, 'Manager không tồn tại', null);
      }
      const manager = managerResult.data;
      if (!manager || !manager.department) {
        return createResponse(404, 'Manager không tồn tại hoặc chưa được phân công department', null);
      }

      // Lấy danh sách employees trong department
      const departmentEmployees = await UserRepository.findByDepartment(manager.department.id, { is_active: true });
      const employeeIds = departmentEmployees.map(emp => emp._id);

      // Lấy PPE issuances của tất cả employees trong department
      const issuances = await ppeRepository.getIssuancesByUsers(employeeIds, {
        issuance_level: 'manager_to_employee',
        status: { $in: ['issued', 'overdue', 'damaged', 'replacement_needed', 'pending_manager_return'] }
      });

      return createResponse(200, 'Lấy danh sách PPE của Employees trong department thành công', {
        issuances: transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE),
        total_items: issuances.length,
        department_id: manager.department_id,
        department_name: manager.department_name
      });
    } catch (error) {
      console.error('Error getting department employees PPE:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách PPE của Employees trong department', null, error.message);
    }
  }

  // Lấy lịch sử PPE của Manager
  async getManagerPPEHistory(managerId) {
    try {
      // Lấy tất cả PPE issuances liên quan đến Manager (nhận từ Admin)
      const managerIssuances = await ppeRepository.getIssuancesByUser(managerId, {
        issuance_level: 'admin_to_manager'
      });

      // Lấy tất cả PPE issuances mà Manager đã phát cho employees
      const employeeIssuances = await ppeRepository.getIssuancesByManager(managerId, {
        issuance_level: 'manager_to_employee'
      });

      // Combine và sort theo ngày
      const allHistory = [...managerIssuances, ...employeeIssuances]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return createResponse(200, 'Lấy lịch sử PPE của Manager thành công', {
        history: transformDocumentsId(allHistory, POPULATED_FIELDS.PPE_ISSUANCE),
        total_items: allHistory.length
      });
    } catch (error) {
      console.error('Error getting manager PPE history:', error);
      return createResponse(500, 'Lỗi khi lấy lịch sử PPE của Manager', null, error.message);
    }
  }

  // Legacy method - Admin phát PPE trực tiếp (giữ lại để tương thích)
  async createIssuance(issuanceData) {
    const session = await mongoose.startSession();
    
    try {
      let issuance, issuer, recipient;
      await session.withTransaction(async () => {
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

        // Get issuer and recipient info for WebSocket
        issuer = await User.findById(issuanceData.issued_by);
        recipient = await User.findById(issuanceData.user_id);

        // Create issuance
        issuance = await ppeRepository.createIssuance(issuanceData);

        // Update item quantity - allocate the quantity
        await ppeRepository.updateItemQuantity(issuanceData.item_id, {
          quantity_available: item.quantity_available - issuanceData.quantity,
          quantity_allocated: item.quantity_allocated + issuanceData.quantity
        });
      });
      
      return createResponse(201, 'Phát PPE thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        issuer: issuer,
        recipient: recipient
      });
    } catch (error) {
      console.error('Error creating PPE issuance:', error);
      return createResponse(500, 'Lỗi khi phát PPE', null, error.message);
    } finally {
      await session.endSession();
    }
  }

  async updateIssuance(id, issuanceData) {
    try {
      const issuance = await ppeRepository.updateIssuance(id, issuanceData);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE để cập nhật');
      }
      return createResponse(200, 'Cập nhật phát PPE thành công',
        transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error updating PPE issuance:', error);
      return createResponse(500, 'Lỗi khi cập nhật phát PPE', null, error.message);
    }
  }

  async returnIssuance(id, returnData) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      if (issuance.status === 'returned') {
        return createResponse(400, 'PPE đã được trả về');
      }

      // Get returner info for WebSocket
      const returner = await User.findById(issuance.user_id);

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

      return createResponse(200, 'Trả PPE thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        returner: returner
      });
    } catch (error) {
      console.error('Error returning PPE issuance:', error);
      return createResponse(500, 'Lỗi khi trả PPE', null, error.message);
    }
  }

  async returnIssuanceEmployee(id, returnData, employeeId) {
    try {
      // Check if employeeId is provided
      if (!employeeId) {
        return createResponse(400, 'Employee ID is required');
      }
      
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      // Verify that the employee is returning their own PPE
      // Handle both string and populated user_id
      if (!issuance.user_id) {
        return createResponse(400, 'Bản ghi PPE không có thông tin người dùng');
      }
      
      const issuanceUserId = issuance.user_id._id || issuance.user_id.id || issuance.user_id;
      
      if (!issuanceUserId) {
        return createResponse(400, 'Không tìm thấy thông tin người dùng trong bản ghi PPE');
      }
      
      // Convert to string safely
      let issuanceUserIdStr, employeeIdStr;
      
      try {
        // Safe string conversion - handle both ObjectId and string
        if (issuanceUserId) {
          issuanceUserIdStr = typeof issuanceUserId === 'string' ? issuanceUserId : issuanceUserId.toString();
        } else {
          throw new Error('issuanceUserId is undefined or null');
        }
        
        if (employeeId) {
          employeeIdStr = typeof employeeId === 'string' ? employeeId : employeeId.toString();
        } else {
          throw new Error('employeeId is undefined or null');
        }
        
      } catch (conversionError) {
        return createResponse(400, `Lỗi chuyển đổi ID: ${conversionError.message}`);
      }
      
      if (issuanceUserIdStr !== employeeIdStr) {
        return createResponse(403, 'Bạn chỉ có thể trả PPE của chính mình');
      }

      if (issuance.status === 'returned') {
        return createResponse(400, 'PPE đã được trả về');
      }

      // Update issuance status with additional return data
      const updateData = {
        status: 'returned',
        actual_return_date: returnData.actual_return_date || new Date(),
        return_condition: returnData.return_condition,
        notes: returnData.notes
      };

      await ppeRepository.updateIssuance(id, updateData);

      // Update item quantity - deallocate the quantity
      const itemId = issuance.item_id._id || issuance.item_id.id || issuance.item_id;
      const item = await ppeRepository.getItemById(itemId);
      
      if (item) {
        await ppeRepository.updateItemQuantity(itemId, {
          quantity_available: item.quantity_available + issuance.quantity,
          quantity_allocated: item.quantity_allocated - issuance.quantity
        });
      }

      // Get the updated issuance and returner info for WebSocket
      const updatedIssuance = await ppeRepository.getIssuanceById(id);
      const returner = await User.findById(employeeId);
      
      return createResponse(200, 'Trả PPE thành công', {
        issuance: transformDocumentId(updatedIssuance, POPULATED_FIELDS.PPE_ISSUANCE),
        returner: returner
      });
    } catch (error) {
      console.error('Error returning PPE issuance by employee:', error);
      return createResponse(500, 'Lỗi khi trả PPE', null, error.message);
    }
  }

  async reportIssuanceEmployee(id, reportData, employeeId) {
    try {
      // Check if employeeId is provided
      if (!employeeId) {
        return createResponse(400, 'Employee ID is required');
      }
      
      const issuance = await ppeRepository.getIssuanceById(id);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      // Verify that the employee is reporting their own PPE
      // Handle both string and populated user_id
      if (!issuance.user_id) {
        return createResponse(400, 'Bản ghi PPE không có thông tin người dùng');
      }
      
      const issuanceUserId = issuance.user_id._id || issuance.user_id.id || issuance.user_id;
      
      if (!issuanceUserId) {
        return createResponse(400, 'Không tìm thấy thông tin người dùng trong bản ghi PPE');
      }
      
      // Convert to string safely
      let issuanceUserIdStr, employeeIdStr;
      
      try {
        // Safe string conversion - handle both ObjectId and string
        if (issuanceUserId) {
          issuanceUserIdStr = typeof issuanceUserId === 'string' ? issuanceUserId : issuanceUserId.toString();
        } else {
          throw new Error('issuanceUserId is undefined or null');
        }
        
        if (employeeId) {
          employeeIdStr = typeof employeeId === 'string' ? employeeId : employeeId.toString();
        } else {
          throw new Error('employeeId is undefined or null');
        }
        
      } catch (conversionError) {
        return createResponse(400, `Lỗi chuyển đổi ID: ${conversionError.message}`);
      }
      
      if (issuanceUserIdStr !== employeeIdStr) {
        return createResponse(403, 'Bạn chỉ có thể báo cáo PPE của chính mình');
      }

      if (issuance.status === 'returned') {
        return createResponse(400, 'PPE đã được trả về, không thể báo cáo');
      }

      // Update issuance with report data
      const updateData = {
        report_type: reportData.report_type,
        report_description: reportData.description,
        report_severity: reportData.severity,
        reported_date: reportData.reported_date || new Date(),
        status: (reportData.report_type === 'damage' ? 'damaged' : 'replacement_needed')
      };

      await ppeRepository.updateIssuance(id, updateData);

      // Get the updated issuance to return
      const updatedIssuance = await ppeRepository.getIssuanceById(id);
      return createResponse(200, 'Báo cáo PPE thành công',
        transformDocumentId(updatedIssuance, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error reporting PPE issuance by employee:', error);
      return createResponse(500, 'Lỗi khi báo cáo PPE', null, error.message);
    }
  }

  async deleteIssuance(id) {
    try {
      const deleted = await ppeRepository.deleteIssuance(id);
      if (!deleted) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE để xóa');
      }
      return createResponse(200, 'Xóa bản ghi phát PPE thành công');
    } catch (error) {
      console.error('Error deleting PPE issuance:', error);
      return createResponse(500, 'Lỗi khi xóa bản ghi phát PPE', null, error.message);
    }
  }

  // Get PPE issuances for a specific user
  async getIssuancesByUser(userId) {
    try {
      const issuances = await ppeRepository.getAllIssuances({ user_id: userId });
      return createResponse(200, 'Lấy PPE của nhân viên thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting PPE issuances by user:', error);
      return createResponse(500, 'Lỗi khi lấy PPE của nhân viên', null, error.message);
    }
  }

  // Get active PPE issuances (not returned)
  async getActiveIssuances() {
    try {
      const issuances = await ppeRepository.getAllIssuances({ status: 'issued' });
      return createResponse(200, 'Lấy PPE đang sử dụng thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting active PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy PPE đang sử dụng', null, error.message);
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
      return createResponse(200, 'Lấy PPE sắp hết hạn thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting expiring PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy PPE sắp hết hạn', null, error.message);
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
      return createResponse(200, 'Lấy PPE quá hạn thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting overdue PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy PPE quá hạn', null, error.message);
    }
  }

  // Statistics and Reports
  async getStockStatus() {
    try {
      const stockStatus = await ppeRepository.getStockStatus();
      return createResponse(200, 'Lấy trạng thái tồn kho thành công', stockStatus);
    } catch (error) {
      console.error('Error getting stock status:', error);
      return createResponse(500, 'Lỗi khi lấy trạng thái tồn kho', null, error.message);
    }
  }

  async getLowStockItems() {
    try {
      const lowStockItems = await ppeRepository.getLowStockItems();
      return createResponse(200, 'Lấy danh sách thiết bị sắp hết thành công',
        transformDocumentsId(lowStockItems, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách thiết bị sắp hết', null, error.message);
    }
  }

  async getIssuanceStatistics() {
    try {
      const stats = await ppeRepository.getIssuanceStats();
      return createResponse(200, 'Lấy thống kê phát PPE thành công', stats);
    } catch (error) {
      console.error('Error getting issuance statistics:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê phát PPE', null, error.message);
    }
  }

  // Get comprehensive quantity statistics
  async getQuantityStatistics() {
    try {
      const stats = await ppeRepository.getQuantityStatistics();
      return createResponse(200, 'Lấy thống kê số lượng thành công', stats);
    } catch (error) {
      console.error('Error getting quantity statistics:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê số lượng', null, error.message);
    }
  }

  // Get users for PPE assignment (filtered by manager's department)
  async getAllUsers(managerId = null) {
    try {
      let query = {};
      
      // If managerId is provided, filter by manager's department
      if (managerId) {
        console.log('=== DEBUG PPE getAllUsers ===');
        console.log('ManagerId:', managerId);
        
        const manager = await User.findById(managerId).populate('department_id');
        console.log('Manager found:', manager ? 'Yes' : 'No');
        console.log('Manager department:', manager?.department_id);
        
        if (!manager) {
          return createResponse(404, 'Không tìm thấy thông tin manager');
        }
        
        const managerDepartmentId = manager.department_id?._id;
        console.log('Manager department ID:', managerDepartmentId);
        
        if (!managerDepartmentId) {
          return createResponse(400, 'Manager không có phòng ban');
        }
        
        // Only get employees in the same department (exclude managers)
        query = {
          department_id: managerDepartmentId,
          role_id: { $ne: null } // Ensure role is populated
        };
        
        console.log('Query:', JSON.stringify(query, null, 2));
      }

      const allUsers = await User.find(query, '_id full_name email department_id position_id role_id')
        .populate('department_id', 'department_name')
        .populate('position_id', 'position_name')
        .populate('role_id', 'role_name')
        .sort({ full_name: 1 });
        
      console.log('All users found:', allUsers.length);
      
      // Filter out managers, only keep employees
      const users = allUsers.filter(user => {
        const roleName = user.role_id?.role_name;
        const isEmployee = roleName === 'employee';
        
        if (!isEmployee) {
          console.log('Filtered out non-employee:', {
            name: user.full_name,
            role: roleName
          });
        }
        
        return isEmployee;
      });
        
      console.log('Employees found after filtering:', users.length);
      if (users.length > 0) {
        console.log('Sample employee:', {
          name: users[0].full_name,
          department: users[0].department_id,
          role: users[0].role_id
        });
      }

      // Sử dụng aggregation để tính active PPE count cho tất cả users cùng lúc
      const userIds = users.map(user => user._id);
      
      const ppeStatsPipeline = [
        {
          $match: {
            user_id: { $in: userIds },
            status: 'issued'
          }
        },
        {
          $group: {
            _id: '$user_id',
            active_ppe_count: { $sum: '$quantity' }
          }
        }
      ];
      
      const ppeStats = await PPEIssuance.aggregate(ppeStatsPipeline);
      const ppeStatsMap = {};
      ppeStats.forEach(stat => {
        ppeStatsMap[stat._id.toString()] = stat.active_ppe_count;
      });
      
      // Kết hợp user data với PPE stats
      const usersWithPPECount = users.map(user => ({
        ...user.toObject(),
        active_ppe_count: ppeStatsMap[user._id.toString()] || 0
      }));

      return createResponse(200, 'Lấy danh sách nhân viên thành công',
        transformDocumentsId(usersWithPPECount, POPULATED_FIELDS.USER));
    } catch (error) {
      console.error('Error getting all users:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách nhân viên', null, error.message);
    }
  }

  // PPE Assignments
  async getAllAssignments(filters = {}) {
    try {
      const assignments = await ppeRepository.getAllAssignments(filters);
      return createResponse(200, 'Lấy danh sách phân công PPE thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PPE_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting PPE assignments:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phân công PPE', null, error.message);
    }
  }

  async getAssignmentById(id) {
    try {
      const assignment = await ppeRepository.getAssignmentById(id);
      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công PPE');
      }
      return createResponse(200, 'Lấy thông tin phân công PPE thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PPE_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting PPE assignment:', error);
      return createResponse(500, 'Lỗi khi lấy phân công PPE', null, error.message);
    }
  }

  async createAssignment(assignmentData) {
    try {
      // Validate required fields
      const requiredFields = ['user_id', 'item_id', 'quantity', 'issued_date'];
      for (const field of requiredFields) {
        if (!assignmentData[field]) {
          return createResponse(400, `Trường ${field} là bắt buộc`);
        }
      }

      const assignment = await ppeRepository.createAssignment(assignmentData);
      return createResponse(201, 'Tạo phân công PPE thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PPE_ASSIGNMENT));
    } catch (error) {
      console.error('Error creating PPE assignment:', error);
      return createResponse(500, 'Lỗi khi tạo phân công PPE', null, error.message);
    }
  }

  async updateAssignment(id, assignmentData) {
    try {
      const assignment = await ppeRepository.updateAssignment(id, assignmentData);
      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công PPE');
      }
      return createResponse(200, 'Cập nhật phân công PPE thành công',
        transformDocumentId(assignment, POPULATED_FIELDS.PPE_ASSIGNMENT));
    } catch (error) {
      console.error('Error updating PPE assignment:', error);
      return createResponse(500, 'Lỗi khi cập nhật phân công PPE', null, error.message);
    }
  }

  async deleteAssignment(id) {
    try {
      const assignment = await ppeRepository.deleteAssignment(id);
      if (!assignment) {
        return createResponse(404, 'Không tìm thấy phân công PPE');
      }
      return createResponse(200, 'Xóa phân công PPE thành công');
    } catch (error) {
      console.error('Error deleting PPE assignment:', error);
      return createResponse(500, 'Lỗi khi xóa phân công PPE', null, error.message);
    }
  }

  async getUserAssignments(userId) {
    try {
      const assignments = await ppeRepository.getUserAssignments(userId);
      return createResponse(200, 'Lấy danh sách phân công PPE của người dùng thành công',
        transformDocumentsId(assignments, POPULATED_FIELDS.PPE_ASSIGNMENT));
    } catch (error) {
      console.error('Error getting user PPE assignments:', error);
      return createResponse(500, 'Lỗi khi lấy phân công PPE của người dùng', null, error.message);
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const [
        totalCategories,
        totalItems,
        totalIssuances,
        lowStockItems,
        overdueIssuances,
        activeIssuances
      ] = await Promise.all([
        ppeRepository.getAllCategories(),
        ppeRepository.getAllItems(),
        ppeRepository.getAllIssuances(),
        ppeRepository.getLowStockItems(),
        ppeRepository.getOverdueIssuances(),
        ppeRepository.getAllIssuances({ status: 'issued' })
      ]);

      const stats = {
        total_categories: totalCategories.length,
        total_items: totalItems.length,
        total_issuances: totalIssuances.length,
        low_stock_items: lowStockItems.length,
        overdue_issuances: overdueIssuances.length,
        active_issuances: activeIssuances.length,
        total_quantity: totalItems.reduce((sum, item) => sum + (item.quantity_available + item.quantity_allocated), 0),
        available_quantity: totalItems.reduce((sum, item) => sum + item.quantity_available, 0),
        allocated_quantity: totalItems.reduce((sum, item) => sum + item.quantity_allocated, 0)
      };

      return createResponse(200, 'Lấy thống kê dashboard thành công', stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê dashboard', null, error.message);
    }
  }

  // Inventory Management
  async getAllInventory(filters = {}) {
    try {
      const items = await ppeRepository.getAllItems(filters);
      return createResponse(200, 'Lấy danh sách tồn kho thành công',
        transformDocumentsId(items, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting inventory:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách tồn kho', null, error.message);
    }
  }

  async getInventoryById(id) {
    try {
      const item = await ppeRepository.getItemById(id);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị trong tồn kho');
      }
      return createResponse(200, 'Lấy thông tin tồn kho thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting inventory item:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin tồn kho', null, error.message);
    }
  }

  async createInventory(inventoryData) {
    try {
      // Validate required fields
      if (!inventoryData.item_id || !inventoryData.quantity || !inventoryData.action) {
        return createResponse(400, 'ID thiết bị, số lượng và hành động là bắt buộc');
      }

      const item = await ppeRepository.getItemById(inventoryData.item_id);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE');
      }

      let updateData = {};
      if (inventoryData.action === 'add') {
        updateData = {
          quantity_available: item.quantity_available + inventoryData.quantity
        };
      } else if (inventoryData.action === 'remove') {
        if (item.quantity_available < inventoryData.quantity) {
          return createResponse(400, 'Không đủ tồn kho để thực hiện thao tác');
        }
        updateData = {
          quantity_available: item.quantity_available - inventoryData.quantity
        };
      } else {
        return createResponse(400, 'Hành động không hợp lệ (add/remove)');
      }

      const updatedItem = await ppeRepository.updateItemQuantity(inventoryData.item_id, updateData);
      return createResponse(200, 'Cập nhật tồn kho thành công',
        transformDocumentId(updatedItem, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error creating inventory record:', error);
      return createResponse(500, 'Lỗi khi cập nhật tồn kho', null, error.message);
    }
  }

  async updateInventory(id, inventoryData) {
    try {
      const item = await ppeRepository.updateItemQuantity(id, inventoryData);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị trong tồn kho');
      }
      return createResponse(200, 'Cập nhật tồn kho thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error updating inventory:', error);
      return createResponse(500, 'Lỗi khi cập nhật tồn kho', null, error.message);
    }
  }

  async deleteInventory(id) {
    try {
      const deleted = await ppeRepository.deleteItem(id);
      if (!deleted) {
        return createResponse(404, 'Không tìm thấy thiết bị trong tồn kho');
      }
      return createResponse(200, 'Xóa thiết bị khỏi tồn kho thành công');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return createResponse(500, 'Lỗi khi xóa thiết bị khỏi tồn kho', null, error.message);
    }
  }

  async getInventoryStats() {
    try {
      const stats = await ppeRepository.getQuantityStatistics();
      return createResponse(200, 'Lấy thống kê tồn kho thành công', stats);
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê tồn kho', null, error.message);
    }
  }

  // Maintenance Management
  async getAllMaintenance(filters = {}) {
    try {
      // For now, return empty array as maintenance model might not exist yet
      // This can be implemented when maintenance model is created
      return createResponse(200, 'Lấy danh sách bảo trì thành công', []);
    } catch (error) {
      console.error('Error getting maintenance records:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách bảo trì', null, error.message);
    }
  }

  async getMaintenanceById(id) {
    try {
      // For now, return not found as maintenance model might not exist yet
      return createResponse(404, 'Không tìm thấy bản ghi bảo trì');
    } catch (error) {
      console.error('Error getting maintenance record:', error);
      return createResponse(500, 'Lỗi khi lấy thông tin bảo trì', null, error.message);
    }
  }

  async createMaintenance(maintenanceData) {
    try {
      // For now, return not implemented as maintenance model might not exist yet
      return createResponse(501, 'Chức năng bảo trì chưa được triển khai');
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      return createResponse(500, 'Lỗi khi tạo bản ghi bảo trì', null, error.message);
    }
  }

  async updateMaintenance(id, maintenanceData) {
    try {
      // For now, return not implemented as maintenance model might not exist yet
      return createResponse(501, 'Chức năng bảo trì chưa được triển khai');
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      return createResponse(500, 'Lỗi khi cập nhật bản ghi bảo trì', null, error.message);
    }
  }

  async deleteMaintenance(id) {
    try {
      // For now, return not implemented as maintenance model might not exist yet
      return createResponse(501, 'Chức năng bảo trì chưa được triển khai');
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      return createResponse(500, 'Lỗi khi xóa bản ghi bảo trì', null, error.message);
    }
  }

  async getMaintenanceStats() {
    try {
      // For now, return empty stats as maintenance model might not exist yet
      return createResponse(200, 'Lấy thống kê bảo trì thành công', {
        total_maintenance: 0,
        pending: 0,
        completed: 0,
        overdue: 0
      });
    } catch (error) {
      console.error('Error getting maintenance stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê bảo trì', null, error.message);
    }
  }

  // Reports
  async getInventoryReport(filters = {}) {
    try {
      const items = await ppeRepository.getAllItems(filters);
      const stats = await ppeRepository.getQuantityStatistics();
      
      const report = {
        items: transformDocumentsId(items, POPULATED_FIELDS.PPE_ITEM),
        statistics: stats,
        generated_at: new Date(),
        filters: filters
      };

      return createResponse(200, 'Lấy báo cáo tồn kho thành công', report);
    } catch (error) {
      console.error('Error getting inventory report:', error);
      return createResponse(500, 'Lỗi khi lấy báo cáo tồn kho', null, error.message);
    }
  }

  async getAssignmentReport(filters = {}) {
    try {
      const assignments = await ppeRepository.getAllAssignments(filters);
      
      const report = {
        assignments: transformDocumentsId(assignments, POPULATED_FIELDS.PPE_ASSIGNMENT),
        total_assignments: assignments.length,
        generated_at: new Date(),
        filters: filters
      };

      return createResponse(200, 'Lấy báo cáo phân công thành công', report);
    } catch (error) {
      console.error('Error getting assignment report:', error);
      return createResponse(500, 'Lỗi khi lấy báo cáo phân công', null, error.message);
    }
  }

  async getMaintenanceReport(filters = {}) {
    try {
      // For now, return empty report as maintenance model might not exist yet
      const report = {
        maintenance_records: [],
        total_records: 0,
        generated_at: new Date(),
        filters: filters
      };

      return createResponse(200, 'Lấy báo cáo bảo trì thành công', report);
    } catch (error) {
      console.error('Error getting maintenance report:', error);
      return createResponse(500, 'Lỗi khi lấy báo cáo bảo trì', null, error.message);
    }
  }

  // Item Statistics
  async getItemStats(itemId) {
    try {
      const item = await ppeRepository.getItemById(itemId);
      if (!item) {
        return createResponse(404, 'Không tìm thấy thiết bị PPE');
      }

      // Get issuance statistics for this item
      const issuances = await ppeRepository.getAllIssuances({ item_id: itemId });
      const stats = {
        item: transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM),
        total_issuances: issuances.length,
        active_issuances: issuances.filter(i => i.status === 'issued').length,
        returned_issuances: issuances.filter(i => i.status === 'returned').length,
        total_quantity_issued: issuances.reduce((sum, i) => sum + i.quantity, 0)
      };

      return createResponse(200, 'Lấy thống kê thiết bị thành công', stats);
    } catch (error) {
      console.error('Error getting item stats:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê thiết bị', null, error.message);
    }
  }
}

module.exports = new PPEService();