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
// Cập nhật thông tin nhân viên trong sự cố
router.put('/update-employee/:id', AuthMiddleware.authenticate, IncidentController.updateEmployeeIncident);
// Lấy danh sách sự cố
router.get('/', AuthMiddleware.authenticate, IncidentController.getIncidents);
// Lấy chi tiết sự cố
router.get('/:id', AuthMiddleware.authenticate, IncidentController.getIncidentById);

module.exports = router;
