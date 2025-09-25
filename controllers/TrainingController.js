const trainingService = require('../services/trainingService');
const { createResponse } = require('../utils/response');
const path = require('path');
const websocketService = require('../services/websocketService');

class TrainingController {
    // ========== Course Set Controllers ==========
    async getAllCourseSets(req, res) {
        try {
            const result = await trainingService.getAllCourseSets();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllCourseSets:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getCourseSetById(req, res) {
        try {
            const { courseSetId } = req.params;
            const result = await trainingService.getCourseSetById(courseSetId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getCourseSetById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createCourseSet(req, res) {
        try {
            const courseSetData = req.body;
            const result = await trainingService.createCourseSet(courseSetData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createCourseSet:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateCourseSet(req, res) {
        try {
            const { courseSetId } = req.params;
            const courseSetData = req.body;
            const result = await trainingService.updateCourseSet(courseSetId, courseSetData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateCourseSet:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteCourseSet(req, res) {
        try {
            const { courseSetId } = req.params;
            const result = await trainingService.deleteCourseSet(courseSetId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteCourseSet:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Course Controllers ==========
    async getAllCourses(req, res) {
        try {
            const filters = req.query;
            const result = await trainingService.getAllCourses(filters);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllCourses:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getCourseById(req, res) {
        try {
            const { courseId } = req.params;
            const result = await trainingService.getCourseById(courseId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getCourseById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createCourse(req, res) {
        try {
            const courseData = req.body;
            const result = await trainingService.createCourse(courseData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createCourse:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateCourse(req, res) {
        try {
            const { courseId } = req.params;
            const courseData = req.body;
            const result = await trainingService.updateCourse(courseId, courseData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateCourse:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteCourse(req, res) {
        try {
            const { courseId } = req.params;
            const result = await trainingService.deleteCourse(courseId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteCourse:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getCourseStats(req, res) {
        try {
            const { courseId } = req.params;
            const result = await trainingService.getCourseStats(courseId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getCourseStats:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Training Session Controllers ==========
    async getAllTrainingSessions(req, res) {
        try {
            const filters = req.query;
            const result = await trainingService.getAllTrainingSessions(filters);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllTrainingSessions:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getTrainingSessionById(req, res) {
        try {
            const { sessionId } = req.params;
            const result = await trainingService.getTrainingSessionById(sessionId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getTrainingSessionById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createTrainingSession(req, res) {
        try {
            const sessionData = req.body;
            console.log('Received session data:', sessionData);
            const result = await trainingService.createTrainingSession(sessionData);
            
            // Emit WebSocket event for training session created
            if (result.statusCode === 201 && result.data) {
                websocketService.emitTrainingSessionCreated(result.data, req.user);
            }
            
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createTrainingSession:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateTrainingSession(req, res) {
        try {
            const { sessionId } = req.params;
            const sessionData = req.body;
            const result = await trainingService.updateTrainingSession(sessionId, sessionData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateTrainingSession:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteTrainingSession(req, res) {
        try {
            const { sessionId } = req.params;
            const result = await trainingService.deleteTrainingSession(sessionId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteTrainingSession:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getSessionEnrollmentStats(req, res) {
        try {
            const { sessionId } = req.params;
            const result = await trainingService.getSessionEnrollmentStats(sessionId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getSessionEnrollmentStats:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Training Enrollment Controllers ==========
    async getAllTrainingEnrollments(req, res) {
        try {
            const filters = req.query;
            const result = await trainingService.getAllTrainingEnrollments(filters);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllTrainingEnrollments:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getTrainingEnrollmentById(req, res) {
        try {
            const { enrollmentId } = req.params;
            const result = await trainingService.getTrainingEnrollmentById(enrollmentId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getTrainingEnrollmentById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createTrainingEnrollment(req, res) {
        try {
            const enrollmentData = req.body;
            const result = await trainingService.createTrainingEnrollment(enrollmentData);
            
            // Emit WebSocket event for training enrollment
            if (result.statusCode === 201 && result.data) {
                websocketService.emitTrainingEnrolled(result.data, req.user);
            }
            
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createTrainingEnrollment:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateTrainingEnrollment(req, res) {
        try {
            const { enrollmentId } = req.params;
            const enrollmentData = req.body;
            const result = await trainingService.updateTrainingEnrollment(enrollmentId, enrollmentData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateTrainingEnrollment:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteTrainingEnrollment(req, res) {
        try {
            const { enrollmentId } = req.params;
            const result = await trainingService.deleteTrainingEnrollment(enrollmentId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteTrainingEnrollment:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Question Bank Controllers ==========
    async getAllQuestionBanks(req, res) {
        try {
            const filters = req.query;
            const result = await trainingService.getAllQuestionBanks(filters);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllQuestionBanks:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getQuestionBankById(req, res) {
        try {
            const { bankId } = req.params;
            const result = await trainingService.getQuestionBankById(bankId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getQuestionBankById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createQuestionBank(req, res) {
        try {
            const bankData = req.body;
            const result = await trainingService.createQuestionBank(bankData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createQuestionBank:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateQuestionBank(req, res) {
        try {
            const { bankId } = req.params;
            const bankData = req.body;
            const result = await trainingService.updateQuestionBank(bankId, bankData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateQuestionBank:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteQuestionBank(req, res) {
        try {
            const { bankId } = req.params;
            const result = await trainingService.deleteQuestionBank(bankId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteQuestionBank:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getQuestionBankStats(req, res) {
        try {
            const { bankId } = req.params;
            const result = await trainingService.getQuestionBankStats(bankId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getQuestionBankStats:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getQuestionBanksByCourse(req, res) {
        try {
            const { courseId } = req.params;
            const result = await trainingService.getQuestionBanksByCourse(courseId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getQuestionBanksByCourse:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Questions Controllers ==========
    async getAllQuestions(req, res) {
        try {
            const filters = req.query;
            const result = await trainingService.getAllQuestions(filters);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getAllQuestions:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async getQuestionById(req, res) {
        try {
            const { questionId } = req.params;
            const result = await trainingService.getQuestionById(questionId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getQuestionById:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async createQuestion(req, res) {
        try {
            const questionData = req.body;
            const result = await trainingService.createQuestion(questionData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in createQuestion:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async updateQuestion(req, res) {
        try {
            const { questionId } = req.params;
            const questionData = req.body;
            const result = await trainingService.updateQuestion(questionId, questionData);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in updateQuestion:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async deleteQuestion(req, res) {
        try {
            const { questionId } = req.params;
            const result = await trainingService.deleteQuestion(questionId);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in deleteQuestion:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async importQuestionsFromExcel(req, res) {
        try {
            const { bank_id } = req.body;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json(createResponse(400, 'Excel file is required'));
            }

            const result = await trainingService.importQuestionsFromExcel(bank_id, file);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in importQuestionsFromExcel:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }


    // ========== Start Training Controllers ==========
    async startTraining(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id; // Get user ID from auth middleware
            
            const result = await trainingService.startTraining(sessionId, userId);
            
            // Emit WebSocket event for training started
            if (result.statusCode === 200 && result.data) {
                websocketService.emitTrainingStarted(result.data.session, req.user);
            }
            
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in startTraining:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async submitTraining(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;
            const { answers, score, completion_time } = req.body;
            
            const result = await trainingService.submitTraining(sessionId, userId, answers, score, completion_time);
            
            // Emit WebSocket event for training submitted
            if (result.statusCode === 200 && result.data) {
                websocketService.emitTrainingSubmitted(result.data.enrollment, req.user);
                
                // If training is completed, emit completion event
                if (result.data.enrollment.status === 'completed') {
                    websocketService.emitTrainingCompleted(result.data.enrollment, req.user);
                }
            }
            
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in submitTraining:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    async retakeTraining(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;
            
            const result = await trainingService.retakeTraining(sessionId, userId);
            
            // Emit WebSocket event for training retake
            if (result.statusCode === 200 && result.data) {
                websocketService.emitTrainingStarted(result.data.session, req.user);
            }
            
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in retakeTraining:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }

    // ========== Dashboard Controllers ==========
    async getTrainingDashboardStats(req, res) {
        try {
            const result = await trainingService.getTrainingDashboardStats();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in getTrainingDashboardStats:', error);
            res.status(500).json(createResponse(500, 'Internal server error'));
        }
    }
}

module.exports = new TrainingController();
