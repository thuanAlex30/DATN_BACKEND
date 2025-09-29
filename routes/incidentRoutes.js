const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const {
  validateCreateIncident,
  validateClassifyIncident,
  validateAssignIncident,
  validateInvestigateIncident,
  validateUpdateProgress,
  validateCloseIncident,
  validateGetIncidents,
  validateSearchIncidents,
  validateExportIncidents,
  validateGetStatistics,
  validateIncidentId,
  validateUpdateIncident
} = require('../validations/incidentValidation');

// Ghi nhận sự cố
router.post('/report', 
  AuthMiddleware.authenticate, 
  validateCreateIncident, 
  IncidentController.reportIncident
);

// Phân loại & thông báo
router.put('/classify/:id', 
  AuthMiddleware.authenticate, 
  validateClassifyIncident, 
  IncidentController.classifyIncident
);

// Phân công người phụ trách
router.put('/assign/:id', 
  AuthMiddleware.authenticate, 
  validateAssignIncident, 
  IncidentController.assignIncident
);

// Điều tra & xử lý
router.put('/investigate/:id', 
  AuthMiddleware.authenticate, 
  validateInvestigateIncident, 
  IncidentController.investigateIncident
);

// Cập nhật tiến độ
router.put('/progress/:id', 
  AuthMiddleware.authenticate, 
  validateUpdateProgress, 
  IncidentController.updateIncidentProgress
);

// Đóng sự cố & xuất báo cáo
router.put('/close/:id', 
  AuthMiddleware.authenticate, 
  validateCloseIncident, 
  IncidentController.closeIncident
);

// Lấy danh sách sự cố
router.get('/', 
  AuthMiddleware.authenticate, 
  validateGetIncidents, 
  IncidentController.getIncidents
);

// Tìm kiếm sự cố
router.get('/search', 
  AuthMiddleware.authenticate, 
  validateSearchIncidents, 
  IncidentController.searchIncidents
);

// Lấy thống kê sự cố
router.get('/statistics', 
  AuthMiddleware.authenticate, 
  validateGetStatistics, 
  IncidentController.getIncidentStatistics
);

// Xuất báo cáo sự cố
router.get('/export', 
  AuthMiddleware.authenticate, 
  validateExportIncidents, 
  IncidentController.exportIncidents
);

// Lấy chi tiết sự cố
router.get('/:id', 
  AuthMiddleware.authenticate, 
  validateIncidentId, 
  IncidentController.getIncidentById
);

// Cập nhật sự cố
router.put('/:id', 
  AuthMiddleware.authenticate, 
  validateUpdateIncident, 
  IncidentController.updateIncident
);

// Xóa sự cố
router.delete('/:id', 
  AuthMiddleware.authenticate, 
  validateIncidentId, 
  IncidentController.deleteIncident
);

module.exports = router;
