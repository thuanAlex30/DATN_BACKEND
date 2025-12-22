const TimeDevice = require('../models/timeDevice');
const Attendance = require('../models/attendance');
const OrphanTimeEvent = require('../models/orphanTimeEvent');
const User = require('../models/user');
const Employee = require('../models/employee');
const connectDB = require('../config/database');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { ApiResponse } = require('../utils/response');
const crypto = require('crypto');

class TimeWebhookController {
  // No auth (devices push), verify X-Signature if device.secret present
  static webhookHandler = ErrorMiddleware.asyncHandler(async (req, res) => {
    // Ensure DB connection (in case called from background worker)
    await connectDB();

    const rawBody = req.body;
    const deviceIdHeader = req.headers['x-device-id'] || rawBody.device_id;
    if (!deviceIdHeader) return ApiResponse.validationError(res, { device_id: ['device_id missing'] });

    const device = await TimeDevice.findOne({ device_id: deviceIdHeader });
    if (!device) {
      // save orphan raw event with no device reference
      await OrphanTimeEvent.create({
        raw_device_id: deviceIdHeader,
        badge: rawBody.badge,
        timestamp: rawBody.timestamp ? new Date(rawBody.timestamp) : new Date(),
        payload: rawBody
      });
      return ApiResponse.notFound(res, 'Unknown device');
    }

    // Verify signature if device.secret is set
    const secret = device.secret || process.env.TIME_DEVICE_SECRET || '';
    if (secret) {
      const signature = req.headers['x-signature'];
      if (!signature) return ApiResponse.forbidden(res, 'Missing signature');
      const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(rawBody)).digest('hex');
      if (computed !== signature) {
        console.warn('Invalid signature for device', device.device_id);
        return ApiResponse.forbidden(res, 'Invalid signature');
      }
    }

    // Map badge -> user/employee
    const badge = rawBody.badge;
    let user = null;
    let employee = null;

    // Try find user by username within tenant
    user = await User.findOne({ username: badge, tenant_id: device.tenant_id });
    if (user) {
      employee = await Employee.findOne({ user_id: user._id });
    }

    // If not found, try match by phone or email
    if (!user) {
      user = await User.findOne({ phone: badge, tenant_id: device.tenant_id });
      if (!user) user = await User.findOne({ email: badge, tenant_id: device.tenant_id });
      if (user) employee = await Employee.findOne({ user_id: user._id });
    }

    // If still not found, save as orphan
    if (!employee) {
      await OrphanTimeEvent.create({
        device_id: device._id,
        raw_device_id: device.device_id,
        tenant_id: device.tenant_id,
        badge,
        timestamp: rawBody.timestamp ? new Date(rawBody.timestamp) : new Date(),
        payload: rawBody
      });
      return ApiResponse.success(res, { status: 'orphan_saved' }, 'Orphan event saved', 202);
    }

    // Create attendance record anchored to device.tenant_id and device.project_id
    const attendance = await Attendance.create({
      employee_id: employee._id,
      user_id: user ? user._id : undefined,
      tenant_id: device.tenant_id,
      project_id: device.project_id,
      device_id: device._id,
      raw_device_id: device.device_id,
      badge,
      timestamp: rawBody.timestamp ? new Date(rawBody.timestamp) : new Date(),
      type: rawBody.type || 'unknown',
      raw_payload: rawBody
    });

    return ApiResponse.success(res, attendance, 'Attendance recorded', 201);
  });
}

module.exports = TimeWebhookController;


