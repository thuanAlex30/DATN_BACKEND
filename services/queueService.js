const Queue = require('bull');
const logger = require('../utils/logger');
const PPENotificationService = require('./ppeNotificationService');
const PPEEvents = require('../events/ppeEvents');
const ppeRepository = require('../repository/PPERepository');
const kafkaProducer = require('./kafkaProducer');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create queue
const ppeQueue = new Queue('ppe-postprocessing', REDIS_URL);

// Add job helpers
async function addIssuancePostProcessingJob(payload) {
  // payload: { issuanceId, tenantId }
  return await ppeQueue.add('issuance_created', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false
  });
}

// Processor
ppeQueue.process('issuance_created', 5, async (job) => {
  const { issuanceId, tenantId } = job.data;
  const start = Date.now();
  try {
    const res = await ppeRepository.getIssuanceById(issuanceId, tenantId);
    const issuance = res;
    // prepare issuer/recipient data
    const issuer = issuance.issued_by ? issuance.issued_by : null;
    const recipient = issuance.user_id ? issuance.user_id : null;

    // Send notifications (these are heavier but now in background)
    try {
      await PPENotificationService.notifyPPEIssuedToEmployee({
        issuance,
        issuer,
        recipient,
        tenantId
      });
    } catch (notifErr) {
      logger.warn('Background notification failed for issuance', issuanceId, notifErr.message || notifErr);
    }

    // Emit events via PPEEvents (this will attempt Kafka but it's okay if fails)
    try {
      await PPEEvents.emitPPEIssuanceCreated(issuance, issuer || { _id: 'system' });
    } catch (evtErr) {
      logger.warn('Background event emission failed for issuance', issuanceId, evtErr.message || evtErr);
    }

    const duration = Date.now() - start;
    logger.info('Processed issuance_created job', { issuanceId, duration });
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed processing issuance_created job', { issuanceId, error: error.message || error });
    throw error;
  }
});

// optional init / health check
function initializeQueue() {
  ppeQueue.on('completed', (job) => {
    logger.info(`Job completed: ${job.id} - ${job.name}`);
  });
  ppeQueue.on('failed', (job, err) => {
    logger.error(`Job failed: ${job.id} - ${job.name}`, err.message || err);
  });
  logger.info('PPE postprocessing queue initialized');
}

module.exports = {
  ppeQueue,
  addIssuancePostProcessingJob,
  initializeQueue
};


