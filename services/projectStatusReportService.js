const ProjectStatusReport = require('../models/projectStatusReport');

class ProjectStatusReportService {
  async getProjectStatusReports(projectId) {
    try {
      const reports = await ProjectStatusReport.find({ project_id: projectId })
        .populate('project_id', 'project_name')
        .populate('reported_by', 'full_name email')
        .sort({ report_date: -1 });

      return {
        success: true,
        data: reports,
        message: 'Lấy danh sách báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error getting project status reports:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo tình hình',
        error: error.message
      };
    }
  }

  async getStatusReportById(id) {
    try {
      const report = await ProjectStatusReport.findById(id)
        .populate('project_id', 'project_name')
        .populate('reported_by', 'full_name email');

      if (!report) {
        return {
          success: false,
          message: 'Không tìm thấy báo cáo tình hình'
        };
      }

      return {
        success: true,
        data: report,
        message: 'Lấy thông tin báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error getting status report:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin báo cáo tình hình',
        error: error.message
      };
    }
  }

  async createStatusReport(reportData, userId) {
    try {
      const requiredFields = ['project_id', 'overall_progress', 'status_summary'];
      for (const field of requiredFields) {
        if (!reportData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const report = new ProjectStatusReport({
        ...reportData,
        reported_by: userId
      });

      await report.save();

      return {
        success: true,
        data: report,
        message: 'Tạo báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error creating status report:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo báo cáo tình hình',
        error: error.message
      };
    }
  }

  async updateStatusReport(id, updateData, userId) {
    try {
      const report = await ProjectStatusReport.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!report) {
        return {
          success: false,
          message: 'Không tìm thấy báo cáo tình hình'
        };
      }

      return {
        success: true,
        data: report,
        message: 'Cập nhật báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error updating status report:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật báo cáo tình hình',
        error: error.message
      };
    }
  }

  async deleteStatusReport(id, userId) {
    try {
      const report = await ProjectStatusReport.findByIdAndDelete(id);

      if (!report) {
        return {
          success: false,
          message: 'Không tìm thấy báo cáo tình hình'
        };
      }

      return {
        success: true,
        message: 'Xóa báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error deleting status report:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa báo cáo tình hình',
        error: error.message
      };
    }
  }

  async getLatestStatusReport(projectId) {
    try {
      const report = await ProjectStatusReport.findOne({ project_id: projectId })
        .populate('project_id', 'project_name')
        .populate('reported_by', 'full_name email')
        .sort({ report_date: -1 });

      if (!report) {
        return {
          success: false,
          message: 'Không tìm thấy báo cáo tình hình'
        };
      }

      return {
        success: true,
        data: report,
        message: 'Lấy báo cáo tình hình mới nhất thành công'
      };
    } catch (error) {
      console.error('Error getting latest status report:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy báo cáo tình hình mới nhất',
        error: error.message
      };
    }
  }

  async getStatusReportStats() {
    try {
      const totalReports = await ProjectStatusReport.countDocuments();
      const reportsByProject = await ProjectStatusReport.aggregate([
        { $group: { _id: '$project_id', count: { $sum: 1 } } }
      ]);

      const stats = {
        total_reports: totalReports,
        reports_by_project: reportsByProject
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error getting status report stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê báo cáo tình hình',
        error: error.message
      };
    }
  }

  async getStatusReportTemplate() {
    try {
      const template = {
        overall_progress: 0,
        tasks_completed: 0,
        tasks_in_progress: 0,
        tasks_overdue: 0,
        status_summary: '',
        key_achievements: '',
        upcoming_activities: '',
        risks_issues: ''
      };

      return {
        success: true,
        data: template,
        message: 'Lấy mẫu báo cáo tình hình thành công'
      };
    } catch (error) {
      console.error('Error getting status report template:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy mẫu báo cáo tình hình',
        error: error.message
      };
    }
  }
}

module.exports = new ProjectStatusReportService();
