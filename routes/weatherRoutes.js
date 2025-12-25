const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RoleMiddleware = require('../middlewares/RoleMiddleware');
const WeatherController = require('../controllers/weatherController');
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

module.exports = router;

