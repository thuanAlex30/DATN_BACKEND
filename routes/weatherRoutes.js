const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RoleMiddleware = require('../middlewares/RoleMiddleware');
const WeatherController = require('../controllers/weatherController');
const WeatherAlertController = require('../controllers/weatherAlertController');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate);

// Get current weather - available to all authenticated users
router.get(
  '/current',
  ValidationMiddleware.validateQuery(
    Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      timezone: Joi.string().optional()
    })
  ),
  WeatherController.getCurrent
);

// Get equipment suggestions based on weather - available to all authenticated users
router.get(
  '/equipment-suggestions',
  ValidationMiddleware.validateQuery(
    Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      timezone: Joi.string().optional()
    })
  ),
  WeatherController.getEquipmentSuggestions
);

// Get 7-day weather forecast - available to all authenticated users
router.get(
  '/forecast',
  ValidationMiddleware.validateQuery(
    Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      timezone: Joi.string().optional()
    })
  ),
  WeatherController.getForecast
);

// Get hourly weather forecast - available to all authenticated users
router.get(
  '/hourly',
  ValidationMiddleware.validateQuery(
    Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      hours: Joi.number().integer().min(1).max(240).optional(),
      timezone: Joi.string().optional()
    })
  ),
  WeatherController.getHourly
);

// Get air quality data - available to all authenticated users
router.get(
  '/air-quality',
  ValidationMiddleware.validateQuery(
    Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      timezone: Joi.string().optional()
    })
  ),
  WeatherController.getAirQuality
);

// =====================
// Weather Alerts Routes
// =====================

// Get active alerts - available to all authenticated users
router.get(
  '/alerts/active',
  ValidationMiddleware.validateQuery(
    Joi.object({
      alert_type: Joi.string().optional(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
    })
  ),
  WeatherAlertController.getActiveAlerts
);

// Get all alerts with pagination - available to all authenticated users
router.get(
  '/alerts',
  ValidationMiddleware.validateQuery(
    Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      alert_type: Joi.string().optional(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
      is_active: Joi.boolean().optional(),
      start_date: Joi.date().optional(),
      end_date: Joi.date().optional()
    })
  ),
  WeatherAlertController.getAllAlerts
);

// Manually check weather and create alerts - available to all authenticated users
router.post(
  '/alerts/check',
  ValidationMiddleware.validateBody(
    Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      name: Joi.string().optional()
    })
  ),
  WeatherAlertController.checkWeather
);

// Resolve an alert - available to all authenticated users
router.post(
  '/alerts/:id/resolve',
  ValidationMiddleware.validateParams(
    Joi.object({
      id: Joi.string().required()
    })
  ),
  WeatherAlertController.resolveAlert
);

// Get alert statistics - available to all authenticated users
router.get(
  '/alerts/statistics',
  ValidationMiddleware.validateQuery(
    Joi.object({
      days: Joi.number().integer().min(1).max(30).optional()
    })
  ),
  WeatherAlertController.getStatistics
);

module.exports = router;

