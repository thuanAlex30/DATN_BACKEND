const express = require('express');
const router = express.Router();
const multer = require('multer');
const ppeController = require('../controllers/PPEController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const validationMiddleware = require('../middlewares/ValidationMiddleware');
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
      .required()
      .messages({
        'string.pattern.base': 'ID người phát không hợp lệ',
        'any.required': 'Người phát là bắt buộc'
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

// PPE Issuances Routes
router.get('/issuances', ppeController.getAllIssuances);
router.get('/issuances/:id', ppeController.getIssuanceById);
router.get('/issuances/user/:userId', ppeController.getIssuancesByUser);
router.get('/issuances/active', ppeController.getActiveIssuances);
router.get('/issuances/expiring', ppeController.getExpiringIssuances);
router.post('/issuances', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  validationMiddleware.validateBody(issuanceValidation.create),
  ppeController.createIssuance
);
router.put('/issuances/:id', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.updateIssuance
);
router.post('/issuances/:id/return', 
  authMiddleware.authorizeRole(['admin', 'manager', 'safety_officer']),
  ppeController.returnIssuance
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

module.exports = router;
