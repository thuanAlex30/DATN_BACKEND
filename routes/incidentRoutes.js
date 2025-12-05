const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const incidentValidation = require('../validations/incidentValidation');

// Apply authentication middleware to all routes (like PPE)
router.use(AuthMiddleware.authenticate);

// ========== SPECIFIC ROUTES (must be before /:id routes) ==========

// Lấy thống kê incidents (MUST be first to avoid /:id matching)
// Department Header, Manager, Employee có thể xem thống kê
router.get('/stats/overview', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidentStats
);

// Tìm kiếm incidents
// Department Header, Manager, Employee có thể tìm kiếm
router.get('/search/query',
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.searchIncidents
);

// Lấy incidents theo user
// Department Header, Manager, Employee có thể xem
router.get('/user/:userId',
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  ValidationMiddleware.validateParams(incidentValidation.userId),
  IncidentController.getIncidentsByUser
);

// Lấy incidents theo project
// Department Header, Manager, Employee có thể xem
router.get('/project/:projectId',
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  ValidationMiddleware.validateParams(incidentValidation.projectId),
  IncidentController.getIncidentsByProject
);

// Lấy incidents theo status
// Department Header, Manager, Employee có thể xem
router.get('/status/:status',
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidentsByStatus
);

// Lấy incidents theo severity
// Department Header, Manager, Employee có thể xem
router.get('/severity/:severity',
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidentsBySeverity
);

// Lấy danh sách sự cố
// Department Header, Manager, Employee có thể xem danh sách
router.get('/', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'list',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidents
);

// ========== ACTION ROUTES (before /:id) ==========

// Ghi nhận sự cố
// Department Header, Manager, Employee có thể tạo incident
router.post('/report', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'create',
    tenantScope: 'tenant'
  }),
  ValidationMiddleware.validateBody(incidentValidation.createIncident),
  IncidentController.reportIncident
);

// Phân loại & thông báo
// Department Header, Manager có thể phân loại (update permission)
router.put('/classify/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'update',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.classifyIncident
  }),
  IncidentController.classifyIncident
);

// Phân công người phụ trách
// Department Header, Manager có thể phân công (update permission)
router.put('/assign/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'update',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.assignIncident
  }),
  IncidentController.assignIncident
);

// Điều tra & xử lý
// Department Header, Manager có thể điều tra (update permission)
router.put('/investigate/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'update',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.investigateIncident
  }),
  IncidentController.investigateIncident
);

// Cập nhật tiến độ
// Department Header, Manager có thể cập nhật tiến độ (update permission)
router.put('/progress/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'update',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.updateProgress
  }),
  IncidentController.updateIncidentProgress
);

// Đóng sự cố & xuất báo cáo
// Department Header, Manager có thể đóng incident (close permission)
router.put('/close/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'close',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  IncidentController.closeIncident
);

// Escalate sự cố - phải đặt trước route /:id
// Chỉ Department Header có thể escalate (escalate permission)
router.post('/:id/escalate', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'escalate',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  IncidentController.escalateIncident
);

// Lấy danh sách escalations của sự cố - phải đặt trước route /:id
// Department Header, Manager, Employee có thể xem escalations
router.get('/:id/escalations', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  IncidentController.getIncidentEscalations
);

// Cập nhật incident (phải đặt trước route /:id)
// Department Header, Manager có thể cập nhật (update permission)
router.put('/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'update',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validate({
    params: incidentValidation.id,
    body: incidentValidation.updateIncident
  }),
  IncidentController.updateIncident
);

// Xóa incident (phải đặt trước route /:id)
// Chỉ Department Header có thể xóa (delete permission)
router.delete('/:id', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'delete',
    tenantScope: 'tenant',
    departmentScope: 'hierarchy'
  }),
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.deleteIncident
);


// Lấy chi tiết incident theo ID
// Department Header, Manager, Employee có thể xem chi tiết
router.get('/:id([0-9a-fA-F]{24})', 
  AuthMiddleware.authorizeScope({
    modules: 'incident',
    action: 'read',
    tenantScope: 'tenant'
  }),
  ValidationMiddleware.validateParams(incidentValidation.id),
  IncidentController.getIncidentById
);

module.exports = router;
