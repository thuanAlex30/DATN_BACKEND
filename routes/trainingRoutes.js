const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/TrainingController');
const trainingValidation = require('../validations/trainingValidation');
const ExpressValidatorMiddleware = require('../middlewares/ExpressValidatorMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);

// ========== Course Set Routes ==========
router.get('/course-sets', 
    trainingController.getAllCourseSets
);

router.get('/course-sets/:courseSetId', 
    ...trainingValidation.getCourseSetById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseSetById
);

router.post('/course-sets', 
    ...trainingValidation.createCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createCourseSet
);

router.put('/course-sets/:courseSetId', 
    ...trainingValidation.updateCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateCourseSet
);

router.delete('/course-sets/:courseSetId', 
    ...trainingValidation.deleteCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteCourseSet
);

// ========== Course Routes ==========
router.get('/courses', 
    ...trainingValidation.getAllCourses,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllCourses
);

router.get('/courses/:courseId', 
    ...trainingValidation.getCourseById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseById
);

router.post('/courses', 
    ...trainingValidation.createCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createCourse
);

router.put('/courses/:courseId', 
    ...trainingValidation.updateCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateCourse
);

router.delete('/courses/:courseId', 
    ...trainingValidation.deleteCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteCourse
);

router.get('/courses/:courseId/stats', 
    ...trainingValidation.getCourseStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseStats
);

// ========== Training Session Routes ==========
router.get('/sessions', 
    ...trainingValidation.getAllTrainingSessions,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllTrainingSessions
);

router.get('/sessions/:sessionId', 
    ...trainingValidation.getTrainingSessionById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingSessionById
);

router.post('/sessions', 
    ...trainingValidation.createTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createTrainingSession
);

router.put('/sessions/:sessionId', 
    ...trainingValidation.updateTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateTrainingSession
);

router.delete('/sessions/:sessionId', 
    ...trainingValidation.deleteTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteTrainingSession
);

router.get('/sessions/:sessionId/enrollment-stats', 
    ...trainingValidation.getSessionEnrollmentStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getSessionEnrollmentStats
);

// ========== Training Enrollment Routes ==========
router.get('/enrollments', 
    ...trainingValidation.getAllTrainingEnrollments,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllTrainingEnrollments
);

router.get('/enrollments/:enrollmentId', 
    ...trainingValidation.getTrainingEnrollmentById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingEnrollmentById
);

router.post('/enrollments', 
    ...trainingValidation.createTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createTrainingEnrollment
);

router.put('/enrollments/:enrollmentId', 
    ...trainingValidation.updateTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateTrainingEnrollment
);

router.delete('/enrollments/:enrollmentId', 
    ...trainingValidation.deleteTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteTrainingEnrollment
);

// ========== Start Training Routes ==========
router.post('/sessions/:sessionId/start', 
    ...trainingValidation.startTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.startTraining
);

router.post('/sessions/:sessionId/submit', 
    ...trainingValidation.submitTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.submitTraining
);

// ========== Admin Grading Routes ==========
router.get('/submissions/grading', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize(['admin', 'manager']),
    trainingController.getSubmissionsForGrading
);

router.get('/submissions/:submissionId/grading', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize(['admin', 'manager']),
    trainingController.getSubmissionForGrading
);

router.post('/submissions/:submissionId/grade', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize(['admin', 'manager']),
    ...trainingValidation.gradeSubmission,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.gradeTrainingSubmission
);

router.post('/sessions/:sessionId/retake', 
    ...trainingValidation.retakeTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.retakeTraining
);

// ========== Question Bank Routes ==========
router.get('/question-banks', 
    ...trainingValidation.getAllQuestionBanks,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllQuestionBanks
);

router.get('/question-banks/:bankId', 
    ...trainingValidation.getQuestionBankById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBankById
);

router.post('/question-banks', 
    ...trainingValidation.createQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createQuestionBank
);

router.put('/question-banks/:bankId', 
    ...trainingValidation.updateQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateQuestionBank
);

router.delete('/question-banks/:bankId', 
    ...trainingValidation.deleteQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteQuestionBank
);

router.get('/question-banks/:bankId/stats', 
    ...trainingValidation.getQuestionBankStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBankStats
);

router.get('/question-banks/course/:courseId', 
    ...trainingValidation.getQuestionBanksByCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBanksByCourse
);

// ========== Questions Routes ==========
router.get('/questions', 
    trainingController.getAllQuestions
);

router.get('/questions/:questionId', 
    ...trainingValidation.getQuestionById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionById
);

router.post('/questions', 
    ...trainingValidation.createQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createQuestion
);

router.put('/questions/:questionId', 
    ...trainingValidation.updateQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateQuestion
);

router.delete('/questions/:questionId', 
    ...trainingValidation.deleteQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteQuestion
);

router.post('/questions/import-excel', 
    uploadMiddleware.single('excelFile'),
    ...trainingValidation.importQuestionsFromExcel,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.importQuestionsFromExcel
);


// ========== Dashboard Routes ==========
router.get('/dashboard/stats', 
    trainingController.getTrainingDashboardStats
);

// ========== Additional Helper Routes ==========
router.get('/courses/:courseId/available-sessions', 
    ...trainingValidation.getAvailableSessions,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAvailableSessionsForCourse
);

router.get('/users/:userId/enrollments', 
    ...trainingValidation.getUserEnrollments,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getUserEnrollments
);

router.get('/courses/:courseId/stats-improved', 
    ...trainingValidation.getCourseStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getImprovedCourseStats
);

module.exports = router;
