const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const maintenanceModuleController = require('../controllers/maintenanceModuleController');
const enforceTenantFilter = require('../middlewares/enforceTenantFilter');

router.use(authMiddleware.authenticate);
router.use(enforceTenantFilter({
  includeDepartment: true,
  requireDepartment: true,
  allowSystemBypass: true
}));

// Equipment status
router.get('/equipment', maintenanceModuleController.listEquipment);
router.put('/equipment', maintenanceModuleController.upsertEquipment);

// Maintenance jobs
router.get('/jobs', maintenanceModuleController.listJobs);
router.post('/jobs', maintenanceModuleController.createJob);
router.put('/jobs/:id', maintenanceModuleController.updateJobStatus);

// Maintenance logs
router.get('/logs', maintenanceModuleController.listLogs);
router.post('/logs', maintenanceModuleController.addLog);

module.exports = router;


