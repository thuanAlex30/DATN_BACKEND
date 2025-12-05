const ppeRepository = require('../repository/PPERepository');
const UserRepository = require('../repository/UserRepository');
const UserService = require('./userService');
const mongoose = require('mongoose');
const User = require('../models/user');
const PPEIssuance = require('../models/ppeIssuance');
const Department = require('../models/department');
const ExcelJS = require('exceljs');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class PPEService {
  // PPE Categories
  async getAllCategories(tenantId = null) {
    try {
      const categories = await ppeRepository.getAllCategories(tenantId);
      return createResponse(200, 'Lấy danh sách danh mục PPE thành công',
        transformDocumentsId(categories, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error getting PPE categories:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách danh mục PPE', null, error.message);
    }
  }

  async getCategoryById(id, tenantId = null) {
    try {
      const category = await ppeRepository.getCategoryById(id, tenantId);
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

  async createCategory(categoryData, tenantId = null) {
    try {
      // Validate required fields
      if (!categoryData.category_name) {
        return createResponse(400, 'Tên danh mục là bắt buộc');
      }

      const category = await ppeRepository.createCategory(categoryData, tenantId);
      return createResponse(201, 'Tạo danh mục PPE thành công',
        transformDocumentId(category, POPULATED_FIELDS.PPE_CATEGORY));
    } catch (error) {
      console.error('Error creating PPE category:', error);
      return createResponse(500, 'Lỗi khi tạo danh mục PPE', null, error.message);
    }
  }

  async importCategoriesFromExcel(file, tenantId = null) {
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
      const existingCategories = await ppeRepository.getAllCategories(tenantId);
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
          const createdCategory = await ppeRepository.createCategory(categoryData, tenantId);
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

  async updateCategory(id, categoryData, tenantId = null) {
    try {
      const category = await ppeRepository.updateCategory(id, categoryData, tenantId);
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

  async deleteCategory(id, tenantId = null) {
    try {
      // Validate ObjectId format
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return createResponse(400, 'ID danh mục không hợp lệ');
      }

      // Check if category exists
      const category = await ppeRepository.getCategoryById(id, tenantId);
      if (!category) {
        return createResponse(404, 'Không tìm thấy danh mục PPE để xóa');
      }

      // Check if there are any PPE items using this category
      const itemsUsingCategory = await ppeRepository.getAllItems({ category_id: id }, tenantId);
      if (itemsUsingCategory && itemsUsingCategory.length > 0) {
        return createResponse(400, `Không thể xóa danh mục này vì còn ${itemsUsingCategory.length} thiết bị PPE đang sử dụng. Vui lòng xóa hoặc chuyển các thiết bị này sang danh mục khác trước.`);
      }

      const deleted = await ppeRepository.deleteCategory(id, tenantId);
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
  async getAllItems(filters = {}, tenantId = null) {
    try {
      const items = await ppeRepository.getAllItems(filters, tenantId);
      return createResponse(200, 'Lấy danh sách thiết bị PPE thành công',
        transformDocumentsId(items, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting PPE items:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách thiết bị PPE', null, error.message);
    }
  }

  async getItemById(id, tenantId = null) {
    try {
      const item = await ppeRepository.getItemById(id, tenantId);
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

  async createItem(itemData, tenantId = null) {
    try {
      // Validate required fields
      if (!itemData.item_code || !itemData.item_name || !itemData.category_id) {
        return createResponse(400, 'Mã thiết bị, tên thiết bị và danh mục là bắt buộc');
      }

      // Normalize item_code to uppercase
      const normalizedItemCode = itemData.item_code.toString().trim().toUpperCase();

      // Check if item code already exists - use direct query for accuracy
      const PPEItem = require('../models/ppeItem');
      const query = { item_code: normalizedItemCode };
      if (tenantId) {
        query.tenant_id = tenantId;
      }
      
      const existingItem = await PPEItem.findOne(query);
      if (existingItem) {
        return createResponse(400, `Mã thiết bị "${normalizedItemCode}" đã tồn tại. Vui lòng sử dụng mã khác.`);
      }

      // Use normalized item_code
      const itemDataWithNormalizedCode = {
        ...itemData,
        item_code: normalizedItemCode
      };

      const item = await ppeRepository.createItem(itemDataWithNormalizedCode, tenantId);
      return createResponse(201, 'Tạo thiết bị PPE thành công',
        transformDocumentId(item, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error creating PPE item:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000 || error.name === 'MongoServerError') {
        const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'item_code';
        return createResponse(400, `Mã thiết bị "${itemData.item_code}" đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.`, null, error.message);
      }
      
      return createResponse(500, 'Lỗi khi tạo thiết bị PPE', null, error.message);
    }
  }

  async updateItem(id, itemData, tenantId = null) {
    try {
      const item = await ppeRepository.updateItem(id, itemData, tenantId);
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

  async deleteItem(id, tenantId = null) {
    try {
      const deleted = await ppeRepository.deleteItem(id, tenantId);
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
  async updateItemQuantity(id, quantityData, tenantId = null) {
    try {
      const item = await ppeRepository.updateItemQuantity(id, quantityData, tenantId);
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
  async getAllIssuances(filters = {}, tenantId = null) {
    try {
      const issuances = await ppeRepository.getAllIssuances(filters, tenantId);
      return createResponse(200, 'Lấy danh sách phát PPE thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách phát PPE', null, error.message);
    }
  }

  async getIssuanceById(id, tenantId = null) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id, tenantId);
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
  async createIssuanceToEmployee(issuanceData, tenantId = null) {
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

        // Kiểm tra vai trò và cùng phòng ban
        const managerUser = await User.findById(issuanceData.issued_by)
          .populate('role_id', 'role_name')
          .populate('department_id');
        const employeeUser = await User.findById(issuanceData.user_id)
          .populate('role_id', 'role_name')
          .populate('department_id');

        if (!managerUser) {
          throw new Error('Manager không tồn tại');
        }
        if (!employeeUser) {
          throw new Error('Nhân viên không tồn tại');
        }
        const managerRole = managerUser.role_id && managerUser.role_id.role_name ? managerUser.role_id.role_name : null;
        if (managerRole !== 'manager') {
          throw new Error('Chỉ Manager mới được phát PPE cho nhân viên');
        }
        if (!managerUser.department_id) {
          throw new Error('Manager chưa được gán phòng ban');
        }
        const managerDeptId = (managerUser.department_id._id || managerUser.department_id).toString();
        const employeeDeptId = employeeUser.department_id ? (employeeUser.department_id._id || employeeUser.department_id).toString() : '';
        if (!employeeDeptId || employeeDeptId !== managerDeptId) {
          throw new Error('Chỉ được phát PPE cho nhân viên trong cùng phòng ban');
        }

        // Kiểm tra Manager có đủ PPE in-hand để phát - sử dụng aggregation để tính chính xác
        const managerPPEStats = await ppeRepository.getManagerPPEStats(issuanceData.issued_by, issuanceData.item_id);
        
        if (!managerPPEStats || managerPPEStats.total_received === 0) {
          throw new Error('Manager chưa nhận PPE này từ Admin');
        }

        // Tính số PPE có thể phát = remaining_in_hand - total_issued_to_employees
        const availableQuantity = Math.max(0, (managerPPEStats.remaining_in_hand || 0) - (managerPPEStats.total_issued_to_employees || 0));

        if (availableQuantity < issuanceData.quantity) {
          throw new Error(`Manager không đủ PPE để phát. Hiện có: ${availableQuantity}, cần phát: ${issuanceData.quantity}`);
        }

        // Get issuer and recipient info for WebSocket
        issuer = await User.findById(issuanceData.issued_by);
        recipient = await User.findById(issuanceData.user_id);
        manager = issuer;

        // Create issuance with proper level and manager reference
        const issuancePayload = {
          ...issuanceData,
          issuance_level: 'manager_to_employee',
          manager_id: issuanceData.issued_by
        };
        issuance = await ppeRepository.createIssuance(issuancePayload, tenantId);
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

  // Employee xác nhận nhận PPE từ Manager hoặc Manager xác nhận nhận PPE từ Header Department
  async confirmReceivedPPE(id, confirmationData, tenantId = null) {
    try {
      console.log('🔍 confirmReceivedPPE - id:', id);
      console.log('🔍 confirmReceivedPPE - confirmationData:', confirmationData);
      
      const issuance = await ppeRepository.getIssuanceById(id, tenantId);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      // Kiểm tra trạng thái hiện tại
      if (issuance.status !== 'pending_confirmation') {
        return createResponse(400, 'PPE này không cần xác nhận hoặc đã được xác nhận');
      }

      // Kiểm tra quyền xác nhận - chỉ người nhận PPE mới có thể xác nhận
      if (confirmationData.confirmed_by) {
        const confirmedByStr = typeof confirmationData.confirmed_by === 'string' ? confirmationData.confirmed_by : confirmationData.confirmed_by.toString();
        const issuanceUserIdStr = (issuance.user_id._id || issuance.user_id).toString();
        if (confirmedByStr !== issuanceUserIdStr) {
          return createResponse(403, 'Bạn chỉ có thể xác nhận PPE được phát cho chính mình');
        }
      }

      // Kiểm tra issuance_level và cho phép cả admin_to_manager và manager_to_employee
      if (issuance.issuance_level !== 'manager_to_employee' && issuance.issuance_level !== 'admin_to_manager') {
        return createResponse(400, 'Chỉ có thể xác nhận PPE được phát từ Manager hoặc Header Department');
      }

      // Cập nhật trạng thái PPE
      const updateData = {
        status: 'issued',
        confirmed_date: new Date(),
        confirmation_notes: confirmationData.confirmation_notes || ''
      };

      const updatedIssuance = await ppeRepository.updateIssuance(id, { ...updateData, tenant_id: tenantId });
      
      // Lấy thông tin người nhận và người phát để gửi WebSocket
      const recipient = await User.findById(issuance.user_id);
      let issuer = null;
      
      if (issuance.issuance_level === 'manager_to_employee') {
        // Employee xác nhận nhận PPE từ Manager
        issuer = await User.findById(issuance.manager_id);
      } else if (issuance.issuance_level === 'admin_to_manager') {
        // Manager xác nhận nhận PPE từ Header Department
        issuer = await User.findById(issuance.issued_by);
      }

      return createResponse(200, 'Xác nhận nhận PPE thành công', {
        issuance: transformDocumentId(updatedIssuance, POPULATED_FIELDS.PPE_ISSUANCE),
        employee: issuance.issuance_level === 'manager_to_employee' ? recipient : null,
        manager: issuance.issuance_level === 'manager_to_employee' ? issuer : (issuance.issuance_level === 'admin_to_manager' ? recipient : null),
        headerDepartment: issuance.issuance_level === 'admin_to_manager' ? issuer : null
      });
    } catch (error) {
      console.error('Error confirming received PPE:', error);
      return createResponse(500, 'Lỗi khi xác nhận nhận PPE', null, error.message);
    }
  }

  // Employee trả PPE cho Manager
  async returnIssuanceToManager(id, returnData, tenantId = null) {
    try {
      const issuance = await ppeRepository.getIssuanceById(id, tenantId);
      if (!issuance) {
        return createResponse(404, 'Không tìm thấy bản ghi phát PPE');
      }

      if (issuance.status === 'returned') {
        return createResponse(400, 'PPE đã được trả về');
      }

      if (issuance.issuance_level !== 'manager_to_employee') {
        return createResponse(400, 'Chỉ có thể trả PPE được phát từ Manager');
      }

      // Enforce: employee can only return their own PPE
      if (returnData.returned_by) {
        const returnedByStr = typeof returnData.returned_by === 'string' ? returnData.returned_by : returnData.returned_by.toString();
        const issuanceUserIdStr = (issuance.user_id._id || issuance.user_id).toString();
        if (returnedByStr !== issuanceUserIdStr) {
          return createResponse(403, 'Bạn chỉ có thể trả PPE của chính mình');
        }
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
  async returnIssuanceToAdmin(id, returnData, tenantId = null) {
    const session = await mongoose.startSession();
    
    try {
      let issuance, returner, item, updatedIssuance;
      await session.withTransaction(async () => {
        issuance = await ppeRepository.getIssuanceById(id, tenantId);
        if (!issuance) {
          throw new Error('Không tìm thấy bản ghi phát PPE');
        }

        if (issuance.status === 'returned') {
          throw new Error('PPE đã được trả về');
        }

        if (issuance.issuance_level !== 'admin_to_manager') {
          throw new Error('Chỉ có thể trả PPE được phát từ Admin');
        }

        // Verify manager is returning their own issuance
        if (returnData.returned_by) {
          const returnedByStr = typeof returnData.returned_by === 'string' ? returnData.returned_by : returnData.returned_by.toString();
          const issuanceUserIdStr = (issuance.user_id._id || issuance.user_id).toString();
          if (returnedByStr !== issuanceUserIdStr) {
            throw new Error('Bạn không có quyền trả PPE này');
          }
        }

        // Get returner and item info
        returner = await User.findById(issuance.user_id);
        item = await ppeRepository.getItemById(issuance.item_id, tenantId);

        // Compute aggregated available-to-return from manager stats (in-hand only)
        const stats = await ppeRepository.getManagerPPEStats(issuance.user_id._id || issuance.user_id, issuance.item_id._id || issuance.item_id);
        const aggregatedAvailableToReturn = Math.max(0, (stats.remaining_in_hand || 0) - (stats.total_issued_to_employees || 0));

        console.log(`[DEBUG returnIssuanceToAdmin] Issuance ID: ${id}`);
        console.log(`[DEBUG returnIssuanceToAdmin] Stats:`, JSON.stringify(stats, null, 2));
        console.log(`[DEBUG returnIssuanceToAdmin] aggregatedAvailableToReturn: ${aggregatedAvailableToReturn}`);
        console.log(`[DEBUG returnIssuanceToAdmin] returnData.quantity: ${returnData.quantity}`);

        // Default to min(per-issuance remaining, aggregated in-hand)
        const remainingQty = issuance.remaining_quantity !== undefined ? issuance.remaining_quantity : issuance.quantity;
        const defaultQty = Math.min(remainingQty, aggregatedAvailableToReturn);
        const returnQty = returnData.quantity || defaultQty;
        
        console.log(`[DEBUG returnIssuanceToAdmin] remainingQty: ${remainingQty}, defaultQty: ${defaultQty}, returnQty: ${returnQty}`);

        // Validate return quantity
        if (returnQty > aggregatedAvailableToReturn) {
          throw new Error(`Số lượng trả (${returnQty}) vượt quá số PPE đang giữ (${aggregatedAvailableToReturn}). Vui lòng thu hồi PPE từ nhân viên trước.`);
        }

        if (returnQty <= 0) {
          throw new Error('Không còn PPE để trả');
        }

        // Calculate new remaining quantity
        const newRemainingQty = remainingQty - returnQty;

        // Determine new status: if all returned -> 'returned', else still 'issued'
        const newStatus = newRemainingQty === 0 ? 'returned' : 'issued';

        // Update issuance
        const updateData = {
          status: newStatus,
          remaining_quantity: newRemainingQty,
          actual_return_date: returnData.actual_return_date || new Date(),
          return_condition: returnData.return_condition,
          notes: returnData.notes
        };

        updatedIssuance = await ppeRepository.updateIssuance(id, updateData);
        console.log(`[DEBUG returnIssuanceToAdmin] Updated issuance:`, JSON.stringify(updatedIssuance, null, 2));

        // Update item quantity - deallocate the returned quantity
        await ppeRepository.updateItemQuantity(issuance.item_id, {
          quantity_available: item.quantity_available + returnQty,
          quantity_allocated: item.quantity_allocated - returnQty
        });
        console.log(`[DEBUG returnIssuanceToAdmin] Updated item quantity: available=${item.quantity_available + returnQty}, allocated=${item.quantity_allocated - returnQty}`);
      });
      
      return createResponse(200, 'Manager trả PPE cho Admin thành công', {
        issuance: transformDocumentId(updatedIssuance || issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        returner: returner,
        returned_quantity: (updatedIssuance ? (issuance.remaining_quantity !== undefined ? (issuance.remaining_quantity - updatedIssuance.remaining_quantity) : (issuance.quantity - updatedIssuance.remaining_quantity)) : (returnData.quantity))
      });
    } catch (error) {
      console.error('Error returning PPE to admin:', error);
      return createResponse(500, 'Lỗi khi Manager trả PPE cho Admin', null, error.message);
    } finally {
      await session.endSession();
    }
  }

  // Manager xác nhận nhận PPE từ Employee
  async confirmEmployeeReturn(id, managerId, tenantId = null) {
    const session = await mongoose.startSession();
    
    try {
      let issuance, employee, manager;
      await session.withTransaction(async () => {
        issuance = await ppeRepository.getIssuanceById(id, tenantId);
        if (!issuance) {
          throw new Error('Không tìm thấy bản ghi phát PPE');
        }

        // Verify this is a manager-to-employee issuance
        if (issuance.issuance_level !== 'manager_to_employee') {
          throw new Error('Bản ghi này không phải PPE phát cho Employee');
        }

        // Verify the manager owns this issuance
        const issuanceManagerId = issuance.manager_id._id || issuance.manager_id;
        const managerIdStr = issuanceManagerId.toString();
        const requestManagerIdStr = managerId.toString();
        
        if (managerIdStr !== requestManagerIdStr) {
          throw new Error('Bạn không có quyền xác nhận PPE này');
        }

        // Verify status is pending_manager_return
        if (issuance.status !== 'pending_manager_return') {
          throw new Error('PPE này không ở trạng thái chờ xác nhận');
        }

        // Get employee and manager info
        employee = await User.findById(issuance.user_id);
        manager = await User.findById(managerId);

        // Mark issuance as returned (Employee has returned to Manager)
        await ppeRepository.updateIssuance(id, {
          status: 'returned'
        });

        // No quantity changes here - Manager still holds the PPE
        // Quantity will only change when Manager returns to Admin
      });
      
      return createResponse(200, 'Xác nhận nhận PPE từ Employee thành công', {
        issuance: transformDocumentId(issuance, POPULATED_FIELDS.PPE_ISSUANCE),
        employee: employee,
        manager: manager
      });
    } catch (error) {
      console.error('Error confirming employee PPE return:', error);
      return createResponse(500, 'Lỗi khi xác nhận nhận PPE từ Employee', null, error.message);
    } finally {
      await session.endSession();
    }
  }

  // Lấy danh sách PPE của Manager - Sử dụng aggregation để tính toán chính xác
  async getManagerPPE(managerId, tenantId = null) {
    try {
      // ✅ Lấy TẤT CẢ PPE items mà Manager đã nhận từ Admin (bao gồm cả đã trả)
      const receivedIssuances = await ppeRepository.getIssuancesByUser(managerId, {
        issuance_level: 'admin_to_manager'
        // ✅ KHÔNG filter status - lấy tất cả để tính total_received chính xác
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
            remaining_in_hand: 0,  // ✅ Số còn giữ chưa phát
            total_issued_to_employees: 0,
            remaining: 0,  // ✅ = remaining_in_hand - total_issued_to_employees
            issuances: []
          };
        }
        
        // ✅ Tính tổng số đã nhận (bao gồm cả đã trả)
        ppeSummary[itemId].total_received += issuance.quantity;
        ppeSummary[itemId].issuances.push(issuance);
      }

      // Tính toán chính xác cho từng item và transform issuances
      for (const itemId in ppeSummary) {
        const stats = await ppeRepository.getManagerPPEStats(managerId, itemId);
        console.log(`[DEBUG] getManagerPPEStats for item ${itemId}:`, JSON.stringify(stats, null, 2));
        
        ppeSummary[itemId].total_received = stats.total_received;  // ✅ Lấy từ DB để chính xác
        ppeSummary[itemId].total_returned = stats.total_returned;
        ppeSummary[itemId].remaining_in_hand = stats.remaining_in_hand;  // ✅ Số còn giữ sau khi trả Admin
        ppeSummary[itemId].total_issued_to_employees = stats.total_issued_to_employees;
        ppeSummary[itemId].remaining = stats.remaining_in_hand - stats.total_issued_to_employees;  // ✅ Số còn lại thực tế
        
        // Transform issuances IDs from _id to id
        ppeSummary[itemId].issuances = transformDocumentsId(ppeSummary[itemId].issuances, POPULATED_FIELDS.PPE_ISSUANCE);
        
        console.log(`[DEBUG] ppeSummary[${itemId}] after calculation:`, JSON.stringify(ppeSummary[itemId], null, 2));
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
  async getEmployeePPE(employeeId, tenantId = null) {
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
  async getDepartmentEmployeesPPE(managerId, tenantId = null) {
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
  async getManagerPPEHistory(managerId, tenantId = null) {
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

        // If admin → manager, enforce recipient is manager or warehouse_staff
        if (issuanceData.issuance_level === 'admin_to_manager') {
          const recipientUser = await User.findById(issuanceData.user_id)
            .populate('role_id', 'role_name role_code')
            .populate('department_id');
          if (!recipientUser) {
            throw new Error('Người nhận (Manager/Warehouse Staff) không tồn tại');
          }
          const roleName = recipientUser.role_id && recipientUser.role_id.role_name ? recipientUser.role_id.role_name.toLowerCase() : '';
          const roleCode = recipientUser.role_id && recipientUser.role_id.role_code ? recipientUser.role_id.role_code.toLowerCase() : '';
          
          // Check if user has manager or warehouse_staff role
          const isManager = roleName === 'manager' || roleCode === 'manager';
          const isWarehouseStaff = roleName === 'warehouse_staff' || roleCode === 'warehouse_staff' || 
                                   roleName === 'warehouse staff' || roleCode === 'warehouse_staff';
          
          if (!isManager && !isWarehouseStaff) {
            throw new Error('Chỉ được phát PPE cho người có vai trò Manager hoặc Warehouse Staff');
          }
          
          // For manager role, check if they are department head
          if (isManager && !isWarehouseStaff) {
            if (!recipientUser.department_id) {
              throw new Error('Manager chưa được gán phòng ban');
            }
            const dept = await Department.findOne({ _id: recipientUser.department_id._id || recipientUser.department_id, manager_id: recipientUser._id });
            if (!dept) {
              throw new Error('Chỉ được phát PPE cho Trưởng phòng (department head)');
            }
          }
          // For warehouse_staff, no department head check required
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

        // Initialize remaining_quantity for admin_to_manager issuances
        if (issuanceData.issuance_level === 'admin_to_manager') {
          issuanceData.remaining_quantity = issuanceData.quantity;
        }

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

      if (issuance.status === 'returned' || issuance.status === 'pending_manager_return') {
        return createResponse(400, 'PPE đã được trả về');
      }

      // Employee returns to Manager - set status to pending_manager_return
      // Manager will confirm and then return to Admin
      const updateData = {
        status: 'pending_manager_return',
        actual_return_date: returnData.actual_return_date || new Date(),
        return_condition: returnData.return_condition,
        notes: returnData.notes
      };

      await ppeRepository.updateIssuance(id, updateData);

      // DO NOT update item quantity yet - wait for Manager to confirm
      // Quantity will be deallocated when Manager returns to Admin

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

  // Get overdue PPE issuances (scoped theo tenant)
  async getOverdueIssuances(tenantId) {
    try {
      const now = new Date();
      const issuances = await ppeRepository.getAllIssuances({
        status: 'issued',
        expected_return_date: { $lt: now },
        ...(tenantId ? { tenant_id: tenantId } : {})
      });
      return createResponse(200, 'Lấy PPE quá hạn thành công',
        transformDocumentsId(issuances, POPULATED_FIELDS.PPE_ISSUANCE));
    } catch (error) {
      console.error('Error getting overdue PPE issuances:', error);
      return createResponse(500, 'Lỗi khi lấy PPE quá hạn', null, error.message);
    }
  }

  // Statistics and Reports (scoped theo tenant)
  async getStockStatus(tenantId) {
    try {
      const stockStatus = await ppeRepository.getStockStatus(tenantId);
      return createResponse(200, 'Lấy trạng thái tồn kho thành công', stockStatus);
    } catch (error) {
      console.error('Error getting stock status:', error);
      return createResponse(500, 'Lỗi khi lấy trạng thái tồn kho', null, error.message);
    }
  }

  async getLowStockItems(tenantId) {
    try {
      const lowStockItems = await ppeRepository.getLowStockItems(tenantId);
      return createResponse(200, 'Lấy danh sách thiết bị sắp hết thành công',
        transformDocumentsId(lowStockItems, POPULATED_FIELDS.PPE_ITEM));
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách thiết bị sắp hết', null, error.message);
    }
  }

  async getIssuanceStatistics(tenantId) {
    try {
      const stats = await ppeRepository.getIssuanceStats(tenantId);
      return createResponse(200, 'Lấy thống kê phát PPE thành công', stats);
    } catch (error) {
      console.error('Error getting issuance statistics:', error);
      return createResponse(500, 'Lỗi khi lấy thống kê phát PPE', null, error.message);
    }
  }

  // Get comprehensive quantity statistics (scoped theo tenant)
  async getQuantityStatistics(tenantId) {
    try {
      const stats = await ppeRepository.getQuantityStatistics(tenantId);
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

      const allUsers = await User.find(query, '_id full_name email department_id role_id')
        .populate('department_id', 'department_name')
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

  // Dashboard Statistics (scoped theo tenant)
  async getDashboardStats(tenantId) {
    try {
      const [
        totalCategories,
        totalItems,
        totalIssuances,
        lowStockItems,
        overdueIssuances,
        activeIssuances
      ] = await Promise.all([
        ppeRepository.getAllCategories(tenantId),
        ppeRepository.getAllItems({}, tenantId),
        ppeRepository.getAllIssuances({}, tenantId),
        ppeRepository.getLowStockItems(tenantId),
        ppeRepository.getOverdueIssuances(tenantId),
        ppeRepository.getAllIssuances({ status: 'issued' }, tenantId)
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