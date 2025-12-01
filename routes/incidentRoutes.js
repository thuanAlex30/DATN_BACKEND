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
router.put('/close/:id', AuthMiddleware.authenticate, IncidentController.closeIncident);

// Lấy thống kê incidents (phải đặt trước route /:id)
router.get('/stats/overview', 
  AuthMiddleware.authenticate,
  IncidentController.getIncidentStats
);

// Lấy danh sách sự cố (phải đặt trước route /:id)
router.get('/', AuthMiddleware.authenticate, IncidentController.getIncidents);

// Escalate sự cố (Department Header) - phải đặt trước route /:id
router.post('/:id/escalate', 
  (req, res, next) => {
    console.log('🔍 Route matched: POST /:id/escalate', req.params);
    next();
  },
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'escalate',
    tenantScope: 'tenant'
  }),
  IncidentController.escalateIncident
);

// Lấy danh sách escalations của sự cố - phải đặt trước route /:id
router.get('/:id/escalations', 
  (req, res, next) => {
    console.log('🔍 Route matched: GET /:id/escalations', req.params);
    next();
  },
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidentEscalations
);

// Xóa incident (phải đặt trước route /:id)
router.delete('/:id', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.deleteIncident
);

// Lấy chi tiết sự cố (phải đặt cuối cùng vì match với mọi /:id)
router.get('/:id', 
  (req, res, next) => {
    console.log('🔍 Route matched: GET /:id', req.params, 'Path:', req.path, 'Original URL:', req.originalUrl);
    next();
  },
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.getIncidentById
);

module.exports = router;
