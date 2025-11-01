const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const incidentValidation = require('../validations/incidentValidation');

// Ghi nhận sự cố
router.post('/report', 
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(['manager']),
  ValidationMiddleware.validateBody(incidentValidation.createIncident),
  IncidentController.reportIncident
);

// Phân loại & thông báo
router.put('/classify/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.classifyIncident
  }),
  IncidentController.classifyIncident
);

// Phân công người phụ trách
router.put('/assign/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.assignIncident
  }),
  IncidentController.assignIncident
);

// Điều tra & xử lý
router.put('/investigate/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.investigateIncident
  }),
  IncidentController.investigateIncident
);

// Cập nhật tiến độ
router.put('/progress/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.updateProgress
  }),
  IncidentController.updateIncidentProgress
);

// Đóng sự cố & xuất báo cáo
router.put('/close/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.closeIncident
  }),
  IncidentController.closeIncident
);

// Cập nhật incident
router.put('/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.updateIncident
  }),
  IncidentController.updateIncident
);

// Lấy danh sách sự cố
router.get('/', AuthMiddleware.authenticate, IncidentController.getIncidents);

// Lấy chi tiết sự cố
router.get('/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.getIncidentById
);

// Lấy thống kê incidents
router.get('/stats/overview', AuthMiddleware.authenticate, IncidentController.getIncidentStats);

// Tìm kiếm incidents
router.get('/search/query', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateQuery(incidentValidation.searchQuery),
  IncidentController.searchIncidents
);

// Lấy incidents theo user
router.get('/user/:userId', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.userId),
  IncidentController.getIncidentsByUser
);

// Lấy incidents theo project
router.get('/project/:projectId', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.projectId),
  IncidentController.getIncidentsByProject
);

// Lấy incidents theo status
router.get('/status/:status', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.status),
  IncidentController.getIncidentsByStatus
);

// Lấy incidents theo severity
router.get('/severity/:severity', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.severity),
  IncidentController.getIncidentsBySeverity
);

// Xóa incident
router.delete('/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.deleteIncident
);

module.exports = router;
