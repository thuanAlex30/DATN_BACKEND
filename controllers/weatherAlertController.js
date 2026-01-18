const EnhancedApiResponse = require('../utils/enhancedResponse');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const WeatherAlertService = require('../services/weatherAlertService');

class WeatherAlertController {
  /**
   * Get active weather alerts for current tenant
   * GET /api/integrations/weather/alerts/active
   */
  static getActiveAlerts = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;
    const { alert_type, severity } = req.query;

    if (!tenantId) {
      return EnhancedApiResponse.error(res, 'Tenant ID is required', 400);
    }

    const filters = {};
    if (alert_type) filters.alert_type = alert_type;
    if (severity) filters.severity = severity;

    const alerts = await WeatherAlertService.getActiveAlerts(tenantId, filters);

    return EnhancedApiResponse.success(res, alerts, 'Active alerts retrieved');
  });

  /**
   * Get all alerts (active and resolved) with pagination
   * GET /api/integrations/weather/alerts
   */
  static getAllAlerts = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;
    const { 
      page = 1, 
      limit = 20, 
      alert_type, 
      severity, 
      is_active,
      start_date,
      end_date
    } = req.query;

    if (!tenantId) {
      return EnhancedApiResponse.error(res, 'Tenant ID is required', 400);
    }

    const WeatherAlert = require('../models/weatherAlert');
    const query = { tenant_id: tenantId };

    if (alert_type) query.alert_type = alert_type;
    if (severity) query.severity = severity;
    if (is_active !== undefined) query.is_active = is_active === 'true';

    // Date range filter
    if (start_date || end_date) {
      query.triggered_at = {};
      if (start_date) query.triggered_at.$gte = new Date(start_date);
      if (end_date) query.triggered_at.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      WeatherAlert.find(query)
        .sort({ triggered_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      WeatherAlert.countDocuments(query)
    ]);

    return EnhancedApiResponse.success(
      res,
      {
        alerts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      'Alerts retrieved'
    );
  });

  /**
   * Manually check weather and create alerts for a location
   * POST /api/integrations/weather/alerts/check
   */
  static checkWeather = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;
    const { latitude, longitude, name } = req.body;

    if (!tenantId) {
      return EnhancedApiResponse.error(res, 'Tenant ID is required', 400);
    }

    if (!latitude || !longitude) {
      return EnhancedApiResponse.error(res, 'Latitude and longitude are required', 400);
    }

    const result = await WeatherAlertService.checkAndCreateAlerts(
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude), name: name || 'Custom Location' },
      tenantId
    );

    return EnhancedApiResponse.success(res, result, 'Weather check completed');
  });

  /**
   * Resolve an alert
   * POST /api/integrations/weather/alerts/:id/resolve
   */
  static resolveAlert = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;

    if (!tenantId) {
      return EnhancedApiResponse.error(res, 'Tenant ID is required', 400);
    }

    const alert = await WeatherAlertService.resolveAlert(id, tenantId);

    if (!alert) {
      return EnhancedApiResponse.error(res, 'Alert not found or already resolved', 404);
    }

    return EnhancedApiResponse.success(res, alert, 'Alert resolved');
  });

  /**
   * Get alert statistics
   * GET /api/integrations/weather/alerts/statistics
   */
  static getStatistics = ErrorMiddleware.asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;
    const { days = 7 } = req.query;

    if (!tenantId) {
      return EnhancedApiResponse.error(res, 'Tenant ID is required', 400);
    }

    const stats = await WeatherAlertService.getAlertStatistics(tenantId, parseInt(days));

    return EnhancedApiResponse.success(res, stats, 'Alert statistics retrieved');
  });
}

module.exports = WeatherAlertController;

