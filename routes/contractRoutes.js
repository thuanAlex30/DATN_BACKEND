const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/contractController');
const { param, query } = require('express-validator');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

const contractIdValidation = [
  param('contractId')
    .notEmpty()
    .withMessage('ContractId là bắt buộc')
];

const orderIdValidation = [
  param('orderId')
    .notEmpty()
    .withMessage('OrderId là bắt buộc')
];

const tenantIdValidation = [
  param('tenantId')
    .isMongoId()
    .withMessage('TenantId không hợp lệ')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100'),
  query('status')
    .optional()
    .isIn(['active', 'expired', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ')
];

router.get('/:contractId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    modules: 'contract', 
    action: 'read', 
    tenantScope: 'tenant',
    minRoleLevel: 10
  }),
  contractIdValidation,
  ContractController.getContractById
);

router.get('/order/:orderId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    modules: 'contract', 
    action: 'read', 
    tenantScope: 'tenant',
    minRoleLevel: 10
  }),
  orderIdValidation,
  ContractController.getContractByOrderId
);

router.get('/tenant/:tenantId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    modules: 'contract', 
    action: 'list', 
    tenantScope: 'tenant',
    minRoleLevel: 10
  }),
  tenantIdValidation,
  queryValidation,
  ContractController.getContractsByTenant
);

router.get('/tenant/:tenantId/latest',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    modules: 'contract', 
    action: 'read', 
    tenantScope: 'tenant',
    minRoleLevel: 10
  }),
  tenantIdValidation,
  ContractController.getLatestContract
);

router.get('/:contractId/pdf',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    modules: 'contract', 
    action: 'read', 
    tenantScope: 'tenant',
    minRoleLevel: 10
  }),
  contractIdValidation,
  ContractController.downloadContractPdf
);

router.get('/debug/pdf-fields',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  ContractController.listPdfFormFields
);

router.get('/debug/test-overlay',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({ 
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  ContractController.testTextOverlay
);

module.exports = router;

