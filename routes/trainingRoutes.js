const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/TrainingController');
const trainingValidation = require('../validations/trainingValidation');
const ExpressValidatorMiddleware = require('../middlewares/ExpressValidatorMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RoleMiddleware = require('../middlewares/RoleMiddleware');

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);

// ========== Course Set Routes ==========
// Company Admin & Header Department routes
router.get('/course-sets', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    trainingController.getAllCourseSets
);

router.get('/course-sets/:courseSetId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getCourseSetById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseSetById
);

router.post('/course-sets', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createCourseSet
);

router.put('/course-sets/:courseSetId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateCourseSet
);

router.delete('/course-sets/:courseSetId', 
    (req, res, next) => {
        console.log('🔍 DELETE /course-sets/:courseSetId - Route matched', {
            method: req.method,
            url: req.url,
            originalUrl: req.originalUrl,
            params: req.params,
            courseSetId: req.params.courseSetId
        });
        next();
    },
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteCourseSet,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteCourseSet
);

// ========== Course Routes ==========
// Admin, Header Department and Manager can view courses
router.get('/courses', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getAllCourses,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllCourses
);

// Employee can view deployed courses
router.get('/courses/available', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.getAllCourses,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAvailableCoursesForEmployee
);

// Get available sessions for a specific course (Employee) - Must be before /courses/:courseId
router.get('/courses/:courseId/available-sessions', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.getCourseById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAvailableSessionsForCourse
);

router.get('/courses/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'employee']),
    ...trainingValidation.getCourseById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseById
);

// Company Admin & Header Department routes
router.post('/courses', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createCourse
);

router.put('/courses/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateCourse
);

router.delete('/courses/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteCourse
);

router.get('/courses/:courseId/stats', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getCourseStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCourseStats
);

// ========== Training Session Routes ==========
// Admin, Header Department and Manager can view sessions
router.get('/sessions', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getAllTrainingSessions,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllTrainingSessions
);

// Employee can view available sessions for their courses
router.get('/sessions/available', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.getAllTrainingSessions,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAvailableTrainingSessionsForEmployee
);

router.get('/sessions/:sessionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'employee']),
    ...trainingValidation.getTrainingSessionById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingSessionById
);

// Admin & Header Department routes
router.post('/sessions', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createTrainingSession
);

router.put('/sessions/:sessionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateTrainingSession
);

router.delete('/sessions/:sessionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteTrainingSession,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteTrainingSession
);

router.get('/sessions/:sessionId/enrollment-stats', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getSessionEnrollmentStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getSessionEnrollmentStats
);

// ========== Training Enrollment Routes ==========
// Admin, Header Department and Manager can view all enrollments, Employee can view their own
router.get('/enrollments', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department', 'employee']),
    ...trainingValidation.getAllTrainingEnrollments,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllTrainingEnrollments
);

router.get('/enrollments/:enrollmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department', 'employee']),
    ...trainingValidation.getTrainingEnrollmentById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingEnrollmentById
);

// Manager can enroll employees, Admin can enroll anyone, Employee can self-enroll
router.post('/enrollments', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department', 'employee']),
    ...trainingValidation.createTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createTrainingEnrollment
);

router.put('/enrollments/:enrollmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.updateTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateTrainingEnrollment
);

router.delete('/enrollments/:enrollmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.deleteTrainingEnrollment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteTrainingEnrollment
);

// ========== Course Quiz Routes (New - replaces session-based training) ==========
// Employee only routes
router.post('/courses/:courseId/start', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.startCourseQuiz,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.startCourseQuiz
);

router.post('/courses/:courseId/submit', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.submitCourseQuiz,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.submitCourseQuiz
);

router.post('/courses/:courseId/retake', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.retakeCourseQuiz,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.retakeCourseQuiz
);

// ========== Old Session-based Training Routes (Deprecated) ==========
// Keep for backward compatibility but will return error
router.post('/sessions/:sessionId/start', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.startTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.startTraining
);

router.post('/sessions/:sessionId/submit', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.submitTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.submitTraining
);

router.post('/sessions/:sessionId/retake', 
    RoleMiddleware.requireRole('employee'),
    ...trainingValidation.retakeTraining,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.retakeTraining
);

// ========== Question Bank Routes ==========
// Admin & Header Department routes
router.get('/question-banks', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getAllQuestionBanks,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getAllQuestionBanks
);

router.get('/question-banks/:bankId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getQuestionBankById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBankById
);

router.post('/question-banks', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createQuestionBank
);

router.put('/question-banks/:bankId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateQuestionBank
);

router.delete('/question-banks/:bankId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteQuestionBank,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteQuestionBank
);

router.get('/question-banks/:bankId/stats', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getQuestionBankStats,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBankStats
);

router.get('/question-banks/course/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getQuestionBanksByCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionBanksByCourse
);

// ========== Questions Routes ==========
// Admin & Header Department routes
router.get('/questions', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    trainingController.getAllQuestions
);

router.get('/questions/:questionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.getQuestionById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getQuestionById
);

router.post('/questions', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createQuestion
);

router.put('/questions/:questionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateQuestion
);

router.delete('/questions/:questionId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteQuestion,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteQuestion
);

router.post('/questions/import-excel', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    uploadMiddleware.single('excelFile'),
    ...trainingValidation.importQuestionsFromExcel,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.importQuestionsFromExcel
);


// ========== Dashboard Routes ==========
// Admin, Header Department and Manager can view dashboard
router.get('/dashboard/stats', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    trainingController.getTrainingDashboardStats
);

// ========== Training Assignment Routes ==========
// Admin, Header Department and Manager can view assignments
router.get('/assignments', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    trainingController.getAllTrainingAssignments
);

router.get('/assignments/:assignmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getTrainingAssignmentById,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingAssignmentById
);

// Admin & Header Department routes
router.post('/assignments', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.createTrainingAssignment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.createTrainingAssignment
);

router.put('/assignments/:assignmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.updateTrainingAssignment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.updateTrainingAssignment
);

router.delete('/assignments/:assignmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'header_department']),
    ...trainingValidation.deleteTrainingAssignment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deleteTrainingAssignment
);

router.get('/assignments/department/:departmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getTrainingAssignmentsByDepartment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingAssignmentsByDepartment
);

router.get('/assignments/course/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getTrainingAssignmentsByCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getTrainingAssignmentsByCourse
);

router.get('/courses/department/:departmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getCoursesByDepartment,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getCoursesByDepartment
);

router.get('/departments/course/:courseId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getDepartmentsByCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getDepartmentsByCourse
);

router.get('/assignments/stats', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    trainingController.getAssignmentStats
);

router.get('/dashboard/department/:departmentId', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.getDepartmentTrainingDashboard,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.getDepartmentTrainingDashboard
);

// ========== Course Deployment Routes ==========
router.post('/courses/:courseId/deploy', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.deployCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.deployCourse
);

router.post('/courses/:courseId/undeploy', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'header_department']),
    ...trainingValidation.undeployCourse,
    ExpressValidatorMiddleware.handleValidationErrors,
    trainingController.undeployCourse
);

// ========== Employee Training Routes ==========
// Employee can view available training sessions
router.get('/sessions/employee', 
    RoleMiddleware.requireAnyRole(['company_admin', 'manager', 'employee']),
    trainingController.getEmployeeTrainingSessions
);

module.exports = router;
