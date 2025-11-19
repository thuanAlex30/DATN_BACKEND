/**
 * PPE Expiry Check Cron Job
 * Runs daily to check for expiring PPE items and send notifications
 */

const cron = require('node-cron');
const ppeExpiryManagementService = require('../services/ppeExpiryManagementService');
const logger = require('../utils/logger');

class ExpiryCheckJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the cron job
   */
  start() {
    if (this.job) {
      logger.warn('Expiry check job is already running');
      return;
    }

    // Run every day at 9:00 AM
    this.job = cron.schedule('0 9 * * *', async () => {
      await this.runExpiryCheck();
    }, {
      scheduled: false,
      timezone: 'Asia/Ho_Chi_Minh'
    });

    this.job.start();
    logger.info('PPE expiry check job started - runs daily at 9:00 AM');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('PPE expiry check job stopped');
    }
  }

  /**
   * Run the expiry check manually
   */
  async runExpiryCheck() {
    if (this.isRunning) {
      logger.warn('Expiry check is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('Starting daily PPE expiry check', {
        startTime: startTime.toISOString()
      });

      const result = await ppeExpiryManagementService.runDailyExpiryCheck();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      if (result.success) {
        logger.info('Daily PPE expiry check completed successfully', {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: `${duration}ms`,
          notificationsSent: result.data.notificationsSent,
          itemsMarkedExpired: result.data.itemsMarkedExpired,
          errors: result.data.errors.length
        });
      } else {
        logger.error('Daily PPE expiry check failed', {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: `${duration}ms`,
          error: result.message
        });
      }

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.error('Daily PPE expiry check encountered an error', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });
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
   * Run expiry check for specific days before expiry
   * @param {number} daysBefore - Days before expiry
   */
  async runCustomExpiryCheck(daysBefore) {
    try {
      logger.info(`Running custom expiry check for ${daysBefore} days before expiry`);

      const result = await ppeExpiryManagementService.checkAndNotifyExpiringItems(daysBefore);

      if (result.success) {
        logger.info(`Custom expiry check completed for ${daysBefore} days`, {
          notificationsSent: result.data.length
        });
      } else {
        logger.error(`Custom expiry check failed for ${daysBefore} days`, {
          error: result.message
        });
      }

      return result;
    } catch (error) {
      logger.error(`Custom expiry check encountered an error for ${daysBefore} days`, {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ExpiryCheckJob();
