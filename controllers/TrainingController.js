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
        const result = await trainingService.getAllCourses(filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getCourseById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await trainingService.getCourseById(courseId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const courseData = req.body;
        const result = await trainingService.createCourse(courseData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static updateCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const courseData = req.body;
        const result = await trainingService.updateCourse(courseId, courseData);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static deleteCourse = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await trainingService.deleteCourse(courseId);
        
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
        const result = await trainingService.getAllTrainingSessions(filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingSessionById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const result = await trainingService.getTrainingSessionById(sessionId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createTrainingSession = ErrorMiddleware.asyncHandler(async (req, res) => {
        const sessionData = req.body;
        const result = await trainingService.createTrainingSession(sessionData);
        
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
        
        // Get old session data for comparison
        const oldSessionResult = await trainingService.getTrainingSessionById(sessionId);
        const result = await trainingService.updateTrainingSession(sessionId, sessionData);
        
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
        
        // Get session data before deletion
        const oldSessionResult = await trainingService.getTrainingSessionById(sessionId);
        const result = await trainingService.deleteTrainingSession(sessionId);
        
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
        const result = await trainingService.getAllTrainingEnrollments(filters);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static getTrainingEnrollmentById = ErrorMiddleware.asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        const result = await trainingService.getTrainingEnrollmentById(enrollmentId);
        
        if (result.success) {
            return ApiResponse.success(res, result.data, result.message, result.statusCode);
        } else {
            return ApiResponse.error(res, result.message, result.statusCode || 500, result.data);
        }
    });

    static createTrainingEnrollment = ErrorMiddleware.asyncHandler(async (req, res) => {
        const enrollmentData = req.body;
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
        const result = await trainingService.getTrainingDashboardStats();
        
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
}

module.exports = TrainingController;