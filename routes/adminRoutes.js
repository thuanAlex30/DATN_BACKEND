const express = require('express');
const AdminController = require('../controllers/AdminController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// System Admin only routes
router.get('/dashboard',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getSystemDashboard
);

router.get('/tenants',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getAllTenantsDetailed
);

router.get('/permission-alerts',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getPermissionAlerts
);

router.get('/stats',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getSystemStats
);

module.exports = router;

