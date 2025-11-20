const { PPEStock } = require('../models/ppeStock');
const { PPEStockMovement, MOVEMENT_TYPES } = require('../models/ppeStockMovement');
const { PPERequest, PPE_REQUEST_STATUSES } = require('../models/ppeRequest');
const { PPEApproval, PPE_APPROVAL_STATUSES } = require('../models/ppeApproval');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { resolveScopeIds, applyScopeFilter } = require('../utils/scopeHelper');

class WarehouseModuleController {
  // ===== Stock levels =====
  static listStock = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });

    const stock = await PPEStock.find(filter)
      .populate('ppe_item_id', 'name category unit');

    return ApiResponse.success(res, stock, 'Lấy tồn kho PPE thành công');
  });

  static upsertStock = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { ppe_item_id, quantity_available, location } = req.body;

    if (!ppe_item_id) {
      return ApiResponse.validationError(res, [{ field: 'ppe_item_id', message: 'ppe_item_id là bắt buộc' }]);
    }

    const stock = await PPEStock.findOneAndUpdate(
      applyScopeFilter(req, { ppe_item_id }, { includeDepartment: true }),
      {
        $set: {
          quantity_available: quantity_available ?? 0,
          location,
          last_audited_at: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ApiResponse.success(res, stock, 'Cập nhật tồn kho thành công');
  });

  // ===== Stock movements =====
  static recordStockMovement = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const { ppe_item_id, movement_type, quantity } = req.body;

    if (!MOVEMENT_TYPES.includes(movement_type)) {
      return ApiResponse.validationError(res, [{ field: 'movement_type', message: 'Loại dịch chuyển không hợp lệ' }]);
    }

    const stock = await PPEStock.findOne(applyScopeFilter(req, { ppe_item_id }, { includeDepartment: true }));
    if (!stock) {
      return ApiResponse.notFound(res, 'Không tìm thấy tồn kho để cập nhật');
    }

    let newQty = stock.quantity_available;
    if (movement_type === 'INBOUND') {
      newQty += quantity;
    } else if (movement_type === 'OUTBOUND') {
      if (stock.quantity_available < quantity) {
        return ApiResponse.validationError(res, [{ field: 'quantity', message: 'Số lượng xuất vượt quá tồn' }]);
      }
      newQty -= quantity;
    }

    stock.quantity_available = newQty;
    await stock.save();

    const movement = await PPEStockMovement.create({
      tenant_id: tenantId,
      department_id: departmentId,
      ppe_item_id,
      movement_type,
      quantity,
      reference_id: req.body.reference_id,
      reference_type: req.body.reference_type,
      created_by: req.user._id || req.user.id,
      metadata: req.body.metadata
    });

    return ApiResponse.success(res, { stock, movement }, 'Ghi nhận dịch chuyển kho thành công', 201);
  });

  static listStockMovements = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (req.query.movement_type) filter.movement_type = req.query.movement_type;

    const movements = await PPEStockMovement.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(req.query.limit || 100, 10));

    return ApiResponse.success(res, movements, 'Lấy lịch sử kho thành công');
  });

  // ===== PPE Requests & Approvals =====
  static listRequests = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    const filter = applyScopeFilter(req, {}, { includeDepartment: Boolean(departmentId) });
    if (req.query.status) filter.status = req.query.status;

    const requests = await PPERequest.find(filter)
      .sort({ created_at: -1 })
      .populate('requester_id', 'full_name')
      .populate('approver_id', 'full_name');

    return ApiResponse.success(res, requests, 'Lấy yêu cầu PPE thành công');
  });

  static approveRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const decision = req.body.decision || 'APPROVED';
    if (!PPE_APPROVAL_STATUSES.includes(decision)) {
      return ApiResponse.validationError(res, [{ field: 'decision', message: 'Quyết định không hợp lệ' }]);
    }

    const request = await PPERequest.findOne(applyScopeFilter(req, { _id: id }));
    if (!request) {
      return ApiResponse.notFound(res, 'Không tìm thấy yêu cầu PPE');
    }

    request.status = decision === 'APPROVED' ? 'APPROVED' : (decision === 'REJECTED' ? 'REJECTED' : request.status);
    request.approver_id = req.user._id || req.user.id;
    await request.save();

    const approval = await PPEApproval.findOneAndUpdate(
      { request_id: id },
      {
        tenant_id: request.tenant_id,
        department_id: request.department_id,
        request_id: request._id,
        approver_id: req.user._id || req.user.id,
        status: decision,
        decision_notes: req.body.decision_notes,
        decided_at: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ApiResponse.success(res, { request, approval }, 'Xử lý phê duyệt PPE thành công');
  });

  static createRequest = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { tenantId, departmentId } = resolveScopeIds(req);
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return ApiResponse.validationError(res, [{ field: 'items', message: 'Danh sách vật tư là bắt buộc' }]);
    }

    const request = await PPERequest.create({
      ...req.body,
      tenant_id: tenantId,
      department_id: departmentId,
      requester_id: req.user._id || req.user.id,
      status: 'PENDING'
    });

    return ApiResponse.success(res, request, 'Tạo yêu cầu PPE thành công', 201);
  });
}

module.exports = WarehouseModuleController;


