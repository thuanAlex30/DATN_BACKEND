const { TrainingSession } = require('../models/trainingSession');
const TrainingAssignment = require('../models/trainingAssignment');
const { TrainingAssessment, ASSESSMENT_STATUSES } = require('../models/trainingAssessment');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { resolveScopeIds, applyScopeFilter } = require('../utils/scopeHelper');

class TrainerModuleController {
  // ===== Training Sessions =====
  static listSessions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status_code;

    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId || req.query.department_id) });
    if (status) filter.status_code = status;

    const sessions = await TrainingSession.find(filter).sort({ start_time: 1 });
    return ApiResponse.success(res, sessions, 'Lấy danh sách training session thành công');
  });

  static createSession = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    if (!departmentId && !req.scopeContext?.bypass) {
      return ApiResponse.validationError(res, [{ field: 'department_id', message: 'department_id là bắt buộc' }]);
    }

    const session = await TrainingSession.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId
    });

    return ApiResponse.success(res, session, 'Tạo training session thành công', 201);
  });

  static updateSession = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const filter = applyScopeFilter(req, { _id: id });
    const session = await TrainingSession.findOneAndUpdate(
      filter,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    if (!session) {
      return ApiResponse.notFound(res, 'Không tìm thấy training session');
    }

    return ApiResponse.success(res, session, 'Cập nhật training session thành công');
  });

  static deleteSession = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const filter = applyScopeFilter(req, { _id: id });
    const session = await TrainingSession.findOneAndDelete(filter);
    if (!session) {
      return ApiResponse.notFound(res, 'Không tìm thấy training session');
    }
    return ApiResponse.success(res, null, 'Xóa training session thành công');
  });

  // ===== Training Assignments =====
  static listAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const filter = applyScopeFilter(req, {}, {
      includeDepartment: Boolean(req.scopeContext?.department_id || req.query.department_id)
    });

    const assignments = await TrainingAssignment.find(filter)
      .populate('course_id', 'course_name')
      .populate('department_id', 'name');

    return ApiResponse.success(res, assignments, 'Lấy danh sách training assignment thành công');
  });

  static createAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    if (!departmentId && !req.scopeContext?.bypass) {
      return ApiResponse.validationError(res, [{ field: 'department_id', message: 'department_id là bắt buộc' }]);
    }

    const assignment = await TrainingAssignment.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      assigned_by: req.user._id || req.user.id
    });

    return ApiResponse.success(res, assignment, 'Tạo training assignment thành công', 201);
  });

  static updateAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái không hợp lệ' }]);
    }

    const filter = applyScopeFilter(req, { _id: id });
    const assignment = await TrainingAssignment.findOneAndUpdate(
      filter,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    if (!assignment) {
      return ApiResponse.notFound(res, 'Không tìm thấy training assignment');
    }

    return ApiResponse.success(res, assignment, 'Cập nhật training assignment thành công');
  });

  static deleteAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const filter = applyScopeFilter(req, { _id: id });
    const assignment = await TrainingAssignment.findOneAndDelete(filter);
    if (!assignment) {
      return ApiResponse.notFound(res, 'Không tìm thấy training assignment');
    }
    return ApiResponse.success(res, null, 'Xóa training assignment thành công');
  });

  // ===== Training Assessments / Results =====
  static listAssessments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status;

    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (status) filter.status = status;

    const assessments = await TrainingAssessment.find(filter)
      .populate('session_id', 'session_name start_time')
      .populate('user_id', 'full_name email');

    return ApiResponse.success(res, assessments, 'Lấy danh sách training assessment thành công');
  });

  static recordAssessment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { session_id, user_id, score, status } = req.body;

    if (!session_id || !user_id) {
      return ApiResponse.validationError(res, [{ field: 'session_id', message: 'session_id và user_id là bắt buộc' }]);
    }

    if (status && !ASSESSMENT_STATUSES.includes(status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái assessment không hợp lệ' }]);
    }

    const payload = {
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      score
    };

    const assessment = await TrainingAssessment.findOneAndUpdate(
      { tenant_id: tenantId, department_id: departmentId, session_id, user_id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ApiResponse.success(res, assessment, 'Ghi nhận kết quả training thành công');
  });
}

module.exports = TrainerModuleController;


