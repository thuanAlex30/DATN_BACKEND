const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const safetyOfficerController = require('../controllers/safetyOfficerController');
const enforceTenantFilter = require('../middlewares/enforceTenantFilter');

router.use(authMiddleware.authenticate);
router.use(enforceTenantFilter({
  includeDepartment: true,
  requireDepartment: true,
  allowSystemBypass: true
}));

// Safety reports
router.get('/reports', safetyOfficerController.listSafetyReports);
router.post('/reports', safetyOfficerController.createSafetyReport);
router.put('/reports/:id', safetyOfficerController.updateSafetyReport);

// Safety checklists
router.get('/checklists', safetyOfficerController.listSafetyChecklists);
router.post('/checklists', safetyOfficerController.createSafetyChecklist);
router.put('/checklists/:id', safetyOfficerController.updateSafetyChecklist);

// Incident escalations
router.get('/incident-escalations', safetyOfficerController.listIncidentEscalations);
router.put('/incident-escalations/:id', safetyOfficerController.updateIncidentEscalation);

module.exports = router;


