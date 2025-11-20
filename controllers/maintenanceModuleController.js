const { EquipmentStatus, EQUIPMENT_STATUSES } = require('../models/equipmentStatus');
const { MaintenanceJob, JOB_STATUSES, JOB_PRIORITIES } = require('../models/maintenanceJob');
const { MaintenanceLog } = require('../models/maintenanceLog');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { resolveScopeIds, applyScopeFilter } = require('../utils/scopeHelper');

class MaintenanceModuleController {
  // ===== Equipment status =====
  static listEquipment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (req.query.status) filter.status = req.query.status;

    const equipments = await EquipmentStatus.find(filter).sort({ equipment_name: 1 });
    return ApiResponse.success(res, equipments, 'Lấy danh sách thiết bị thành công');
  });

  static upsertEquipment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { equipment_name, equipment_code } = req.body;

    if (!equipment_name) {
      return ApiResponse.validationError(res, [{ field: 'equipment_name', message: 'Tên thiết bị là bắt buộc' }]);
    }

    if (req.body.status && !EQUIPMENT_STATUSES.includes(req.body.status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái thiết bị không hợp lệ' }]);
    }

    const equipment = await EquipmentStatus.findOneAndUpdate(
      applyScopeFilter(req, { equipment_code }, { includeDepartment: true }),
      {
        ...req.body,
        tenant_id: tenantId,
        department_id: departmentId,
        updated_at: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ApiResponse.success(res, equipment, 'Cập nhật trạng thái thiết bị thành công');
  });

  // ===== Maintenance jobs =====
  static listJobs = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (req.query.status) filter.status = req.query.status;

    const jobs = await MaintenanceJob.find(filter)
      .sort({ priority: -1, created_at: -1 })
      .populate('assigned_to', 'full_name')
      .populate('equipment_id', 'equipment_name status');

    return ApiResponse.success(res, jobs, 'Lấy danh sách maintenance job thành công');
  });

  static createJob = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);

    if (!req.body.title) {
      return ApiResponse.validationError(res, [{ field: 'title', message: 'Tiêu đề công việc là bắt buộc' }]);
    }
    if (req.body.priority && !JOB_PRIORITIES.includes(req.body.priority)) {
      return ApiResponse.validationError(res, [{ field: 'priority', message: 'Độ ưu tiên không hợp lệ' }]);
    }

    const job = await MaintenanceJob.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      created_by: req.user._id || req.user.id
    });

    return ApiResponse.success(res, job, 'Tạo maintenance job thành công', 201);
  });

  static updateJobStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };

    if (updates.status && !JOB_STATUSES.includes(updates.status)) {
      return ApiResponse.validationError(res, [{ field: 'status', message: 'Trạng thái công việc không hợp lệ' }]);
    }

    const filter = applyScopeFilter(req, { _id: id });
    const job = await MaintenanceJob.findOneAndUpdate(filter, updates, { new: true });
    if (!job) {
      return ApiResponse.notFound(res, 'Không tìm thấy maintenance job');
    }

    return ApiResponse.success(res, job, 'Cập nhật maintenance job thành công');
  });

  // ===== Maintenance logs =====
  static listLogs = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (req.query.job_id) filter.job_id = req.query.job_id;

    const logs = await MaintenanceLog.find(filter)
      .sort({ created_at: -1 })
      .populate('created_by', 'full_name');

    return ApiResponse.success(res, logs, 'Lấy nhật ký bảo trì thành công');
  });

  static addLog = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { job_id, description } = req.body;

    if (!job_id || !description) {
      return ApiResponse.validationError(res, [{ field: 'job_id', message: 'job_id & description là bắt buộc' }]);
    }

    const log = await MaintenanceLog.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      created_by: req.user._id || req.user.id
    });

    return ApiResponse.success(res, log, 'Thêm nhật ký bảo trì thành công', 201);
  });
}

module.exports = MaintenanceModuleController;


