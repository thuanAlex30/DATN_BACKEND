const trainingRepository = require('../repository/TrainingRepository');
const { createResponse } = require('../utils/response');
const trainingUtils = require('../utils/trainingUtils');

class TrainingService {
    // ========== Course Set Services ==========
    async getAllCourseSets() {
        try {
            const courseSets = await trainingRepository.getAllCourseSets();
            return createResponse(200, 'Course sets retrieved successfully', courseSets);
        } catch (error) {
            throw error;
        }
    }

    async getCourseSetById(courseSetId) {
        try {
            const courseSet = await trainingRepository.getCourseSetById(courseSetId);
            if (!courseSet) {
                return createResponse(404, 'Course set not found');
            }
            return createResponse(200, 'Course set retrieved successfully', courseSet);
        } catch (error) {
            throw error;
        }
    }

    async createCourseSet(courseSetData) {
        try {
            const courseSet = await trainingRepository.createCourseSet(courseSetData);
            return createResponse(201, 'Course set created successfully', courseSet);
        } catch (error) {
            throw error;
        }
    }

    async updateCourseSet(courseSetId, courseSetData) {
        try {
            const courseSet = await trainingRepository.updateCourseSet(courseSetId, courseSetData);
            return createResponse(200, 'Course set updated successfully', courseSet);
        } catch (error) {
            if (error.message === 'Course set not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteCourseSet(courseSetId) {
        try {
            await trainingRepository.deleteCourseSet(courseSetId);
            return createResponse(200, 'Course set deleted successfully');
        } catch (error) {
            if (error.message === 'Course set not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    // ========== Course Services ==========
    async getAllCourses(filters = {}) {
        try {
            const courses = await trainingRepository.getAllCourses(filters);
            return createResponse(200, 'Courses retrieved successfully', courses);
        } catch (error) {
            throw error;
        }
    }

    async getCourseById(courseId) {
        try {
            const course = await trainingRepository.getCourseById(courseId);
            if (!course) {
                return createResponse(404, 'Course not found');
            }
            return createResponse(200, 'Course retrieved successfully', course);
        } catch (error) {
            throw error;
        }
    }

    async createCourse(courseData) {
        try {
            const course = await trainingRepository.createCourse(courseData);
            return createResponse(201, 'Course created successfully', course);
        } catch (error) {
            throw error;
        }
    }

    async updateCourse(courseId, courseData) {
        try {
            const course = await trainingRepository.updateCourse(courseId, courseData);
            return createResponse(200, 'Course updated successfully', course);
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteCourse(courseId) {
        try {
            await trainingRepository.deleteCourse(courseId);
            return createResponse(200, 'Course deleted successfully');
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async getCourseStats(courseId) {
        try {
            const stats = await trainingRepository.getCourseStats(courseId);
            return createResponse(200, 'Course statistics retrieved successfully', stats);
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    // ========== Training Session Services ==========
    async getAllTrainingSessions(filters = {}) {
        try {
            const sessions = await trainingRepository.getAllTrainingSessions(filters);
            return createResponse(200, 'Training sessions retrieved successfully', sessions);
        } catch (error) {
            throw error;
        }
    }

    async getTrainingSessionById(sessionId) {
        try {
            const session = await trainingRepository.getTrainingSessionById(sessionId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }
            return createResponse(200, 'Training session retrieved successfully', session);
        } catch (error) {
            throw error;
        }
    }

    async createTrainingSession(sessionData) {
        try {
            console.log('Service received session data:', sessionData);
            
            // Validate required fields
            if (!sessionData.session_name || !sessionData.course_id || !sessionData.start_time || !sessionData.end_time) {
                console.log('Validation failed: Missing required fields');
                return createResponse(400, 'Missing required fields: session_name, course_id, start_time, end_time');
            }

            // Validate course exists
            const course = await trainingRepository.getCourseById(sessionData.course_id);
            if (!course) {
                console.log('Validation failed: Course not found with ID:', sessionData.course_id);
                return createResponse(400, 'Valid course ID is required', {
                    errors: [{
                        field: 'course_id',
                        message: 'Valid course ID is required',
                        value: sessionData.course_id
                    }]
                });
            }

            // Validate max_participants
            if (!sessionData.max_participants || isNaN(sessionData.max_participants) || sessionData.max_participants < 1) {
                console.log('Validation failed: Invalid max_participants');
                return createResponse(400, 'max_participants must be a number greater than 0');
            }
            
            // Validate session dates
            if (new Date(sessionData.start_time) >= new Date(sessionData.end_time)) {
                console.log('Validation failed: End time must be after start time');
                return createResponse(400, 'End time must be after start time');
            }

            console.log('Validation passed, creating session...');
            const session = await trainingRepository.createTrainingSession(sessionData);
            console.log('Session created successfully:', session);
            return createResponse(201, 'Training session created successfully', session);
        } catch (error) {
            console.error('Error in createTrainingSession service:', error);
            if (error.name === 'ValidationError') {
                return createResponse(400, `Validation error: ${error.message}`);
            }
            throw error;
        }
    }

    async updateTrainingSession(sessionId, sessionData) {
        try {
            // Validate session dates if provided
            if (sessionData.start_time && sessionData.end_time) {
                if (new Date(sessionData.start_time) >= new Date(sessionData.end_time)) {
                    return createResponse(400, 'End time must be after start time');
                }
            }

            const session = await trainingRepository.updateTrainingSession(sessionId, sessionData);
            return createResponse(200, 'Training session updated successfully', session);
        } catch (error) {
            if (error.message === 'Training session not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteTrainingSession(sessionId) {
        try {
            await trainingRepository.deleteTrainingSession(sessionId);
            return createResponse(200, 'Training session deleted successfully');
        } catch (error) {
            if (error.message === 'Training session not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async getSessionEnrollmentStats(sessionId) {
        try {
            const stats = await trainingRepository.getSessionEnrollmentStats(sessionId);
            return createResponse(200, 'Session enrollment statistics retrieved successfully', stats);
        } catch (error) {
            if (error.message === 'Training session not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    // ========== Training Enrollment Services ==========
    async getAllTrainingEnrollments(filters = {}) {
        try {
            const enrollments = await trainingRepository.getAllTrainingEnrollments(filters);
            return createResponse(200, 'Training enrollments retrieved successfully', enrollments);
        } catch (error) {
            throw error;
        }
    }

    async getTrainingEnrollmentById(enrollmentId) {
        try {
            const enrollment = await trainingRepository.getTrainingEnrollmentById(enrollmentId);
            if (!enrollment) {
                return createResponse(404, 'Training enrollment not found');
            }
            return createResponse(200, 'Training enrollment retrieved successfully', enrollment);
        } catch (error) {
            throw error;
        }
    }

    async createTrainingEnrollment(enrollmentData) {
        try {
            const { session_id, user_id } = enrollmentData;

            // Validate session exists
            const session = await trainingRepository.getTrainingSessionById(session_id);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            // Check if user already enrolled
            const existingEnrollment = await trainingRepository.getEnrollmentByUserAndSession(user_id, session_id);
            if (existingEnrollment) {
                return createResponse(400, 'User is already enrolled in this session');
            }

            // Check session capacity
            const enrollmentCount = await trainingRepository.getSessionEnrollmentCount(session_id);
            if (enrollmentCount >= session.max_participants) {
                return createResponse(400, 'Session is full');
            }

            // Check prerequisites (if course has prerequisite_course_ids field)
            const course = await trainingRepository.getCourseById(session.course_id);
            if (course) {
                const prereqCheck = await trainingUtils.validatePrerequisites(
                    course,
                    user_id,
                    async (userId, courseId) => {
                        return await trainingRepository.hasUserCompletedCourse(userId, courseId);
                    }
                );

                if (!prereqCheck.isValid) {
                    return createResponse(400, prereqCheck.message, {
                        missingPrerequisites: prereqCheck.missingPrerequisites
                    });
                }
            }

            // Check session status
            const sessionStatus = trainingUtils.getSessionStatus(session);
            if (sessionStatus === 'COMPLETED' || sessionStatus === 'CANCELLED') {
                return createResponse(400, `Cannot enroll in ${sessionStatus.toLowerCase()} session`);
            }

            // Create enrollment
            const enrollment = await trainingRepository.createTrainingEnrollment(enrollmentData);
            return createResponse(201, 'Training enrollment created successfully', enrollment);
        } catch (error) {
            if (error.message === 'User is already enrolled in this session' || 
                error.message === 'Session is full' ||
                error.message === 'Training session not found') {
                return createResponse(400, error.message);
            }
            throw error;
        }
    }

    async updateTrainingEnrollment(enrollmentId, enrollmentData) {
        try {
            const enrollment = await trainingRepository.updateTrainingEnrollment(enrollmentId, enrollmentData);
            return createResponse(200, 'Training enrollment updated successfully', enrollment);
        } catch (error) {
            if (error.message === 'Training enrollment not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteTrainingEnrollment(enrollmentId) {
        try {
            await trainingRepository.deleteTrainingEnrollment(enrollmentId);
            return createResponse(200, 'Training enrollment deleted successfully');
        } catch (error) {
            if (error.message === 'Training enrollment not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    // ========== Question Bank Services ==========
    async getAllQuestionBanks(filters = {}) {
        try {
            const banks = await trainingRepository.getAllQuestionBanks(filters);
            return createResponse(200, 'Question banks retrieved successfully', banks);
        } catch (error) {
            throw error;
        }
    }

    async getQuestionBankById(bankId) {
        try {
            const bank = await trainingRepository.getQuestionBankById(bankId);
            if (!bank) {
                return createResponse(404, 'Question bank not found');
            }
            return createResponse(200, 'Question bank retrieved successfully', bank);
        } catch (error) {
            throw error;
        }
    }

    async createQuestionBank(bankData) {
        try {
            const bank = await trainingRepository.createQuestionBank(bankData);
            return createResponse(201, 'Question bank created successfully', bank);
        } catch (error) {
            throw error;
        }
    }

    async updateQuestionBank(bankId, bankData) {
        try {
            const bank = await trainingRepository.updateQuestionBank(bankId, bankData);
            return createResponse(200, 'Question bank updated successfully', bank);
        } catch (error) {
            if (error.message === 'Question bank not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteQuestionBank(bankId) {
        try {
            await trainingRepository.deleteQuestionBank(bankId);
            return createResponse(200, 'Question bank deleted successfully');
        } catch (error) {
            if (error.message === 'Question bank not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async getQuestionBankStats(bankId) {
        try {
            const stats = await trainingRepository.getQuestionBankStats(bankId);
            return createResponse(200, 'Question bank statistics retrieved successfully', stats);
        } catch (error) {
            if (error.message === 'Question bank not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async getQuestionBanksByCourse(courseId) {
        try {
            const questionBanks = await trainingRepository.getQuestionBanksByCourse(courseId);
            return createResponse(200, 'Question banks retrieved successfully', questionBanks);
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    // ========== Questions Services ==========
    async getAllQuestions(filters = {}) {
        try {
            const questions = await trainingRepository.getAllQuestions(filters);
            return createResponse(200, 'Questions retrieved successfully', questions);
        } catch (error) {
            throw error;
        }
    }

    async getQuestionById(questionId) {
        try {
            const question = await trainingRepository.getQuestionById(questionId);
            if (!question) {
                return createResponse(404, 'Question not found');
            }
            return createResponse(200, 'Question retrieved successfully', question);
        } catch (error) {
            throw error;
        }
    }

    async createQuestion(questionData) {
        try {
            const question = await trainingRepository.createQuestion(questionData);
            return createResponse(201, 'Question created successfully', question);
        } catch (error) {
            throw error;
        }
    }

    async updateQuestion(questionId, questionData) {
        try {
            const question = await trainingRepository.updateQuestion(questionId, questionData);
            if (!question) {
                return createResponse(404, 'Question not found');
            }
            return createResponse(200, 'Question updated successfully', question);
        } catch (error) {
            throw error;
        }
    }

    async deleteQuestion(questionId) {
        try {
            const deleted = await trainingRepository.deleteQuestion(questionId);
            if (!deleted) {
                return createResponse(404, 'Question not found');
            }
            return createResponse(200, 'Question deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async importQuestionsFromExcel(bankId, file) {
        try {
            const questions = await trainingRepository.importQuestionsFromExcel(bankId, file);
            return createResponse(201, 'Questions imported successfully', questions);
        } catch (error) {
            throw error;
        }
    }


    // ========== Dashboard Statistics ==========
    async getTrainingDashboardStats() {
        try {
            const [
                totalCourses,
                totalSessions,
                totalEnrollments,
                totalQuestionBanks
            ] = await Promise.all([
                trainingRepository.getAllCourses(),
                trainingRepository.getAllTrainingSessions(),
                trainingRepository.getAllTrainingEnrollments(),
                trainingRepository.getAllQuestionBanks()
            ]);

            const completedEnrollments = totalEnrollments.filter(e => e.status === 'completed').length;
            const passedEnrollments = totalEnrollments.filter(e => e.passed === true).length;

            const stats = {
                totalCourses: totalCourses.length,
                totalSessions: totalSessions.length,
                totalEnrollments: totalEnrollments.length,
                completedEnrollments,
                passedEnrollments,
                totalQuestionBanks: totalQuestionBanks.length,
                completionRate: totalEnrollments.length > 0 ? (completedEnrollments / totalEnrollments.length) * 100 : 0,
                passRate: completedEnrollments > 0 ? (passedEnrollments / completedEnrollments) * 100 : 0
            };

            return createResponse(200, 'Training dashboard statistics retrieved successfully', stats);
        } catch (error) {
            throw error;
        }
    }

    // ========== Session Status Management ==========
    async updateSessionStatus(session) {
        try {
            const newStatus = trainingUtils.getSessionStatus(session);

            // Update session if status changed
            if (newStatus !== session.status_code) {
                await trainingRepository.updateTrainingSession(session._id, { status_code: newStatus });
            }

            return newStatus;
        } catch (error) {
            throw error;
        }
    }

    // ========== Auto Update All Session Statuses ==========
    async updateAllSessionStatuses() {
        try {
            const { shouldBeOngoing, shouldBeCompleted } = await trainingRepository.getSessionsNeedingStatusUpdate();
            
            let updatedCount = 0;

            // Update sessions to ONGOING
            for (const session of shouldBeOngoing) {
                await trainingRepository.updateTrainingSession(session._id, { status_code: 'ONGOING' });
                updatedCount++;
            }

            // Update sessions to COMPLETED
            for (const session of shouldBeCompleted) {
                await trainingRepository.updateTrainingSession(session._id, { status_code: 'COMPLETED' });
                updatedCount++;
            }

            return {
                updatedCount,
                ongoingUpdated: shouldBeOngoing.length,
                completedUpdated: shouldBeCompleted.length
            };
        } catch (error) {
            console.error('Error updating session statuses:', error);
            throw error;
        }
    }

    // ========== Start Training Services ==========
    async startTraining(sessionId, userId) {
        try {
            // Check if session exists and is active
            const session = await trainingRepository.getTrainingSessionById(sessionId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            // Update session status based on current time
            await this.updateSessionStatus(session);

            // Get updated session
            const updatedSession = await trainingRepository.getTrainingSessionById(sessionId);

            // Check if session is in correct status
            if (updatedSession.status_code !== 'ONGOING') {
                return createResponse(400, 'Training session is not currently active');
            }

            // Check if user is enrolled in this session
            const enrollment = await trainingRepository.getEnrollmentByUserAndSession(userId, sessionId);
            if (!enrollment) {
                return createResponse(403, 'You are not enrolled in this training session');
            }

            // Check if enrollment status allows starting
            if (enrollment.status !== 'enrolled') {
                return createResponse(400, `Cannot start training. Current status: ${enrollment.status}`);
            }

            // Get course information and question bank
            const course = await trainingRepository.getCourseById(session.course_id);
            if (!course) {
                return createResponse(404, 'Course not found');
            }

            // Get question bank for this course
            const questionBank = await trainingRepository.getQuestionBankByCourseId(session.course_id);
            if (!questionBank) {
                return createResponse(404, 'No question bank found for this course');
            }

            // Get questions for the training
            let questions = await trainingRepository.getQuestionsByBankId(questionBank._id);

            // Shuffle questions for security (each attempt gets different order)
            // Optional: Limit number of questions if needed
            questions = trainingUtils.shuffleQuestions(questions);

            // Sanitize questions (remove correct_answer)
            const sanitizedQuestions = trainingUtils.sanitizeQuestions(questions);

            // Calculate time remaining
            const timeUntilEnd = trainingUtils.getTimeDifference(new Date(), session.end_time);

            return createResponse(200, 'Training started successfully', {
                session: {
                    _id: session._id,
                    session_name: session.session_name,
                    start_time: session.start_time,
                    end_time: session.end_time,
                    location: session.location
                },
                course: {
                    _id: course._id,
                    course_name: course.course_name,
                    description: course.description,
                    duration_hours: course.duration_hours
                },
                enrollment: {
                    _id: enrollment._id,
                    status: enrollment.status,
                    enrolled_at: enrollment.enrolled_at
                },
                questionBank: {
                    _id: questionBank._id,
                    name: questionBank.name,
                    total_questions: sanitizedQuestions.length
                },
                questions: sanitizedQuestions,
                timeRemaining: {
                    seconds: timeUntilEnd.seconds,
                    minutes: timeUntilEnd.minutes,
                    hours: timeUntilEnd.hours
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async submitTraining(sessionId, userId, answers, completionTime) {
        try {
            // Check if user is enrolled in this session
            const enrollment = await trainingRepository.getEnrollmentByUserAndSession(userId, sessionId);
            if (!enrollment) {
                return createResponse(403, 'You are not enrolled in this training session');
            }

            // Check if enrollment status allows submission
            if (enrollment.status !== 'enrolled') {
                return createResponse(400, `Cannot submit training. Current status: ${enrollment.status}`);
            }

            // Check if already submitted
            const existingSubmission = await trainingRepository.getSubmissionByEnrollment(enrollment._id);
            if (existingSubmission) {
                return createResponse(400, 'You have already submitted this training. Please wait for grading.');
            }

            // Get session to validate
            const session = await trainingRepository.getTrainingSessionById(sessionId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            // Create submission (lưu answers, chờ admin chấm)
            const submission = await trainingRepository.createSubmission({
                enrollment_id: enrollment._id,
                session_id: sessionId,
                user_id: userId,
                answers: answers,
                submitted_at: completionTime || new Date(),
                status: 'submitted'
            });

            // Update enrollment status to indicate submitted (vẫn giữ 'enrolled' nhưng có submission)
            // Note: Có thể thêm field submitted_at vào enrollment nếu cần

            return createResponse(200, 'Training submitted successfully. Please wait for grading.', {
                submission: {
                    id: submission._id,
                    submitted_at: submission.submitted_at,
                    status: submission.status
                },
                message: 'Bài làm của bạn đã được gửi. Vui lòng chờ admin chấm điểm.'
            });
        } catch (error) {
            if (error.code === 11000) {
                return createResponse(400, 'You have already submitted this training');
            }
            throw error;
        }
    }

    // ========== Admin Grading Services ==========
    
    /**
     * Get submissions waiting for grading
     */
    async getSubmissionsForGrading(filters = {}) {
        try {
            const submissions = await trainingRepository.getSubmissionsForGrading(filters);
            return createResponse(200, 'Submissions retrieved successfully', submissions);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get submission details for grading
     */
    async getSubmissionForGrading(submissionId) {
        try {
            const submission = await trainingRepository.getSubmissionForGrading(submissionId);
            if (!submission) {
                return createResponse(404, 'Submission not found');
            }
            return createResponse(200, 'Submission retrieved successfully', submission);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Grade a training submission (Admin only)
     */
    async gradeTrainingSubmission(submissionId, adminId, score, passed, adminComments = null) {
        try {
            // Get submission
            const submission = await trainingRepository.getSubmissionById(submissionId);
            if (!submission) {
                return createResponse(404, 'Submission not found');
            }

            if (submission.status === 'graded') {
                return createResponse(400, 'This submission has already been graded');
            }

            // Get questions to calculate score details
            const session = await trainingRepository.getTrainingSessionById(submission.session_id);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            const questionBank = await trainingRepository.getQuestionBankByCourseId(session.course_id);
            if (!questionBank) {
                return createResponse(404, 'Question bank not found');
            }

            const questions = await trainingRepository.getQuestionsByBankId(questionBank._id);
            
            // Calculate score details for reference
            const scoreDetails = trainingUtils.calculateScore(questions, submission.answers);
            
            // Update submission
            const updatedSubmission = await trainingRepository.updateSubmission(submissionId, {
                status: 'graded',
                graded_at: new Date(),
                graded_by: adminId,
                admin_comments: adminComments
            });

            // Update enrollment with results
            const updatedEnrollment = await trainingRepository.updateTrainingEnrollment(submission.enrollment_id, {
                status: passed ? 'completed' : 'failed',
                score: score,
                passed: passed,
                completion_date: new Date()
            });

            // Send notification to user
            try {
                const websocketService = require('../services/websocketService');
                await websocketService.emitToUser(submission.user_id, 'training_graded', {
                    type: 'training_graded',
                    enrollment: {
                        id: updatedEnrollment._id,
                        status: updatedEnrollment.status,
                        score: updatedEnrollment.score,
                        passed: updatedEnrollment.passed
                    },
                    message: passed 
                        ? `Chúc mừng! Bạn đã đậu khóa học với điểm số ${score}`
                        : `Bạn đã hoàn thành khóa học với điểm số ${score}. Vui lòng làm lại để đạt yêu cầu.`
                });
            } catch (notifError) {
                console.error('Error sending notification:', notifError);
                // Don't fail if notification fails
            }

            return createResponse(200, 'Training submission graded successfully', {
                submission: updatedSubmission,
                enrollment: updatedEnrollment,
                scoreDetails: {
                    totalQuestions: scoreDetails.totalQuestions,
                    correctAnswers: scoreDetails.correctAnswers,
                    percentage: scoreDetails.percentage
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async retakeTraining(sessionId, userId) {
        try {
            // Check if user is enrolled in this session
            const enrollment = await trainingRepository.getEnrollmentByUserAndSession(userId, sessionId);
            if (!enrollment) {
                return createResponse(403, 'You are not enrolled in this training session');
            }

            // Check if enrollment status allows retake (only failed enrollments can retake)
            if (enrollment.status !== 'failed') {
                return createResponse(400, `Cannot retake training. Current status: ${enrollment.status}. Only failed trainings can be retaken.`);
            }

            // Get session details
            const session = await trainingRepository.getTrainingSessionById(sessionId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            // Check if session is still active
            if (trainingUtils.isSessionExpired(session.end_time)) {
                return createResponse(400, 'Training session has expired. Cannot retake.');
            }

            // Reset enrollment status to 'enrolled' for retake
            const updatedEnrollment = await trainingRepository.updateTrainingEnrollment(enrollment._id, {
                status: 'enrolled',
                score: null,
                passed: null,
                completion_date: null
            });

            // Get course information
            const course = await trainingRepository.getCourseById(session.course_id);
            if (!course) {
                return createResponse(404, 'Course not found');
            }

            // Get question bank and questions for the retake
            const questionBank = await trainingRepository.getQuestionBankByCourseId(session.course_id);
            if (!questionBank) {
                return createResponse(404, 'Question bank not found');
            }

            let questions = await trainingRepository.getQuestionsByBankId(questionBank._id);
            
            // Shuffle questions for retake
            questions = trainingUtils.shuffleQuestions(questions);
            const sanitizedQuestions = trainingUtils.sanitizeQuestions(questions);
            
            // Return training data for retake
            return createResponse(200, 'Training retake initiated successfully', {
                session: session,
                course: course,
                enrollment: updatedEnrollment,
                questions: sanitizedQuestions,
                questionBank: questionBank,
                retakeInfo: {
                    previousScore: enrollment.score,
                    previousStatus: enrollment.status,
                    retakeDate: new Date()
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // ========== Additional Helper Services ==========
    
    /**
     * Get available sessions for a course
     */
    async getAvailableSessionsForCourse(courseId, userId = null) {
        try {
            const sessions = await trainingRepository.getAvailableSessionsForCourse(courseId, userId);
            return createResponse(200, 'Available sessions retrieved successfully', sessions);
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    /**
     * Get user's enrollments with details
     */
    async getUserEnrollments(userId, filters = {}) {
        try {
            const enrollments = await trainingRepository.getUserEnrollments(userId, filters);
            return createResponse(200, 'User enrollments retrieved successfully', enrollments);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get improved course statistics
     */
    async getImprovedCourseStats(courseId) {
        try {
            const stats = await trainingRepository.getImprovedCourseStats(courseId);
            return createResponse(200, 'Course statistics retrieved successfully', stats);
        } catch (error) {
            if (error.message === 'Course not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }
}

module.exports = new TrainingService();
