const express = require('express');
const router = express.Router();
const multer = require('multer');
const ppeController = require('../controllers/PPEController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const validationMiddleware = require('../middlewares/ValidationMiddleware');
const addIssuedByMiddleware = require('../middlewares/AddIssuedByMiddleware');
const Joi = require('joi');

// Configure multer for Excel import
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

// Configure multer for image upload (PPE categories/items) -> use memory so we can push to Cloudinary
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ upload file ảnh'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Concurrency limiter middleware (to avoid DB overload / bursts)
const concurrencyLimiter = require('../middlewares/concurrencyLimiter');
const writeLimiter = concurrencyLimiter(Number(process.env.PPE_CONCURRENCY_LIMIT) || 5);
const uploadLimiter = concurrencyLimiter(Number(process.env.PPE_UPLOAD_CONCURRENCY_LIMIT) || 2);

// Common ObjectId validator
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'ID không hợp lệ'
  });

// PPE Category validation schema
const categoryValidation = {
  create: Joi.object({
    category_name: Joi.string().min(2).max(100).required()
      .messages({
        'string.base': 'Tên danh mục phải là chuỗi',
        'string.min': 'Tên danh mục phải có ít nhất 2 ký tự',
        'string.max': 'Tên danh mục không được quá 100 ký tự',
        'any.required': 'Tên danh mục là bắt buộc'
      }),
    description: Joi.string().allow('', null).max(500)
      .optional()
      .messages({
        'string.max': 'Mô tả không được quá 500 ký tự'
      }),
    lifespan_months: Joi.number().integer().min(1).max(120)
      .optional()
      .messages({
        'number.base': 'Thời hạn sử dụng phải là số',
        'number.integer': 'Thời hạn sử dụng phải là số nguyên',
        'number.min': 'Thời hạn sử dụng tối thiểu là 1 tháng',
        'number.max': 'Thời hạn sử dụng tối đa là 120 tháng'
      }),
    image_url: Joi.string().optional()
  }),
  update: Joi.object({
    category_name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('', null).max(500).optional(),
    lifespan_months: Joi.number().integer().min(1).max(120).optional(),
    image_url: Joi.string().optional()
  })
};

// PPE Item validation schema
const itemValidation = {
  create: Joi.object({
    item_code: Joi.string().pattern(/^[A-Z0-9-_]+$/).min(3).max(50).required()
      .messages({
        'string.pattern.base': 'Mã thiết bị chỉ gồm chữ hoa, số, gạch ngang, gạch dưới',
        'string.min': 'Mã thiết bị phải có ít nhất 3 ký tự',
        'string.max': 'Mã thiết bị không được quá 50 ký tự',
        'any.required': 'Mã thiết bị là bắt buộc'
      }),
    item_name: Joi.string().min(2).max(200).required()
      .messages({
        'string.min': 'Tên thiết bị phải có ít nhất 2 ký tự',
        'string.max': 'Tên thiết bị không được quá 200 ký tự',
        'any.required': 'Tên thiết bị là bắt buộc'
      }),
    category_id: objectId.required().messages({
      'any.required': 'Danh mục là bắt buộc'
    }),
    brand: Joi.string().allow('', null).max(100).optional(),
    model: Joi.string().allow('', null).max(100).optional(),
    reorder_level: Joi.number().integer().min(0).optional(),
    quantity_available: Joi.number().integer().min(0).optional(),
    quantity_allocated: Joi.number().integer().min(0).optional(),
    image_url: Joi.string().optional()
  }),
  update: Joi.object({
    item_code: Joi.string().pattern(/^[A-Z0-9-_]+$/).min(3).max(50).optional(),
    item_name: Joi.string().min(2).max(200).optional(),
    category_id: objectId.optional(),
    brand: Joi.string().allow('', null).max(100).optional(),
    model: Joi.string().allow('', null).max(100).optional(),
    reorder_level: Joi.number().integer().min(0).optional(),
    quantity_available: Joi.number().integer().min(0).optional(),
    quantity_allocated: Joi.number().integer().min(0).optional(),
    image_url: Joi.string().optional()
  }),
  quantity: Joi.object({
    quantity_available: Joi.number().integer().min(0).required()
      .messages({
        'any.required': 'Số lượng có sẵn là bắt buộc',
        'number.min': 'Số lượng có sẵn phải >= 0'
      }),
    quantity_allocated: Joi.number().integer().min(0).optional()
  })
};

// PPE Inventory validation schema
const inventoryValidation = {
  create: Joi.object({
    item_id: objectId.required().messages({ 'any.required': 'Thiết bị là bắt buộc' }),
    site_id: objectId.required().messages({ 'any.required': 'Địa điểm là bắt buộc' }),
    quantity_available: Joi.number().integer().min(0).required()
      .messages({
        'number.min': 'Số lượng có sẵn phải >= 0',
        'any.required': 'Số lượng có sẵn là bắt buộc'
      }),
    quantity_allocated: Joi.number().integer().min(0).optional()
  }),
  update: Joi.object({
    item_id: objectId.optional(),
    site_id: objectId.optional(),
    quantity_available: Joi.number().integer().min(0).optional(),
    quantity_allocated: Joi.number().integer().min(0).optional()
  })
};

// PPE Issuance validation schema
const issuanceValidation = {
  create: Joi.object({
    user_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID nhân viên không hợp lệ',
        'any.required': 'Nhân viên là bắt buộc'
      }),
    item_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID thiết bị không hợp lệ',
        'any.required': 'Thiết bị là bắt buộc'
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'Số lượng phải là số',
        'number.integer': 'Số lượng phải là số nguyên',
        'number.min': 'Số lượng phải lớn hơn 0',
        'any.required': 'Số lượng là bắt buộc'
      }),
    issued_date: Joi.date()
      .iso()
      .required()
      .messages({
        'date.base': 'Ngày phát không hợp lệ',
        'date.format': 'Ngày phát phải là định dạng ISO8601',
        'any.required': 'Ngày phát là bắt buộc'
      }),
    expected_return_date: Joi.date()
      .iso()
      .greater(Joi.ref('issued_date'))
      .required()
      .messages({
        'date.base': 'Ngày trả dự kiến không hợp lệ',
        'date.format': 'Ngày trả dự kiến phải là định dạng ISO8601',
        'date.greater': 'Ngày trả dự kiến phải sau ngày phát',
        'any.required': 'Ngày trả dự kiến là bắt buộc'
      }),
    issued_by: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'ID người phát không hợp lệ'
      }),
    notes: Joi.string()
      .allow('', null) // allow empty string/null from UI
      .max(500)
      .optional()
      .messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
      }),
    issuance_level: Joi.string()
      .valid('admin_to_manager', 'manager_to_employee')
      .optional()
      .messages({
        'any.only': 'Cấp độ phát PPE phải là admin_to_manager hoặc manager_to_employee'
      }),
    manager_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'ID Manager không hợp lệ'
      }),
    assigned_serial_numbers: Joi.array()
      .items(Joi.string().max(100))
      .optional()
      .messages({
        'array.base': 'Serial numbers phải là mảng',
        'string.max': 'Mỗi serial number không được quá 100 ký tự'
      })
  }),
  return: Joi.object({
    actual_return_date: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày trả thực tế không hợp lệ',
        'date.format': 'Ngày trả thực tế phải là định dạng ISO8601'
      }),
    return_condition: Joi.string()
      .valid('good', 'damaged', 'worn')
      .optional()
      .messages({
        'any.only': 'Tình trạng trả phải là good, damaged hoặc worn'
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Số lượng phải là số',
        'number.integer': 'Số lượng phải là số nguyên',
        'number.min': 'Số lượng phải lớn hơn 0'
      }),
    notes: Joi.string()
      .allow('', null)
      .max(500)
      .optional()
      .messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
      }),
    returned_serial_numbers: Joi.array()
      .items(Joi.string().max(100))
      .optional()
      .messages({
        'array.base': 'Returned serial numbers phải là mảng',
        'string.max': 'Mỗi serial number không được quá 100 ký tự'
      })
  }),
  report: Joi.object({
    report_type: Joi.string()
      .valid('damage', 'replacement', 'lost')
      .required()
      .messages({
        'any.only': 'Loại báo cáo phải là damage, replacement hoặc lost',
        'any.required': 'Loại báo cáo là bắt buộc'
      }),
    description: Joi.string()
      .max(1000)
      .required()
      .messages({
        'string.max': 'Mô tả không được quá 1000 ký tự',
        'any.required': 'Mô tả là bắt buộc'
      }),
    severity: Joi.string()
      .valid('low', 'medium', 'high')
      .optional()
      .messages({
        'any.only': 'Mức độ nghiêm trọng phải là low, medium hoặc high'
      }),
    reported_date: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày báo cáo không hợp lệ',
        'date.format': 'Ngày báo cáo phải là định dạng ISO8601'
      })
  })
};

// PPE Categories Routes
router.get('/categories', ppeController.getAllCategories);
router.get('/categories/:id', ppeController.getCategoryById);
router.post('/categories', 
  uploadLimiter,
  imageUpload.single('image'),
  writeLimiter,
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateBody(categoryValidation.create),
  ppeController.createCategory
);
router.post('/categories/import',
  upload.single('file'),
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  (req, res, next) => {
    // Set timeout for this specific route
    req.setTimeout(300000); // 5 minutes
    next();
  },
  ppeController.importCategories
);
router.put('/categories/:id', 
  uploadLimiter,
  imageUpload.single('image'),
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  validationMiddleware.validateBody(categoryValidation.update),
  ppeController.updateCategory
);
router.delete('/categories/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 80, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.deleteCategory
);

// PPE Items Routes
router.get('/items', ppeController.getAllItems);
router.post('/items/import', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  upload.single('file'),
  ppeController.importItems
);
router.get('/items/:id', ppeController.getItemById);
// Generate serial numbers for an item (body: { count?: number })
router.post('/items/:id/generate-serials', ppeController.generateSerialsForItem);
router.post('/items', 
  uploadLimiter,
  imageUpload.single('image'),
  writeLimiter,
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateBody(itemValidation.create),
  ppeController.createItem
);
router.put('/items/:id', 
  uploadLimiter,
  imageUpload.single('image'),
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  validationMiddleware.validateBody(itemValidation.update),
  ppeController.updateItem
);
router.delete('/items/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 80, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.deleteItem
);

// PPE Items Quantity Management Routes
router.put('/items/:id/quantity', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  validationMiddleware.validateBody(itemValidation.quantity),
  ppeController.updateItemQuantity
);

// PPE Issuances Routes - Luồng phân cấp Admin → Manager → Employee
// Admin phát PPE cho Manager
router.post('/issuances/to-manager', 
  writeLimiter,
  authMiddleware.authorizeScope({ minRoleLevel: 80, tenantScope: 'tenant' }),
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.issueToManager
);

// Manager phát PPE cho Employee
router.post('/issuances/to-employee', 
  writeLimiter,
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  addIssuedByMiddleware,
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.issueToEmployee
);

// Employee xác nhận nhận PPE từ Manager hoặc Manager xác nhận nhận PPE từ Header Department
router.post('/issuances/:id/confirm-received', 
  authMiddleware.authorizeScope({ minRoleLevel: 10, maxRoleLevel: 100, tenantScope: 'tenant', departmentScope: 'own' }),
  ppeController.confirmReceivedPPE
);

// Employee trả PPE cho Manager
router.post('/issuances/:id/return-to-manager', 
  authMiddleware.authorizeScope({ minRoleLevel: 10, maxRoleLevel: 20, tenantScope: 'tenant', departmentScope: 'own' }),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnToManager
);

// Manager xác nhận nhận PPE từ Employee
router.post('/issuances/:id/confirm-employee-return', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  ppeController.confirmEmployeeReturn
);

// Manager trả PPE cho Admin
router.post('/issuances/:id/return-to-admin', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnToAdmin
);

// Lấy danh sách PPE của Manager
router.get('/issuances/manager-ppe', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  ppeController.getManagerPPE
);

// Lấy danh sách PPE của Employee (chỉ dành cho employee)
router.get('/issuances/employee-ppe', 
  authMiddleware.authorizeScope({ minRoleLevel: 10, maxRoleLevel: 20, tenantScope: 'tenant', departmentScope: 'own' }),
  ppeController.getEmployeePPE
);

// Lấy danh sách PPE của Employees trong department (dành cho manager)
router.get('/issuances/department-employees-ppe', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  ppeController.getDepartmentEmployeesPPE
);

  // Lấy lịch sử PPE của Manager
  router.get('/issuances/manager-history',
    authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
    ppeController.getManagerPPEHistory
  );

  // API endpoints cho serial number management
  // Lấy serial numbers khả dụng cho manager
  router.get('/serial-numbers/manager/:itemId',
    authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
    validationMiddleware.validateParams(Joi.object({ itemId: objectId.required() })),
    ppeController.getAvailableSerialNumbersForManager
  );

  // Lấy serial numbers khả dụng cho admin
  router.get('/serial-numbers/admin/:itemId',
    authMiddleware.authorizeScope({ minRoleLevel: 80, tenantScope: 'tenant' }),
    validationMiddleware.validateParams(Joi.object({ itemId: objectId.required() })),
    ppeController.getAvailableSerialNumbersForAdmin
  );

// Legacy PPE Issuances Routes - giữ lại để tương thích
router.get('/issuances', ppeController.getAllIssuances);
router.get('/issuances/my', ppeController.getMyIssuances);
router.get('/issuances/:id', ppeController.getIssuanceById);
router.get('/issuances/user/:userId', ppeController.getIssuancesByUser);
router.get('/issuances/active', ppeController.getActiveIssuances);
router.get('/issuances/expiring', ppeController.getExpiringIssuances);
router.post('/issuances', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  addIssuedByMiddleware,
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.createIssuance
);
router.put('/issuances/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  ppeController.updateIssuance
);
router.post('/issuances/:id/return', 
  writeLimiter,
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnIssuance
);

// Employee PPE return route - employees can return their own PPE
router.post('/issuances/:id/return-employee', 
  authMiddleware.authenticate,
  authMiddleware.authorizeScope({ minRoleLevel: 10, maxRoleLevel: 20, tenantScope: 'tenant', departmentScope: 'own' }),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnIssuanceEmployee
);

// Employee PPE report route - employees can report issues with their own PPE
router.post('/issuances/:id/report-employee', 
  authMiddleware.authenticate,
  authMiddleware.authorizeScope({ minRoleLevel: 10, maxRoleLevel: 20, tenantScope: 'tenant', departmentScope: 'own' }),
  validationMiddleware.validateBody(issuanceValidation.report),
  ppeController.reportIssuanceEmployee
);
router.delete('/issuances/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  ppeController.deleteIssuance
);

// Statistics and Reports Routes
router.get('/statistics/stock-status', ppeController.getStockStatus);
router.get('/statistics/overdue-issuances', ppeController.getOverdueIssuances);
router.get('/statistics/low-stock-items', ppeController.getLowStockItems);
router.get('/statistics/issuance-stats', ppeController.getIssuanceStatistics);
router.get('/statistics/quantity-stats', ppeController.getQuantityStatistics);

// Dashboard Routes
router.get('/dashboard', ppeController.getDashboardData);

// User management for PPE assignment
router.get('/users', ppeController.getAllUsers);

// PPE Items Statistics Routes
router.get('/items/:id/stats', ppeController.getItemStats);

// PPE Inventory Routes
router.get('/inventory', ppeController.getAllInventory);
router.get('/inventory/:id', 
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.getInventoryById
);
router.post('/inventory', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateBody(inventoryValidation.create),
  ppeController.createInventory
);
router.put('/inventory/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  validationMiddleware.validateBody(inventoryValidation.update),
  ppeController.updateInventory
);
router.delete('/inventory/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant', departmentScope: 'hierarchy' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.deleteInventory
);
router.get('/inventory/stats', ppeController.getInventoryStats);

// PPE Assignments Routes
router.get('/assignments', ppeController.getAllAssignments);
router.get('/assignments/:id', 
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.getAssignmentById
);
router.post('/assignments', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  ppeController.createAssignment
);
router.put('/assignments/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.updateAssignment
);
router.delete('/assignments/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.deleteAssignment
);
router.get('/assignments/user/:userId', ppeController.getUserAssignments);
router.post('/assignments/:id/return', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.returnAssignment
);

// PPE Maintenance Routes
router.get('/maintenance', ppeController.getAllMaintenance);
router.get('/maintenance/:id', 
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.getMaintenanceById
);
router.post('/maintenance', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  ppeController.createMaintenance
);
router.put('/maintenance/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.updateMaintenance
);
router.delete('/maintenance/:id', 
  authMiddleware.authorizeScope({ minRoleLevel: 70, tenantScope: 'tenant' }),
  validationMiddleware.validateParams(Joi.object({ id: objectId.required() })),
  ppeController.deleteMaintenance
);
router.get('/maintenance/stats', ppeController.getMaintenanceStats);

// PPE Reports Routes
router.get('/reports/inventory', ppeController.getInventoryReport);
router.get('/reports/assignments', ppeController.getAssignmentReport);
router.get('/reports/maintenance', ppeController.getMaintenanceReport);

// Dashboard Statistics Routes
router.get('/dashboard-stats', ppeController.getDashboardStats);

module.exports = router;
