const EnhancedApiResponse = require('../utils/enhancedResponse');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const WeatherService = require('../services/weatherService');
const EquipmentSuggestionService = require('../services/equipmentSuggestionService');

class WeatherController {
  static getCurrent = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { latitude, longitude, timezone } = req.query;
    const tenantId = req.user?.tenant_id;

    // Parse coordinates safely, only if provided and valid
    let lat, lon;
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      if (!isNaN(parsedLat) && isFinite(parsedLat)) {
        lat = parsedLat;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLon = Number(longitude);
      if (!isNaN(parsedLon) && isFinite(parsedLon)) {
        lon = parsedLon;
      }
    }

    const weather = await WeatherService.fetchCurrentWeather({
      latitude: lat,
      longitude: lon,
      timezone: timezone || undefined,
    });

    return EnhancedApiResponse.success(res, weather, 'Current weather retrieved');
  });

  static getEquipmentSuggestions = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { latitude, longitude, timezone } = req.query;
    const tenantId = req.user?.tenant_id;

    // Parse coordinates safely, only if provided and valid
    let lat, lon;
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      if (!isNaN(parsedLat) && isFinite(parsedLat)) {
        lat = parsedLat;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLon = Number(longitude);
      if (!isNaN(parsedLon) && isFinite(parsedLon)) {
        lon = parsedLon;
      }
    }

    // Get weather data first
    const weather = await WeatherService.fetchCurrentWeather({
      latitude: lat,
      longitude: lon,
      timezone: timezone || undefined,
    });

    // Get equipment suggestions based on weather
    const suggestions = await EquipmentSuggestionService.suggestEquipment(weather, tenantId);

    return EnhancedApiResponse.success(res, {
      weather,
      suggestions: suggestions.suggestions,
      message: suggestions.message,
      conditions: suggestions.conditions,
      weatherSummary: suggestions.weather,
    }, 'Equipment suggestions retrieved');
  });

  static getForecast = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { latitude, longitude, timezone } = req.query;
    const tenantId = req.user?.tenant_id;

    // Parse coordinates safely
    let lat, lon;
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      if (!isNaN(parsedLat) && isFinite(parsedLat)) {
        lat = parsedLat;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLon = Number(longitude);
      if (!isNaN(parsedLon) && isFinite(parsedLon)) {
        lon = parsedLon;
      }
    }

    const forecast = await WeatherService.fetchForecast({
      latitude: lat,
      longitude: lon,
      timezone: timezone || undefined,
    });

    return EnhancedApiResponse.success(res, forecast, 'Weather forecast retrieved');
  });

  static getHourly = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { latitude, longitude, timezone, hours } = req.query;

    // Parse coordinates safely
    let lat, lon;
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      if (!isNaN(parsedLat) && isFinite(parsedLat)) {
        lat = parsedLat;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLon = Number(longitude);
      if (!isNaN(parsedLon) && isFinite(parsedLon)) {
        lon = parsedLon;
      }
    }

    // Parse hours (default 24, max 240)
    let hoursNum = 24;
    if (hours !== undefined && hours !== null && hours !== '') {
      const parsedHours = Number(hours);
      if (!isNaN(parsedHours) && isFinite(parsedHours) && parsedHours > 0) {
        hoursNum = Math.min(parsedHours, 240); // Max 240 hours (10 days)
      }
    }

    const hourlyForecast = await WeatherService.fetchHourlyForecast({
      latitude: lat,
      longitude: lon,
      timezone: timezone || undefined,
      hours: hoursNum,
    });

    return EnhancedApiResponse.success(res, hourlyForecast, 'Hourly forecast retrieved');
  });

  static getAirQuality = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { latitude, longitude, timezone } = req.query;

    // Parse coordinates safely
    let lat, lon;
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      if (!isNaN(parsedLat) && isFinite(parsedLat)) {
        lat = parsedLat;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLon = Number(longitude);
      if (!isNaN(parsedLon) && isFinite(parsedLon)) {
        lon = parsedLon;
      }
    }

    const airQuality = await WeatherService.fetchAirQuality({
      latitude: lat,
      longitude: lon,
      timezone: timezone || undefined,
    });

    return EnhancedApiResponse.success(res, airQuality, 'Air quality retrieved');
  });
}

module.exports = WeatherController;

