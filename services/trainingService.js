const trainingRepository = require('../repository/TrainingRepository');
const { createResponse } = require('../utils/response');

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

    async getAvailableCoursesForEmployee(userId, filters = {}) {
        try {
            const courses = await trainingRepository.getAvailableCoursesForEmployee(userId, filters);
            return createResponse(200, 'Available courses for employee retrieved successfully', courses);
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
    async getAllTrainingSessions(filters = {}, tenantId = null) {
        try {
            const sessions = await trainingRepository.getAllTrainingSessions(filters, tenantId);
            return createResponse(200, 'Training sessions retrieved successfully', sessions);
        } catch (error) {
            throw error;
        }
    }

    async getAvailableTrainingSessionsForEmployee(userId, tenantId = null, filters = {}) {
        try {
            const sessions = await trainingRepository.getAvailableTrainingSessionsForEmployee(userId, tenantId, filters);
            return createResponse(200, 'Available training sessions retrieved successfully', sessions);
        } catch (error) {
            throw error;
        }
    }

    async getTrainingSessionById(sessionId, tenantId = null) {
        try {
            const session = await trainingRepository.getTrainingSessionById(sessionId, tenantId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }
            return createResponse(200, 'Training session retrieved successfully', session);
        } catch (error) {
            throw error;
        }
    }

    async createTrainingSession(sessionData, tenantId = null) {
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
            const session = await trainingRepository.createTrainingSession(sessionData, tenantId);
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

    async updateTrainingSession(sessionId, sessionData, tenantId = null) {
        try {
            // Validate session dates if provided
            if (sessionData.start_time && sessionData.end_time) {
                if (new Date(sessionData.start_time) >= new Date(sessionData.end_time)) {
                    return createResponse(400, 'End time must be after start time');
                }
            }

            const session = await trainingRepository.updateTrainingSession(sessionId, sessionData, tenantId);
            return createResponse(200, 'Training session updated successfully', session);
        } catch (error) {
            if (error.message === 'Training session not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteTrainingSession(sessionId, tenantId = null) {
        try {
            await trainingRepository.deleteTrainingSession(sessionId, tenantId);
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
            const now = new Date();
            let newStatus = session.status_code;

            // Update status based on time
            if (session.status_code === 'SCHEDULED' && now >= session.start_time && now <= session.end_time) {
                newStatus = 'ONGOING';
            } else if (session.status_code === 'ONGOING' && now > session.end_time) {
                newStatus = 'COMPLETED';
            } else if (session.status_code === 'SCHEDULED' && now > session.end_time) {
                newStatus = 'COMPLETED';
            }

            // Update session if status changed
            if (newStatus !== session.status_code) {
                await trainingRepository.updateTrainingSession(session._id, { status_code: newStatus });
            }

            return newStatus;
        } catch (error) {
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
            const questions = await trainingRepository.getQuestionsByBankId(questionBank._id);

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
                    duration_minutes: course.duration_minutes
                },
                enrollment: {
                    _id: enrollment._id,
                    status: enrollment.status,
                    enrolled_at: enrollment.enrolled_at
                },
                questionBank: {
                    _id: questionBank._id,
                    bank_name: questionBank.bank_name,
                    total_questions: questions.length
                },
                questions: questions.map(q => ({
                    _id: q._id,
                    content: q.content,
                    question_type: q.question_type,
                    options: q.options,
                    difficulty_level: q.difficulty_level,
                    points: q.points
                    // Note: correct_answer is not sent to frontend for security
                }))
            });
        } catch (error) {
            throw error;
        }
    }

    async submitTraining(sessionId, userId, answers, score, completionTime) {
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

            // Get questions to validate answers and calculate correct score
            const session = await trainingRepository.getTrainingSessionById(sessionId);
            if (!session) {
                return createResponse(404, 'Training session not found');
            }

            const questionBank = await trainingRepository.getQuestionBankByCourseId(session.course_id);
            if (!questionBank) {
                return createResponse(404, 'Question bank not found');
            }

            const questions = await trainingRepository.getQuestionsByBankId(questionBank._id);
            
            // Calculate actual score based on correct answers
            let actualScore = 0;
            let correctAnswers = 0;
            
            questions.forEach(question => {
                const userAnswer = answers[question._id];
                if (userAnswer === question.correct_answer) {
                    actualScore += question.points;
                    correctAnswers++;
                }
            });

            const totalPossibleScore = questions.reduce((sum, q) => sum + q.points, 0);
            const passThreshold = 70; // 70% to pass
            const passed = (actualScore / totalPossibleScore) * 100 >= passThreshold;

            // Update enrollment with results
            const updatedEnrollment = await trainingRepository.updateTrainingEnrollment(enrollment._id, {
                status: passed ? 'completed' : 'failed',
                score: actualScore,
                passed: passed,
                completion_date: completionTime
            });

            return createResponse(200, 'Training submitted successfully', {
                enrollment: updatedEnrollment,
                results: {
                    totalQuestions: questions.length,
                    correctAnswers: correctAnswers,
                    score: actualScore,
                    totalPossibleScore: totalPossibleScore,
                    percentage: Math.round((actualScore / totalPossibleScore) * 100),
                    passed: passed,
                    passThreshold: passThreshold
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
            const now = new Date();
            if (now > session.end_time) {
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

            const questions = await trainingRepository.getQuestionsByBankId(questionBank._id);
            
            // Return training data for retake
            return createResponse(200, 'Training retake initiated successfully', {
                session: session,
                course: course,
                enrollment: updatedEnrollment,
                questions: questions,
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

    // ========== Training Assignment Services ==========
    async getAllTrainingAssignments(filters = {}) {
        try {
            const assignments = await trainingRepository.getAllTrainingAssignments(filters);
            return createResponse(200, 'Training assignments retrieved successfully', assignments);
        } catch (error) {
            throw error;
        }
    }

    async getTrainingAssignmentById(assignmentId) {
        try {
            const assignment = await trainingRepository.getTrainingAssignmentById(assignmentId);
            if (!assignment) {
                return createResponse(404, 'Training assignment not found');
            }
            return createResponse(200, 'Training assignment retrieved successfully', assignment);
        } catch (error) {
            throw error;
        }
    }

    async createTrainingAssignment(assignmentData) {
        try {
            const assignment = await trainingRepository.createTrainingAssignment(assignmentData);
            return createResponse(201, 'Training assignment created successfully', assignment);
        } catch (error) {
            if (error.message === 'Course is already assigned to this department') {
                return createResponse(400, error.message);
            }
            throw error;
        }
    }

    async updateTrainingAssignment(assignmentId, assignmentData) {
        try {
            const assignment = await trainingRepository.updateTrainingAssignment(assignmentId, assignmentData);
            return createResponse(200, 'Training assignment updated successfully', assignment);
        } catch (error) {
            if (error.message === 'Training assignment not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async deleteTrainingAssignment(assignmentId) {
        try {
            await trainingRepository.deleteTrainingAssignment(assignmentId);
            return createResponse(200, 'Training assignment deleted successfully');
        } catch (error) {
            if (error.message === 'Training assignment not found') {
                return createResponse(404, error.message);
            }
            throw error;
        }
    }

    async getTrainingAssignmentsByDepartment(departmentId) {
        try {
            const assignments = await trainingRepository.getTrainingAssignmentsByDepartment(departmentId);
            return createResponse(200, 'Department training assignments retrieved successfully', assignments);
        } catch (error) {
            throw error;
        }
    }

    async getTrainingAssignmentsByCourse(courseId) {
        try {
            const assignments = await trainingRepository.getTrainingAssignmentsByCourse(courseId);
            return createResponse(200, 'Course training assignments retrieved successfully', assignments);
        } catch (error) {
            throw error;
        }
    }

    async getCoursesByDepartment(departmentId) {
        try {
            const courses = await trainingRepository.getCoursesByDepartment(departmentId);
            return createResponse(200, 'Department courses retrieved successfully', courses);
        } catch (error) {
            throw error;
        }
    }

    async getDepartmentsByCourse(courseId) {
        try {
            const departments = await trainingRepository.getDepartmentsByCourse(courseId);
            return createResponse(200, 'Course departments retrieved successfully', departments);
        } catch (error) {
            throw error;
        }
    }

    async getAssignmentStats() {
        try {
            const stats = await trainingRepository.getAssignmentStats();
            return createResponse(200, 'Assignment statistics retrieved successfully', stats);
        } catch (error) {
            throw error;
        }
    }

    // ========== Department-based Training Services ==========
    async getDepartmentTrainingDashboard(departmentId) {
        try {
            // Get assigned courses for department
            const assignments = await trainingRepository.getTrainingAssignmentsByDepartment(departmentId);
            const courseIds = assignments.map(a => a.course_id._id);
            
            // Get all enrollments for these courses
            const enrollments = await trainingRepository.getAllTrainingEnrollments({
                courseIds: courseIds
            });

            // Get department employees
            const User = require('../models/user');
            const departmentEmployees = await User.find({ 
                department_id: departmentId,
                role_id: { $ne: null }
            }).populate('role_id', 'role_name');

            const employees = departmentEmployees.filter(user => 
                user.role_id && user.role_id.role_name === 'employee'
            );

            // Calculate statistics
            const totalEmployees = employees.length;
            const totalCourses = assignments.length;
            const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
            const inProgressEnrollments = enrollments.filter(e => e.status === 'enrolled').length;
            const failedEnrollments = enrollments.filter(e => e.status === 'failed').length;

            const completionRate = totalEmployees > 0 ? (completedEnrollments / totalEmployees) * 100 : 0;

            return createResponse(200, 'Department training dashboard retrieved successfully', {
                department: {
                    _id: departmentId,
                    totalEmployees,
                    totalCourses
                },
                statistics: {
                    completedEnrollments,
                    inProgressEnrollments,
                    failedEnrollments,
                    completionRate: Math.round(completionRate * 100) / 100
                },
                assignments,
                employees: employees.map(emp => ({
                    _id: emp._id,
                    full_name: emp.full_name,
                    email: emp.email
                }))
            });
        } catch (error) {
            throw error;
        }
    }

    // ========== Course Deployment Services ==========
    async deployCourse(courseId, userId) {
        try {
            const course = await trainingRepository.getCourseById(courseId);
            if (!course) {
                return createResponse(404, 'Course not found');
            }

            if (course.is_deployed) {
                return createResponse(200, 'Course is already deployed', course);
            }

            const deployedCourse = await trainingRepository.deployCourse(courseId, userId);
            return createResponse(200, 'Course deployed successfully', deployedCourse);
        } catch (error) {
            throw error;
        }
    }

    async undeployCourse(courseId, userId) {
        try {
            const course = await trainingRepository.getCourseById(courseId);
            if (!course) {
                return createResponse(404, 'Course not found');
            }

            if (!course.is_deployed) {
                return createResponse(200, 'Course is not deployed', course);
            }

            const undeployedCourse = await trainingRepository.undeployCourse(courseId, userId);
            return createResponse(200, 'Course undeployed successfully', undeployedCourse);
        } catch (error) {
            throw error;
        }
    }

    // ========== Employee Training Methods ==========
    async getEmployeeTrainingSessions(userId) {
        try {
            const sessions = await trainingRepository.getEmployeeTrainingSessions(userId);
            return createResponse(200, 'Employee training sessions retrieved successfully', sessions);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new TrainingService();
