const ProjectRisk = require('../models/projectRisk');

class ProjectRiskService {
  async getProjectRisks(projectId) {
    try {
      const risks = await ProjectRisk.find({ project_id: projectId })
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return {
        success: true,
        data: risks,
        message: 'Lấy danh sách rủi ro dự án thành công'
      };
    } catch (error) {
      console.error('Error getting project risks:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách rủi ro dự án',
        error: error.message
      };
    }
  }

  async getRiskById(id) {
    try {
      const risk = await ProjectRisk.findById(id)
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email');

      if (!risk) {
        return {
          success: false,
          message: 'Không tìm thấy rủi ro'
        };
      }

      return {
        success: true,
        data: risk,
        message: 'Lấy thông tin rủi ro thành công'
      };
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
      const risk = await ProjectRisk.findByIdAndUpdate(
        id,
        { 
          status: status,
          actual_resolution_date: status === 'CLOSED' ? new Date() : null,
          updated_at: new Date()
        },
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
        message: 'Cập nhật trạng thái rủi ro thành công'
      };
    } catch (error) {
      console.error('Error updating risk status:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật trạng thái rủi ro',
        error: error.message
      };
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

  async getAssignedRisks(userId) {
    try {
      const risks = await ProjectRisk.find({ owner_id: userId })
        .populate('project_id', 'project_name')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return {
        success: true,
        data: risks,
        message: 'Lấy danh sách rủi ro được giao thành công'
      };
    } catch (error) {
      console.error('Error getting assigned risks:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách rủi ro được giao',
        error: error.message
      };
    }
  }
}

module.exports = new ProjectRiskService();
