/**
 * PPE Overdue Check Cron Job
 * Runs daily to mark overdue issuances and send notifications
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const PPEIssuance = require('../models/ppeIssuance');
const websocketService = require('../services/websocketService');

class PPEOverdueJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  start() {
    if (this.job) {
      logger.warn('Overdue check job is already running');
      return;
    }

    // Run every day at 08:30 AM
    this.job = cron.schedule(
      '30 8 * * *',
      async () => {
        await this.runOverdueCheck();
      },
      {
        scheduled: false,
        timezone: 'Asia/Ho_Chi_Minh',
      }
    );

    this.job.start();
    logger.info('PPE overdue check job started - runs daily at 08:30 AM');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('PPE overdue check job stopped');
    }
  }

  async runOverdueCheck() {
    if (this.isRunning) {
      logger.warn('Overdue check is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      const now = new Date();
      // Mark issuances overdue if expected_return_date < today and not returned
      const overdueStatuses = ['issued', 'pending_manager_return', 'pending_confirmation', 'damaged', 'replacement_needed'];
      const filter = {
        expected_return_date: { $lt: now },
        status: { $in: overdueStatuses },
      };

      const issuances = await PPEIssuance.find(filter).lean();
      const ids = issuances.map((i) => i._id);

      if (ids.length === 0) {
        logger.info('PPE overdue check: no overdue issuances found', { startTime });
        this.isRunning = false;
        return;
      }

      const updateResult = await PPEIssuance.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'overdue' } }
      );

      // Notify involved users (issuer, user, manager if present)
      issuances.forEach((issuance) => {
        const payload = {
          type: 'ppe_overdue',
          title: 'PPE quá hạn trả',
          message: `PPE ${issuance.item_id?.item_name || issuance.item_id} đã quá hạn trả.`,
          issuance_id: issuance._id,
          expected_return_date: issuance.expected_return_date,
          status: 'overdue',
          timestamp: new Date(),
        };
        const userId = issuance.user_id?.toString?.() || issuance.user_id;
        const issuerId = issuance.issued_by?.toString?.() || issuance.issued_by;
        const managerId = issuance.manager_id?.toString?.() || issuance.manager_id;
        [userId, issuerId, managerId].filter(Boolean).forEach((uid) => {
          websocketService.emitToUser(uid.toString(), 'ppe_notification', payload);
        });
      });

      const endTime = new Date();
      logger.info('PPE overdue check completed', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        count: ids.length,
        updated: updateResult.modifiedCount,
      });
    } catch (error) {
      logger.error('PPE overdue check failed', { error: error.message, stack: error.stack });
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.job !== null,
      nextRun: this.job ? this.job.nextDate() : null,
    };
  }
}

module.exports = new PPEOverdueJob();

