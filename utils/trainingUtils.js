/**
 * Training Utility Functions
 * Các hàm tiện ích hỗ trợ cho training system
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Shuffle questions and optionally limit the count
 * @param {Array} questions - Array of questions
 * @param {Number} limit - Optional limit on number of questions
 * @returns {Array} - Shuffled questions (limited if specified)
 */
function shuffleQuestions(questions, limit = null) {
    const shuffled = shuffleArray(questions);
    if (limit && limit > 0 && limit < shuffled.length) {
        return shuffled.slice(0, limit);
    }
    return shuffled;
}

/**
 * Calculate training score based on answers
 * @param {Array} questions - Array of questions with correct_answer and points
 * @param {Object} userAnswers - Object mapping questionId to user's answer
 * @returns {Object} - Score details
 */
function calculateScore(questions, userAnswers) {
    let totalScore = 0;
    let correctAnswers = 0;
    let totalPossibleScore = 0;
    const answerDetails = [];

    questions.forEach(question => {
        const questionId = question._id?.toString() || question.id?.toString();
        const userAnswer = userAnswers[questionId];
        const isCorrect = userAnswer === question.correct_answer;
        const points = question.points || 1;
        
        totalPossibleScore += points;
        
        if (isCorrect) {
            totalScore += points;
            correctAnswers++;
        }

        answerDetails.push({
            questionId: questionId,
            questionContent: question.content,
            userAnswer: userAnswer || null,
            correctAnswer: question.correct_answer,
            isCorrect: isCorrect,
            points: points,
            earnedPoints: isCorrect ? points : 0
        });
    });

    const percentage = totalPossibleScore > 0 
        ? Math.round((totalScore / totalPossibleScore) * 100) 
        : 0;

    return {
        totalScore,
        totalPossibleScore,
        correctAnswers,
        totalQuestions: questions.length,
        percentage,
        answerDetails
    };
}

/**
 * Check if score passes the threshold
 * @param {Number} percentage - Score percentage
 * @param {Number} threshold - Pass threshold (default 70)
 * @returns {Boolean} - True if passed
 */
function isPassed(percentage, threshold = 70) {
    return percentage >= threshold;
}

/**
 * Remove correct answers from questions for security
 * @param {Array} questions - Array of questions
 * @returns {Array} - Questions without correct_answer field
 */
function sanitizeQuestions(questions) {
    return questions.map(q => {
        const { correct_answer, ...sanitized } = q.toObject ? q.toObject() : q;
        return sanitized;
    });
}

/**
 * Get time difference in various units
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Object} - Time difference object
 */
function getTimeDifference(startTime, endTime) {
    const diff = new Date(endTime) - new Date(startTime);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
        milliseconds: diff,
        seconds,
        minutes,
        hours,
        days
    };
}

/**
 * Check if current time is within session time range
 * @param {Date} startTime - Session start time
 * @param {Date} endTime - Session end time
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {Boolean} - True if within range
 */
function isWithinSessionTime(startTime, endTime, currentTime = new Date()) {
    const now = new Date(currentTime);
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
}

/**
 * Check if session has expired
 * @param {Date} endTime - Session end time
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {Boolean} - True if expired
 */
function isSessionExpired(endTime, currentTime = new Date()) {
    return new Date(currentTime) > new Date(endTime);
}

/**
 * Get session status based on current time
 * @param {Object} session - Session object with start_time, end_time, status_code
 * @returns {String} - Updated status code
 */
function getSessionStatus(session) {
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const currentStatus = session.status_code;

    // If already cancelled, keep it cancelled
    if (currentStatus === 'CANCELLED') {
        return 'CANCELLED';
    }

    // If already completed, keep it completed
    if (currentStatus === 'COMPLETED') {
        return 'COMPLETED';
    }

    // Check if session has ended
    if (now > endTime) {
        return 'COMPLETED';
    }

    // Check if session is ongoing
    if (now >= startTime && now <= endTime) {
        return 'ONGOING';
    }

    // Otherwise, it's scheduled
    return 'SCHEDULED';
}

/**
 * Format time remaining until session starts
 * @param {Date} startTime - Session start time
 * @returns {Object} - Time remaining object
 */
function getTimeUntilStart(startTime) {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff <= 0) {
        return {
            hasStarted: true,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hasStarted: false,
        days,
        hours,
        minutes,
        seconds,
        totalMinutes: Math.floor(diff / (1000 * 60))
    };
}

/**
 * Check if reminder should be sent based on time until start
 * @param {Date} startTime - Session start time
 * @param {Array} reminderDays - Array of days before to send reminder (e.g., [7, 1])
 * @param {Number} reminderHours - Hours before to send reminder (e.g., 1)
 * @returns {Object} - Reminder status
 */
function shouldSendReminder(startTime, reminderDays = [7, 1], reminderHours = 1) {
    const timeUntil = getTimeUntilStart(startTime);
    
    if (timeUntil.hasStarted) {
        return {
            shouldSend: false,
            reason: 'Session has already started'
        };
    }

    const totalDays = timeUntil.days;
    const totalHours = timeUntil.hours + (timeUntil.days * 24);

    // Check for day-based reminders
    if (reminderDays.includes(totalDays)) {
        return {
            shouldSend: true,
            type: 'day',
            days: totalDays,
            message: `Session sẽ bắt đầu sau ${totalDays} ngày`
        };
    }

    // Check for hour-based reminder
    if (totalHours === reminderHours && timeUntil.minutes < 60) {
        return {
            shouldSend: true,
            type: 'hour',
            hours: reminderHours,
            message: `Session sẽ bắt đầu sau ${reminderHours} giờ`
        };
    }

    return {
        shouldSend: false,
        reason: 'Not time for reminder'
    };
}

/**
 * Validate enrollment prerequisites
 * Note: This assumes prerequisites are stored in course.prerequisite_course_ids
 * If not available in model, this will return empty array
 * @param {Object} course - Course object
 * @param {String} userId - User ID
 * @param {Function} checkUserCompletedCourse - Function to check if user completed a course
 * @returns {Object} - Prerequisites validation result
 */
async function validatePrerequisites(course, userId, checkUserCompletedCourse) {
    // Check if course has prerequisites
    // Note: Since we can't modify models, we'll check if prerequisite_course_ids exists
    const prerequisiteIds = course.prerequisite_course_ids || [];
    
    if (!prerequisiteIds || prerequisiteIds.length === 0) {
        return {
            isValid: true,
            missingPrerequisites: [],
            message: 'No prerequisites required'
        };
    }

    // Check if user has completed all prerequisites
    const missingPrerequisites = [];
    
    for (const prereqId of prerequisiteIds) {
        const hasCompleted = await checkUserCompletedCourse(userId, prereqId);
        if (!hasCompleted) {
            missingPrerequisites.push(prereqId);
        }
    }

    if (missingPrerequisites.length > 0) {
        return {
            isValid: false,
            missingPrerequisites,
            message: `Bạn cần hoàn thành ${missingPrerequisites.length} khóa học tiên quyết trước`
        };
    }

    return {
        isValid: true,
        missingPrerequisites: [],
        message: 'All prerequisites completed'
    };
}

/**
 * Check if session has available slots
 * @param {Object} session - Session object with max_participants
 * @param {Number} currentEnrollments - Current number of enrollments
 * @returns {Object} - Availability status
 */
function checkSessionAvailability(session, currentEnrollments) {
    const maxParticipants = session.max_participants || 0;
    const availableSlots = maxParticipants - currentEnrollments;
    const isAvailable = availableSlots > 0;

    return {
        isAvailable,
        availableSlots,
        maxParticipants,
        currentEnrollments,
        isFull: !isAvailable
    };
}

/**
 * Format training results for response
 * @param {Object} enrollment - Enrollment object
 * @param {Object} scoreDetails - Score calculation details
 * @param {Number} passThreshold - Pass threshold percentage
 * @returns {Object} - Formatted results
 */
function formatTrainingResults(enrollment, scoreDetails, passThreshold = 70) {
    return {
        enrollment: {
            id: enrollment._id || enrollment.id,
            status: enrollment.status,
            score: enrollment.score,
            passed: enrollment.passed,
            completionDate: enrollment.completion_date
        },
        results: {
            totalQuestions: scoreDetails.totalQuestions,
            correctAnswers: scoreDetails.correctAnswers,
            score: scoreDetails.totalScore,
            totalPossibleScore: scoreDetails.totalPossibleScore,
            percentage: scoreDetails.percentage,
            passed: scoreDetails.percentage >= passThreshold,
            passThreshold: passThreshold,
            answerDetails: scoreDetails.answerDetails
        }
    };
}

module.exports = {
    shuffleArray,
    shuffleQuestions,
    calculateScore,
    isPassed,
    sanitizeQuestions,
    getTimeDifference,
    isWithinSessionTime,
    isSessionExpired,
    getSessionStatus,
    getTimeUntilStart,
    shouldSendReminder,
    validatePrerequisites,
    checkSessionAvailability,
    formatTrainingResults
};

