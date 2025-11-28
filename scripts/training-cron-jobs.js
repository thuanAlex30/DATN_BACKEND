/**
 * Training Cron Jobs
 * Tự động cập nhật session status và gửi reminders
 */

const trainingService = require('../services/trainingService');
const trainingRepository = require('../repository/TrainingRepository');
const TrainingEvents = require('../events/trainingEvents');
const websocketService = require('../services/websocketService');
const trainingUtils = require('../utils/trainingUtils');

/**
 * Update all session statuses based on current time
 * Should run every minute
 */
async function updateSessionStatuses() {
    try {
        console.log('🔄 [Cron] Updating session statuses...');
        const result = await trainingService.updateAllSessionStatuses();
        console.log(`✅ [Cron] Updated ${result.updatedCount} sessions (${result.ongoingUpdated} to ONGOING, ${result.completedUpdated} to COMPLETED)`);
        return result;
    } catch (error) {
        console.error('❌ [Cron] Error updating session statuses:', error);
        throw error;
    }
}

/**
 * Send training reminders
 * Should run every hour
 */
async function sendTrainingReminders() {
    try {
        console.log('📧 [Cron] Checking for training reminders...');
        
        // Get sessions needing reminders (7 days, 1 day, 1 hour before)
        const sessionsNeedingReminders = await trainingRepository.getSessionsNeedingReminders([7, 1], 1);
        
        let remindersSent = 0;

        for (const { session, reminderType, daysUntil, hoursUntil } of sessionsNeedingReminders) {
            try {
                // Get all enrollments for this session
                const enrollments = await trainingRepository.getAllEnrollments({
                    sessionId: session._id.toString(),
                    status: 'enrolled'
                });

                for (const enrollment of enrollments) {
                    const userId = enrollment.user_id?._id || enrollment.user_id;
                    
                    if (!userId) continue;

                    let message = '';
                    if (reminderType === 'day') {
                        message = `Khóa học "${session.course_id?.course_name || 'N/A'}" sẽ bắt đầu sau ${daysUntil} ngày (${new Date(session.start_time).toLocaleDateString('vi-VN')})`;
                    } else if (reminderType === 'hour') {
                        message = `Khóa học "${session.course_id?.course_name || 'N/A'}" sẽ bắt đầu sau ${hoursUntil} giờ`;
                    }

                    // Send WebSocket notification
                    try {
                        await websocketService.emitToUser(userId, 'training_reminder', {
                            type: 'reminder',
                            session: {
                                id: session._id,
                                name: session.session_name,
                                startTime: session.start_time,
                                courseName: session.course_id?.course_name
                            },
                            message: message,
                            reminderType: reminderType
                        });
                        remindersSent++;
                    } catch (wsError) {
                        console.error(`Error sending WebSocket reminder to user ${userId}:`, wsError);
                    }
                }
            } catch (error) {
                console.error(`Error processing reminders for session ${session._id}:`, error);
            }
        }

        console.log(`✅ [Cron] Sent ${remindersSent} training reminders`);
        return { remindersSent, sessionsProcessed: sessionsNeedingReminders.length };
    } catch (error) {
        console.error('❌ [Cron] Error sending training reminders:', error);
        throw error;
    }
}

/**
 * Send notification when session starts
 * Should run every 5 minutes
 */
async function notifySessionStarted() {
    try {
        console.log('🔔 [Cron] Checking for sessions that just started...');
        
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Get sessions that started in the last 5 minutes
        const sessions = await trainingRepository.getAllSessions({
            statusCode: 'ONGOING'
        });

        let notificationsSent = 0;

        for (const session of sessions) {
            const startTime = new Date(session.start_time);
            
            // Only notify if session started in the last 5 minutes
            if (startTime >= fiveMinutesAgo && startTime <= now) {
                // Get all enrollments
                const enrollments = await trainingRepository.getAllEnrollments({
                    sessionId: session._id.toString(),
                    status: 'enrolled'
                });

                for (const enrollment of enrollments) {
                    const userId = enrollment.user_id?._id || enrollment.user_id;
                    
                    if (!userId) continue;

                    try {
                        await websocketService.emitToUser(userId, 'training_started', {
                            type: 'session_started',
                            session: {
                                id: session._id,
                                name: session.session_name,
                                courseName: session.course_id?.course_name
                            },
                            message: `Khóa học "${session.course_id?.course_name || 'N/A'}" đã bắt đầu. Bạn có thể bắt đầu làm bài ngay bây giờ.`
                        });
                        notificationsSent++;
                    } catch (wsError) {
                        console.error(`Error sending start notification to user ${userId}:`, wsError);
                    }
                }
            }
        }

        console.log(`✅ [Cron] Sent ${notificationsSent} session start notifications`);
        return { notificationsSent };
    } catch (error) {
        console.error('❌ [Cron] Error notifying session started:', error);
        throw error;
    }
}

/**
 * Check and notify about expiring certificates
 * Should run daily
 */
async function checkExpiringCertificates() {
    try {
        console.log('📜 [Cron] Checking for expiring certificates...');
        
        // Note: This requires certificate model which we're not creating
        // This is a placeholder for future implementation
        // For now, we can check enrollments that are about to expire based on course validity
        
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Get completed enrollments
        const completedEnrollments = await trainingRepository.getAllEnrollments({
            status: 'completed'
        });

        let notificationsSent = 0;

        for (const enrollment of completedEnrollments) {
            try {
                const session = await trainingRepository.getTrainingSessionById(enrollment.session_id);
                if (!session) continue;

                const course = await trainingRepository.getCourseById(session.course_id);
                if (!course || !course.validity_months) continue;

                // Calculate expiry date
                const completionDate = new Date(enrollment.completion_date || enrollment.enrolled_at);
                const expiryDate = new Date(completionDate);
                expiryDate.setMonth(expiryDate.getMonth() + course.validity_months);

                const userId = enrollment.user_id?._id || enrollment.user_id;
                if (!userId) continue;

                // Check if expiring in 30 days
                if (expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow) {
                    await websocketService.emitToUser(userId, 'certificate_expiring', {
                        type: 'certificate_expiring_30_days',
                        course: {
                            name: course.course_name
                        },
                        expiryDate: expiryDate,
                        message: `Chứng chỉ khóa học "${course.course_name}" sẽ hết hạn sau 30 ngày`
                    });
                    notificationsSent++;
                }
                // Check if expiring in 7 days
                else if (expiryDate <= sevenDaysFromNow && expiryDate > now) {
                    await websocketService.emitToUser(userId, 'certificate_expiring', {
                        type: 'certificate_expiring_7_days',
                        course: {
                            name: course.course_name
                        },
                        expiryDate: expiryDate,
                        message: `Chứng chỉ khóa học "${course.course_name}" sẽ hết hạn sau 7 ngày`
                    });
                    notificationsSent++;
                }
            } catch (error) {
                console.error(`Error checking certificate for enrollment ${enrollment._id}:`, error);
            }
        }

        console.log(`✅ [Cron] Sent ${notificationsSent} certificate expiry notifications`);
        return { notificationsSent };
    } catch (error) {
        console.error('❌ [Cron] Error checking expiring certificates:', error);
        throw error;
    }
}

module.exports = {
    updateSessionStatuses,
    sendTrainingReminders,
    notifySessionStarted,
    checkExpiringCertificates
};

