const express = require('express');
const AdminController = require('../controllers/AdminController');
const SubscriptionPlanController = require('../controllers/SubscriptionPlanController');
const SystemSettingsController = require('../controllers/SystemSettingsController');
const BackupController = require('../controllers/BackupController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// System Admin only routes - Dashboard
router.get('/dashboard',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getSystemDashboard
);

router.get('/stats',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  AdminController.getSystemStats
);

// Tenants routes (already handled in tenantRoutes, but keeping for compatibility)
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

// Subscription Plans routes
router.get('/subscription-plans',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SubscriptionPlanController.getAllPlans
);

router.get('/subscription-plans/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SubscriptionPlanController.getPlanById
);

router.post('/subscription-plans',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SubscriptionPlanController.createPlan
);

router.put('/subscription-plans/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SubscriptionPlanController.updatePlan
);

router.delete('/subscription-plans/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SubscriptionPlanController.deletePlan
);

// System Settings routes
router.get('/settings',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SystemSettingsController.getSettings
);

router.put('/settings',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  SystemSettingsController.updateSettings
);

// Backup & Restore routes
router.post('/backup',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  BackupController.startBackup
);

router.get('/backup/history',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  BackupController.getBackupHistory
);

router.get('/backup/:id',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  BackupController.getBackupById
);

router.post('/backup/:id/restore',
  AuthMiddleware.authorizeScope({
    minRoleLevel: 100,
    tenantScope: 'global'
  }),
  BackupController.restoreBackup
);

module.exports = router;

