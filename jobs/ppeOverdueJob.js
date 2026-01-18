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

      // Fetch issuances in batches to avoid loading too many records at once
      const batchSize = Number(process.env.PPE_OVERDUE_BATCH_SIZE) || 200;
      const PPENotificationService = require('../services/ppeNotificationService');
      const User = require('../models/user');

      // Stream IDs to avoid building a huge array in memory
      const cursor = PPEIssuance.find(filter).select('_id user_id issued_by manager_id tenant_id item_id expected_return_date').lean().cursor();
      const idsToUpdate = [];
      const issuancesBuffer = [];
      let count = 0;

      for await (const doc of cursor) {
        idsToUpdate.push(doc._id);
        issuancesBuffer.push(doc);
        count++;

        if (idsToUpdate.length >= batchSize) {
          // Bulk update this batch to overdue
          await PPEIssuance.updateMany({ _id: { $in: idsToUpdate } }, { $set: { status: 'overdue' } });
          // Send notifications with limited concurrency
          await sendNotificationsForBatch(issuancesBuffer, PPENotificationService, User);
          idsToUpdate.length = 0;
          issuancesBuffer.length = 0;
        }
      }

      // Process remaining
      if (idsToUpdate.length > 0) {
        await PPEIssuance.updateMany({ _id: { $in: idsToUpdate } }, { $set: { status: 'overdue' } });
        await sendNotificationsForBatch(issuancesBuffer, PPENotificationService, User);
      }

      logger.info('PPE overdue check processed count', { count });

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

  // Helper: send notifications for a batch with limited concurrency
  async sendNotificationsForBatch(issuances, PPENotificationService, User) {
  const concurrency = Number(process.env.PPE_NOTIFICATION_CONCURRENCY) || 5;
  let idx = 0;

  const worker = async () => {
    while (true) {
      const i = idx++;
      if (i >= issuances.length) return;
      const issuance = issuances[i];
      try {
        const userId = issuance.user_id?.toString?.() || issuance.user_id;
        const issuerId = issuance.issued_by?.toString?.() || issuance.issued_by;
        const managerId = issuance.manager_id?.toString?.() || issuance.manager_id;
        const tenantId = issuance.tenant_id?.toString?.() || issuance.tenant_id;

        const [user, issuer, manager] = await Promise.all([
          userId ? User.findById(userId).select('_id full_name').lean() : null,
          issuerId ? User.findById(issuerId).select('_id full_name').lean() : null,
          managerId ? User.findById(managerId).select('_id full_name').lean() : null
        ]);

        if (user) {
          await PPENotificationService.notifyPPEOverdue({
            tracking: issuance,
            user,
            issuer: issuer || null,
            tenantId
          });
        }

        if (issuer && issuer._id.toString() !== user?._id?.toString()) {
          await PPENotificationService.notifyPPEOverdue({
            tracking: issuance,
            user: user || null,
            issuer,
            tenantId
          });
        }

        if (manager && manager._id.toString() !== user?._id?.toString() && manager._id.toString() !== issuer?._id?.toString()) {
          await PPENotificationService.notifyPPEOverdue({
            tracking: issuance,
            user: user || null,
            issuer: manager,
            tenantId
          });
        }

        // Emit websocket
        const payload = {
          type: 'ppe_overdue',
          title: 'PPE quá hạn trả',
          message: `PPE ${issuance.item_id?.item_name || issuance.item_id} đã quá hạn trả.`,
          issuance_id: issuance._id,
          expected_return_date: issuance.expected_return_date,
          status: 'overdue',
          timestamp: new Date(),
        };
        [userId, issuerId, managerId].filter(Boolean).forEach((uid) => {
          websocketService.emitToUser(uid.toString(), 'ppe_notification', payload);
        });
      } catch (err) {
        logger.error('Error sending notification for issuance', { err: err.message || err, issuanceId: issuance._id || issuance.id });
      }
    }
  };

    const workers = [];
    for (let w = 0; w < Math.min(concurrency, issuances.length); w++) {
      workers.push(worker());
    }
    await Promise.all(workers);
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

