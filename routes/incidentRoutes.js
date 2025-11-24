const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Ghi nhận sự cố
router.post('/report', AuthMiddleware.authenticate, IncidentController.reportIncident);
// Phân loại & thông báo
router.put('/classify/:id', AuthMiddleware.authenticate, IncidentController.classifyIncident);
// Phân công người phụ trách
router.put('/assign/:id', AuthMiddleware.authenticate, IncidentController.assignIncident);
// Điều tra & xử lý
router.put('/investigate/:id', AuthMiddleware.authenticate, IncidentController.investigateIncident);
// Cập nhật tiến độ
router.put('/progress/:id', AuthMiddleware.authenticate, IncidentController.updateIncidentProgress);
// Đóng sự cố & xuất báo cáo
router.put('/close/:id', AuthMiddleware.authenticate, IncidentController.closeIncident);

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

// Lấy chi tiết sự cố (phải đặt cuối cùng vì match với mọi /:id)
router.get('/:id', 
  (req, res, next) => {
    console.log('🔍 Route matched: GET /:id', req.params, 'Path:', req.path, 'Original URL:', req.originalUrl);
    next();
  },
  AuthMiddleware.authenticate, 
  IncidentController.getIncidentById
);

module.exports = router;
