const express = require('express');
const CompanyAdminController = require('../controllers/CompanyAdminController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Company Admin only routes (minRoleLevel: 90)
router.post('/assign-role',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  CompanyAdminController.assignRole
);

router.post('/bulk-assign-role',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  CompanyAdminController.bulkAssignRole
);

router.get('/quotas',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  CompanyAdminController.getQuotas
);

router.put('/quotas',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  CompanyAdminController.updateQuota
);

router.get('/users-by-role/:role_id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 90,
    tenantScope: 'tenant'
  }),
  CompanyAdminController.getUsersByRole
);

module.exports = router;

