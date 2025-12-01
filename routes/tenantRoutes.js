const express = require('express');
const TenantController = require('../controllers/TenantController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// System Admin only routes
router.get('/',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.getAllTenants
);

router.get('/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.getTenantById
);

router.post('/',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.createTenant
);

router.put('/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.updateTenant
);

router.delete('/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.deleteTenant
);

// Subscription management
router.put('/:id/subscription',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.updateSubscription
);

// Status management
router.patch('/:id/status',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.updateStatus
);

// Reset tenant
router.post('/:id/reset',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.resetTenant
);

// Assign Company Admin
router.post('/:id/assign-company-admin',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.assignCompanyAdmin
);

// Get tenant statistics
router.get('/:id/stats',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  TenantController.getTenantStats
);

module.exports = router;

