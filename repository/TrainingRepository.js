const CourseSet = require('../models/courseSet');
const Course = require('../models/course');
const { TrainingSession, SessionStatus } = require('../models/trainingSession');
const TrainingEnrollment = require('../models/trainingEnrollment');
const { QuestionBank, Question } = require('../models/questionBank');
const TrainingAssignment = require('../models/trainingAssignment');
const User = require('../models/user');
const mongoose = require('mongoose');

class TrainingRepository {
    // ========== Course Set Operations ==========
    async getAllCourseSets() {
        return await CourseSet.find().sort({ name: 1 });
    }

    async getCourseSetById(courseSetId) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            return null;
        }
        return await CourseSet.findById(courseSetId);
    }

    async createCourseSet(courseSetData) {
        const courseSet = new CourseSet(courseSetData);
        return await courseSet.save();
    }

    async updateCourseSet(courseSetId, courseSetData) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            throw new Error('Course set not found');
        }
        const courseSet = await CourseSet.findByIdAndUpdate(
            courseSetId, 
            courseSetData, 
            { new: true, runValidators: true }
        );
        if (!courseSet) {
            throw new Error('Course set not found');
        }
        return courseSet;
    }

    async deleteCourseSet(courseSetId) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            throw new Error('Course set not found');
        }
        const courseSet = await CourseSet.findByIdAndDelete(courseSetId);
        if (!courseSet) {
            throw new Error('Course set not found');
        }
        return courseSet;
    }

    // ========== Course Operations ==========
    async getAllCourses(filters = {}) {
        const query = {};
        
        if (filters.courseSetId) {
            query.course_set_id = filters.courseSetId;
        }
        
        if (filters.isMandatory !== undefined) {
            query.is_mandatory = filters.isMandatory;
        }

        if (filters.isDeployed !== undefined) {
            query.is_deployed = filters.isDeployed;
        }

        return await Course.find(query)
            .populate('course_set_id', 'name')
            .populate('deployed_by', 'full_name')
            .sort({ course_name: 1 });
    }

    async getAvailableCoursesForEmployee(userId, filters = {}) {
        try {
            // Get user's department
            const user = await User.findById(userId).populate('department_id');
            if (!user || !user.department_id) {
                return [];
            }

            const departmentId = user.department_id._id;

            // Get training assignments for user's department
            const assignments = await TrainingAssignment.find({ 
                department_id: departmentId,
                status: 'active'
            }).populate('course_id');

            // Filter courses that are deployed
            const availableCourses = [];
            
            for (const assignment of assignments) {
                if (assignment.course_id && assignment.course_id.is_deployed) {
                    // Apply additional filters
                    if (filters.isMandatory !== undefined && 
                        assignment.course_id.is_mandatory !== filters.isMandatory) {
                        continue;
                    }
                    
                    // Add assignment_id to course for reference
                    const course = assignment.course_id.toObject();
                    course.assignment_id = assignment._id;
                    availableCourses.push(course);
                }
            }

            return availableCourses;
        } catch (error) {
            console.error('Error in getAvailableCoursesForEmployee:', error);
            throw error;
        }
    }

    async getCourseById(courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return null;
        }
        return await Course.findById(courseId).populate('course_set_id', 'name');
    }

    async createCourse(courseData) {
        const course = new Course(courseData);
        return await course.save();
    }

    async updateCourse(courseId, courseData) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        const course = await Course.findByIdAndUpdate(
            courseId, 
            courseData, 
            { new: true, runValidators: true }
        ).populate('course_set_id', 'name');
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    async deleteCourse(courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    // ========== Training Session Operations ==========
    async getAllSessions(filters = {}) {
        const query = {};
        
        if (filters.courseId) {
            query.course_id = filters.courseId;
        }
        
        
        if (filters.statusCode) {
            query.status_code = filters.statusCode;
        }

        return await TrainingSession.find(query)
            .populate('course_id', 'course_name')
            .sort({ start_time: 1 });
    }

    async getAllTrainingSessions(filters = {}) {
        return await this.getAllSessions(filters);
    }

    async getAvailableTrainingSessionsForEmployee(userId, filters = {}) {
        try {
            // Get user's department
            const User = require('../models/user');
            const user = await User.findById(userId).populate('department_id');
            if (!user || !user.department_id) {
                return [];
            }

            const departmentId = user.department_id._id;

            // Get training assignments for user's department
            const TrainingAssignment = require('../models/trainingAssignment');
            const assignments = await TrainingAssignment.find({ 
                department_id: departmentId,
                status: 'active'
            }).populate('course_id');

            // Get course IDs that are assigned to user's department
            const assignedCourseIds = assignments
                .filter(assignment => assignment.course_id && assignment.course_id.is_deployed)
                .map(assignment => assignment.course_id._id);

            if (assignedCourseIds.length === 0) {
                return [];
            }

            // Build query for training sessions
            const query = {
                course_id: { $in: assignedCourseIds },
                status_code: 'SCHEDULED' // Only show scheduled sessions
            };

            // Apply additional filters
            if (filters.courseId) {
                query.course_id = filters.courseId;
            }
            
            if (filters.statusCode) {
                query.status_code = filters.statusCode;
            }

            // Get sessions with populated course data
            const sessions = await TrainingSession.find(query)
                .populate('course_id', 'course_name description is_mandatory')
                .sort({ start_time: 1 });

            return sessions;
        } catch (error) {
            console.error('Error in getAvailableTrainingSessionsForEmployee:', error);
            throw error;
        }
    }

    async getSessionById(sessionId) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return null;
        }
        return await TrainingSession.findById(sessionId)
            .populate('course_id', 'course_name');
    }

    async getTrainingSessionById(sessionId) {
        return await this.getSessionById(sessionId);
    }

    async createSession(sessionData) {
        console.log('Repository creating session with data:', sessionData);
        const session = new TrainingSession(sessionData);
        console.log('Session object created:', session);
        const savedSession = await session.save();
        console.log('Session saved successfully:', savedSession);
        return savedSession;
    }

    async createTrainingSession(sessionData) {
        return await this.createSession(sessionData);
    }

    async updateSession(sessionId, sessionData) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new Error('Training session not found');
        }
        const session = await TrainingSession.findByIdAndUpdate(
            sessionId, 
            sessionData, 
            { new: true, runValidators: true }
        ).populate('course_id', 'course_name');
        if (!session) {
            throw new Error('Training session not found');
        }
        return session;
    }

    async updateTrainingSession(sessionId, sessionData) {
        return await this.updateSession(sessionId, sessionData);
    }

    async deleteSession(sessionId) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new Error('Training session not found');
        }
        const session = await TrainingSession.findByIdAndDelete(sessionId);
        if (!session) {
            throw new Error('Training session not found');
        }
        return session;
    }

    async deleteTrainingSession(sessionId) {
        return await this.deleteSession(sessionId);
    }

    // ========== Training Enrollment Operations ==========
    async getAllEnrollments(filters = {}) {
        const query = {};
        
        if (filters.sessionId) {
            query.session_id = filters.sessionId;
        }
        
        if (filters.userId) {
            query.user_id = filters.userId;
        }
        
        if (filters.status) {
            query.status = filters.status;
        }

        return await TrainingEnrollment.find(query)
            .populate({
                path: 'session_id',
                select: 'session_name start_time end_time course_id',
                populate: {
                    path: 'course_id',
                    select: 'course_name description duration_hours is_mandatory validity_months course_set_id'
                }
            })
            .populate('user_id', 'full_name email')
            .sort({ enrolled_at: -1 });
    }

    async getAllTrainingEnrollments(filters = {}) {
        return await this.getAllEnrollments(filters);
    }

    async getEnrollmentById(enrollmentId) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return null;
        }
        return await TrainingEnrollment.findById(enrollmentId)
            .populate('session_id', 'session_name start_time end_time')
            .populate('user_id', 'full_name email');
    }

    async getTrainingEnrollmentById(enrollmentId) {
        return await this.getEnrollmentById(enrollmentId);
    }

    async createEnrollment(enrollmentData) {
        const enrollment = new TrainingEnrollment(enrollmentData);
        return await enrollment.save();
    }

    async createTrainingEnrollment(enrollmentData) {
        return await this.createEnrollment(enrollmentData);
    }

    async updateEnrollment(enrollmentId, enrollmentData) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            throw new Error('Training enrollment not found');
        }
        const enrollment = await TrainingEnrollment.findByIdAndUpdate(
            enrollmentId, 
            enrollmentData, 
            { new: true, runValidators: true }
        ).populate('session_id', 'session_name start_time end_time')
         .populate('user_id', 'full_name email');
        if (!enrollment) {
            throw new Error('Training enrollment not found');
        }
        return enrollment;
    }

    async updateTrainingEnrollment(enrollmentId, enrollmentData) {
        return await this.updateEnrollment(enrollmentId, enrollmentData);
    }

    async deleteEnrollment(enrollmentId) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            throw new Error('Training enrollment not found');
        }
        const enrollment = await TrainingEnrollment.findByIdAndDelete(enrollmentId);
        if (!enrollment) {
            throw new Error('Training enrollment not found');
        }
        return enrollment;
    }

    async deleteTrainingEnrollment(enrollmentId) {
        return await this.deleteEnrollment(enrollmentId);
    }

    // ========== Question Bank Operations ==========
    async getAllQuestionBanks(filters = {}) {
        const query = {};
        
        if (filters.courseId) {
            query.course_id = filters.courseId;
        }

        return await QuestionBank.find(query)
            .populate('course_id', 'course_name')
            .sort({ name: 1 });
    }

    async getQuestionBankById(bankId) {
        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            return null;
        }
        return await QuestionBank.findById(bankId).populate('course_id', 'course_name');
    }

    async createQuestionBank(bankData) {
        const bank = new QuestionBank(bankData);
        return await bank.save();
    }

    async updateQuestionBank(bankId, bankData) {
        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            throw new Error('Question bank not found');
        }
        const bank = await QuestionBank.findByIdAndUpdate(
            bankId, 
            bankData, 
            { new: true, runValidators: true }
        ).populate('course_id', 'course_name');
        if (!bank) {
            throw new Error('Question bank not found');
        }
        return bank;
    }

    async deleteQuestionBank(bankId) {
        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            throw new Error('Question bank not found');
        }
        const bank = await QuestionBank.findByIdAndDelete(bankId);
        if (!bank) {
            throw new Error('Question bank not found');
        }
        return bank;
    }

    // ========== Question Operations ==========
    async getAllQuestions(filters = {}) {
        const query = {};
        
        if (filters.bankId) {
            query.bank_id = filters.bankId;
        }

        return await Question.find(query).sort({ created_at: 1 });
    }

    async getQuestionById(questionId) {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return null;
        }
        return await Question.findById(questionId);
    }

    async createQuestion(questionData) {
        const question = new Question(questionData);
        return await question.save();
    }

    async updateQuestion(questionId, questionData) {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            throw new Error('Question not found');
        }
        const question = await Question.findByIdAndUpdate(
            questionId, 
            questionData, 
            { new: true, runValidators: true }
        );
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }

    async deleteQuestion(questionId) {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            throw new Error('Question not found');
        }
        const question = await Question.findByIdAndDelete(questionId);
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }

    async importQuestionsFromExcel(bankId, file) {
        try {
            const XLSX = require('xlsx');
            
            console.log('File info:', {
                path: file.path,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
            
            // Read Excel file
            const workbook = XLSX.readFile(file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            console.log('Excel data:', data);

            const questions = [];
            
            for (const row of data) {
                // Expected columns: question_text, question_type, options, correct_answer, explanation, difficulty_level, points
                if (!row.question_text || !row.options || !row.correct_answer) {
                    console.log('Skipping invalid row:', row);
                    continue; // Skip invalid rows
                }

                // Parse options from pipe-separated string
                const options = row.options.split('|').map(option => option.trim()).filter(option => option !== '');
                
                if (options.length < 2) {
                    console.log('Skipping row with less than 2 options:', row);
                    continue; // Skip if less than 2 options
                }

                // Validate correct_answer is one of the options
                const correctAnswer = row.correct_answer.trim();
                if (!options.includes(correctAnswer)) {
                    console.warn(`Correct answer "${correctAnswer}" not found in options for question: ${row.question_text}`);
                    continue; // Skip if correct answer doesn't match any option
                }

                const questionData = {
                    bank_id: bankId,
                    content: row.question_text,
                    question_type: row.question_type || 'MULTIPLE_CHOICE',
                    options: options,
                    correct_answer: correctAnswer,
                    explanation: row.explanation || '',
                    difficulty_level: row.difficulty_level || 'MEDIUM',
                    points: parseInt(row.points) || 1
                };

                const question = new Question(questionData);
                await question.save();
                questions.push(question);
            }

            console.log(`Successfully imported ${questions.length} questions`);
            return questions;
        } catch (error) {
            console.error('Error in importQuestionsFromExcel:', error);
            throw error;
        }
    }


    // ========== Statistics Operations ==========
    async getTrainingStats() {
        const stats = await Promise.all([
            CourseSet.countDocuments(),
            Course.countDocuments(),
            TrainingSession.countDocuments(),
            TrainingEnrollment.countDocuments(),
            QuestionBank.countDocuments(),
            Question.countDocuments()
        ]);

        return {
            totalCourseSets: stats[0],
            totalCourses: stats[1],
            totalSessions: stats[2],
            totalEnrollments: stats[3],
            totalQuestionBanks: stats[4],
            totalQuestions: stats[5]
        };
    }

    async getCourseStats(courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const [sessionCount, enrollmentCount] = await Promise.all([
            TrainingSession.countDocuments({ course_id: courseId }),
            TrainingEnrollment.countDocuments({ 
                session_id: { $in: await TrainingSession.find({ course_id: courseId }).distinct('_id') }
            })
        ]);

        return {
            courseId,
            courseName: course.course_name,
            sessionCount,
            enrollmentCount
        };
    }

    async getSessionEnrollmentStats(sessionId) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new Error('Training session not found');
        }
        
        const session = await TrainingSession.findById(sessionId);
        if (!session) {
            throw new Error('Training session not found');
        }

        const enrollmentStats = await TrainingEnrollment.aggregate([
            { $match: { session_id: new mongoose.Types.ObjectId(sessionId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            sessionId,
            sessionName: session.session_name,
            enrollmentStats
        };
    }

    async getQuestionBankStats(bankId) {
        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            throw new Error('Question bank not found');
        }
        
        const bank = await QuestionBank.findById(bankId);
        if (!bank) {
            throw new Error('Question bank not found');
        }

        const questionCount = await Question.countDocuments({ bank_id: bankId });

        return {
            bankId,
            bankName: bank.name,
            questionCount
        };
    }

    async getQuestionBanksByCourse(courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const questionBanks = await QuestionBank.find({ course_id: courseId });
        return questionBanks;
    }

    async getSessionStats() {
        const stats = await TrainingSession.aggregate([
            {
                $group: {
                    _id: '$status_code',
                    count: { $sum: 1 }
                }
            }
        ]);

        return stats;
    }

    async getEnrollmentStats() {
        const stats = await TrainingEnrollment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return stats;
    }

    // ========== Session Status Operations ==========
    async getAllSessionStatuses() {
        return await SessionStatus.find().sort({ status_code: 1 });
    }

    async createSessionStatus(statusData) {
        const status = new SessionStatus(statusData);
        return await status.save();
    }

    // ========== Start Training Operations ==========
    async getEnrollmentByUserAndSession(userId, sessionId) {
        return await TrainingEnrollment.findOne({
            user_id: userId,
            session_id: sessionId
        }).populate('session_id', 'session_name start_time end_time status_code location')
          .populate('user_id', 'full_name email');
    }

    async getQuestionBankByCourseId(courseId) {
        return await QuestionBank.findOne({ course_id: courseId });
    }

    async getQuestionsByBankId(bankId) {
        return await Question.find({ bank_id: bankId })
            .select('content question_type options correct_answer difficulty_level points')
            .sort({ difficulty_level: 1, points: -1 });
    }

    // ========== Training Assignment Operations ==========
    async getAllTrainingAssignments(filters = {}) {
        let query = {};
        
        if (filters.department_id) {
            query.department_id = filters.department_id;
        }
        
        if (filters.course_id) {
            query.course_id = filters.course_id;
        }
        
        if (filters.status) {
            query.status = filters.status;
        }

        return await TrainingAssignment.find(query)
            .populate('course_id', 'course_name description duration_hours is_mandatory')
            .populate('department_id', 'department_name')
            .populate('assigned_by', 'full_name email')
            .sort({ created_at: -1 });
    }

    async getTrainingAssignmentById(assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return null;
        }
        return await TrainingAssignment.findById(assignmentId)
            .populate('course_id', 'course_name description duration_hours is_mandatory')
            .populate('department_id', 'department_name')
            .populate('assigned_by', 'full_name email');
    }

    async createTrainingAssignment(assignmentData) {
        // Check if assignment already exists
        const existingAssignment = await TrainingAssignment.findOne({
            course_id: assignmentData.course_id,
            department_id: assignmentData.department_id
        });

        if (existingAssignment) {
            throw new Error('Course is already assigned to this department');
        }

        const assignment = new TrainingAssignment(assignmentData);
        return await assignment.save();
    }

    async updateTrainingAssignment(assignmentId, assignmentData) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            throw new Error('Training assignment not found');
        }
        const assignment = await TrainingAssignment.findByIdAndUpdate(
            assignmentId, 
            assignmentData, 
            { new: true, runValidators: true }
        ).populate('course_id', 'course_name description duration_hours is_mandatory')
         .populate('department_id', 'department_name')
         .populate('assigned_by', 'full_name email');
        
        if (!assignment) {
            throw new Error('Training assignment not found');
        }
        return assignment;
    }

    async deleteTrainingAssignment(assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            throw new Error('Training assignment not found');
        }
        const assignment = await TrainingAssignment.findByIdAndDelete(assignmentId);
        if (!assignment) {
            throw new Error('Training assignment not found');
        }
        return assignment;
    }

    async getTrainingAssignmentsByDepartment(departmentId) {
        return await TrainingAssignment.find({ 
            department_id: departmentId,
            status: 'active'
        })
        .populate({
            path: 'course_id',
            select: 'course_name description duration_hours is_mandatory validity_months is_deployed deployed_at deployed_by',
            populate: {
                path: 'deployed_by',
                select: 'full_name email'
            }
        })
        .populate('assigned_by', 'full_name email')
        .sort({ created_at: -1 });
    }

    async getTrainingAssignmentsByCourse(courseId) {
        return await TrainingAssignment.find({ 
            course_id: courseId,
            status: 'active'
        })
        .populate('department_id', 'department_name')
        .populate('assigned_by', 'full_name email')
        .sort({ created_at: -1 });
    }

    async getCoursesByDepartment(departmentId) {
        const assignments = await this.getTrainingAssignmentsByDepartment(departmentId);
        const courseIds = assignments
            .filter(assignment => assignment.course_id && assignment.course_id._id)
            .map(assignment => assignment.course_id._id);
        
        // Get full course data with deployment info
        const courses = await Course.find({ _id: { $in: courseIds } })
            .populate('deployed_by', 'full_name email')
            .lean();
        
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course._id.toString()] = course;
        });
        
        return assignments
            .filter(assignment => assignment.course_id && assignment.course_id._id)
            .map(assignment => {
                const courseId = assignment.course_id._id.toString();
                const courseData = courseMap[courseId] || assignment.course_id.toObject();
                
                return {
                    ...courseData,
                    assignment_id: assignment._id,
                    assigned_by: assignment.assigned_by,
                    assigned_at: assignment.created_at,
                    notes: assignment.notes,
                    // Ensure deployment fields are included
                    is_deployed: courseData.is_deployed || false,
                    deployed_at: courseData.deployed_at,
                    deployed_by: courseData.deployed_by
                };
            });
    }

    async getDepartmentsByCourse(courseId) {
        const assignments = await this.getTrainingAssignmentsByCourse(courseId);
        return assignments.map(assignment => assignment.department_id);
    }

    async getAssignmentStats() {
        const totalAssignments = await TrainingAssignment.countDocuments();
        const activeAssignments = await TrainingAssignment.countDocuments({ status: 'active' });
        const inactiveAssignments = await TrainingAssignment.countDocuments({ status: 'inactive' });

        return {
            total: totalAssignments,
            active: activeAssignments,
            inactive: inactiveAssignments
        };
    }

    // ========== Course Deployment Operations ==========
    async deployCourse(courseId, userId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        
        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                is_deployed: true,
                deployed_at: new Date(),
                deployed_by: userId
            },
            { new: true, runValidators: true }
        );
        
        if (!course) {
            throw new Error('Course not found');
        }
        
        return course;
    }

    async undeployCourse(courseId, userId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
        
        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                is_deployed: false,
                deployed_at: null,
                deployed_by: null
            },
            { new: true, runValidators: true }
        );
        
        if (!course) {
            throw new Error('Course not found');
        }
        
        return course;
    }

    // ========== Employee Training Methods ==========
    async getEmployeeTrainingSessions(userId) {
        // Get all deployed courses that the employee can access
        const deployedCourses = await Course.find({
            is_deployed: true,
            status: 'active'
        })
        .populate('course_set_id', 'name description')
        .populate('question_bank_id', 'name description')
        .select('name description course_set_id question_bank_id duration_minutes created_at deployed_at')
        .sort({ deployed_at: -1 });

        // Get employee's training history
        const trainingHistory = await TrainingHistory.find({
            employee_id: userId
        })
        .populate('course_id', 'name description')
        .select('course_id status score completion_percentage started_at completed_at')
        .sort({ started_at: -1 });

        // Get employee's assignments
        const assignments = await TrainingAssignment.find({
            employee_id: userId,
            status: { $in: ['assigned', 'in_progress'] }
        })
        .populate('course_id', 'name description duration_minutes')
        .populate('assigned_by', 'full_name email')
        .select('course_id assigned_by assigned_at due_date status')
        .sort({ assigned_at: -1 });

        return {
            availableCourses: deployedCourses,
            trainingHistory: trainingHistory,
            currentAssignments: assignments
        };
    }
}

module.exports = new TrainingRepository();