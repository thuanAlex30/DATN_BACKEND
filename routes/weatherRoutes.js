const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RoleMiddleware = require('../middlewares/RoleMiddleware');
const WeatherController = require('../controllers/weatherController');

const router = express.Router();

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate);

// Get current weather - available to all authenticated users
router.get(
  '/current',
  WeatherController.getCurrent
);

// Get equipment suggestions based on weather - available to all authenticated users
router.get(
  '/equipment-suggestions',
  WeatherController.getEquipmentSuggestions
);

// Get 7-day weather forecast - available to all authenticated users
router.get(
  '/forecast',
  WeatherController.getForecast
);

// Get hourly weather forecast - available to all authenticated users
router.get(
  '/hourly',
  WeatherController.getHourly
);

// Get air quality data - available to all authenticated users
router.get(
  '/air-quality',
  WeatherController.getAirQuality
);

module.exports = router;

