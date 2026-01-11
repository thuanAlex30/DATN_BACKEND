const crypto = require('crypto');
const mongoose = require('mongoose');
const WeatherAlert = require('../models/weatherAlert');
const WeatherService = require('./weatherService');
const RealtimeNotificationService = require('./realtimeNotificationService');
const logger = require('../utils/logger');
const User = require('../models/user');

class WeatherAlertService {
  /**
   * Generate condition hash for deduplication
   */
  static generateConditionHash(alertType, location, weatherData) {
    const hashData = {
      alert_type: alertType,
      latitude: location.latitude,
      longitude: location.longitude,
      // Include relevant weather data for this alert type
      temperature: weatherData.temperature,
      windspeed: weatherData.windspeed,
      weathercode: weatherData.weathercode,
      uv_index: weatherData.uv_index,
      visibility: weatherData.visibility,
      air_quality_aqi: weatherData.air_quality_aqi
    };
    return crypto.createHash('md5').update(JSON.stringify(hashData)).digest('hex');
  }

  /**
   * Detect dangerous weather conditions and create alerts
   */
  static async detectWeatherConditions(weatherData, airQualityData, location, tenantId) {
    const alerts = [];
    const current = weatherData.current || {};
    const aqi = airQualityData?.current?.us_aqi ?? airQualityData?.current?.european_aqi ?? null;

    const locationObj = {
      name: location.name || 'Default Location',
      latitude: location.latitude,
      longitude: location.longitude
    };

    const weatherDataForHash = {
      temperature: current.temperature,
      windspeed: current.windspeed,
      weathercode: current.weathercode,
      uv_index: current.uv_index,
      visibility: current.visibility,
      air_quality_aqi: aqi,
      precipitation: current.precipitation,
      windgusts: current.windgusts_10m
    };

    // 1. High Temperature Alert
    if (current.temperature >= 38) {
      const severity = current.temperature >= 40 ? 'critical' : current.temperature >= 39 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'high_temperature',
        severity,
        title: `Cảnh báo nhiệt độ cao: ${current.temperature.toFixed(1)}°C`,
        message: `Nhiệt độ hiện tại rất cao (${current.temperature.toFixed(1)}°C). Cần uống nhiều nước, tránh hoạt động ngoài trời vào giờ cao điểm, và chuẩn bị thiết bị chống nắng.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          temperature: current.temperature
        },
        condition_hash: this.generateConditionHash('high_temperature', locationObj, weatherDataForHash)
      });
    }

    // 2. Low Temperature Alert
    if (current.temperature <= 5) {
      const severity = current.temperature <= 0 ? 'critical' : 'high';
      alerts.push({
        alert_type: 'low_temperature',
        severity,
        title: `Cảnh báo nhiệt độ thấp: ${current.temperature.toFixed(1)}°C`,
        message: `Nhiệt độ hiện tại rất thấp (${current.temperature.toFixed(1)}°C). Cần mặc ấm, tránh tiếp xúc lâu với không khí lạnh, và chuẩn bị thiết bị giữ ấm.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          temperature: current.temperature
        },
        condition_hash: this.generateConditionHash('low_temperature', locationObj, weatherDataForHash)
      });
    }

    // 3. High Wind Alert
    const windSpeed = current.windspeed || 0;
    const windGusts = current.windgusts_10m || 0;
    if (windSpeed >= 50 || windGusts >= 60) {
      const severity = windSpeed >= 70 || windGusts >= 80 ? 'critical' : windSpeed >= 60 || windGusts >= 70 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'high_wind',
        severity,
        title: `Cảnh báo gió mạnh: ${windSpeed.toFixed(1)} km/h${windGusts > 0 ? ` (gió giật ${windGusts.toFixed(1)} km/h)` : ''}`,
        message: `Gió mạnh (${windSpeed.toFixed(1)} km/h${windGusts > 0 ? `, gió giật ${windGusts.toFixed(1)} km/h` : ''}). Cần cẩn thận khi làm việc trên cao, cố định vật dụng, và tránh làm việc ngoài trời khi gió quá mạnh.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          windspeed: windSpeed,
          windgusts: windGusts
        },
        condition_hash: this.generateConditionHash('high_wind', locationObj, weatherDataForHash)
      });
    }

    // 4. Heavy Rain Alert
    const weatherCode = current.weathercode || 0;
    const precipitation = current.precipitation || 0;
    if ([80, 81, 82].includes(weatherCode) || precipitation > 10) {
      const severity = weatherCode === 82 || precipitation > 20 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'heavy_rain',
        severity,
        title: 'Cảnh báo mưa lớn',
        message: `Đang có mưa lớn (${precipitation > 0 ? `${precipitation.toFixed(1)}mm` : 'theo dự báo'}). Cần chuẩn bị thiết bị chống nước, cẩn thận khi lái xe, và tránh làm việc ngoài trời.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          precipitation,
          weathercode: weatherCode
        },
        condition_hash: this.generateConditionHash('heavy_rain', locationObj, weatherDataForHash)
      });
    }

    // 5. Thunderstorm Alert
    if ([95, 96, 99].includes(weatherCode)) {
      alerts.push({
        alert_type: 'thunderstorm',
        severity: 'critical',
        title: 'Cảnh báo dông bão',
        message: 'Đang có dông bão. Cần ngừng mọi hoạt động ngoài trời, tìm nơi trú ẩn an toàn, tránh các vật dụng kim loại, và tắt các thiết bị điện khi không cần thiết.',
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          weathercode: weatherCode
        },
        condition_hash: this.generateConditionHash('thunderstorm', locationObj, weatherDataForHash)
      });
    }

    // 6. High UV Alert
    const uvIndex = current.uv_index;
    if (uvIndex !== null && uvIndex !== undefined && uvIndex >= 8) {
      const severity = uvIndex >= 11 ? 'critical' : uvIndex >= 10 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'high_uv',
        severity,
        title: `Cảnh báo UV cao: ${uvIndex.toFixed(1)}`,
        message: `Chỉ số UV rất cao (${uvIndex.toFixed(1)}). Cần bắt buộc thoa kem chống nắng, đội mũ nón, đeo kính râm, và tránh tiếp xúc trực tiếp với ánh nắng từ 10h-16h.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          uv_index: uvIndex
        },
        condition_hash: this.generateConditionHash('high_uv', locationObj, weatherDataForHash)
      });
    }

    // 7. Poor Air Quality Alert
    if (aqi !== null && aqi > 150) {
      const severity = aqi > 300 ? 'critical' : aqi > 200 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'poor_air_quality',
        severity,
        title: `Cảnh báo chất lượng không khí kém: AQI ${aqi}`,
        message: `Chất lượng không khí kém (AQI: ${aqi}). Nhóm nhạy cảm nên ở trong nhà. Tất cả mọi người nên hạn chế hoạt động ngoài trời và đeo khẩu trang N95 nếu phải ra ngoài.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          air_quality_aqi: aqi
        },
        condition_hash: this.generateConditionHash('poor_air_quality', locationObj, weatherDataForHash)
      });
    }

    // 8. Low Visibility Alert
    const visibility = current.visibility;
    if (visibility !== null && visibility !== undefined && visibility < 1) {
      const severity = visibility < 0.5 ? 'high' : 'medium';
      alerts.push({
        alert_type: 'low_visibility',
        severity,
        title: `Cảnh báo tầm nhìn kém: ${visibility.toFixed(1)} km`,
        message: `Tầm nhìn rất thấp (${visibility.toFixed(1)} km). Cần mặc áo phản quang, sử dụng đèn pin, cẩn thận khi lái xe hoặc làm việc ngoài trời.`,
        location: locationObj,
        weather_data: {
          ...weatherDataForHash,
          visibility
        },
        condition_hash: this.generateConditionHash('low_visibility', locationObj, weatherDataForHash)
      });
    }

    return alerts;
  }

  /**
   * Create alerts for a location and send notifications
   */
  static async checkAndCreateAlerts(location, tenantId) {
    try {
      const { latitude, longitude, name } = location;

      // Fetch current weather and air quality
      const [weatherData, airQualityData] = await Promise.all([
        WeatherService.fetchCurrentWeather({ latitude, longitude }),
        WeatherService.fetchAirQuality({ latitude, longitude }).catch(() => null) // Air quality is optional
      ]);

      // Detect dangerous conditions
      const detectedAlerts = await this.detectWeatherConditions(
        weatherData,
        airQualityData,
        { latitude, longitude, name: name || 'Default Location' },
        tenantId
      );

      const createdAlerts = [];

      // Create alerts (with deduplication)
      for (const alertData of detectedAlerts) {
        // Check for duplicate alert
        const existingAlert = await WeatherAlert.findDuplicateAlert(
          alertData.condition_hash,
          tenantId,
          { latitude, longitude }
        );

        if (!existingAlert) {
          // Create new alert
          const alert = await WeatherAlert.createAlert({
            ...alertData,
            tenant_id: tenantId
          });
          createdAlerts.push(alert);

          // Send notifications
          await this.sendAlertNotifications(alert, tenantId);
        } else {
          // Update last notification sent time if needed (for repeat notifications)
          logger.debug('Duplicate alert detected, skipping creation', {
            alert_type: alertData.alert_type,
            location: { latitude, longitude }
          });
        }
      }

      // Auto-resolve alerts that no longer match conditions
      await this.autoResolveAlerts(location, tenantId, detectedAlerts);

      return {
        checked: true,
        alerts_detected: detectedAlerts.length,
        alerts_created: createdAlerts.length,
        created_alerts: createdAlerts
      };
    } catch (error) {
      logger.error('Error checking and creating weather alerts:', error);
      throw error;
    }
  }

  /**
   * Send notifications for a weather alert
   */
  static async sendAlertNotifications(alert, tenantId) {
    try {
      // Get all active users in tenant
      const users = await User.find({
        tenant_id: tenantId,
        is_active: true
      }).select('_id');

      if (users.length === 0) {
        logger.warn('No active users found in tenant for weather alert', { tenantId });
        return;
      }

      const userIds = users.map(u => u._id);

      // Map alert severity to notification priority
      const priorityMap = {
        low: 'low',
        medium: 'medium',
        high: 'high',
        critical: 'urgent'
      };

      // Map alert type to notification type
      const typeMap = {
        high_temperature: 'warning',
        low_temperature: 'warning',
        high_wind: 'warning',
        heavy_rain: 'warning',
        thunderstorm: 'error',
        high_uv: 'warning',
        poor_air_quality: 'error',
        low_visibility: 'warning',
        extreme_weather: 'error'
      };

      // Send notifications to all users in tenant
      await RealtimeNotificationService.sendToUsers({
        userIds,
        title: alert.title,
        message: alert.message,
        type: typeMap[alert.alert_type] || 'warning',
        category: 'safety',
        priority: priorityMap[alert.severity] || 'medium',
        tenantId,
        actionUrl: `/weather/alerts/${alert._id}`,
        data: {
          alert_id: alert._id.toString(),
          alert_type: alert.alert_type,
          severity: alert.severity,
          location: alert.location
        }
      });

      // Update alert notification tracking
      alert.notifications_sent = (alert.notifications_sent || 0) + 1;
      alert.last_notification_sent_at = new Date();
      await alert.save();

      logger.info('Weather alert notifications sent', {
        alert_id: alert._id,
        tenant_id: tenantId,
        users_count: userIds.length
      });
    } catch (error) {
      logger.error('Error sending weather alert notifications:', error);
      // Don't throw - notification failure shouldn't block alert creation
    }
  }

  /**
   * Auto-resolve alerts that no longer match conditions
   */
  static async autoResolveAlerts(location, tenantId, currentAlerts) {
    try {
      const { latitude, longitude } = location;

      // Get all active alerts for this location
      const activeAlerts = await WeatherAlert.findActiveAlerts(tenantId, {
        'location.latitude': latitude,
        'location.longitude': longitude
      });

      // Get current alert types
      const currentAlertTypes = new Set(currentAlerts.map(a => a.alert_type));

      // Resolve alerts that are no longer active
      for (const alert of activeAlerts) {
        if (!currentAlertTypes.has(alert.alert_type)) {
          await alert.resolve();
          logger.info('Auto-resolved weather alert', {
            alert_id: alert._id,
            alert_type: alert.alert_type
          });
        }
      }
    } catch (error) {
      logger.error('Error auto-resolving weather alerts:', error);
      // Don't throw - auto-resolve failure shouldn't block alert creation
    }
  }

  /**
   * Get active alerts for tenant
   */
  static async getActiveAlerts(tenantId, filters = {}) {
    try {
      return await WeatherAlert.findActiveAlerts(tenantId, filters);
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert manually
   */
  static async resolveAlert(alertId, tenantId) {
    try {
      const alert = await WeatherAlert.resolveAlert(alertId, tenantId);
      if (!alert) {
        throw new Error('Alert not found or already resolved');
      }
      return alert;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStatistics(tenantId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await WeatherAlert.aggregate([
        {
          $match: {
            tenant_id: mongoose.Types.ObjectId.isValid(tenantId) 
              ? new mongoose.Types.ObjectId(tenantId) 
              : tenantId,
            triggered_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$alert_type',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error getting alert statistics:', error);
      throw error;
    }
  }
}

module.exports = WeatherAlertService;

