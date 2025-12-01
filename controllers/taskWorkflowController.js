const { TaskWorkflow, TASK_LEVELS, TASK_STATUSES } = require('../models/taskWorkflow');
const { TaskWorkflowLog, TASK_ACTIONS } = require('../models/taskWorkflowLog');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { resolveScopeIds, applyScopeFilter } = require('../utils/scopeHelper');

class TaskWorkflowController {
  // ========== TASK WORKFLOW CORE ==========

  // Dept Header tạo chiến dịch gốc cho bộ phận
  static createCampaign = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { title, description, due_date, priority } = req.body;

    if (!title) {
      return ApiResponse.validationError(res, [{ field: 'title', message: 'Tiêu đề là bắt buộc' }]);
    }

    const campaign = await TaskWorkflow.create({
      tenant_id: tenantId,
      department_id: departmentId,
      title,
      description,
      is_campaign: true,
      level: 'DEPARTMENT_HEADER',
      status: 'NEW',
      priority: priority || 'MEDIUM',
      due_date,
      assigned_by: userId,
      created_by: userId
    });

    await TaskWorkflowLog.create({
      tenant_id: tenantId,
      department_id: departmentId,
      task_id: campaign._id,
      action: 'CREATE_CAMPAIGN',
      to_level: 'DEPARTMENT_HEADER',
      to_user_id: userId,
      note: 'Tạo chiến dịch cấp bộ phận'
    });

    return ApiResponse.success(res, campaign, 'Tạo chiến dịch thành công', 201);
  });

  // Manager/Leader phân rã nhiệm vụ cha thành các nhiệm vụ con
  static breakdownTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params; // parent task id
    const userId = req.user._id || req.user.id;
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { subtasks } = req.body;

    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return ApiResponse.validationError(res, [{ field: 'subtasks', message: 'Danh sách nhiệm vụ con là bắt buộc' }]);
    }

    const parentTask = await TaskWorkflow.findOne(applyScopeFilter(req, { _id: id }, { includeDepartment: true }));
    if (!parentTask) {
      return ApiResponse.notFound(res, 'Không tìm thấy nhiệm vụ cha');
    }

    const createdSubtasks = [];
    for (const sub of subtasks) {
      if (!sub.title) continue;

      const level = sub.level && TASK_LEVELS.includes(sub.level) ? sub.level : parentTask.level;

      const child = await TaskWorkflow.create({
        tenant_id: tenantId,
        department_id: departmentId || parentTask.department_id,
        parent_task_id: parentTask._id,
        title: sub.title,
        description: sub.description,
        is_campaign: false,
        level,
        status: 'NEW',
        priority: sub.priority || parentTask.priority || 'MEDIUM',
        due_date: sub.due_date || parentTask.due_date,
        assigned_by: userId,
        assigned_to: sub.assigned_to,
        created_by: userId
      });

      createdSubtasks.push(child);

      await TaskWorkflowLog.create({
        tenant_id: tenantId,
        department_id: departmentId || parentTask.department_id,
        task_id: child._id,
        action: 'BREAKDOWN',
        from_level: parentTask.level,
        to_level: level,
        from_user_id: userId,
        to_user_id: sub.assigned_to,
        note: sub.note || 'Phân rã nhiệm vụ'
      });
    }

    return ApiResponse.success(res, createdSubtasks, 'Phân rã nhiệm vụ thành công', 201);
  });

  // Assign hoặc chuyển cấp nhiệm vụ (Manager -> Leader, Leader -> Employee, ...)
  static assignTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { to_level, to_user_id, note } = req.body;

    const task = await TaskWorkflow.findOne(applyScopeFilter(req, { _id: id }));
    if (!task) {
      return ApiResponse.notFound(res, 'Không tìm thấy nhiệm vụ');
    }

    if (to_level && !TASK_LEVELS.includes(to_level)) {
      return ApiResponse.validationError(res, [{ field: 'to_level', message: 'Cấp nhiệm vụ không hợp lệ' }]);
    }

    const oldLevel = task.level;
    const oldAssignee = task.assigned_to;

    task.level = to_level || task.level;
    task.assigned_to = to_user_id || task.assigned_to;
    task.assigned_by = userId;
    task.updated_by = userId;
    await task.save();

    await TaskWorkflowLog.create({
      tenant_id: tenantId,
      department_id: departmentId || task.department_id,
      task_id: task._id,
      action: oldAssignee ? 'REASSIGN' : 'ASSIGN',
      from_level: oldLevel,
      to_level: task.level,
      from_user_id: userId,
      to_user_id: to_user_id,
      note: note || (oldAssignee ? 'Chuyển giao nhiệm vụ' : 'Phân công nhiệm vụ')
    });

    return ApiResponse.success(res, task, 'Phân công/chuyển cấp nhiệm vụ thành công');
  });

  // Employee cập nhật tiến độ & báo cáo
  static updateProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { progress_percentage, status, note, metadata } = req.body;

    const task = await TaskWorkflow.findOne(applyScopeFilter(req, { _id: id }));
    if (!task) {
      return ApiResponse.notFound(res, 'Không tìm thấy nhiệm vụ');
    }

    if (typeof progress_percentage === 'number') {
      if (progress_percentage < 0 || progress_percentage > 100) {
        return ApiResponse.validationError(res, [{
          field: 'progress_percentage',
          message: 'Tiến độ phải từ 0 đến 100'
        }]);
      }
      task.progress_percentage = progress_percentage;
    }

    if (status && !TASK_STATUSES.includes(status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái không hợp lệ' }]);
    }

    if (status) {
      task.status = status;
    }

    task.updated_by = userId;
    await task.save();

    await TaskWorkflowLog.create({
      tenant_id: tenantId,
      department_id: departmentId || task.department_id,
      task_id: task._id,
      action: 'UPDATE_PROGRESS',
      from_level: task.level,
      to_level: task.level,
      from_user_id: userId,
      to_user_id: task.assigned_to,
      note: note || 'Cập nhật tiến độ/báo cáo',
      metadata: metadata || { progress_percentage, status }
    });

    return ApiResponse.success(res, task, 'Cập nhật tiến độ thành công');
  });

  // Thêm comment vào task (bất kỳ cấp nào)
  static addComment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { note, metadata } = req.body;

    const task = await TaskWorkflow.findOne(applyScopeFilter(req, { _id: id }));
    if (!task) {
      return ApiResponse.notFound(res, 'Không tìm thấy nhiệm vụ');
    }

    if (!note) {
      return ApiResponse.validationError(res, [{ field: 'note', message: 'Nội dung bình luận là bắt buộc' }]);
    }

    const log = await TaskWorkflowLog.create({
      tenant_id: tenantId,
      department_id: departmentId || task.department_id,
      task_id: task._id,
      action: 'COMMENT',
      from_level: task.level,
      to_level: task.level,
      from_user_id: userId,
      to_user_id: task.assigned_to,
      note,
      metadata: metadata || {}
    });

    return ApiResponse.success(res, log, 'Thêm bình luận thành công', 201);
  });

  // ========== QUERY ==========

  static getTaskById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = await TaskWorkflow.findOne(applyScopeFilter(req, { _id: id }))
      .populate('assigned_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('parent_task_id', 'title level status');

    if (!task) {
      return ApiResponse.notFound(res, 'Không tìm thấy nhiệm vụ');
    }

    return ApiResponse.success(res, task, 'Lấy thông tin nhiệm vụ thành công');
  });

  static getDepartmentCampaigns = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status;

    const query = {
      tenant_id: tenantId,
      department_id: departmentId,
      is_campaign: true
    };

    if (status) {
      query.status = status;
    }

    const campaigns = await TaskWorkflow.find(query).sort({ created_at: -1 });
    return ApiResponse.success(res, campaigns, 'Lấy danh sách chiến dịch thành công');
  });

  static getUserTasks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const status = req.query.status;

    const query = applyScopeFilter(req, { assigned_to: userId }, { includeDepartment: false });

    if (status) {
      query.status = status;
    }

    const tasks = await TaskWorkflow.find(query).sort({ due_date: 1 });
    return ApiResponse.success(res, tasks, 'Lấy danh sách nhiệm vụ cá nhân thành công');
  });

  static getTaskLogs = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const logs = await TaskWorkflowLog.find(applyScopeFilter(req, { task_id: id }))
      .sort({ created_at: -1 })
      .populate('from_user_id', 'full_name email')
      .populate('to_user_id', 'full_name email');

    return ApiResponse.success(res, logs, 'Lấy lịch sử nhiệm vụ thành công');
  });
}

module.exports = TaskWorkflowController;


