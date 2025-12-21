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

    return await EnhancedApiResponse.success(res, weather, 'Current weather retrieved');
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

    return await EnhancedApiResponse.success(res, {
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

    return await EnhancedApiResponse.success(res, forecast, 'Weather forecast retrieved');
  });
}

module.exports = WeatherController;

