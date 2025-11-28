/**
 * Start Training Cron Jobs
 * Khởi động các cron jobs cho training system
 */

const cron = require('node-cron');
const trainingCronJobs = require('./training-cron-jobs');

let cronJobsStarted = false;

/**
 * Start all training cron jobs
 */
function startTrainingCronJobs() {
    if (cronJobsStarted) {
        console.log('⚠️  Training cron jobs already started');
        return;
    }

    console.log('🚀 Starting training cron jobs...');

    // Update session statuses every minute
    cron.schedule('* * * * *', async () => {
        try {
            await trainingCronJobs.updateSessionStatuses();
        } catch (error) {
            console.error('Error in session status update cron:', error);
        }
    });
    console.log('✅ Scheduled: Update session statuses (every minute)');

    // Send training reminders every hour
    cron.schedule('0 * * * *', async () => {
        try {
            await trainingCronJobs.sendTrainingReminders();
        } catch (error) {
            console.error('Error in training reminders cron:', error);
        }
    });
    console.log('✅ Scheduled: Send training reminders (every hour)');

    // Notify when sessions start (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        try {
            await trainingCronJobs.notifySessionStarted();
        } catch (error) {
            console.error('Error in session start notification cron:', error);
        }
    });
    console.log('✅ Scheduled: Notify session started (every 5 minutes)');

    // Check expiring certificates daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
        try {
            await trainingCronJobs.checkExpiringCertificates();
        } catch (error) {
            console.error('Error in certificate expiry check cron:', error);
        }
    });
    console.log('✅ Scheduled: Check expiring certificates (daily at 9 AM)');

    cronJobsStarted = true;
    console.log('✅ All training cron jobs started successfully');
}

/**
 * Stop all training cron jobs
 */
function stopTrainingCronJobs() {
    // Note: node-cron doesn't have a built-in way to stop all jobs
    // This would require keeping track of all cron jobs
    console.log('⚠️  Stopping cron jobs is not implemented. Restart server to stop.');
}

module.exports = {
    startTrainingCronJobs,
    stopTrainingCronJobs
};

