const express = require('express');
const router = express.Router();
const AccidentController = require('../controllers/accidentController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Báo cáo tai nạn
router.post('/report', AuthMiddleware, AccidentController.reportAccident);
// Xác nhận & phân loại
router.put('/confirm/:id', AuthMiddleware, AccidentController.confirmAccident);
// Cập nhật xử lý & ghi nhận biện pháp
router.put('/update/:id', AuthMiddleware, AccidentController.updateAccident);
// Đánh giá & đóng sự cố
router.put('/close/:id', AuthMiddleware, AccidentController.closeAccident);
// Lấy danh sách tai nạn
router.get('/', AuthMiddleware, AccidentController.getAccidents);

module.exports = router;
