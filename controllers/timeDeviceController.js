const TimeDevice = require('../models/timeDevice');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { ApiResponse } = require('../utils/response');
const mongoose = require('mongoose');

class TimeDeviceController {
  // Create device - tenant_id and project_id are required and enforced from req.user
  static createDevice = ErrorMiddleware.asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const tenantIdFromToken = currentUser?.tenant_id;

    // Enforce tenant_id from token if present
    if (!tenantIdFromToken && !req.body.tenant_id) {
      return ApiResponse.validationError(res, { tenant_id: ['tenant_id is required'] }, 'Missing tenant_id');
    }

    const tenantId = tenantIdFromToken || req.body.tenant_id;
    const projectId = req.body.project_id;

    if (!projectId) {
      return ApiResponse.validationError(res, { project_id: ['project_id is required'] }, 'Missing project_id');
    }

    // If token tenant exists, ensure it matches provided tenant_id (if provided)
    if (tenantIdFromToken && req.body.tenant_id && String(tenantIdFromToken) !== String(req.body.tenant_id)) {
      return ApiResponse.forbidden(res, 'Cannot create device for another tenant');
    }

    const payload = {
      device_id: req.body.device_id,
      tenant_id: mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId,
      project_id: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
      name: req.body.name,
      baseURL: req.body.baseURL,
      ip: req.body.ip,
      port: req.body.port,
      vendor: req.body.vendor || 'hikvision',
      username: req.body.username,
      password: req.body.password,
      secret: req.body.secret,
      protocol: req.body.protocol || 'http',
      meta: req.body.meta || {}
    };

    // Basic validation
    const errors = {};
    if (!payload.device_id) errors.device_id = ['device_id is required'];
    if (!payload.tenant_id) errors.tenant_id = ['tenant_id is required'];
    if (!payload.project_id) errors.project_id = ['project_id is required'];
    if (Object.keys(errors).length > 0) return ApiResponse.validationError(res, errors);

    // Upsert by device_id
    const device = await TimeDevice.findOneAndUpdate(
      { device_id: payload.device_id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ApiResponse.success(res, device, 'Time device created/updated', 201);
  });

  // List devices for tenant (non-admins)
  static listDevices = ErrorMiddleware.asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const tenantId = currentUser?.tenant_id || req.query.tenant_id;
    if (!tenantId) return ApiResponse.validationError(res, { tenant_id: ['tenant_id is required'] });

    const devices = await TimeDevice.find({ tenant_id: tenantId }).lean();
    return ApiResponse.success(res, devices, 'Devices fetched', 200);
  });

  // Update device - only within tenant
  static updateDevice = ErrorMiddleware.asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const tenantIdFromToken = currentUser?.tenant_id;
    const deviceId = req.params.deviceId;

    const device = await TimeDevice.findOne({ device_id: deviceId });
    if (!device) return ApiResponse.notFound(res, 'Device not found');

    if (tenantIdFromToken && String(device.tenant_id) !== String(tenantIdFromToken)) {
      return ApiResponse.forbidden(res, 'Cannot modify device of another tenant');
    }

    // Prevent changing tenant_id/project_id to another tenant via update
    if (req.body.tenant_id && tenantIdFromToken && String(req.body.tenant_id) !== String(tenantIdFromToken)) {
      return ApiResponse.forbidden(res, 'Cannot change tenant_id');
    }

    const update = {};
    const allowed = ['name','baseURL','ip','port','vendor','username','password','secret','protocol','meta','project_id','status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    if (update.project_id && mongoose.Types.ObjectId.isValid(update.project_id)) {
      update.project_id = new mongoose.Types.ObjectId(update.project_id);
    }

    const updated = await TimeDevice.findOneAndUpdate({ device_id: deviceId }, update, { new: true });
    return ApiResponse.success(res, updated, 'Device updated', 200);
  });
}

module.exports = TimeDeviceController;


