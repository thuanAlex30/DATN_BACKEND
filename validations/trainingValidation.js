const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

const trainingValidation = {
    // Course Set Validations
    createCourseSet: [
        body('name')
            .notEmpty()
            .withMessage('Course set name is required')
            .isLength({ min: 1, max: 255 })
            .withMessage('Course set name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters')
    ],

    updateCourseSet: [
        param('courseSetId')
            .custom(isValidObjectId)
            .withMessage('Invalid course set ID'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('Course set name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters')
    ],

    getCourseSetById: [
        param('courseSetId')
            .isInt({ min: 1 })
            .withMessage('Invalid course set ID')
    ],

    deleteCourseSet: [
        param('courseSetId')
            .isInt({ min: 1 })
            .withMessage('Invalid course set ID')
    ],

    // Course Validations
    createCourse: [
        body('course_set_id')
            .custom(isValidObjectId)
            .withMessage('Valid course set ID is required'),
        body('course_name')
            .notEmpty()
            .withMessage('Course name is required')
            .isLength({ min: 1, max: 255 })
            .withMessage('Course name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('duration_hours')
            .isInt({ min: 1 })
            .withMessage('Duration must be at least 1 hour'),
        body('is_mandatory')
            .isBoolean()
            .withMessage('is_mandatory must be a boolean value'),
        body('validity_months')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Validity months must be at least 1')
    ],

    updateCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID'),
        body('course_set_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Valid course set ID is required'),
        body('course_name')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('Course name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('duration_hours')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Duration must be at least 1 hour'),
        body('is_mandatory')
            .optional()
            .isBoolean()
            .withMessage('is_mandatory must be a boolean value'),
        body('validity_months')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Validity months must be at least 1')
    ],

    getCourseById: [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage('Invalid course ID')
    ],

    deleteCourse: [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage('Invalid course ID')
    ],

    getCourseStats: [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage('Invalid course ID')
    ],

    // Training Session Validations
    createTrainingSession: [
        body('course_id')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('session_name')
            .notEmpty()
            .withMessage('Session name is required')
            .isLength({ min: 1, max: 255 })
            .withMessage('Session name must be between 1 and 255 characters'),
        body('start_time')
            .isISO8601()
            .withMessage('Valid start time is required'),
        body('end_time')
            .isISO8601()
            .withMessage('Valid end time is required'),
        body('instructor_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Valid instructor ID is required'),
        body('max_participants')
            .isInt({ min: 1 })
            .withMessage('Max participants must be at least 1'),
        body('location')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Location must not exceed 255 characters'),
        body('status_code')
            .isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'])
            .withMessage('Invalid status code')
    ],

    updateTrainingSession: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Invalid session ID'),
        body('course_id')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('session_name')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('Session name must be between 1 and 255 characters'),
        body('start_time')
            .optional()
            .isISO8601()
            .withMessage('Valid start time is required'),
        body('end_time')
            .optional()
            .isISO8601()
            .withMessage('Valid end time is required'),
        body('instructor_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Valid instructor ID is required'),
        body('max_participants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be at least 1'),
        body('location')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Location must not exceed 255 characters'),
        body('status_code')
            .optional()
            .isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'])
            .withMessage('Invalid status code')
    ],

    getTrainingSessionById: [
        param('sessionId')
            .isInt({ min: 1 })
            .withMessage('Invalid session ID')
    ],

    deleteTrainingSession: [
        param('sessionId')
            .isInt({ min: 1 })
            .withMessage('Invalid session ID')
    ],

    getSessionEnrollmentStats: [
        param('sessionId')
            .isInt({ min: 1 })
            .withMessage('Invalid session ID')
    ],

    // Training Enrollment Validations
    createTrainingEnrollment: [
        body('session_id')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required'),
        body('user_id')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('status')
            .optional()
            .isIn(['enrolled', 'completed', 'failed', 'cancelled'])
            .withMessage('Invalid status')
    ],

    updateTrainingEnrollment: [
        param('enrollmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid enrollment ID'),
        body('status')
            .optional()
            .isIn(['enrolled', 'completed', 'failed', 'cancelled'])
            .withMessage('Invalid status'),
        body('score')
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Score must be between 0 and 100'),
        body('passed')
            .optional()
            .isBoolean()
            .withMessage('Passed must be a boolean value'),
        body('completion_date')
            .optional()
            .isISO8601()
            .withMessage('Valid completion date is required')
    ],

    getTrainingEnrollmentById: [
        param('enrollmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid enrollment ID')
    ],

    deleteTrainingEnrollment: [
        param('enrollmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid enrollment ID')
    ],

    // Question Bank Validations
    createQuestionBank: [
        body('course_id')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('name')
            .notEmpty()
            .withMessage('Question bank name is required')
            .isLength({ min: 1, max: 255 })
            .withMessage('Question bank name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters')
    ],

    updateQuestionBank: [
        param('bankId')
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID'),
        body('course_id')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('Question bank name must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters')
    ],

    getQuestionBankById: [
        param('bankId')
            .isInt({ min: 1 })
            .withMessage('Invalid question bank ID')
    ],

    deleteQuestionBank: [
        param('bankId')
            .isInt({ min: 1 })
            .withMessage('Invalid question bank ID')
    ],

    getQuestionBankStats: [
        param('bankId')
            .isInt({ min: 1 })
            .withMessage('Invalid question bank ID')
    ],

    getQuestionBanksByCourse: [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage('Invalid course ID')
    ],


    // Query Parameter Validations
    getAllCourses: [
        query('courseSetId')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Invalid course set ID'),
        query('isMandatory')
            .optional()
            .isBoolean()
            .withMessage('isMandatory must be a boolean'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search term must not exceed 255 characters')
    ],

    getAllTrainingSessions: [
        query('statusCode')
            .optional()
            .isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'])
            .withMessage('Invalid status code'),
        query('courseId')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Invalid course ID'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search term must not exceed 255 characters')
    ],

    getAllTrainingEnrollments: [
        query('status')
            .optional()
            .isIn(['enrolled', 'completed', 'failed', 'cancelled'])
            .withMessage('Invalid status'),
        query('userId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Invalid user ID')
    ],

    getAllQuestionBanks: [
        query('courseId')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Invalid course ID'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search term must not exceed 255 characters')
    ],

    // Question Validations
    createQuestion: [
        body('bank_id')
            .custom(isValidObjectId)
            .withMessage('Valid question bank ID is required'),
        body('content')
            .notEmpty()
            .withMessage('Question content is required')
            .isLength({ min: 10, max: 1000 })
            .withMessage('Question content must be between 10 and 1000 characters'),
        body('options')
            .isArray({ min: 2, max: 6 })
            .withMessage('Question must have between 2 and 6 options'),
        body('options.*')
            .notEmpty()
            .withMessage('All options must not be empty')
            .isLength({ min: 1, max: 500 })
            .withMessage('Each option must be between 1 and 500 characters'),
        body('correct_answer')
            .notEmpty()
            .withMessage('Correct answer is required')
            .isLength({ min: 1, max: 500 })
            .withMessage('Correct answer must be between 1 and 500 characters'),
        body('explanation')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Explanation must not exceed 1000 characters'),
        body('difficulty_level')
            .optional()
            .isIn(['EASY', 'MEDIUM', 'HARD'])
            .withMessage('Difficulty level must be EASY, MEDIUM, or HARD'),
        body('points')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Points must be between 1 and 10')
    ],

    updateQuestion: [
        param('questionId')
            .custom(isValidObjectId)
            .withMessage('Invalid question ID'),
        body('bank_id')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID'),
        body('content')
            .optional()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Question content must be between 10 and 1000 characters'),
        body('options')
            .optional()
            .isArray({ min: 2, max: 6 })
            .withMessage('Question must have between 2 and 6 options'),
        body('options.*')
            .optional()
            .isLength({ min: 1, max: 500 })
            .withMessage('Each option must be between 1 and 500 characters'),
        body('correct_answer')
            .optional()
            .isLength({ min: 1, max: 500 })
            .withMessage('Correct answer must be between 1 and 500 characters'),
        body('explanation')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Explanation must not exceed 1000 characters'),
        body('difficulty_level')
            .optional()
            .isIn(['EASY', 'MEDIUM', 'HARD'])
            .withMessage('Difficulty level must be EASY, MEDIUM, or HARD'),
        body('points')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Points must be between 1 and 10')
    ],

    getQuestionById: [
        param('questionId')
            .custom(isValidObjectId)
            .withMessage('Invalid question ID')
    ],

    deleteQuestion: [
        param('questionId')
            .custom(isValidObjectId)
            .withMessage('Invalid question ID')
    ],

    importQuestionsFromExcel: [
        body('bank_id')
            .custom(isValidObjectId)
            .withMessage('Valid question bank ID is required')
    ],

    getQuestionsByBank: [
        param('bankId')
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID'),
        query('difficulty')
            .optional()
            .isIn(['EASY', 'MEDIUM', 'HARD'])
            .withMessage('Invalid difficulty level'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be at least 1')
    ],

    importQuestionsFromExcel: [
        body('bank_id')
            .custom(isValidObjectId)
            .withMessage('Valid question bank ID is required')
    ],

    // Start Training Validation
    startTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required')
    ],

    // Submit Training Validation
    submitTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required'),
        body('answers')
            .isObject()
            .withMessage('Answers must be an object'),
        body('completionTime')
            .optional()
            .isISO8601()
            .withMessage('Valid completion time is required')
    ],

    // Grade Submission Validation
    gradeSubmission: [
        param('submissionId')
            .custom(isValidObjectId)
            .withMessage('Valid submission ID is required'),
        body('score')
            .isFloat({ min: 0, max: 100 })
            .withMessage('Score must be a number between 0 and 100'),
        body('passed')
            .isBoolean()
            .withMessage('Passed must be a boolean value'),
        body('admin_comments')
            .optional()
            .isString()
            .isLength({ max: 1000 })
            .withMessage('Admin comments must not exceed 1000 characters')
    ],

    // Retake Training Validation
    retakeTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required')
    ],

    // Get Available Sessions
    getAvailableSessions: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        query('userId')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required')
    ],

    // Get User Enrollments
    getUserEnrollments: [
        param('userId')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        query('status')
            .optional()
            .isIn(['enrolled', 'completed', 'failed', 'cancelled'])
            .withMessage('Invalid status')
    ]
};

module.exports = trainingValidation;
