const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
    if (!value) return false;
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
            .custom(isValidObjectId)
            .withMessage('Invalid course set ID')
    ],

    deleteCourseSet: [
        param('courseSetId')
            .custom(isValidObjectId)
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
            .isFloat({ min: 1 })
            .withMessage('Duration must be a number and at least 1 hour'),
        body('is_mandatory')
            .isBoolean()
            .withMessage('is_mandatory must be a boolean value'),
        body('validity_months')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Validity months must be an integer and at least 1'),
        body('prerequisite_course_ids')
            .optional()
            .isArray()
            .withMessage('prerequisite_course_ids must be an array'),
        body('prerequisite_course_ids.*')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Each prerequisite course ID must be a valid ObjectId')
    ],

    updateCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID'),
        body('course_set_id')
            .optional()
            .custom(isValidObjectId)
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
            .isFloat({ min: 1 })
            .withMessage('Duration must be a number and at least 1 hour'),
        body('is_mandatory')
            .optional()
            .isBoolean()
            .withMessage('is_mandatory must be a boolean value'),
        body('validity_months')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Validity months must be an integer and at least 1'),
        body('prerequisite_course_ids')
            .optional()
            .isArray()
            .withMessage('prerequisite_course_ids must be an array'),
        body('prerequisite_course_ids.*')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Each prerequisite course ID must be a valid ObjectId')
    ],

    getCourseById: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ],

    deleteCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ],

    getCourseStats: [
        param('courseId')
            .custom(isValidObjectId)
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
            .custom(isValidObjectId)
            .withMessage('Valid instructor ID is required'),
        body('max_participants')
            .isInt({ min: 1 })
            .withMessage('Max participants must be an integer and at least 1'),
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
            .custom(isValidObjectId)
            .withMessage('Valid instructor ID is required'),
        body('max_participants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be an integer and at least 1'),
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
            .custom(isValidObjectId)
            .withMessage('Invalid session ID')
    ],

    deleteTrainingSession: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Invalid session ID')
    ],

    getSessionEnrollmentStats: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Invalid session ID')
    ],

    // Training Enrollment Validations
    createTrainingEnrollment: [
        body('course_id')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('user_id')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('assigned_by')
            .optional()
            .custom(isValidObjectId)
            .withMessage('Valid assigned_by user ID is required'),
        body('status')
            .optional()
            .isIn(['enrolled', 'in_progress', 'completed', 'failed', 'cancelled'])
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
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID')
    ],

    deleteQuestionBank: [
        param('bankId')
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID')
    ],

    getQuestionBankStats: [
        param('bankId')
            .custom(isValidObjectId)
            .withMessage('Invalid question bank ID')
    ],

    getQuestionBanksByCourse: [
        param('courseId')
            .custom(isValidObjectId)
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
            .custom(isValidObjectId)
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
            .withMessage('Page must be an integer and at least 1')
    ],

    // ========== Course Quiz Validations (New - replaces session-based training) ==========
    startCourseQuiz: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required')
    ],

    submitCourseQuiz: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('answers')
            .isObject()
            .withMessage('Answers must be an object')
            .notEmpty()
            .withMessage('Answers cannot be empty')
    ],

    retakeCourseQuiz: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required')
    ],

    // ========== Old Session-based Training Validations (Deprecated) ==========
    startTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required')
    ],

    submitTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required'),
        body('answers')
            .isObject()
            .withMessage('Answers must be an object'),
        body('score')
            .isFloat({ min: 0 })
            .withMessage('Score must be a number greater than or equal to 0'),
        body('completionTime')
            .optional()
            .isISO8601()
            .withMessage('Valid completion time is required'),
        body('completion_time')
            .optional()
            .isISO8601()
            .withMessage('Valid completion time is required')
    ],

    retakeTraining: [
        param('sessionId')
            .custom(isValidObjectId)
            .withMessage('Valid session ID is required')
    ],

    // ========== Training Assignment Validations ==========
    createTrainingAssignment: [
        body('course_id')
            .custom(isValidObjectId)
            .withMessage('Valid course ID is required'),
        body('department_id')
            .custom(isValidObjectId)
            .withMessage('Valid department ID is required'),
        body('notes')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Notes must be a string with maximum 500 characters')
    ],

    updateTrainingAssignment: [
        param('assignmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid assignment ID'),
        body('status')
            .optional()
            .isIn(['active', 'inactive'])
            .withMessage('Status must be active or inactive'),
        body('notes')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Notes must be a string with maximum 500 characters')
    ],

    getTrainingAssignmentById: [
        param('assignmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid assignment ID')
    ],

    deleteTrainingAssignment: [
        param('assignmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid assignment ID')
    ],

    getTrainingAssignmentsByDepartment: [
        param('departmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid department ID')
    ],

    getTrainingAssignmentsByCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ],

    getCoursesByDepartment: [
        param('departmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid department ID')
    ],

    getDepartmentsByCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ],

    getDepartmentTrainingDashboard: [
        param('departmentId')
            .custom(isValidObjectId)
            .withMessage('Invalid department ID')
    ],

    // Course Deployment Validations
    deployCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ],

    undeployCourse: [
        param('courseId')
            .custom(isValidObjectId)
            .withMessage('Invalid course ID')
    ]
};

module.exports = trainingValidation;
