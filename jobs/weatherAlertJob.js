/**
 * Weather Alert Check Cron Job
 * Runs periodically to check weather conditions and create alerts
 */

const cron = require('node-cron');
const WeatherAlertService = require('../services/weatherAlertService');
const Tenant = require('../models/tenant');
const logger = require('../utils/logger');

class WeatherAlertJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the cron job
   */
  start() {
    if (this.job) {
      logger.warn('Weather alert check job is already running');
      return;
    }

    // Run every 1 hour (reduced from 30 minutes to avoid rate limits)
    // Format: minute hour day month dayOfWeek
    // '0 * * * *' means every hour at minute 0 (e.g., 00:00, 01:00, 02:00)
    // Can be overridden via WEATHER_ALERT_CHECK_SCHEDULE env var
    // To disable: set WEATHER_ALERT_ENABLED=false
    const isAlertEnabled = process.env.WEATHER_ALERT_ENABLED !== 'false';
    if (!isAlertEnabled) {
      logger.info('Weather alert job is disabled (WEATHER_ALERT_ENABLED=false)');
      return;
    }
    
    const schedule = process.env.WEATHER_ALERT_CHECK_SCHEDULE || '0 * * * *'; // Every hour
    
    this.job = cron.schedule(schedule, async () => {
      await this.runWeatherCheck();
    }, {
      scheduled: false,
      timezone: 'Asia/Ho_Chi_Minh'
    });

    this.job.start();
    logger.info(`Weather alert check job started - runs every ${schedule === '*/30 * * * *' ? '30 minutes' : schedule}`);
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Weather alert check job stopped');
    }
  }

  /**
   * Run the weather check manually
   */
  async runWeatherCheck() {
    if (this.isRunning) {
      logger.warn('Weather alert check is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('Starting weather alert check', {
        startTime: startTime.toISOString()
      });

      // Get all active tenants
      const tenants = await Tenant.find({ is_active: true }).select('_id tenant_name');
      
      if (tenants.length === 0) {
        logger.info('No active tenants found for weather check');
        return;
      }

      // Default location from env (fallback for tenants without custom location)
      const defaultLat = parseFloat(process.env.WEATHER_DEFAULT_LAT) || 16.0471; // Da Nang default
      const defaultLon = parseFloat(process.env.WEATHER_DEFAULT_LON) || 108.2068;
      const defaultLocationName = process.env.WEATHER_DEFAULT_LOCATION_NAME || 'Default Location';

      const results = {
        tenants_checked: 0,
        alerts_created: 0,
        errors: []
      };

      // Check weather for each tenant
      for (const tenant of tenants) {
        try {
          // For now, use default location for all tenants
          // TODO: In future, support custom locations per tenant
          const location = {
            latitude: defaultLat,
            longitude: defaultLon,
            name: `${tenant.tenant_name || 'Tenant'} - ${defaultLocationName}`
          };

          const result = await WeatherAlertService.checkAndCreateAlerts(
            location,
            tenant._id
          );

          results.tenants_checked++;
          results.alerts_created += result.alerts_created;

          logger.debug('Weather check completed for tenant', {
            tenant_id: tenant._id,
            tenant_name: tenant.tenant_name,
            alerts_created: result.alerts_created
          });
        } catch (error) {
          logger.error('Error checking weather for tenant', {
            tenant_id: tenant._id,
            tenant_name: tenant.tenant_name,
            error: error.message
          });
          results.errors.push({
            tenant_id: tenant._id,
            tenant_name: tenant.tenant_name,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.info('Weather alert check completed', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}ms`,
        tenants_checked: results.tenants_checked,
        alerts_created: results.alerts_created,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.error('Weather alert check encountered an error', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.job !== null,
      nextRun: this.job ? this.job.nextDate() : null
    };
  }

  /**
   * Check weather for a specific tenant and location
   * @param {Object} options - Check options
   * @param {string} options.tenantId - Tenant ID
   * @param {Object} options.location - Location object {latitude, longitude, name}
   */
  async checkWeatherForTenant(options) {
    try {
      const { tenantId, location } = options;

      if (!tenantId || !location || !location.latitude || !location.longitude) {
        throw new Error('tenantId and location (with latitude, longitude) are required');
      }

      logger.info('Manual weather check for tenant', {
        tenant_id: tenantId,
        location
      });

      const result = await WeatherAlertService.checkAndCreateAlerts(location, tenantId);

      logger.info('Manual weather check completed', {
        tenant_id: tenantId,
        alerts_created: result.alerts_created
      });

      return result;
    } catch (error) {
      logger.error('Manual weather check encountered an error', {
        tenant_id: options?.tenantId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new WeatherAlertJob();

