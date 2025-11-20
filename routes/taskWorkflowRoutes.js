const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const taskWorkflowController = require('../controllers/taskWorkflowController');
const enforceTenantFilter = require('../middlewares/enforceTenantFilter');

// Áp dụng xác thực cho tất cả các route
router.use(authMiddleware.authenticate);
router.use(enforceTenantFilter({
  includeDepartment: true,
  requireDepartment: true,
  allowSystemBypass: true
}));

// ========== TASK WORKFLOW ROUTES ==========

// Dept Header tạo chiến dịch
router.post('/campaigns', taskWorkflowController.createCampaign);

// Manager/Leader phân rã nhiệm vụ cha
router.post('/tasks/:id/breakdown', taskWorkflowController.breakdownTask);

// Phân công / chuyển cấp nhiệm vụ
router.post('/tasks/:id/assign', taskWorkflowController.assignTask);

// Employee cập nhật tiến độ/báo cáo
router.put('/tasks/:id/progress', taskWorkflowController.updateProgress);

// Thêm comment vào nhiệm vụ
router.post('/tasks/:id/comments', taskWorkflowController.addComment);

// Lấy thông tin nhiệm vụ
router.get('/tasks/:id', taskWorkflowController.getTaskById);

// Lấy danh sách chiến dịch của bộ phận
router.get('/campaigns', taskWorkflowController.getDepartmentCampaigns);

// Lấy danh sách nhiệm vụ của user hiện tại
router.get('/my-tasks', taskWorkflowController.getUserTasks);

// Lấy lịch sử workflow của 1 task
router.get('/tasks/:id/logs', taskWorkflowController.getTaskLogs);

module.exports = router;


