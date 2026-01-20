const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Increase cache TTL to reduce API calls and avoid 429 rate limits
// Default: 30 minutes (1800 seconds), can be overridden via OPEN_METEO_CACHE_TTL_SECONDS
// Weather data doesn't change frequently, so 30 minutes is reasonable
const cache = new NodeCache({
  stdTTL: Number(process.env.OPEN_METEO_CACHE_TTL_SECONDS) || 1800, // 30 minutes default (increased from 15)
  checkperiod: 120,
  useClones: false, // Better performance for large objects
});

// Helper to safely parse latitude/longitude with fallbacks
function parseCoordinate(value, envVar, defaultValue) {
  if (value !== undefined && value !== null && value !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  const envN = Number(process.env[envVar]);
  if (Number.isFinite(envN)) return envN;
  return defaultValue;
}

function extractApiMessage(respData) {
  if (respData === undefined || respData === null) return null;
  if (typeof respData === 'string') return respData;
  if (typeof respData === 'boolean') {
    // Boolean true/false should not be used as error messages
    return null; // Return null to use fallback message
  }
  if (typeof respData === 'number') return `Provider returned ${String(respData)}`;
  if (typeof respData === 'object') {
    // Check if message is a meaningful string, not boolean
    const errorMsg = respData.error ?? respData.message;
    if (typeof errorMsg === 'string' && errorMsg.trim()) {
      return errorMsg;
    }
    if (typeof errorMsg === 'boolean') {
      // Don't use boolean as message
      return null;
    }
    return JSON.stringify(respData);
  }
  return null;
}

const OPEN_METEO_BASE_URL = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';
const AIR_QUALITY_BASE_URL = process.env.AIR_QUALITY_BASE_URL || 'https://air-quality-api.open-meteo.com/v1';

class WeatherService {
  static buildCacheKey(params) {
    return `weather:${params.latitude}:${params.longitude}:${params.current}:${params.hourly || ''}`;
  }

  static async fetchCurrentWeather(params) {
    const latitude = parseCoordinate(params.latitude, 'WEATHER_DEFAULT_LAT', 16.0471);
    const longitude = parseCoordinate(params.longitude, 'WEATHER_DEFAULT_LON', 108.2068);

    const normalizedParams = {
      latitude,
      longitude,
      current_weather: true,
      hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,cloudcover,windspeed_10m,winddirection_10m,windgusts_10m,uv_index,visibility,is_day,dewpoint_2m',
      daily: 'uv_index_max,sunrise,sunset',
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

      // Get current data from hourly data
      let currentPrecipitation = 0;
      let currentUVIndex = null;
      let currentVisibility = null;
      let currentHumidity = null;
      let currentApparentTemperature = null;
      let currentWindGusts = null;
      
      if (data.hourly && data.hourly.time) {
        const currentTime = data.current_weather.time;
        const timeIndex = data.hourly.time.findIndex(t => t === currentTime);
        if (timeIndex !== -1) {
          currentPrecipitation = data.hourly.precipitation?.[timeIndex] || 0;
          currentUVIndex = data.hourly.uv_index?.[timeIndex] ?? null;
          currentVisibility = data.hourly.visibility?.[timeIndex] ?? null;
          currentHumidity = data.hourly.relativehumidity_2m?.[timeIndex] ?? null;
          currentApparentTemperature = data.hourly.apparent_temperature?.[timeIndex] ?? null;
          currentWindGusts = data.hourly.windgusts_10m?.[timeIndex] ?? null;
        }
      }

      // Get UV max from daily data
      let uvIndexMax = null;
      if (data.daily && data.daily.uv_index_max && data.daily.time) {
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = data.daily.time.findIndex(d => d.startsWith(today));
        if (todayIndex !== -1) {
          uvIndexMax = data.daily.uv_index_max[todayIndex];
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
          uv_index: currentUVIndex,
          visibility: currentVisibility,
          relativehumidity_2m: currentHumidity,
          apparent_temperature: currentApparentTemperature,
          windgusts_10m: currentWindGusts,
          uv_index_max: uvIndexMax,
          sunrise: data.daily?.sunrise?.[0] || null,
          sunset: data.daily?.sunset?.[0] || null,
        },
        latencyMs,
        raw: process.env.NODE_ENV === 'development' ? data : undefined,
        stale: false,
      };

      cache.set(cacheKey, response);
      logger.info('Weather fetched', { latencyMs, cacheKey });
      return response;
    } catch (error) {
      // If Open-Meteo returned 400 (likely invalid timezone or params), try a safe retry with timezone='auto'
      if (error.response?.status === 400 && normalizedParams.timezone !== 'auto') {
        try {
          logger.warn('Weather API 400 received, retrying with timezone=auto', { cacheKey });
          const safeParams = { ...normalizedParams, timezone: 'auto' };
          const { data } = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
            params: safeParams,
            timeout: 10000
          });

          // compute currentPrecipitation as before
          let currentPrecipitation = 0;
          if (data.hourly && data.hourly.precipitation && data.hourly.time) {
            const currentTime = data.current_weather.time;
            const timeIndex = data.hourly.time.findIndex(t => t === currentTime);
            if (timeIndex !== -1 && data.hourly.precipitation[timeIndex] !== undefined) {
              currentPrecipitation = data.hourly.precipitation[timeIndex];
            }
          }

          const latencyMs = Date.now() - startedAt;
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
          logger.info('Weather fetched (retry)', { latencyMs, cacheKey });
          return response;
        } catch (retryErr) {
          // fall through to existing error handling below
          logger.warn('Retry with timezone=auto also failed', { cacheKey, message: retryErr.message });
          error = retryErr;
        }
      }
      const latencyMs = Date.now() - startedAt;
      const statusCode = error.response?.status;
      
      // Handle 429 (Rate Limit) - serve stale cache immediately, don't retry
      if (statusCode === 429) {
        const cachedFallback = cache.get(cacheKey);
        if (cachedFallback) {
          logger.warn('Weather API rate limited (429), serving stale cache', {
            latencyMs,
            cacheKey,
            error: error.message,
          });
          return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
        }
        // If no cache, return error with helpful message
        logger.error('Weather API rate limited (429) and no cache available', {
          latencyMs,
          cacheKey,
          message: error.message,
        });
        throw {
          statusCode: 429,
          message: 'Weather API rate limit exceeded. Please try again later.',
          feature: 'weather',
          retryAfter: error.response?.headers?.['retry-after'] || 60
        };
      }

      // For other errors, try to serve stale cache
      const cachedFallback = cache.get(cacheKey);
      if (cachedFallback) {
        logger.warn('Weather API failed, serving stale cache', {
          latencyMs,
          cacheKey,
          error: error.message,
          status: statusCode,
        });
        return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
      }

      logger.error('Weather API error', {
        latencyMs,
        cacheKey,
        message: error.message,
        status: statusCode,
      });

      throw {
        statusCode: statusCode || 500,
        message: extractApiMessage(error.response?.data) || error.message || 'Failed to fetch weather data',
        feature: 'weather'
      };
    }
  }

  static async fetchForecast(params) {
    const latitude = parseCoordinate(params.latitude, 'WEATHER_DEFAULT_LAT', 16.0471);
    const longitude = parseCoordinate(params.longitude, 'WEATHER_DEFAULT_LON', 108.2068);

    const normalizedParams = {
      latitude,
      longitude,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_hours,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant',
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
            apparent_temperature_max: data.daily.apparent_temperature_max?.[i] ?? null,
            apparent_temperature_min: data.daily.apparent_temperature_min?.[i] ?? null,
            windspeed_max: data.daily.windspeed_10m_max[i],
            windgusts_max: data.daily.windgusts_10m_max?.[i] ?? null,
            winddirection_dominant: data.daily.winddirection_10m_dominant?.[i] ?? null,
            precipitation_sum: data.daily.precipitation_sum[i] || 0,
            precipitation_hours: data.daily.precipitation_hours?.[i] ?? 0,
            precipitation_probability_max: data.daily.precipitation_probability_max?.[i] ?? null,
            uv_index_max: data.daily.uv_index_max?.[i] ?? null,
            sunrise: data.daily.sunrise?.[i] || null,
            sunset: data.daily.sunset?.[i] || null,
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

      cache.set(cacheKey, response, 3600 * 2); // Cache 2 hours for forecast (reduced API calls)
      logger.info('Weather forecast fetched', { latencyMs, cacheKey });
      return response;
    } catch (error) {
      // If Open-Meteo returned 400 (likely invalid timezone or params), try a safe retry with timezone='auto'
      if (error.response?.status === 400 && normalizedParams.timezone !== 'auto') {
        try {
          logger.warn('Weather forecast API 400 received, retrying with timezone=auto', { cacheKey });
          const safeParams = { ...normalizedParams, timezone: 'auto' };
          const { data } = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
            params: safeParams,
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

          cache.set(cacheKey, response, 3600 * 2); // Cache 2 hours for forecast (reduced API calls)
          logger.info('Weather forecast fetched (retry)', { latencyMs, cacheKey });
          return response;
        } catch (retryErr) {
          // fall through to existing error handling below
          logger.warn('Retry forecast with timezone=auto also failed', { cacheKey, message: retryErr.message });
          error = retryErr;
        }
      }
      const latencyMs = Date.now() - startedAt;
      const statusCode = error.response?.status;
      
      // Handle 429 (Rate Limit) - serve stale cache immediately
      if (statusCode === 429) {
        const cachedFallback = cache.get(cacheKey);
        if (cachedFallback) {
          logger.warn('Weather forecast API rate limited (429), serving stale cache', {
            latencyMs,
            cacheKey,
            error: error.message,
          });
          return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
        }
        logger.error('Weather forecast API rate limited (429) and no cache available', {
          latencyMs,
          cacheKey,
          message: error.message,
        });
        throw {
          statusCode: 429,
          message: 'Weather API rate limit exceeded. Please try again later.',
          feature: 'weather-forecast',
          retryAfter: error.response?.headers?.['retry-after'] || 60
        };
      }

      // For other errors, try to serve stale cache
      const cachedFallback = cache.get(cacheKey);
      if (cachedFallback) {
        logger.warn('Weather forecast API failed, serving stale cache', {
          latencyMs,
          cacheKey,
          error: error.message,
          status: statusCode,
        });
        return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
      }

      logger.error('Weather forecast API error', {
        latencyMs,
        cacheKey,
        message: error.message,
        status: statusCode,
      });

      throw {
        statusCode: statusCode || 500,
        message: extractApiMessage(error.response?.data) || error.message || 'Failed to fetch weather forecast',
        feature: 'weather-forecast'
      };
    }
  }

  static async fetchHourlyForecast(params) {
    const latitude =
      params.latitude ?? Number(process.env.WEATHER_DEFAULT_LAT) ?? 16.0471;
    const longitude =
      params.longitude ?? Number(process.env.WEATHER_DEFAULT_LON) ?? 108.2068;
    const hours = params.hours || 24; // Default 24 hours, max 240 (10 days)

    const normalizedParams = {
      latitude,
      longitude,
      // Request all necessary fields for hourly forecast charts
      hourly: params.hourly ?? 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,cloudcover,windspeed_10m,winddirection_10m,windgusts_10m,uv_index,visibility,is_day,dewpoint_2m',
      // Default timezone to Asia/Ho_Chi_Minh per user request
      timezone: params.timezone ?? process.env.WEATHER_TIMEZONE ?? 'Asia/Ho_Chi_Minh',
      forecast_days: Math.ceil(hours / 24), // Calculate days needed
    };

    const cacheKey = `hourly:${latitude}:${longitude}:${hours}h`;
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

      // Process hourly forecast data (limit to requested hours)
      const hourlyForecast = [];
      if (data.hourly && data.hourly.time) {
        const limit = Math.min(hours, data.hourly.time.length);
        for (let i = 0; i < limit; i++) {
          hourlyForecast.push({
            time: data.hourly.time[i],
            temperature_2m: data.hourly.temperature_2m?.[i] ?? null,
            relativehumidity_2m: data.hourly.relativehumidity_2m?.[i] ?? null,
            apparent_temperature: data.hourly.apparent_temperature?.[i] ?? null,
            precipitation: data.hourly.precipitation?.[i] ?? 0,
            weathercode: data.hourly.weathercode?.[i] ?? 0,
            cloudcover: data.hourly.cloudcover?.[i] ?? null,
            pressure_msl: data.hourly.pressure_msl?.[i] ?? null,
            windspeed_10m: data.hourly.windspeed_10m?.[i] ?? 0,
            winddirection_10m: data.hourly.winddirection_10m?.[i] ?? 0,
            windgusts_10m: data.hourly.windgusts_10m?.[i] ?? null,
            uv_index: data.hourly.uv_index?.[i] ?? null,
            visibility: data.hourly.visibility?.[i] ?? null,
            is_day: data.hourly.is_day?.[i] ?? 1,
            dewpoint_2m: data.hourly.dewpoint_2m?.[i] ?? null, // Điểm sương (°C)
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
        hourly: hourlyForecast,
        latencyMs,
        stale: false,
      };

      cache.set(cacheKey, response, 3600); // Cache 1 hour for hourly (reduced API calls)
      logger.info('Hourly forecast fetched', { latencyMs, cacheKey, hours });
      return response;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const statusCode = error.response?.status;
      
      // Handle 429 (Rate Limit) - serve stale cache immediately
      if (statusCode === 429) {
        const cachedFallback = cache.get(cacheKey);
        if (cachedFallback) {
          logger.warn('Hourly forecast API rate limited (429), serving stale cache', {
            latencyMs,
            cacheKey,
            error: error.message,
          });
          return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
        }
        logger.error('Hourly forecast API rate limited (429) and no cache available', {
          latencyMs,
          cacheKey,
          message: error.message,
        });
        throw {
          statusCode: 429,
          message: 'Weather API rate limit exceeded. Please try again later.',
          feature: 'hourly-forecast',
          retryAfter: error.response?.headers?.['retry-after'] || 60
        };
      }

      // For other errors, try to serve stale cache
      const cachedFallback = cache.get(cacheKey);
      if (cachedFallback) {
        logger.warn('Hourly forecast API failed, serving stale cache', {
          latencyMs,
          cacheKey,
          error: error.message,
          status: statusCode,
        });
        return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
      }

      logger.error('Hourly forecast API error', {
        latencyMs,
        cacheKey,
        message: error.message,
        status: statusCode,
      });

      throw {
        statusCode: statusCode || 500,
        message: extractApiMessage(error.response?.data) || error.message || 'Failed to fetch hourly forecast',
        feature: 'hourly-forecast'
      };
    }
  }

  static async fetchAirQuality(params) {
    // Parse latitude safely - avoid NaN
    let latitude = 16.0471; // Default
    if (params.latitude != null && !isNaN(params.latitude) && isFinite(params.latitude)) {
      latitude = Number(params.latitude);
    } else if (process.env.WEATHER_DEFAULT_LAT) {
      const envLat = Number(process.env.WEATHER_DEFAULT_LAT);
      if (!isNaN(envLat) && isFinite(envLat)) {
        latitude = envLat;
      }
    }
    
    // Parse longitude safely - avoid NaN
    let longitude = 108.2068; // Default
    if (params.longitude != null && !isNaN(params.longitude) && isFinite(params.longitude)) {
      longitude = Number(params.longitude);
    } else if (process.env.WEATHER_DEFAULT_LON) {
      const envLon = Number(process.env.WEATHER_DEFAULT_LON);
      if (!isNaN(envLon) && isFinite(envLon)) {
        longitude = envLon;
      }
    }

    const normalizedParams = {
      latitude,
      longitude,
      current: 'pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi',
      hourly: 'pm2_5,pm10,european_aqi,us_aqi',
      timezone: params.timezone ?? 'auto',
      forecast_days: 1, // Current day only for now
    };

    const cacheKey = `airquality:${latitude}:${longitude}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startedAt = Date.now();
    try {
      const { data } = await axios.get(`${AIR_QUALITY_BASE_URL}/air-quality`, {
        params: normalizedParams,
        timeout: 10000
      });
      const latencyMs = Date.now() - startedAt;

      const response = {
        provider: 'open-meteo-air-quality',
        fetchedAt: new Date().toISOString(),
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
        },
        current: {
          pm2_5: data.current?.pm2_5 ?? null,
          pm10: data.current?.pm10 ?? null,
          carbon_monoxide: data.current?.carbon_monoxide ?? null,
          nitrogen_dioxide: data.current?.nitrogen_dioxide ?? null,
          sulphur_dioxide: data.current?.sulphur_dioxide ?? null,
          ozone: data.current?.ozone ?? null,
          european_aqi: data.current?.european_aqi ?? null,
          us_aqi: data.current?.us_aqi ?? null,
        },
        hourly: data.hourly ? {
          time: data.hourly.time || [],
          pm2_5: data.hourly.pm2_5 || [],
          pm10: data.hourly.pm10 || [],
          european_aqi: data.hourly.european_aqi || [],
          us_aqi: data.hourly.us_aqi || [],
        } : null,
        latencyMs,
        stale: false,
      };

      cache.set(cacheKey, response, 3600); // Cache 1 hour for air quality (reduced API calls)
      logger.info('Air quality fetched', { latencyMs, cacheKey });
      return response;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const statusCode = error.response?.status;
      
      // Handle 429 (Rate Limit) - serve stale cache immediately
      if (statusCode === 429) {
        const cachedFallback = cache.get(cacheKey);
        if (cachedFallback) {
          logger.warn('Air quality API rate limited (429), serving stale cache', {
            latencyMs,
            cacheKey,
            error: error.message,
          });
          return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
        }
        // Air quality is optional, return null values instead of throwing
        logger.warn('Air quality API rate limited (429) and no cache available, returning null', {
          latencyMs,
          cacheKey,
          message: error.message,
        });
      } else {
        // For other errors, try to serve stale cache
        const cachedFallback = cache.get(cacheKey);
        if (cachedFallback) {
          logger.warn('Air quality API failed, serving stale cache', {
            latencyMs,
            cacheKey,
            error: error.message,
            status: statusCode,
          });
          return { ...cachedFallback, stale: true, staleAt: new Date().toISOString() };
        }
        
        logger.error('Air quality API error', {
          latencyMs,
          cacheKey,
          message: error.message,
          status: statusCode,
        });
      }

      // Don't throw, return null values instead as AQ is optional
      return {
        provider: 'open-meteo-air-quality',
        fetchedAt: new Date().toISOString(),
        location: { latitude, longitude, timezone: 'auto' },
        current: {
          pm2_5: null,
          pm10: null,
          carbon_monoxide: null,
          nitrogen_dioxide: null,
          sulphur_dioxide: null,
          ozone: null,
          european_aqi: null,
          us_aqi: null,
        },
        hourly: null,
        latencyMs,
        stale: false,
        error: error.message,
      };
    }
  }
}

module.exports = WeatherService;

