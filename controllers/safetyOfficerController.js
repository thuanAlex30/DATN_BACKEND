const { SafetyReport, SAFETY_STATUSES } = require('../models/safetyReport');
const { SafetyChecklist } = require('../models/safetyChecklist');
const { IncidentEscalation, ESCALATION_STATUSES } = require('../models/incidentEscalation');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { resolveScopeIds, applyScopeFilter } = require('../utils/scopeHelper');

class SafetyOfficerController {
  // ===== Safety Reports =====
  static listSafetyReports = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status;

    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (status) filter.status = status;

    const reports = await SafetyReport.find(filter)
      .sort({ created_at: -1 })
      .populate('reported_by', 'full_name')
      .populate('assigned_to', 'full_name');

    return ApiResponse.success(res, reports, 'Lấy danh sách safety reports thành công');
  });

  static createSafetyReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);

    if (!req.body.title) {
      return ApiResponse.validationError(res, [{ field: 'title', message: 'Tiêu đề là bắt buộc' }]);
    }

    const report = await SafetyReport.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      reported_by: req.user._id || req.user.id
    });

    return ApiResponse.success(res, report, 'Tạo safety report thành công', 201);
  });

  static updateSafetyReport = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.body.status && !SAFETY_STATUSES.includes(req.body.status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái safety report không hợp lệ' }]);
    }

    const filter = applyScopeFilter(req, { _id: id });
    const report = await SafetyReport.findOneAndUpdate(
      filter,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    if (!report) {
      return ApiResponse.notFound(res, 'Không tìm thấy safety report');
    }

    return ApiResponse.success(res, report, 'Cập nhật safety report thành công');
  });

  // ===== Safety Checklists =====
  static listSafetyChecklists = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status;

    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (status) filter.status = status;

    const checklists = await SafetyChecklist.find(filter).sort({ created_at: -1 });
    return ApiResponse.success(res, checklists, 'Lấy danh sách safety checklist thành công');
  });

  static createSafetyChecklist = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);

    if (!req.body.title) {
      return ApiResponse.validationError(res, [{ field: 'title', message: 'Tiêu đề checklist là bắt buộc' }]);
    }

    const checklist = await SafetyChecklist.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      conducted_by: req.user._id || req.user.id
    });

    return ApiResponse.success(res, checklist, 'Tạo safety checklist thành công', 201);
  });

  static updateSafetyChecklist = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const filter = applyScopeFilter(req, { _id: id });
    const checklist = await SafetyChecklist.findOneAndUpdate(
      filter,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    if (!checklist) {
      return ApiResponse.notFound(res, 'Không tìm thấy safety checklist');
    }

    return ApiResponse.success(res, checklist, 'Cập nhật safety checklist thành công');
  });

  // ===== Incident Escalations =====
  static listIncidentEscalations = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const status = req.query.status;

    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (status) filter.status = status;

    const escalations = await IncidentEscalation.find(filter)
      .sort({ created_at: -1 })
      .populate('incident_id', 'title severity')
      .populate('created_by', 'full_name')
      .populate('resolved_by', 'full_name');

    return ApiResponse.success(res, escalations, 'Lấy danh sách incident escalation thành công');
  });

  static updateIncidentEscalation = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.body.status && !ESCALATION_STATUSES.includes(req.body.status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái escalation không hợp lệ' }]);
    }

    const filter = applyScopeFilter(req, { _id: id });
    const escalation = await IncidentEscalation.findOneAndUpdate(
      filter,
      {
        ...req.body,
        resolved_by: req.body.status === 'RESOLVED' ? (req.user._id || req.user.id) : undefined,
        resolved_at: req.body.status === 'RESOLVED' ? new Date() : undefined,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!escalation) {
      return ApiResponse.notFound(res, 'Không tìm thấy incident escalation');
    }

    return ApiResponse.success(res, escalation, 'Cập nhật incident escalation thành công');
  });
}

module.exports = SafetyOfficerController;


