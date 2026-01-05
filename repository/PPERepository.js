const mongoose = require('mongoose');
const PPECategory = require('../models/ppeCategory');
const PPEItem = require('../models/ppeItem');
const PPEIssuance = require('../models/ppeIssuance');
const User = require('../models/user');

class PPERepository {
  // PPE Categories
  async getAllCategories(tenantId = null) {
    const filter = {};
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    return await PPECategory.find(filter)
      .select('category_name description tenant_id createdAt')
      .sort({ category_name: 1 })
      .lean();
  }

  async getCategoryById(id, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    return await PPECategory.findOne(filter);
  }

  async createCategory(categoryData, tenantId = null) {
    const category = new PPECategory({
      ...categoryData,
      ...(tenantId ? { tenant_id: tenantId } : {})
    });
    return await category.save();
  }

  async updateCategory(id, categoryData, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    return await PPECategory.findOneAndUpdate(filter, categoryData, { new: true });
  }

  async deleteCategory(id, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    const result = await PPECategory.findOneAndDelete(filter);
    return !!result;
  }

  async importItems(file) {
    const XLSX = require('xlsx');
    
    try {
      // Read the uploaded file from buffer (multer.memoryStorage())
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Excel data parsed:', data);
      
      if (!data || data.length === 0) {
        throw new Error('File Excel không có dữ liệu');
      }

      const results = {
        success: [],
        errors: [],
        totalRows: data.length,
        validRows: 0
      };

      // Get all categories for validation (only name and id)
      const categories = await PPECategory.find().select('category_name').lean();
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.category_name.toLowerCase()] = cat._id;
      });
      
      console.log('Available categories:', categories.map(cat => cat.category_name));
      console.log('Category map:', categoryMap);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel row number (accounting for header)

        try {
          // Validate required fields
          if (!row['Tên thiết bị'] || !row['Mã thiết bị'] || !row['Danh mục']) {
            results.errors.push(`Dòng ${rowNumber}: Thiếu thông tin bắt buộc (Tên thiết bị, Mã thiết bị, Danh mục)`);
            continue;
          }

          // Validate category exists
          const categoryName = row['Danh mục'].toString().trim();
          const categoryId = categoryMap[categoryName.toLowerCase()];
          if (!categoryId) {
            results.errors.push(`Dòng ${rowNumber}: Danh mục "${categoryName}" không tồn tại`);
            continue;
          }

          // Check for duplicate item code
          const existingItem = await PPEItem.findOne({ item_code: row['Mã thiết bị'].toString().trim().toUpperCase() });
          if (existingItem) {
            results.errors.push(`Dòng ${rowNumber}: Mã thiết bị "${row['Mã thiết bị']}" đã tồn tại`);
            continue;
          }

          // Prepare item data
          const itemData = {
            category_id: categoryId,
            item_code: row['Mã thiết bị'].toString().trim().toUpperCase(),
            item_name: row['Tên thiết bị'].toString().trim(),
            brand: row['Thương hiệu'] ? row['Thương hiệu'].toString().trim() : '',
            model: row['Model'] ? row['Model'].toString().trim() : '',
            reorder_level: parseInt(row['Mức tái đặt hàng']) || 10,
            quantity_available: parseInt(row['Số lượng có sẵn']) || 0,
            quantity_allocated: parseInt(row['Số lượng đã phân phối']) || 0
          };

          // Validate numeric fields
          if (isNaN(itemData.reorder_level) || itemData.reorder_level < 0) {
            results.errors.push(`Dòng ${rowNumber}: Mức tái đặt hàng phải là số >= 0`);
            continue;
          }

          if (isNaN(itemData.quantity_available) || itemData.quantity_available < 0) {
            results.errors.push(`Dòng ${rowNumber}: Số lượng có sẵn phải là số >= 0`);
            continue;
          }

          if (isNaN(itemData.quantity_allocated) || itemData.quantity_allocated < 0) {
            results.errors.push(`Dòng ${rowNumber}: Số lượng đã phân phối phải là số >= 0`);
            continue;
          }

          // Create the item
          const newItem = await PPEItem.create(itemData);
          results.success.push(newItem);
          results.validRows++;

        } catch (error) {
          results.errors.push(`Dòng ${rowNumber}: ${error.message}`);
        }
      }

      return results;

    } catch (error) {
      throw error;
    }
  }

  // PPE Items
  async getAllItems(filters = {}, tenantId = null) {
    try {
      const query = {};

      if (tenantId) {
        query.tenant_id = tenantId;
      }
      
      if (filters.category_id) {
        query.category_id = filters.category_id;
      }
      
      if (filters.search) {
        query.$or = [
          { item_name: { $regex: filters.search, $options: 'i' } },
          { item_code: { $regex: filters.search, $options: 'i' } },
          { brand: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      // By default only active items, unless explicitly requested
      if (!filters.include_inactive) {
        query.status = 'active';
      }

      // Use aggregation pipeline for better performance
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'ppecategories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'ppeissuances',
            let: { itemId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$item_id', '$$itemId'] },
                      { $eq: ['$issuance_level', 'admin_to_manager'] },
                      { $ne: ['$status', 'returned'] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  total_allocated: { $sum: { $ifNull: ['$remaining_quantity', '$quantity'] } }
                }
              }
            ],
            as: 'allocations'
          }
        },
        {
          $addFields: {
            total_quantity: { $add: ['$quantity_available', '$quantity_allocated'] },
            actual_allocated_quantity: {
              $ifNull: [{ $arrayElemAt: ['$allocations.total_allocated', 0] }, 0]
            }
          }
        },
        {
          $addFields: {
            remaining_quantity: { $subtract: ['$total_quantity', '$actual_allocated_quantity'] }
          }
        },
        {
          $project: {
            _id: 1,
            category_id: 1,
            item_name: 1,
            item_code: 1,
            brand: 1,
            model: 1,
            reorder_level: 1,
            quantity_available: 1,
            quantity_allocated: 1,
            createdAt: 1,
            updatedAt: 1,
            'category.category_name': 1,
            'category.description': 1,
            total_quantity: 1,
            remaining_quantity: 1,
            actual_allocated_quantity: 1,
            image_url: 1
          }
        },
        { $sort: { item_name: 1 } }
      ];

      // Run aggregation with disk use allowed and reasonable timeout
      const result = await PPEItem.aggregate(pipeline, {
        allowDiskUse: true,
        maxTimeMS: 10000
      });
      
      // Filter out any documents with invalid ObjectIds
      return result.filter(doc => {
        try {
          // Test if _id can be converted to string
          if (doc._id) {
            doc._id.toString();
          }
          return true;
        } catch (error) {
          console.error('Invalid ObjectId found in document:', doc._id, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in getAllItems:', error);
      throw error;
    }
  }

  async getItemById(id, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }

    const item = await PPEItem.findOne(filter)
      .select('item_name item_code brand model quantity_available quantity_allocated reorder_level category_id image_url serial_numbers')
      .populate('category_id', 'category_name description')
      .lean();

    if (!item) {
      return null;
    }

    // Calculate total quantities for the item
    const total_quantity = item.quantity_available + item.quantity_allocated;
    
    // Get actual allocated quantity from issuances (for verification)
    const actualAllocated = await PPEIssuance.aggregate([
      {
        $match: {
          item_id: item._id,
          status: 'issued'
        }
      },
      {
        $group: {
          _id: null,
          total_allocated: { $sum: '$quantity' }
        }
      }
    ]);

    const actual_allocated_quantity = actualAllocated.length > 0 ? actualAllocated[0].total_allocated : 0;
    
    // Calculate remaining quantity
    const remaining_quantity = total_quantity - actual_allocated_quantity;

    return {
      ...item,
      total_quantity,
      remaining_quantity,
      actual_allocated_quantity
    };
  }

  async createItem(itemData, tenantId = null) {
    const item = new PPEItem({
      ...itemData,
      ...(tenantId ? { tenant_id: tenantId } : {})
    });
    return await item.save();
  }

  async updateItem(id, itemData, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    return await PPEItem.findOneAndUpdate(filter, itemData, { new: true });
  }

  async deleteItem(id, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    const result = await PPEItem.findOneAndDelete(filter);
    return !!result;
  }

  // PPE Items with quantity management
  async updateItemQuantity(id, quantityData, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    return await PPEItem.findOneAndUpdate(filter, {
      quantity_available: quantityData.quantity_available,
      quantity_allocated: quantityData.quantity_allocated
    }, { new: true });
  }

  // PPE Issuances
  async getAllIssuances(filters = {}, tenantId = null) {
    const query = {};

    if (tenantId) {
      query.tenant_id = tenantId;
    }
    
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.item_id) {
      query.item_id = filters.item_id;
    }

    return await PPEIssuance.find(query)
      .select('user_id item_id issued_by manager_id status issued_date expected_return_date actual_return_date remaining_quantity manager_remaining_quantity quantity assigned_serial_numbers returned_serial_numbers report_description report_severity report_type reported_date confirmation_notes confirmed_date notes tenant_id createdAt updatedAt')
      .populate({
        path: 'user_id',
        select: 'full_name email',
        populate: {
          path: 'department_id',
          select: 'department_name'
        }
      })
      .populate({
        path: 'item_id',
        select: 'item_name item_code category_id',
        populate: {
          path: 'category_id',
          select: 'category_name description'
        }
      })
      .populate('issued_by', 'full_name')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }

  async getIssuanceById(id, tenantId = null) {
    const filter = { _id: id };
    if (tenantId) {
      filter.tenant_id = tenantId;
    }
    let issuance = await PPEIssuance.findOne(filter)
      .populate({
        path: 'user_id',
        select: 'full_name email',
        populate: {
          path: 'department_id',
          select: 'department_name'
        }
      })
      .populate({
        path: 'item_id',
        populate: {
          path: 'category_id',
          select: 'category_name description'
        }
      })
      .populate('issued_by', 'full_name');
    // If not found using tenant filter, retry without tenant (helpful for debugging tenant mismatches)
    if (!issuance && tenantId) {
      console.warn(`[PPERepository.getIssuanceById] Not found with tenantId=${tenantId}, retrying without tenant filter for id=${id}`);
      issuance = await PPEIssuance.findOne({ _id: id })
        .populate({
          path: 'user_id',
          select: 'full_name email',
          populate: {
            path: 'department_id',
            select: 'department_name'
          }
        })
        .populate({
          path: 'item_id',
          populate: {
            path: 'category_id',
            select: 'category_name description'
          }
        })
        .populate('issued_by', 'full_name');
    }
    return issuance;
  }

  async createIssuance(issuanceData, tenantId = null, options = {}) {
    const issuance = new PPEIssuance({
      ...issuanceData,
      ...(tenantId ? { tenant_id: tenantId } : {})
    });
    // options may include session for transactions
    return await issuance.save(options);
  }

  // Count issuances pending employee confirmation (manager -> employee, status pending_confirmation)
  async countPendingEmployeeConfirmations(tenantId = null) {
    const filter = {
      issuance_level: 'manager_to_employee',
      status: 'pending_confirmation'
    };
    if (tenantId) filter.tenant_id = tenantId;
    return await PPEIssuance.countDocuments(filter);
  }

  // Lấy danh sách PPE của user theo filters
  async getIssuancesByUser(userId, filters = {}, tenantId = null) {
    const query = { user_id: userId, ...filters };
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    return await PPEIssuance.find(query)
      // Include additional fields required by frontend (report, return details, dates, serials, notes, timestamps)
      .select('item_id user_id issued_by manager_id status issued_date expected_return_date actual_return_date remaining_quantity manager_remaining_quantity quantity assigned_serial_numbers returned_serial_numbers report_description report_severity report_type reported_date confirmation_notes confirmed_date notes tenant_id createdAt updatedAt')
      .populate('item_id', 'item_name item_code brand model image_url')
      .populate('user_id', 'full_name email department')
      .populate('issued_by', 'full_name email')
      .populate('manager_id', 'full_name email')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }

  // Lấy danh sách PPE của nhiều users theo filters
  async getIssuancesByUsers(userIds, filters = {}, tenantId = null) {
    const query = { user_id: { $in: userIds }, ...filters };
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    return await PPEIssuance.find(query)
      .select('item_id user_id issued_by manager_id status issued_date expected_return_date actual_return_date remaining_quantity manager_remaining_quantity quantity assigned_serial_numbers returned_serial_numbers report_description report_severity report_type reported_date confirmation_notes confirmed_date notes tenant_id createdAt updatedAt')
      .populate('item_id', 'item_name item_code brand model image_url')
      .populate('user_id', 'full_name email department')
      .populate('issued_by', 'full_name email')
      .populate('manager_id', 'full_name email')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }

  // Lấy danh sách PPE mà Manager đã phát cho employees
  async getIssuancesByManager(managerId, filters = {}, tenantId = null) {
    const query = { manager_id: managerId, ...filters };
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    return await PPEIssuance.find(query)
      .select('item_id user_id issued_by manager_id status issued_date remaining_quantity quantity')
      .populate('item_id', 'item_name item_code brand model image_url')
      .populate('user_id', 'full_name email department_id')
      .populate('issued_by', 'full_name email')
      .populate('manager_id', 'full_name email')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }

  // Lấy số lượng PPE đã trả của Manager
  async getManagerReturnedQuantity(managerId, itemId) {
    const res = await PPEIssuance.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(managerId),
          item_id: new mongoose.Types.ObjectId(itemId),
          issuance_level: 'admin_to_manager',
          status: 'returned'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ], { maxTimeMS: 5000 });

    return (res[0] && res[0].total) ? res[0].total : 0;
  }

  // Lấy thống kê PPE của Manager cho một item cụ thể - Sử dụng aggregation
  async getManagerPPEStats(managerId, itemId) {
    const pipeline = [
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(managerId),
          item_id: new mongoose.Types.ObjectId(itemId),
          issuance_level: 'admin_to_manager'  // Chỉ lấy PPE Manager nhận từ Admin
        }
      },
      {
        $lookup: {
          from: 'ppeissuances',
          let: { 
            managerId: '$user_id',
            itemId: '$item_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$manager_id', '$$managerId'] },
                    { $eq: ['$item_id', '$$itemId'] },
                    { $eq: ['$issuance_level', 'manager_to_employee'] }
                  ]
                }
              }
            },
            {
              $project: {
                quantity: 1,
                status: 1
              }
            }
          ],
          as: 'employee_issuances'
        }
      },
      {
        $group: {
          _id: null,
          total_received: {
            $sum: '$quantity'  // ✅ TỔNG SỐ NHẬN = SUM tất cả quantity, không phụ thuộc status
          },
          // Total returned to Header Department (only count admin->manager issuances with status 'returned')
          total_returned: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'returned'] },
                '$quantity',
                0
              ]
            }
          },
          remaining_in_hand: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'returned'] },
                { $ifNull: ['$remaining_quantity', '$quantity'] },  // ✅ Dùng remaining_quantity
                0
              ]
            }
          },
          employee_issuances_all: { $push: '$employee_issuances' }
        }
      },
      {
        $project: {
          _id: 0,
          total_received: 1,
          total_returned: 1,
          remaining_in_hand: 1,  // ✅ Thêm field này
          // ✅ TỔNG số đã phát cho employees = SUM tất cả quantity (kể cả đã trả)
          total_issued_to_employees: {
            $sum: {
              $reduce: {
                input: {
                  $reduce: {
                    input: '$employee_issuances_all',
                    initialValue: [],
                    in: { $concatArrays: ['$$value', '$$this'] }
                  }
                },
                initialValue: 0,
                in: {
                  // ✅ Tính chỉ những issuance đã được xác nhận (status === 'issued')
                  $add: [
                    '$$value',
                    {
                      $cond: [
                        { $eq: ['$$this.status', 'issued'] },
                        { $ifNull: ['$$this.quantity', 0] },
                        0
                      ]
                    }
                  ]
                }
              }
            }
          },
          // ✅ Tổng số employees đã trả lại cho manager
          total_returned_by_employees: {
            $sum: {
              $reduce: {
                input: {
                  $reduce: {
                    input: '$employee_issuances_all',
                    initialValue: [],
                    in: { $concatArrays: ['$$value', '$$this'] }
                  }
                },
                initialValue: 0,
                in: {
                  // Tính số đã trả = quantity - remaining_quantity (nếu có)
                  $cond: [
                    { $eq: ['$$this.status', 'returned'] },
                    { $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }] },
                    {
                      $add: [
                        '$$value',
                        {
                          $subtract: [
                            { $ifNull: ['$$this.quantity', 0] },
                            { $ifNull: ['$$this.remaining_quantity', 0] }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }
    ];

    const result = await PPEIssuance.aggregate(pipeline);
    const stats = result.length > 0 ? result[0] : { 
      total_received: 0, 
      total_returned: 0, 
      remaining_in_hand: 0,
      total_issued_to_employees: 0,
      total_returned_by_employees: 0
    };
    
    // ✅ Đảm bảo các giá trị không null/undefined
    return {
      total_received: stats.total_received || 0,
      total_returned: stats.total_returned || 0,
      remaining_in_hand: stats.remaining_in_hand || 0,
      total_issued_to_employees: stats.total_issued_to_employees || 0,
      total_returned_by_employees: stats.total_returned_by_employees || 0
    };
  }

  // Lấy danh sách PPE đang chờ Manager xác nhận trả
  async getPendingManagerReturns(managerId) {
    return await PPEIssuance.find({
      manager_id: managerId,
      status: 'pending_manager_return'
    })
    .populate('item_id', 'item_name item_code brand model image_url')
    .populate('user_id', 'full_name email department')
    .populate('issued_by', 'full_name email')
    .sort({ actual_return_date: -1 });
  }

  async updateIssuance(id, issuanceData) {
    return await PPEIssuance.findByIdAndUpdate(id, issuanceData, { new: true });
  }

  async deleteIssuance(id) {
    const result = await PPEIssuance.findByIdAndDelete(id);
    return !!result;
  }

  // Statistics (optionally scoped by tenant)
  async getStockStatus(tenantId = null) {
    try {
      const itemFilter = {};
      if (tenantId) {
        itemFilter.tenant_id = tenantId;
      }
      // Fetch items with minimal fields and process in batches to avoid high parallel load
      const items = await PPEItem.find(itemFilter)
        .select('item_name item_code category_id quantity_available quantity_allocated reorder_level image_url')
        .populate('category_id', 'category_name description')
        .sort({ item_name: 1 })
        .lean();

      const batchSize = 10;
      const itemsWithTotals = [];
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (item) => {
          try {
            // Calculate total quantity (available + allocated)
            const total_quantity = (item.quantity_available || 0) + (item.quantity_allocated || 0);

            // Get actual allocated quantity from issuances (for verification) using aggregation
            const issuanceMatch = {
              item_id: item._id,
              status: 'issued'
            };
            if (tenantId) {
              issuanceMatch.tenant_id = tenantId;
            }
            const actualAllocated = await PPEIssuance.aggregate([
              { $match: issuanceMatch },
              { $group: { _id: null, total_allocated: { $sum: '$quantity' } } }
            ], { maxTimeMS: 5000 });

            const actual_allocated_quantity = actualAllocated.length > 0 ? actualAllocated[0].total_allocated : 0;
            const remaining_quantity = total_quantity - actual_allocated_quantity;

            return {
              item: {
                ...item,
                total_quantity,
                remaining_quantity,
                actual_allocated_quantity
              },
              total_available: item.quantity_available,
              total_allocated: item.quantity_allocated,
              total_quantity,
              remaining_quantity,
              actual_allocated_quantity
            };
          } catch (error) {
            console.error('Error processing item in getStockStatus:', item._id, error);
            return null;
          }
        }));

        itemsWithTotals.push(...batchResults.filter(x => x !== null));
      }

      return itemsWithTotals;
    } catch (error) {
      console.error('Error in getStockStatus:', error);
      throw error;
    }
  }

  async getOverdueIssuances(tenantId = null) {
    const today = new Date();
    const query = {
      status: 'issued',
      expected_return_date: { $lt: today }
    };
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    return await PPEIssuance.find(query)
      .select('user_id item_id issued_date expected_return_date status quantity remaining_quantity')
      .populate('user_id', 'full_name email')
      .populate('item_id', 'item_name item_code image_url')
      .sort({ expected_return_date: -1 })
      .limit(200)
      .lean();
  }

  async getLowStockItems(tenantId = null) {
    const query = {
      $expr: { $lte: ["$quantity_available", "$reorder_level"] }
    };
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    return await PPEItem.find(query)
      .select('item_name item_code category_id quantity_available reorder_level image_url')
      .populate('category_id', 'category_name description')
      .sort({ item_name: 1 })
      .limit(200)
      .lean();
  }

  async getIssuanceStats(tenantId = null) {
    const pipeline = [];
    if (tenantId) {
      pipeline.push({ $match: { tenant_id: tenantId } });
    }
    pipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    });
    const stats = await PPEIssuance.aggregate(pipeline, { maxTimeMS: 5000 });

    const result = {
      total_issuances: 0,
      issued: 0,
      returned: 0,
      overdue: 0
    };

    stats.forEach(stat => {
      result.total_issuances += stat.count;
      result[stat._id] = stat.count;
    });

    return result;
  }

  // Get comprehensive quantity statistics (optionally scoped by tenant)
  async getQuantityStatistics(tenantId = null) {
    const itemFilter = {};
    if (tenantId) {
      itemFilter.tenant_id = tenantId;
    }
    // Fetch items minimal fields and process in batches to avoid large parallel aggregation load
    const items = await PPEItem.find(itemFilter)
      .select('item_name item_code category_id quantity_available quantity_allocated reorder_level image_url')
      .populate('category_id', 'category_name description')
      .lean();

    const batchSize = 10;
    const statistics = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchStats = await Promise.all(batch.map(async (item) => {
        const total_quantity = (item.quantity_available || 0) + (item.quantity_allocated || 0);
        const issuanceMatch = { item_id: item._id, status: 'issued' };
        if (tenantId) issuanceMatch.tenant_id = tenantId;

        const actualAllocated = await PPEIssuance.aggregate([
          { $match: issuanceMatch },
          { $group: { _id: null, total_allocated: { $sum: '$quantity' } } }
        ], { maxTimeMS: 5000 });

        const actual_allocated_quantity = actualAllocated.length > 0 ? actualAllocated[0].total_allocated : 0;
        const remaining_quantity = total_quantity - actual_allocated_quantity;

        return {
          item_id: item._id,
          item_name: item.item_name,
          item_code: item.item_code,
          category_name: item.category_id?.category_name || 'Không xác định',
          total_quantity,
          remaining_quantity,
          actual_allocated_quantity,
          quantity_available: item.quantity_available,
          quantity_allocated: item.quantity_allocated,
          reorder_level: item.reorder_level,
          stock_status: remaining_quantity <= item.reorder_level ? 'low' : 'good'
        };
      }));
      statistics.push(...batchStats);
    }

    // Calculate overall statistics
    const overallStats = {
      total_items: statistics.length,
      total_quantity: statistics.reduce((sum, item) => sum + item.total_quantity, 0),
      total_remaining: statistics.reduce((sum, item) => sum + item.remaining_quantity, 0),
      total_allocated: statistics.reduce((sum, item) => sum + item.actual_allocated_quantity, 0),
      low_stock_items: statistics.filter(item => item.stock_status === 'low').length,
      out_of_stock_items: statistics.filter(item => item.remaining_quantity === 0).length
    };

    return {
      items: statistics,
      overall: overallStats
    };
  }

  // PPE Assignments
  async getAllAssignments(filters = {}) {
    const query = {};
    
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    if (filters.item_id) {
      query.item_id = filters.item_id;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { 'user_id.full_name': { $regex: filters.search, $options: 'i' } },
        { 'item_id.item_name': { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await PPEIssuance.find(query)
      .select('user_id item_id issued_by status issued_date expected_return_date actual_return_date remaining_quantity manager_remaining_quantity quantity assigned_serial_numbers returned_serial_numbers report_description report_severity report_type reported_date confirmation_notes confirmed_date notes tenant_id createdAt updatedAt')
      .populate('user_id', 'full_name email employee_id department_id')
      .populate({
        path: 'user_id',
        populate: {
          path: 'department_id',
          select: 'department_name'
        }
      })
      .populate('item_id', 'item_name item_code brand model image_url category_id')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }

  async getAssignmentById(id) {
    return await PPEIssuance.findById(id)
      .select('user_id item_id issued_by status issued_date quantity remaining_quantity tenant_id')
      .populate('user_id', 'full_name email employee_id phone department_id')
      .populate({
        path: 'user_id',
        populate: {
          path: 'department_id',
          select: 'department_name'
        }
      })
      .populate('item_id', 'item_name item_code brand model image_url category_id')
      .lean();
  }

  async createAssignment(assignmentData) {
    const assignment = new PPEIssuance(assignmentData);
    return await assignment.save();
  }

  async updateAssignment(id, assignmentData) {
    return await PPEIssuance.findByIdAndUpdate(id, assignmentData, { new: true })
      .populate('user_id', 'full_name email employee_id')
      .populate('item_id', 'item_name category_id');
  }

  async deleteAssignment(id) {
    const result = await PPEIssuance.findByIdAndDelete(id);
    return !!result;
  }

  async getUserAssignments(userId) {
    return await PPEIssuance.find({ user_id: userId })
      .select('user_id item_id status issued_date quantity remaining_quantity tenant_id')
      .populate('user_id', 'full_name email employee_id')
      .populate('item_id', 'item_name category_id')
      .sort({ issued_date: -1 })
      .limit(200)
      .lean();
  }
}

module.exports = new PPERepository();