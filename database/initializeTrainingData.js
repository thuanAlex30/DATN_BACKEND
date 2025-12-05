const mongoose = require('mongoose');
const CourseSet = require('../models/courseSet');
const Course = require('../models/course');
const { TrainingSession, SessionStatus } = require('../models/trainingSession');
const TrainingEnrollment = require('../models/trainingEnrollment');
const { QuestionBank, Question } = require('../models/questionBank');

const initializeTrainingData = async () => {
    try {
        console.log('Initializing training data...');

        // Check if data already exists
        const existingCourseSets = await CourseSet.countDocuments();
        if (existingCourseSets > 0) {
            console.log('Training data already exists, skipping initialization');
            return;
        }

        // Create session statuses
        const sessionStatuses = [
            { status_code: 'SCHEDULED', description: 'Đã lên lịch' },
            { status_code: 'ONGOING', description: 'Đang diễn ra' },
            { status_code: 'COMPLETED', description: 'Hoàn thành' },
            { status_code: 'CANCELLED', description: 'Đã hủy' }
        ];

        await SessionStatus.insertMany(sessionStatuses);
        console.log('Session statuses created');

        // Create course sets
        const courseSets = [
            {
                name: 'An toàn cơ bản',
                description: 'Các khóa học an toàn lao động cơ bản'
            },
            {
                name: 'An toàn nâng cao',
                description: 'Các khóa học an toàn lao động nâng cao'
            },
            {
                name: 'Chuyên môn kỹ thuật',
                description: 'Các khóa học chuyên môn kỹ thuật'
            }
        ];

        const createdCourseSets = await CourseSet.insertMany(courseSets);
        console.log('Course sets created');

        // Create courses
        const courses = [
            {
                course_set_id: createdCourseSets[0]._id,
                course_name: 'An toàn lao động cơ bản',
                description: 'Khóa học cơ bản về an toàn lao động cho tất cả nhân viên',
                duration_hours: 8,
                is_mandatory: true,
                validity_months: 12
            },
            {
                course_set_id: createdCourseSets[0]._id,
                course_name: 'Sử dụng thiết bị bảo hộ',
                description: 'Hướng dẫn sử dụng các loại thiết bị bảo hộ cá nhân',
                duration_hours: 4,
                is_mandatory: true,
                validity_months: 6
            },
            {
                course_set_id: createdCourseSets[1]._id,
                course_name: 'An toàn điện nâng cao',
                description: 'Khóa học chuyên sâu về an toàn điện cho kỹ thuật viên',
                duration_hours: 16,
                is_mandatory: false,
                validity_months: 24
            },
            {
                course_set_id: createdCourseSets[1]._id,
                course_name: 'Quản lý rủi ro',
                description: 'Phương pháp đánh giá và quản lý rủi ro trong công việc',
                duration_hours: 12,
                is_mandatory: false,
                validity_months: 18
            }
        ];

        const createdCourses = await Course.insertMany(courses);
        console.log('Courses created');

        // Create question banks
        const questionBanks = [
            {
                course_id: createdCourses[0]._id,
                name: 'Ngân hàng câu hỏi An toàn cơ bản',
                description: 'Các câu hỏi về kiến thức an toàn lao động cơ bản'
            },
            {
                course_id: createdCourses[1]._id,
                name: 'Ngân hàng câu hỏi PPE',
                description: 'Câu hỏi về thiết bị bảo hộ cá nhân'
            },
            {
                course_id: createdCourses[2]._id,
                name: 'Ngân hàng câu hỏi An toàn điện',
                description: 'Câu hỏi chuyên sâu về an toàn điện'
            }
        ];

        const createdQuestionBanks = await QuestionBank.insertMany(questionBanks);
        console.log('Question banks created');

        // Create sample questions
        const questions = [
            {
                bank_id: createdQuestionBanks[0]._id,
                content: 'Theo quy định về an toàn lao động, người lao động phải làm gì khi phát hiện tình huống nguy hiểm?',
                options: [
                    'Tiếp tục làm việc bình thường',
                    'Báo cáo ngay cho người phụ trách',
                    'Tự xử lý mà không báo cáo',
                    'Bỏ qua và không quan tâm'
                ],
                correct_answer: 'Báo cáo ngay cho người phụ trách'
            },
            {
                bank_id: createdQuestionBanks[0]._id,
                content: 'Màu sắc của biển báo cấm thường là gì?',
                options: [
                    'Xanh lá cây',
                    'Đỏ',
                    'Vàng',
                    'Xanh dương'
                ],
                correct_answer: 'Đỏ'
            },
            {
                bank_id: createdQuestionBanks[1]._id,
                content: 'Khi nào cần sử dụng mũ bảo hiểm?',
                options: [
                    'Chỉ khi trời mưa',
                    'Khi làm việc ở độ cao trên 2m',
                    'Chỉ khi làm việc ban đêm',
                    'Không bao giờ cần'
                ],
                correct_answer: 'Khi làm việc ở độ cao trên 2m'
            },
            {
                bank_id: createdQuestionBanks[2]._id,
                content: 'Khoảng cách an toàn tối thiểu khi làm việc gần đường dây điện 110kV là bao nhiêu?',
                options: [
                    '1m',
                    '2m',
                    '3m',
                    '5m'
                ],
                correct_answer: '3m'
            }
        ];

        await Question.insertMany(questions);
        console.log('Questions created');

        console.log('Training data initialization completed successfully!');

    } catch (error) {
        console.error('Error initializing training data:', error);
        throw error;
    }
};

module.exports = initializeTrainingData;
