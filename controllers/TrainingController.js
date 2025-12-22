const trainingService = require('../services/trainingService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const path = require('path');
const websocketService = require('../services/websocketService');
const TrainingEvents = require('../events/trainingEvents');

class TrainingController {
    // ========== Course Set Controllers ==========
    static getAllCourseSets = ErrorMiddleware.asyncHandler(async (req, res) => {
        const result = await trainingService.getAllCourseSets();
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getCourseSetById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseSetId } = req.params;
        const result = await trainingService.getCourseSetById(courseSetId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createCourseSet = ErrorMiddleware.asyncHandler(async (req, res) => {
        const courseSetData = req.body;
        const result = await trainingService.createCourseSet(courseSetData);
        
        if (result.success) {
            // Emit course set created event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitCourseSetCreated(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting course set created event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateCourseSet = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseSetId } = req.params;
        const courseSetData = req.body;
        
        // Get old course set data for comparison
        const oldCourseSetResult = await trainingService.getCourseSetById(courseSetId);
        const result = await trainingService.updateCourseSet(courseSetId, courseSetData);
        
        if (result.success) {
            // Emit course set updated event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                if (oldCourseSetResult.success) {
                    await TrainingEvents.emitCourseSetUpdated(result.data, oldCourseSetResult.data, metadata);
                }
            } catch (error) {
                console.error('❌ Error emitting course set updated event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteCourseSet = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseSetId } = req.params;
        
        // Get course set data before deletion
        const oldCourseSetResult = await trainingService.getCourseSetById(courseSetId);
        const result = await trainingService.deleteCourseSet(courseSetId);
        
        if (result.success) {
            // Emit course set deleted event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                if (oldCourseSetResult.success) {
                    await TrainingEvents.emitCourseSetDeleted(oldCourseSetResult.data, metadata);
                }
            } catch (error) {
                console.error('❌ Error emitting course set deleted event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Course Controllers ==========
    static getAllCourses = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        // Allow system admin to override tenant filter via query param
        let tenantId = req.user?.tenant_id || null;
        const currentRoleLevel = (req.user && req.user.role && req.user.role.role_level) ? req.user.role.role_level : (req.user?.role_level || 0);
        if (currentRoleLevel >= 100 && req.query?.tenant_id) {
            tenantId = req.query.tenant_id;
        }
        const result = await trainingService.getAllCourses(filters, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getAvailableCoursesForEmployee = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        const userId = req.user.id;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getAvailableCoursesForEmployee(userId, filters, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getCourseById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getCourseById(courseId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const courseData = req.body;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.createCourse(courseData, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const courseData = req.body;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.updateCourse(courseId, courseData, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.deleteCourse(courseId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getCourseStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await trainingService.getCourseStats(courseId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Training Session Controllers ==========
    static getAllTrainingSessions = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        // Allow system admin to override tenant filter via query param
        let tenantId = req.user?.tenant_id || null;
        const currentRoleLevel = (req.user && req.user.role && req.user.role.role_level) ? req.user.role.role_level : (req.user?.role_level || 0);
        if (currentRoleLevel >= 100 && req.query?.tenant_id) {
            tenantId = req.query.tenant_id;
        }
        const result = await trainingService.getAllTrainingSessions(filters, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getAvailableTrainingSessionsForEmployee = ErrorMiddleware.asyncHandler(async (req, res) => {
        const userId = req.user?.id;
        const tenantId = req.user.tenant_id;
        const filters = req.query;
        const result = await trainingService.getAvailableTrainingSessionsForEmployee(userId, tenantId, filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getAvailableSessionsForCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user?.id;
        const tenantId = req.user.tenant_id;
        const filters = { ...req.query, courseId };
        const result = await trainingService.getAvailableTrainingSessionsForEmployee(userId, tenantId, filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingSessionById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const tenantId = req.user.tenant_id;
        const result = await trainingService.getTrainingSessionById(sessionId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createTrainingSession = ErrorMiddleware.asyncHandler(async (req, res) => {
        const sessionData = req.body;
        const tenantId = req.user.tenant_id;
        const result = await trainingService.createTrainingSession(sessionData, tenantId);
        
        if (result.success) {
            // Emit training session created event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingSessionCreated(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training session created event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateTrainingSession = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const sessionData = req.body;
        const tenantId = req.user.tenant_id;
        
        // Get old session data for comparison
        const oldSessionResult = await trainingService.getTrainingSessionById(sessionId, tenantId);
        const result = await trainingService.updateTrainingSession(sessionId, sessionData, tenantId);
        
        if (result.success) {
            // Emit training session updated event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                if (oldSessionResult.success) {
                    await TrainingEvents.emitTrainingSessionUpdated(result.data, oldSessionResult.data, metadata);
                }
            } catch (error) {
                console.error('❌ Error emitting training session updated event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteTrainingSession = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const tenantId = req.user.tenant_id;
        
        // Get session data before deletion
        const oldSessionResult = await trainingService.getTrainingSessionById(sessionId, tenantId);
        const result = await trainingService.deleteTrainingSession(sessionId, tenantId);
        
        if (result.success) {
            // Emit training session deleted event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                if (oldSessionResult.success) {
                    await TrainingEvents.emitTrainingSessionDeleted(oldSessionResult.data, metadata);
                }
            } catch (error) {
                console.error('❌ Error emitting training session deleted event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getSessionEnrollmentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const result = await trainingService.getSessionEnrollmentStats(sessionId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Training Enrollment Controllers ==========
    static getAllTrainingEnrollments = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        const tenantId = req.user?.tenant_id || null;
        const userRole = req.user?.role?.role_name;
        
        // If user is employee, only show their own enrollments
        if (userRole === 'employee') {
            filters.userId = req.user.id;
        }
        
        const result = await trainingService.getAllTrainingEnrollments(filters, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingEnrollmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        const userRole = req.user?.role?.role_name;
        
        const result = await trainingService.getTrainingEnrollmentById(enrollmentId);
        
        if (result.success) {
            // If user is employee, check if they own this enrollment
            if (userRole === 'employee' && result.data.user_id.toString() !== req.user.id.toString()) {
                return ApiResponse.forbidden(res, 'Access denied: You can only view your own enrollments');
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createTrainingEnrollment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const enrollmentData = req.body;
        const userRole = req.user?.role?.role_name;
        
        // If user is employee, they can only enroll themselves
        if (userRole === 'employee') {
            enrollmentData.user_id = req.user.id;
        }
        
        const result = await trainingService.createTrainingEnrollment(enrollmentData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateTrainingEnrollment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        const enrollmentData = req.body;
        const result = await trainingService.updateTrainingEnrollment(enrollmentId, enrollmentData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteTrainingEnrollment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        const result = await trainingService.deleteTrainingEnrollment(enrollmentId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Question Bank Controllers ==========
    static getAllQuestionBanks = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        const result = await trainingService.getAllQuestionBanks(filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getQuestionBankById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { bankId } = req.params;
        const result = await trainingService.getQuestionBankById(bankId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createQuestionBank = ErrorMiddleware.asyncHandler(async (req, res) => {
        const bankData = req.body;
        const result = await trainingService.createQuestionBank(bankData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateQuestionBank = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { bankId } = req.params;
        const bankData = req.body;
        const result = await trainingService.updateQuestionBank(bankId, bankData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteQuestionBank = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { bankId } = req.params;
        const result = await trainingService.deleteQuestionBank(bankId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getQuestionBankStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { bankId } = req.params;
        const result = await trainingService.getQuestionBankStats(bankId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getQuestionBanksByCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await trainingService.getQuestionBanksByCourse(courseId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Questions Controllers ==========
    static getAllQuestions = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        const result = await trainingService.getAllQuestions(filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getQuestionById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { questionId } = req.params;
        const result = await trainingService.getQuestionById(questionId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createQuestion = ErrorMiddleware.asyncHandler(async (req, res) => {
        const questionData = req.body;
        const result = await trainingService.createQuestion(questionData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateQuestion = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { questionId } = req.params;
        const questionData = req.body;
        const result = await trainingService.updateQuestion(questionId, questionData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteQuestion = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { questionId } = req.params;
        const result = await trainingService.deleteQuestion(questionId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static importQuestionsFromExcel = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { bankId } = req.params;
        
        if (!req.file) {
            return ApiResponse.error(res, 'No file uploaded', 400);
        }

        const result = await trainingService.importQuestionsFromExcel(bankId, req.file);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Dashboard Statistics ==========
    static getTrainingDashboardStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getTrainingDashboardStats(tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // Enrollment stats grouped by status (tenant-scoped via session.tenant_id)
    static getEnrollmentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getEnrollmentStats(tenantId);

        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // Session stats grouped by status_code (tenant-scoped)
    static getSessionStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getSessionStats(tenantId);

        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Training Actions ==========
    static startTraining = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const userId = req.user._id || req.user.id;
        
        const result = await trainingService.startTraining(sessionId, userId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static submitTraining = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const userId = req.user._id || req.user.id;
        const { answers, score, completionTime } = req.body;
        
        const result = await trainingService.submitTraining(sessionId, userId, answers, score, completionTime);
        
        if (result.success) {
            // Emit training completion event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingCompletion(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training completion event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static retakeTraining = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const userId = req.user._id || req.user.id;
        
        const result = await trainingService.retakeTraining(sessionId, userId);
        
        if (result.success) {
            // Emit training retake event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingRetake(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training retake event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Course Quiz Controllers (New - replaces session-based training) ==========
    static startCourseQuiz = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;
        const tenantId = req.user?.tenant_id;
        
        const result = await trainingService.startCourseQuiz(courseId, userId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static submitCourseQuiz = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;
        const { answers, score, completionTime } = req.body;
        const tenantId = req.user?.tenant_id;
        
        const result = await trainingService.submitCourseQuiz(courseId, userId, answers, score, completionTime, tenantId);
        
        if (result.success) {
            // Emit training completion event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingCompletion(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training completion event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static retakeCourseQuiz = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;
        const tenantId = req.user?.tenant_id;
        
        const result = await trainingService.retakeCourseQuiz(courseId, userId, tenantId);
        
        if (result.success) {
            // Emit training retake event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingRetake(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training retake event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Training Assignment Controllers ==========
    static getAllTrainingAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
        const filters = req.query;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getAllTrainingAssignments(filters, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingAssignmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        const result = await trainingService.getTrainingAssignmentById(assignmentId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createTrainingAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const tenantId = req.user?.tenant_id || null;
        const assignmentData = {
            ...req.body,
            assigned_by: req.user._id,
            tenant_id: tenantId  // ✅ Tự động set tenant_id
        };
        
        const result = await trainingService.createTrainingAssignment(assignmentData);
        
        if (result.success) {
            // Emit training assignment event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitTrainingAssignment(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting training assignment event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateTrainingAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        const assignmentData = req.body;
        
        const result = await trainingService.updateTrainingAssignment(assignmentId, assignmentData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteTrainingAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        const result = await trainingService.deleteTrainingAssignment(assignmentId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingAssignmentsByDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { departmentId } = req.params;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getTrainingAssignmentsByDepartment(departmentId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingAssignmentsByCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getTrainingAssignmentsByCourse(courseId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getCoursesByDepartment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { departmentId } = req.params;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getCoursesByDepartment(departmentId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getDepartmentsByCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await trainingService.getDepartmentsByCourse(courseId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getAssignmentStats = ErrorMiddleware.asyncHandler(async (req, res) => {
        const result = await trainingService.getAssignmentStats();
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getDepartmentTrainingDashboard = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { departmentId } = req.params;
        const result = await trainingService.getDepartmentTrainingDashboard(departmentId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Course Deployment Controllers ==========
    static deployCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;
        
        const result = await trainingService.deployCourse(courseId, userId);
        
        if (result.success) {
            // Emit course deployed event
            try {
                const metadata = {
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    userFullName: req.user?.full_name,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                };
                await TrainingEvents.emitCourseDeployed(result.data, metadata);
            } catch (error) {
                console.error('❌ Error emitting course deployed event:', error);
                // Don't fail the request if event emission fails
            }
            
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static undeployCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;
        
        const result = await trainingService.undeployCourse(courseId, userId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    // ========== Employee Training Routes ==========
    static getEmployeeTrainingSessions = ErrorMiddleware.asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const tenantId = req.user?.tenant_id || null;
        const result = await trainingService.getEmployeeTrainingSessions(userId, tenantId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });
}

module.exports = TrainingController;