const ProjectRisk = require('../models/projectRisk');
const projectRiskRepository = require('../repository/projectRiskRepository');
const { transformDocumentId, transformDocumentsId, POPULATED_FIELDS } = require('../utils/transformId');
const { createResponse } = require('../utils/response');

class ProjectRiskService {
  async getProjectRisks(projectId) {
    try {
      const risks = await ProjectRisk.find({ project_id: projectId })
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      // Transform và đảm bảo field progress được trả về
      const transformedRisks = transformDocumentsId(risks, POPULATED_FIELDS.PROJECT_RISK);
      
      // Đảm bảo mỗi risk có field progress (default 0 nếu không có)
      transformedRisks.forEach(risk => {
        if (risk.progress === undefined || risk.progress === null) {
          risk.progress = 0;
        }
      });

      return createResponse(200, 'Lấy danh sách rủi ro dự án thành công', transformedRisks);
    } catch (error) {
      console.error('Error getting project risks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách rủi ro dự án', null, error.message);
    }
  }

  async getRiskById(id) {
    try {
      const risk = await ProjectRisk.findById(id)
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email');

      if (!risk) {
        return createResponse(404, 'Không tìm thấy rủi ro');
      }

      const transformedRisk = transformDocumentId(risk, POPULATED_FIELDS.PROJECT_RISK);
      
      // Đảm bảo field progress được trả về (default 0 nếu không có)
      if (transformedRisk.progress === undefined || transformedRisk.progress === null) {
        transformedRisk.progress = 0;
      }

      return createResponse(200, 'Lấy thông tin rủi ro thành công', transformedRisk);
    } catch (error) {
      console.error('Error getting risk:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin rủi ro',
        error: error.message
      };
    }
  }

  async createRisk(riskData, userId) {
    try {
      const requiredFields = ['project_id', 'risk_name', 'description', 'risk_category', 'probability', 'impact_score', 'mitigation_plan', 'owner_id', 'target_resolution_date'];
      for (const field of requiredFields) {
        if (!riskData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      // Calculate risk score
      const riskScore = riskData.probability * riskData.impact_score;

      const risk = new ProjectRisk({
        ...riskData,
        risk_score: riskScore
      });

      await risk.save();

      return {
        success: true,
        data: risk,
        message: 'Tạo rủi ro dự án thành công'
      };
    } catch (error) {
      console.error('Error creating risk:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo rủi ro dự án',
        error: error.message
      };
    }
  }

  async updateRisk(id, updateData, userId) {
    try {
      const risk = await ProjectRisk.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!risk) {
        return {
          success: false,
          message: 'Không tìm thấy rủi ro'
        };
      }

      return {
        success: true,
        data: risk,
        message: 'Cập nhật rủi ro dự án thành công'
      };
    } catch (error) {
      console.error('Error updating risk:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật rủi ro dự án',
        error: error.message
      };
    }
  }

  async deleteRisk(id, userId) {
    try {
      const risk = await ProjectRisk.findByIdAndDelete(id);

      if (!risk) {
        return {
          success: false,
          message: 'Không tìm thấy rủi ro'
        };
      }

      return {
        success: true,
        message: 'Xóa rủi ro dự án thành công'
      };
    } catch (error) {
      console.error('Error deleting risk:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa rủi ro dự án',
        error: error.message
      };
    }
  }

  async updateRiskStatus(id, status, userId) {
    try {
      // Khi chuyển sang IN_PROGRESS, khởi tạo progress = 0 nếu chưa có
      const updateData = { 
        status: status,
        actual_resolution_date: status === 'CLOSED' ? new Date() : null,
        updated_at: new Date()
      };
      
      if (status === 'IN_PROGRESS') {
        updateData.progress = 0;
      }

      const risk = await ProjectRisk.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('project_id', 'project_name')
       .populate('owner_id', 'full_name email');

      if (!risk) {
        return createResponse(404, 'Không tìm thấy rủi ro');
      }

      const transformedRisk = transformDocumentId(risk, POPULATED_FIELDS.PROJECT_RISK);
      
      // Đảm bảo field progress được trả về (default 0 nếu không có)
      if (transformedRisk.progress === undefined || transformedRisk.progress === null) {
        transformedRisk.progress = 0;
      }

      return createResponse(200, 'Cập nhật trạng thái rủi ro thành công', transformedRisk);
    } catch (error) {
      console.error('Error updating risk status:', error);
      return createResponse(500, 'Lỗi khi cập nhật trạng thái rủi ro', null, error.message);
    }
  }

  async getRiskStats() {
    try {
      const totalRisks = await ProjectRisk.countDocuments();
      const risksByStatus = await ProjectRisk.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const risksByCategory = await ProjectRisk.aggregate([
        { $group: { _id: '$risk_category', count: { $sum: 1 } } }
      ]);
      const highRiskRisks = await ProjectRisk.countDocuments({ risk_score: { $gte: 4 } });

      const stats = {
        total_risks: totalRisks,
        risks_by_status: risksByStatus,
        risks_by_category: risksByCategory,
        high_risk_count: highRiskRisks
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê rủi ro thành công'
      };
    } catch (error) {
      console.error('Error getting risk stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê rủi ro',
        error: error.message
      };
    }
  }

  async getRisksByCategory(category) {
    try {
      const risks = await ProjectRisk.find({ risk_category: category })
        .populate('project_id', 'project_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1 });

      return {
        success: true,
        data: risks,
        message: 'Lấy rủi ro theo danh mục thành công'
      };
    } catch (error) {
      console.error('Error getting risks by category:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy rủi ro theo danh mục',
        error: error.message
      };
    }
  }

  async getHighPriorityRisks() {
    try {
      const risks = await ProjectRisk.find({ risk_score: { $gte: 4 } })
        .populate('project_id', 'project_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1 });

      return {
        success: true,
        data: risks,
        message: 'Lấy rủi ro ưu tiên cao thành công'
      };
    } catch (error) {
      console.error('Error getting high priority risks:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy rủi ro ưu tiên cao',
        error: error.message
      };
    }
  }

  async getAssignedRisks(userId, filters = {}) {
    try {
      const query = { owner_id: userId };
      
      // Add project filter if provided
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      
      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      // Log để debug
      console.log('getAssignedRisks - Raw risks:', risks.map(r => ({
        id: r._id,
        risk_name: r.risk_name,
        progress: r.progress,
        status: r.status
      })));

      // Transform và đảm bảo field progress được trả về
      const transformedRisks = transformDocumentsId(risks, POPULATED_FIELDS.PROJECT_RISK);
      
      // Đảm bảo mỗi risk có field progress (default 0 nếu không có)
      transformedRisks.forEach(risk => {
        if (risk.progress === undefined || risk.progress === null) {
          risk.progress = 0;
        }
      });

      // Log để debug
      console.log('getAssignedRisks - Transformed risks:', transformedRisks.map(r => ({
        id: r.id,
        risk_name: r.risk_name,
        progress: r.progress,
        status: r.status
      })));

      return createResponse(200, 'Lấy danh sách rủi ro được giao thành công', transformedRisks);
    } catch (error) {
      console.error('Error getting assigned risks:', error);
      return createResponse(500, 'Lỗi khi lấy danh sách rủi ro được giao', null, error.message);
    }
  }

  /**
   * Get all risks with optional filters (for dashboards, analytics, etc.)
   */
  async getAllRisks(filters = {}) {
    try {
      const query = {};

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.risk_level) {
        query.risk_level = filters.risk_level;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (typeof filters.is_active !== 'undefined') {
        query.is_active = filters.is_active;
      }

      // Simple text search on name/description
      if (filters.search) {
        query.$or = [
          { risk_name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return {
        success: true,
        data: risks,
        message: 'Lấy danh sách rủi ro thành công'
      };
    } catch (error) {
      console.error('Error getting all risks:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách rủi ro',
        error: error.message
      };
    }
  }

  async updateRiskProgress(riskId, progress, userId) {
    try {
      const progressValue = Number(progress);
      if (progressValue < 0 || progressValue > 100) {
        return createResponse(400, 'Tiến độ phải từ 0 đến 100');
      }

      // Tự động cập nhật trạng thái dựa trên tiến độ
      let status = 'IN_PROGRESS';
      if (progressValue >= 100) {
        status = 'RESOLVED'; // Hoặc 'CLOSED' tùy vào logic nghiệp vụ
      } else if (progressValue > 0) {
        status = 'IN_PROGRESS';
      }

      const risk = await ProjectRisk.findByIdAndUpdate(
        riskId,
        { 
          progress: progressValue,
          status: status,
          updated_at: new Date()
        },
        { new: true }
      ).populate('project_id', 'project_name')
       .populate('owner_id', 'full_name email');

      if (!risk) {
        return createResponse(404, 'Không tìm thấy rủi ro');
      }

      // Log để debug
      console.log('updateRiskProgress - Risk after update:', {
        riskId,
        progressValue,
        riskProgress: risk.progress,
        riskStatus: risk.status
      });

      const transformedRisk = transformDocumentId(risk, POPULATED_FIELDS.PROJECT_RISK);
      
      // Đảm bảo field progress được trả về
      if (transformedRisk.progress === undefined || transformedRisk.progress === null) {
        transformedRisk.progress = progressValue;
      }

      // Log để debug
      console.log('updateRiskProgress - Transformed risk:', {
        riskId,
        transformedProgress: transformedRisk.progress
      });

      return createResponse(200, 'Cập nhật tiến độ rủi ro thành công', transformedRisk);
    } catch (error) {
      console.error('Error updating risk progress:', error);
      return createResponse(500, 'Lỗi khi cập nhật tiến độ rủi ro', null, error.message);
    }
  }

  async getRiskProgressLogs(riskId) {
    try {
      const progressLogs = await projectRiskRepository.getRiskProgressLogs(riskId);
      return createResponse(200, 'Lấy nhật ký tiến độ rủi ro thành công',
        transformDocumentsId(progressLogs, POPULATED_FIELDS.RISK_PROGRESS_LOG || ['risk_id', 'user_id']));
    } catch (error) {
      console.error('Error getting risk progress logs:', error);
      return createResponse(500, 'Lỗi khi lấy nhật ký tiến độ rủi ro', null, error.message);
    }
  }

  async addRiskProgressLog(riskId, progressData, userId) {
    try {
      const progressValue = Number(progressData.progress_percentage || progressData.progress || 0);
      const logData = {
        progress_percentage: progressValue,
        work_description: progressData.work_description || progressData.note || '',
        hours_worked: progressData.hours_worked || 0,
        log_date: progressData.log_date ? new Date(progressData.log_date) : new Date()
      };
      
      const progressLog = await projectRiskRepository.createProgressLog(riskId, logData, userId);
      
      // Tự động cập nhật trạng thái risk dựa trên tiến độ
      let status = 'IN_PROGRESS';
      if (progressValue >= 100) {
        status = 'RESOLVED';
      } else if (progressValue > 0) {
        status = 'IN_PROGRESS';
      }
      
      // Cập nhật trạng thái và tiến độ risk và lấy lại dữ liệu đã cập nhật
      const updatedRisk = await ProjectRisk.findByIdAndUpdate(
        riskId,
        { 
          progress: progressValue,
          status: status,
          updated_at: new Date()
        },
        { new: true }
      ).populate('project_id', 'project_name')
       .populate('owner_id', 'full_name email');
      
      // Log để debug
      console.log('Updated risk progress:', {
        riskId,
        progressValue,
        status,
        updatedRiskProgress: updatedRisk?.progress
      });
      
      return createResponse(201, 'Thêm nhật ký tiến độ rủi ro thành công', progressLog);
    } catch (error) {
      console.error('Error adding risk progress log:', error);
      return createResponse(500, 'Lỗi khi thêm nhật ký tiến độ rủi ro', null, error.message);
    }
  }
}

module.exports = new ProjectRiskService();
