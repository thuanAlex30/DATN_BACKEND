const express = require('express');
const router = express.Router();
const multer = require('multer');
const ppeController = require('../controllers/PPEController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const validationMiddleware = require('../middlewares/ValidationMiddleware');
const addIssuedByMiddleware = require('../middlewares/AddIssuedByMiddleware');
const Joi = require('joi');

// Configure multer for file upload
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

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

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
      .max(500)
      .optional()
      .messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
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
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.createCategory
);
router.post('/categories/import',
  upload.single('file'),
  authMiddleware.authorizeRole(['admin', 'manager']),
  (req, res, next) => {
    // Set timeout for this specific route
    req.setTimeout(300000); // 5 minutes
    next();
  },
  ppeController.importCategories
);
router.put('/categories/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.updateCategory
);
router.delete('/categories/:id', 
  authMiddleware.authorizeRole(['admin']),
  ppeController.deleteCategory
);

// PPE Items Routes
router.get('/items', ppeController.getAllItems);
router.post('/items/import', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  upload.single('file'),
  ppeController.importItems
);
router.get('/items/:id', ppeController.getItemById);
router.post('/items', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.createItem
);
router.put('/items/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.updateItem
);
router.delete('/items/:id', 
  authMiddleware.authorizeRole(['admin']),
  ppeController.deleteItem
);

// PPE Items Quantity Management Routes
router.put('/items/:id/quantity', 
  authMiddleware.authorizeRole(['admin', 'manager', 'warehouse_staff']),
  ppeController.updateItemQuantity
);

// PPE Issuances Routes - Luồng phân cấp Admin → Manager → Employee
// Admin phát PPE cho Manager
router.post('/issuances/to-manager', 
  authMiddleware.authorizeRole(['admin']),
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.issueToManager
);

// Manager phát PPE cho Employee
router.post('/issuances/to-employee', 
  authMiddleware.authorizeRole(['manager']),
  addIssuedByMiddleware,
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.issueToEmployee
);

// Employee trả PPE cho Manager
router.post('/issuances/:id/return-to-manager', 
  authMiddleware.authorizeRole(['employee']),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnToManager
);

// Manager xác nhận nhận PPE từ Employee
router.post('/issuances/:id/confirm-employee-return', 
  authMiddleware.authorizeRole(['manager']),
  ppeController.confirmEmployeeReturn
);

// Manager trả PPE cho Admin
router.post('/issuances/:id/return-to-admin', 
  authMiddleware.authorizeRole(['manager']),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnToAdmin
);

// Lấy danh sách PPE của Manager
router.get('/issuances/manager-ppe', 
  authMiddleware.authorizeRole(['manager']),
  ppeController.getManagerPPE
);

// Lấy danh sách PPE của Employee (chỉ dành cho employee)
router.get('/issuances/employee-ppe', 
  authMiddleware.authorizeRole(['employee']),
  ppeController.getEmployeePPE
);

// Lấy danh sách PPE của Employees trong department (dành cho manager)
router.get('/issuances/department-employees-ppe', 
  authMiddleware.authorizeRole(['manager']),
  ppeController.getDepartmentEmployeesPPE
);

// Lấy lịch sử PPE của Manager
router.get('/issuances/manager-history', 
  authMiddleware.authorizeRole(['manager']),
  ppeController.getManagerPPEHistory
);

// Legacy PPE Issuances Routes - giữ lại để tương thích
router.get('/issuances', ppeController.getAllIssuances);
router.get('/issuances/my', ppeController.getMyIssuances);
router.get('/issuances/:id', ppeController.getIssuanceById);
router.get('/issuances/user/:userId', ppeController.getIssuancesByUser);
router.get('/issuances/active', ppeController.getActiveIssuances);
router.get('/issuances/expiring', ppeController.getExpiringIssuances);
router.post('/issuances', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  addIssuedByMiddleware,
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.createIssuance
);
router.put('/issuances/:id', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.updateIssuance
);
router.post('/issuances/:id/return', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnIssuance
);

// Employee PPE return route - employees can return their own PPE
router.post('/issuances/:id/return-employee', 
  authMiddleware.authenticate,
  authMiddleware.authorizeRole(['employee']),
  validationMiddleware.validateBody(issuanceValidation.return),
  ppeController.returnIssuanceEmployee
);

// Employee PPE report route - employees can report issues with their own PPE
router.post('/issuances/:id/report-employee', 
  authMiddleware.authenticate,
  authMiddleware.authorizeRole(['employee']),
  validationMiddleware.validateBody(issuanceValidation.report),
  ppeController.reportIssuanceEmployee
);
router.delete('/issuances/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
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
router.get('/inventory/:id', ppeController.getInventoryById);
router.post('/inventory', 
  authMiddleware.authorizeRole(['admin', 'manager', 'warehouse_staff']),
  ppeController.createInventory
);
router.put('/inventory/:id', 
  authMiddleware.authorizeRole(['admin', 'manager', 'warehouse_staff']),
  ppeController.updateInventory
);
router.delete('/inventory/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.deleteInventory
);
router.get('/inventory/stats', ppeController.getInventoryStats);

// PPE Assignments Routes
router.get('/assignments', ppeController.getAllAssignments);
router.get('/assignments/:id', ppeController.getAssignmentById);
router.post('/assignments', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.createAssignment
);
router.put('/assignments/:id', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.updateAssignment
);
router.delete('/assignments/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
  ppeController.deleteAssignment
);
router.get('/assignments/user/:userId', ppeController.getUserAssignments);
router.post('/assignments/:id/return', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.returnAssignment
);

// PPE Maintenance Routes
router.get('/maintenance', ppeController.getAllMaintenance);
router.get('/maintenance/:id', ppeController.getMaintenanceById);
router.post('/maintenance', 
  authMiddleware.authorizeRole(['admin', 'manager', 'maintenance_staff']),
  ppeController.createMaintenance
);
router.put('/maintenance/:id', 
  authMiddleware.authorizeRole(['admin', 'manager', 'maintenance_staff']),
  ppeController.updateMaintenance
);
router.delete('/maintenance/:id', 
  authMiddleware.authorizeRole(['admin', 'manager']),
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
