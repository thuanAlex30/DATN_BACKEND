const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const trainerModuleController = require('../controllers/trainerModuleController');
const enforceTenantFilter = require('../middlewares/enforceTenantFilter');

router.use(authMiddleware.authenticate);
router.use(enforceTenantFilter({
  includeDepartment: true,
  requireDepartment: false,
  allowSystemBypass: true
}));

// Training sessions
router.get('/sessions', trainerModuleController.listSessions);
router.post('/sessions', trainerModuleController.createSession);
router.put('/sessions/:id', trainerModuleController.updateSession);
router.delete('/sessions/:id', trainerModuleController.deleteSession);

// Training assignments
router.get('/assignments', trainerModuleController.listAssignments);
router.post('/assignments', trainerModuleController.createAssignment);
router.put('/assignments/:id', trainerModuleController.updateAssignment);
router.delete('/assignments/:id', trainerModuleController.deleteAssignment);

// Training assessments / results
router.get('/assessments', trainerModuleController.listAssessments);
router.post('/assessments', trainerModuleController.recordAssessment);

module.exports = router;


