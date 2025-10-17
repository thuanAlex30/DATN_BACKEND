const { body, param, query } = require('express-validator');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

// PPE Category validations
const validateCreateCategory = [
  body('category_name')
    .notEmpty()
    .withMessage('Tên danh mục là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên danh mục phải có từ 2-100 ký tự'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  
  body('lifespan_months')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Thời hạn sử dụng phải từ 1-120 tháng')
];

const validateUpdateCategory = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID danh mục không hợp lệ'),
  
  body('category_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên danh mục phải có từ 2-100 ký tự'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  
  body('lifespan_months')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Thời hạn sử dụng phải từ 1-120 tháng')
];

// PPE Item validations
const validateCreateItem = [
  body('item_code')
    .notEmpty()
    .withMessage('Mã thiết bị là bắt buộc')
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã thiết bị phải có từ 3-50 ký tự')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Mã thiết bị chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới'),
  
  body('item_name')
    .notEmpty()
    .withMessage('Tên thiết bị là bắt buộc')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên thiết bị phải có từ 2-200 ký tự'),
  
  body('category_id')
    .custom(isValidObjectId)
    .withMessage('Danh mục là bắt buộc'),
  
  body('brand')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Thương hiệu không được quá 100 ký tự'),
  
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Model không được quá 100 ký tự'),
  
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mức tồn kho tối thiểu phải là số nguyên dương')
];

const validateUpdateItem = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID thiết bị không hợp lệ'),
  
  body('item_code')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã thiết bị phải có từ 3-50 ký tự')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Mã thiết bị chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới'),
  
  body('item_name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên thiết bị phải có từ 2-200 ký tự'),
  
  body('category_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Danh mục không hợp lệ'),
  
  body('brand')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Thương hiệu không được quá 100 ký tự'),
  
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Model không được quá 100 ký tự'),
  
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mức tồn kho tối thiểu phải là số nguyên dương')
];

// PPE Inventory validations
const validateCreateInventory = [
  body('item_id')
    .custom(isValidObjectId)
    .withMessage('Thiết bị là bắt buộc'),
  
  body('site_id')
    .custom(isValidObjectId)
    .withMessage('Địa điểm là bắt buộc'),
  
  body('quantity_available')
    .isInt({ min: 0 })
    .withMessage('Số lượng có sẵn phải là số nguyên không âm'),
  
  body('quantity_allocated')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng đã phát phải là số nguyên không âm')
];

const validateUpdateInventory = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID tồn kho không hợp lệ'),
  
  body('quantity_available')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng có sẵn phải là số nguyên không âm'),
  
  body('quantity_allocated')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng đã phát phải là số nguyên không âm')
];

// PPE Issuance validations
const validateCreateIssuance = [
  body('user_id')
    .custom(isValidObjectId)
    .withMessage('Nhân viên là bắt buộc'),
  
  body('item_id')
    .custom(isValidObjectId)
    .withMessage('Thiết bị là bắt buộc'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương'),
  
  body('issued_date')
    .isISO8601()
    .withMessage('Ngày phát không hợp lệ'),
  
  body('expected_return_date')
    .isISO8601()
    .withMessage('Ngày trả dự kiến không hợp lệ')
    .custom((value, { req }) => {
      const issuedDate = new Date(req.body.issued_date);
      const returnDate = new Date(value);
      if (returnDate <= issuedDate) {
        throw new Error('Ngày trả dự kiến phải sau ngày phát');
      }
      return true;
    }),
  
  body('issued_by')
    .custom(isValidObjectId)
    .withMessage('Người phát không hợp lệ'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được quá 500 ký tự')
];

const validateUpdateIssuance = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID phát PPE không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['issued', 'returned', 'overdue'])
    .withMessage('Trạng thái không hợp lệ'),
  
  body('actual_return_date')
    .optional()
    .isISO8601()
    .withMessage('Ngày trả thực tế không hợp lệ')
];

const validateReturnIssuance = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID phát PPE không hợp lệ'),
  
  body('actual_return_date')
    .optional()
    .isISO8601()
    .withMessage('Ngày trả thực tế không hợp lệ')
];

// Query validations
const validateGetItems = [
  query('category_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID danh mục không hợp lệ'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
];

const validateGetInventory = [
  query('site_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID địa điểm không hợp lệ'),
  
  query('item_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID thiết bị không hợp lệ')
];

const validateGetIssuances = [
  query('user_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID nhân viên không hợp lệ'),
  
  query('status')
    .optional()
    .isIn(['issued', 'returned', 'overdue'])
    .withMessage('Trạng thái không hợp lệ'),
  
  query('item_id')
    .optional()
    .custom(isValidObjectId)
    .withMessage('ID thiết bị không hợp lệ')
];

// ID parameter validations
const validateIdParam = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('ID không hợp lệ')
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateItem,
  validateUpdateItem,
  validateCreateInventory,
  validateUpdateInventory,
  validateCreateIssuance,
  validateUpdateIssuance,
  validateReturnIssuance,
  validateGetItems,
  validateGetInventory,
  validateGetIssuances,
  validateIdParam
};
