const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const warehouseModuleController = require('../controllers/warehouseModuleController');
const enforceTenantFilter = require('../middlewares/enforceTenantFilter');

router.use(authMiddleware.authenticate);
router.use(enforceTenantFilter({
  includeDepartment: true,
  requireDepartment: false,
  allowSystemBypass: true
}));

// Stock
router.get('/stock', warehouseModuleController.listStock);
router.put('/stock', warehouseModuleController.upsertStock);

// Stock movements
router.get('/stock-movements', warehouseModuleController.listStockMovements);
router.post('/stock-movements', warehouseModuleController.recordStockMovement);

// PPE requests & approvals
router.get('/requests', warehouseModuleController.listRequests);
router.post('/requests', warehouseModuleController.createRequest);
router.post('/requests/:id/decision', warehouseModuleController.approveRequest);

module.exports = router;


