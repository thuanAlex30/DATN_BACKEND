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
    async getAllCourseSets(tenantId = null) {
        const query = {};
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        return await CourseSet.find(query).sort({ name: 1 });
    }

    async getCourseSetById(courseSetId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            return null;
        }
        const filter = { _id: courseSetId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        return await CourseSet.findOne(filter);
    }

    async createCourseSet(courseSetData, tenantId = null) {
        const courseSet = new CourseSet({
            ...courseSetData,
            ...(tenantId ? { tenant_id: tenantId } : {})
        });
        return await courseSet.save();
    }

    async updateCourseSet(courseSetId, courseSetData, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            throw new Error('Course set not found');
        }
        const filter = { _id: courseSetId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const courseSet = await CourseSet.findOneAndUpdate(
            filter, 
            courseSetData, 
            { new: true, runValidators: true }
        );
        if (!courseSet) {
            throw new Error('Course set not found');
        }
        return courseSet;
    }

    async deleteCourseSet(courseSetId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseSetId)) {
            throw new Error('Course set not found');
        }
        const filter = { _id: courseSetId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const courseSet = await CourseSet.findOneAndDelete(filter);
        if (!courseSet) {
            throw new Error('Course set not found');
        }
        return courseSet;
    }

    // ========== Course Operations ==========
    async getAllCourses(filters = {}, tenantId = null) {
        const query = {};
        
<<<<<<< HEAD
=======
        // ✅ Tenant filter cho courses
>>>>>>> ThuanDH30
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        
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

    async getAvailableCoursesForEmployee(userId, filters = {}, tenantId = null) {
        try {
            // Get user's department
            const user = await User.findById(userId).populate('department_id');
            if (!user || !user.department_id) {
                return [];
            }

            const departmentId = user.department_id._id;

            // Get training assignments for user's department
            const assignmentQuery = { 
                department_id: departmentId,
                status: 'active'
            };
<<<<<<< HEAD
            
            if (tenantId) {
                assignmentQuery.tenant_id = tenantId;
            }
            
=======
            // ✅ Tenant filter
            if (tenantId) {
                assignmentQuery.tenant_id = tenantId;
            }
>>>>>>> ThuanDH30
            const assignments = await TrainingAssignment.find(assignmentQuery).populate('course_id');

            // Filter courses that are deployed and belong to tenant
            const availableCourses = [];
            
            for (const assignment of assignments) {
                if (assignment.course_id && assignment.course_id.is_deployed) {
                    // ✅ Tenant filter: chỉ lấy courses của tenant
                    if (tenantId && assignment.course_id.tenant_id) {
                        if (assignment.course_id.tenant_id.toString() !== tenantId.toString()) {
                            continue;
                        }
                    }
                    
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

    async getCourseById(courseId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return null;
        }
<<<<<<< HEAD
        const filter = { _id: courseId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        return await Course.findOne(filter).populate('course_set_id', 'name');
    }

    async createCourse(courseData, tenantId = null) {
=======
        const query = { _id: courseId };
        // ✅ Tenant filter
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        return await Course.findOne(query).populate('course_set_id', 'name');
    }

    async createCourse(courseData, tenantId = null) {
        // ✅ Tự động set tenant_id nếu có
>>>>>>> ThuanDH30
        const course = new Course({
            ...courseData,
            ...(tenantId ? { tenant_id: tenantId } : {})
        });
        return await course.save();
    }

    async updateCourse(courseId, courseData, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
<<<<<<< HEAD
        const filter = { _id: courseId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const course = await Course.findOneAndUpdate(
            filter, 
=======
        const query = { _id: courseId };
        // ✅ Tenant filter
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        // Không cho phép đổi tenant_id qua API
        if (courseData.tenant_id) {
            delete courseData.tenant_id;
        }
        const course = await Course.findOneAndUpdate(
            query, 
>>>>>>> ThuanDH30
            courseData, 
            { new: true, runValidators: true }
        ).populate('course_set_id', 'name');
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    async deleteCourse(courseId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new Error('Course not found');
        }
<<<<<<< HEAD
        
        const filter = { _id: courseId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        
        // Check if course exists
        const course = await Course.findOne(filter);
=======
        const query = { _id: courseId };
        // ✅ Tenant filter
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        const course = await Course.findOneAndDelete(query);
>>>>>>> ThuanDH30
        if (!course) {
            throw new Error('Course not found');
        }

        // Check for related data
        const sessionQuery = { course_id: courseId };
        const questionBankQuery = { course_id: courseId }; // QuestionBank doesn't have tenant_id
        const assignmentQuery = { course_id: courseId };
        const prerequisiteQuery = { prerequisite_course_ids: courseId };
        
        if (tenantId) {
            sessionQuery.tenant_id = tenantId;
            assignmentQuery.tenant_id = tenantId;
            prerequisiteQuery.tenant_id = tenantId;
        }

        const [sessions, questionBanks, assignments, coursesWithPrerequisite] = await Promise.all([
            TrainingSession.countDocuments(sessionQuery),
            QuestionBank.countDocuments(questionBankQuery),
            TrainingAssignment.countDocuments(assignmentQuery),
            Course.countDocuments(prerequisiteQuery)
        ]);

        // Build error message if there are related data
        const relatedData = [];
        if (sessions > 0) relatedData.push(`${sessions} buổi đào tạo`);
        if (questionBanks > 0) relatedData.push(`${questionBanks} ngân hàng câu hỏi`);
        if (assignments > 0) relatedData.push(`${assignments} gán khóa học`);
        if (coursesWithPrerequisite > 0) relatedData.push(`${coursesWithPrerequisite} khóa học khác đang sử dụng làm prerequisite`);

        if (relatedData.length > 0) {
            throw new Error(`Không thể xóa khóa học này vì đang được sử dụng bởi: ${relatedData.join(', ')}. Vui lòng xóa các dữ liệu liên quan trước.`);
        }

        // If no related data, proceed with deletion
        const deletedCourse = await Course.findOneAndDelete(filter);
        return deletedCourse;
    }

    // ========== Training Session Operations ==========
    async getAllSessions(filters = {}, tenantId = null) {
        const query = {};

        // ⭐ Tenant filter cho session
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        
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

    async getAllTrainingSessions(filters = {}, tenantId = null) {
        return await this.getAllSessions(filters, tenantId);
    }

    async getAvailableTrainingSessionsForEmployee(userId, tenantId = null, filters = {}) {
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
            const assignmentQuery = { 
                department_id: departmentId,
                status: 'active'
            };

            // ⭐ Tenant filter cho assignment
            if (tenantId) {
                assignmentQuery.tenant_id = tenantId;
            }

            const assignments = await TrainingAssignment.find(assignmentQuery).populate('course_id');

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

            // ⭐ Tenant filter cho session
            if (tenantId) {
                query.tenant_id = tenantId;
            }

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

    async getSessionById(sessionId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return null;
        }
        const filter = { _id: sessionId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }

        return await TrainingSession.findOne(filter)
            .populate('course_id', 'course_name');
    }

    async getTrainingSessionById(sessionId, tenantId = null) {
        return await this.getSessionById(sessionId, tenantId);
    }

    async createSession(sessionData, tenantId = null) {
        console.log('Repository creating session with data:', sessionData);
        const session = new TrainingSession({
            ...sessionData,
            // ⭐ Gắn tenant_id theo scope nếu có
            ...(tenantId ? { tenant_id: tenantId } : {})
        });
        console.log('Session object created:', session);
        const savedSession = await session.save();
        console.log('Session saved successfully:', savedSession);
        return savedSession;
    }

    async createTrainingSession(sessionData, tenantId = null) {
        return await this.createSession(sessionData, tenantId);
    }

    async updateSession(sessionId, sessionData, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new Error('Training session not found');
        }
        const filter = { _id: sessionId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const session = await TrainingSession.findOneAndUpdate(
            filter, 
            sessionData, 
            { new: true, runValidators: true }
        ).populate('course_id', 'course_name');
        if (!session) {
            throw new Error('Training session not found');
        }
        return session;
    }

    async updateTrainingSession(sessionId, sessionData, tenantId = null) {
        return await this.updateSession(sessionId, sessionData, tenantId);
    }

    async deleteSession(sessionId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new Error('Training session not found');
        }
        const filter = { _id: sessionId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const session = await TrainingSession.findOneAndDelete(filter);
        if (!session) {
            throw new Error('Training session not found');
        }
        return session;
    }

    async deleteTrainingSession(sessionId, tenantId = null) {
        return await this.deleteSession(sessionId, tenantId);
    }

    // ========== Training Enrollment Operations ==========
    async getAllEnrollments(filters = {}, tenantId = null) {
        const query = {};
        
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        
        if (filters.courseId) {
            query.course_id = filters.courseId;
        }
        
        if (filters.userId) {
            query.user_id = filters.userId;
        }
        
        if (filters.status) {
            query.status = filters.status;
        }

<<<<<<< HEAD
        if (filters.assignedBy) {
            query.assigned_by = filters.assignedBy;
        }

        return await TrainingEnrollment.find(query)
            .populate({
                path: 'course_id',
                select: 'course_name description duration_hours is_mandatory validity_months course_set_id is_deployed'
=======
        // ✅ Tenant filter cho enrollment qua session.tenant_id
        let enrollmentQuery = TrainingEnrollment.find(query);
        
        if (tenantId) {
            // Filter enrollments by sessions that belong to the tenant
            const sessionIds = await TrainingSession.find({ tenant_id: tenantId }).distinct('_id');
            if (sessionIds.length > 0) {
                enrollmentQuery = TrainingEnrollment.find({
                    ...query,
                    session_id: { $in: sessionIds }
                });
            } else {
                // No sessions for this tenant, return empty array
                return [];
            }
        }

        return await enrollmentQuery
            .populate({
                path: 'session_id',
                select: 'session_name start_time end_time course_id tenant_id',
                populate: {
                    path: 'course_id',
                    select: 'course_name description duration_hours is_mandatory validity_months course_set_id'
                }
>>>>>>> ThuanDH30
            })
            .populate('user_id', 'full_name email')
            .populate('assigned_by', 'full_name email')
            .sort({ enrolled_at: -1 });
    }

    async getAllTrainingEnrollments(filters = {}, tenantId = null) {
        return await this.getAllEnrollments(filters, tenantId);
    }

    async getEnrollmentById(enrollmentId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return null;
        }
        const filter = { _id: enrollmentId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        return await TrainingEnrollment.findOne(filter)
            .populate('course_id', 'course_name description duration_hours is_mandatory validity_months')
            .populate('user_id', 'full_name email')
            .populate('assigned_by', 'full_name email');
    }

    async getTrainingEnrollmentById(enrollmentId, tenantId = null) {
        return await this.getEnrollmentById(enrollmentId, tenantId);
    }

    async createEnrollment(enrollmentData, tenantId = null) {
        const enrollment = new TrainingEnrollment({
            ...enrollmentData,
            ...(tenantId ? { tenant_id: tenantId } : {})
        });
        return await enrollment.save();
    }

    async createTrainingEnrollment(enrollmentData, tenantId = null) {
        // Check if user is already enrolled in this course
        const existingEnrollment = await this.getEnrollmentByUserAndCourse(
            enrollmentData.user_id,
            enrollmentData.course_id,
            tenantId
        );
        if (existingEnrollment) {
            throw new Error('User is already enrolled in this course');
        }

        // Verify course exists and is deployed
        const course = await this.getCourseById(enrollmentData.course_id, tenantId);
        if (!course) {
            throw new Error('Course not found');
        }

        if (!course.is_deployed) {
            throw new Error('Course is not deployed yet');
        }

        return await this.createEnrollment(enrollmentData, tenantId);
    }

    async updateEnrollment(enrollmentId, enrollmentData, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            throw new Error('Training enrollment not found');
        }
        const filter = { _id: enrollmentId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const enrollment = await TrainingEnrollment.findOneAndUpdate(
            filter, 
            enrollmentData, 
            { new: true, runValidators: true }
        ).populate('course_id', 'course_name description duration_hours is_mandatory validity_months')
         .populate('user_id', 'full_name email')
         .populate('assigned_by', 'full_name email');
        if (!enrollment) {
            throw new Error('Training enrollment not found');
        }
        return enrollment;
    }

    async updateTrainingEnrollment(enrollmentId, enrollmentData, tenantId = null) {
        return await this.updateEnrollment(enrollmentId, enrollmentData, tenantId);
    }

    async deleteEnrollment(enrollmentId, tenantId = null) {
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            throw new Error('Training enrollment not found');
        }
        const filter = { _id: enrollmentId };
        if (tenantId) {
            filter.tenant_id = tenantId;
        }
        const enrollment = await TrainingEnrollment.findOneAndDelete(filter);
        if (!enrollment) {
            throw new Error('Training enrollment not found');
        }
        return enrollment;
    }

    async deleteTrainingEnrollment(enrollmentId, tenantId = null) {
        return await this.deleteEnrollment(enrollmentId, tenantId);
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
            
            // Validate file exists
            if (!file || !file.path) {
                throw new Error('File not found or invalid');
            }

            console.log('File info:', {
                path: file.path,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
            
            // Validate file extension
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExtension)) {
                throw new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`);
            }
            
            // Read Excel file
            let workbook;
            try {
                workbook = XLSX.readFile(file.path);
            } catch (error) {
                throw new Error(`Failed to read Excel file: ${error.message}`);
            }

            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel file has no sheets');
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (!data || data.length === 0) {
                throw new Error('Excel file is empty or has no data');
            }

            console.log(`Found ${data.length} rows in Excel file`);

            const questions = [];
            const errors = [];
            let rowNumber = 2; // Start from row 2 (row 1 is header)
            
            for (const row of data) {
                try {
                    // Expected columns: question_text, question_type, options, correct_answer, explanation, difficulty_level, points
                    if (!row.question_text || !row.options || !row.correct_answer) {
                        errors.push(`Dòng ${rowNumber}: Thiếu thông tin bắt buộc (question_text, options, correct_answer)`);
                        rowNumber++;
                        continue;
                    }

                    // Parse options from pipe-separated string
                    const optionsString = String(row.options).trim();
                    const options = optionsString.split('|').map(option => option.trim()).filter(option => option !== '');
                    
                    if (options.length < 2) {
                        errors.push(`Dòng ${rowNumber}: Cần ít nhất 2 lựa chọn (options)`);
                        rowNumber++;
                        continue;
                    }

                    // Validate correct_answer is one of the options
                    const correctAnswer = String(row.correct_answer).trim();
                    if (!options.includes(correctAnswer)) {
                        errors.push(`Dòng ${rowNumber}: Đáp án đúng "${correctAnswer}" không khớp với bất kỳ lựa chọn nào`);
                        rowNumber++;
                        continue;
                    }

                    // Validate difficulty_level
                    const difficultyLevel = row.difficulty_level ? String(row.difficulty_level).toUpperCase() : 'MEDIUM';
                    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficultyLevel)) {
                        errors.push(`Dòng ${rowNumber}: Mức độ khó không hợp lệ (phải là EASY, MEDIUM, hoặc HARD)`);
                        rowNumber++;
                        continue;
                    }

                    // Validate points
                    const points = parseInt(row.points) || 1;
                    if (points < 1 || points > 10) {
                        errors.push(`Dòng ${rowNumber}: Điểm số phải từ 1 đến 10`);
                        rowNumber++;
                        continue;
                    }

                    const questionData = {
                        bank_id: bankId,
                        content: String(row.question_text).trim(),
                        question_type: row.question_type || 'MULTIPLE_CHOICE',
                        options: options,
                        correct_answer: correctAnswer,
                        explanation: row.explanation ? String(row.explanation).trim() : '',
                        difficulty_level: difficultyLevel,
                        points: points
                    };

                    const question = new Question(questionData);
                    await question.save();
                    questions.push(question);
                } catch (rowError) {
                    errors.push(`Dòng ${rowNumber}: ${rowError.message || 'Lỗi không xác định'}`);
                }
                rowNumber++;
            }

            if (questions.length === 0 && errors.length > 0) {
                throw new Error(`Không thể import câu hỏi nào. Lỗi:\n${errors.join('\n')}`);
            }

            if (errors.length > 0) {
                console.warn(`Import completed with ${errors.length} errors:\n${errors.join('\n')}`);
            }

            console.log(`Successfully imported ${questions.length} questions`);
            return {
                questions,
                errors: errors.length > 0 ? errors : undefined,
                totalRows: data.length,
                importedRows: questions.length,
                failedRows: errors.length
            };
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

        // Count enrollments directly by course_id
        const enrollmentCount = await TrainingEnrollment.countDocuments({ course_id: courseId });
        
        // Count enrollments by status
        const enrollmentStats = await TrainingEnrollment.aggregate([
            { $match: { course_id: new mongoose.Types.ObjectId(courseId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        return {
            courseId,
            courseName: course.course_name,
            enrollmentCount,
            enrollmentStats: enrollmentStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
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

        const questionBanks = await QuestionBank.find({ course_id: courseId })
            .populate('course_id', 'course_name')
            .sort({ created_at: -1 });
        
        // Get question count for each bank
        const banksWithCounts = await Promise.all(
            questionBanks.map(async (bank) => {
                const questionCount = await Question.countDocuments({ bank_id: bank._id });
                return {
                    ...bank.toObject(),
                    questionCount
                };
            })
        );
        
        return banksWithCounts;
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
    async getEnrollmentByUserAndCourse(userId, courseId, tenantId = null) {
        const query = {
            user_id: userId,
            course_id: courseId
        };
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        return await TrainingEnrollment.findOne(query)
            .populate('course_id', 'course_name description duration_hours is_mandatory validity_months')
            .populate('user_id', 'full_name email')
            .populate('assigned_by', 'full_name email');
    }

    // Keep old method for backward compatibility (deprecated)
    async getEnrollmentByUserAndSession(userId, sessionId, tenantId = null) {
        // This method is deprecated - use getEnrollmentByUserAndCourse instead
        console.warn('getEnrollmentByUserAndSession is deprecated. Use getEnrollmentByUserAndCourse instead.');
        return null;
    }

    /**
     * Check if user has completed all prerequisite courses
     * @param {String} userId - User ID
     * @param {String} courseId - Course ID to check prerequisites for
     * @param {String} tenantId - Optional tenant ID
     * @returns {Object} { passed: boolean, missing: Array<String> }
     */
    async checkPrerequisites(userId, courseId, tenantId = null) {
        const course = await this.getCourseById(courseId, tenantId);
        if (!course) {
            throw new Error('Course not found');
        }

        // If no prerequisites, return passed
        if (!course.prerequisite_course_ids || course.prerequisite_course_ids.length === 0) {
            return { passed: true, missing: [] };
        }

        // Get completed enrollments for user in prerequisite courses (directly by course_id)
        const enrollmentQuery = {
            user_id: userId,
            course_id: { $in: course.prerequisite_course_ids },
            status: 'completed',
            passed: true
        };
        if (tenantId) {
            enrollmentQuery.tenant_id = tenantId;
        }

        const completedEnrollments = await TrainingEnrollment.find(enrollmentQuery)
            .select('course_id');

        // Get unique course IDs that user has completed
        const completedCourseIds = new Set(
            completedEnrollments.map(e => e.course_id.toString())
        );

        // Check which prerequisites are missing
        const missingPrerequisites = course.prerequisite_course_ids.filter(
            prereqId => !completedCourseIds.has(prereqId.toString())
        );

        return {
            passed: missingPrerequisites.length === 0,
            missing: missingPrerequisites
        };
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
    async getAllTrainingAssignments(filters = {}, tenantId = null) {
        let query = {};
        
        // ✅ Tenant filter cho assignment
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        
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
        // Check if assignment already exists (including tenant_id for multi-tenant support)
        const query = {
            course_id: assignmentData.course_id,
            department_id: assignmentData.department_id
        };
        
        // Include tenant_id in duplicate check if provided
        if (assignmentData.tenant_id) {
            query.tenant_id = assignmentData.tenant_id;
        }
        
        const existingAssignment = await TrainingAssignment.findOne(query);

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

    async getTrainingAssignmentsByDepartment(departmentId, tenantId = null) {
        const query = { 
            department_id: departmentId,
            status: 'active'
        };
        // ✅ Tenant filter
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        return await TrainingAssignment.find(query)
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

    async getTrainingAssignmentsByCourse(courseId, tenantId = null) {
        const query = { 
            course_id: courseId,
            status: 'active'
        };
        // ✅ Tenant filter
        if (tenantId) {
            query.tenant_id = tenantId;
        }
        return await TrainingAssignment.find(query)
        .populate('department_id', 'department_name')
        .populate('assigned_by', 'full_name email')
        .sort({ created_at: -1 });
    }

    async getCoursesByDepartment(departmentId, tenantId = null) {
        const assignments = await this.getTrainingAssignmentsByDepartment(departmentId, tenantId);
        const courseIds = assignments
            .filter(assignment => assignment.course_id && assignment.course_id._id)
            .map(assignment => assignment.course_id._id);
        
        // Get full course data with deployment info
        // Ensure we only fetch courses that belong to the tenant (if tenantId provided)
        const courseQuery = { _id: { $in: courseIds } };
        if (tenantId) {
            courseQuery.tenant_id = tenantId;
        }
        const courses = await Course.find(courseQuery)
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
    async getEmployeeTrainingSessions(userId, tenantId = null) {
        // Get all deployed courses that the employee can access (filter by tenant if provided)
        const courseQuery = {
            is_deployed: true,
            status: 'active'
        };
        if (tenantId) {
            courseQuery.tenant_id = tenantId;
        }

        const deployedCourses = await Course.find(courseQuery)
            .populate('course_set_id', 'name description')
            .populate('question_bank_id', 'name description')
            .select('name description course_set_id question_bank_id duration_minutes created_at deployed_at tenant_id')
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