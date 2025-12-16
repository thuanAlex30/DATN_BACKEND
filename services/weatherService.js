const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const cache = new NodeCache({
  stdTTL: Number(process.env.OPEN_METEO_CACHE_TTL_SECONDS) || 600,
  checkperiod: 120,
});

const OPEN_METEO_BASE_URL = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';

class WeatherService {
  static buildCacheKey(params) {
    return `weather:${params.latitude}:${params.longitude}:${params.current}:${params.hourly || ''}`;
  }

  static async fetchCurrentWeather(params) {
    const latitude =
      params.latitude ?? Number(process.env.WEATHER_DEFAULT_LAT) ?? 16.0471;
    const longitude =
      params.longitude ?? Number(process.env.WEATHER_DEFAULT_LON) ?? 108.2068;

    const normalizedParams = {
      latitude,
      longitude,
      current_weather: true,
      hourly: 'precipitation',
      timezone: params.timezone ?? 'auto',
    };

    const cacheKey = WeatherService.buildCacheKey(normalizedParams);
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startedAt = Date.now();
    try {
      const { data } = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, { 
        params: normalizedParams,
        timeout: 10000
      });
      const latencyMs = Date.now() - startedAt;

      // Get current precipitation from hourly data
      let currentPrecipitation = 0;
      if (data.hourly && data.hourly.precipitation && data.hourly.time) {
        const currentTime = data.current_weather.time;
        const timeIndex = data.hourly.time.findIndex(t => t === currentTime);
        if (timeIndex !== -1 && data.hourly.precipitation[timeIndex] !== undefined) {
          currentPrecipitation = data.hourly.precipitation[timeIndex];
        }
      }

      const response = {
        provider: 'open-meteo',
        fetchedAt: new Date().toISOString(),
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          utcOffsetSeconds: data.utc_offset_seconds,
        },
        current: {
          ...data.current_weather,
          precipitation: currentPrecipitation,
        },
        latencyMs,
        raw: process.env.NODE_ENV === 'development' ? data : undefined,
        stale: false,
      };

      cache.set(cacheKey, response);
      logger.info('Weather fetched', { latencyMs, cacheKey });
      return response;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const cachedFallback = cache.get(cacheKey);
      if (cachedFallback) {
        logger.warn('Weather API failed, serving stale cache', {
          latencyMs,
          cacheKey,
          error: error.message,
        });
        return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
      }

      logger.error('Weather API error', {
        latencyMs,
        cacheKey,
        message: error.message,
        status: error.response?.status,
      });

      throw {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.error || 'Failed to fetch weather data',
        feature: 'weather'
      };
    }
  }

  static async fetchForecast(params) {
    const latitude =
      params.latitude ?? Number(process.env.WEATHER_DEFAULT_LAT) ?? 16.0471;
    const longitude =
      params.longitude ?? Number(process.env.WEATHER_DEFAULT_LON) ?? 108.2068;

    const normalizedParams = {
      latitude,
      longitude,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum',
      timezone: params.timezone ?? 'auto',
      forecast_days: 7,
    };

    const cacheKey = `forecast:${latitude}:${longitude}:7days`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startedAt = Date.now();
    try {
      const { data } = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: normalizedParams,
        timeout: 10000
      });
      const latencyMs = Date.now() - startedAt;

      // Process daily forecast data
      const dailyForecast = [];
      if (data.daily && data.daily.time) {
        for (let i = 0; i < data.daily.time.length; i++) {
          dailyForecast.push({
            date: data.daily.time[i],
            weathercode: data.daily.weathercode[i],
            temperature_max: data.daily.temperature_2m_max[i],
            temperature_min: data.daily.temperature_2m_min[i],
            windspeed_max: data.daily.windspeed_10m_max[i],
            precipitation_sum: data.daily.precipitation_sum[i] || 0,
          });
        }
      }

      const response = {
        provider: 'open-meteo',
        fetchedAt: new Date().toISOString(),
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          utcOffsetSeconds: data.utc_offset_seconds,
        },
        daily: dailyForecast,
        latencyMs,
        stale: false,
      };

      cache.set(cacheKey, response, 3600); // Cache 1 hour for forecast
      logger.info('Weather forecast fetched', { latencyMs, cacheKey });
      return response;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const cachedFallback = cache.get(cacheKey);
      if (cachedFallback) {
        logger.warn('Weather forecast API failed, serving stale cache', {
          latencyMs,
          cacheKey,
          error: error.message,
        });
        return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
      }

      logger.error('Weather forecast API error', {
        latencyMs,
        cacheKey,
        message: error.message,
        status: error.response?.status,
      });

      throw {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.error || 'Failed to fetch weather forecast',
        feature: 'weather-forecast'
      };
    }
  }
}

module.exports = WeatherService;

