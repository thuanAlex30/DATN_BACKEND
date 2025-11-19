const ProjectStatusReport = require('../models/projectStatusReport');

class ProjectStatusReportRepository {
  // ========== BASIC CRUD ==========
  async getAllReports(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.reported_by) {
        query.reported_by = filters.reported_by;
      }
      if (filters.report_type) {
        query.report_type = filters.report_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.start_date && filters.end_date) {
        query.report_date = {
          $gte: new Date(filters.start_date),
          $lte: new Date(filters.end_date)
        };
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  async getReportById(id) {
    try {
      const report = await ProjectStatusReport.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return report;
    } catch (error) {
      console.error('Error getting report by id:', error);
      throw error;
    }
  }

  async createReport(reportData) {
    try {
      const report = new ProjectStatusReport(reportData);
      await report.save();
      
      return await this.getReportById(report._id);
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async updateReport(id, updateData) {
    try {
      const report = await ProjectStatusReport.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return report;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  async deleteReport(id) {
    try {
      const report = await ProjectStatusReport.findByIdAndDelete(id);
      return report;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // ========== PROJECT REPORT QUERIES ==========
  async getProjectReports(projectId) {
    try {
      const reports = await ProjectStatusReport.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error getting project reports:', error);
      throw error;
    }
  }

  async getReportsByType(reportType, projectId = null) {
    try {
      const query = { report_type: reportType };
      if (projectId) {
        query.project_id = projectId;
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error getting reports by type:', error);
      throw error;
    }
  }

  async getUserReports(userId, filters = {}) {
    try {
      const query = { reported_by: userId };
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.report_type) {
        query.report_type = filters.report_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw error;
    }
  }

  async getRecentReports(limit = 10, projectId = null) {
    try {
      const query = {};
      if (projectId) {
        query.project_id = projectId;
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 })
        .limit(limit);

      return reports;
    } catch (error) {
      console.error('Error getting recent reports:', error);
      throw error;
    }
  }

  async getReportsByDateRange(startDate, endDate, projectId = null) {
    try {
      const query = {
        report_date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      if (projectId) {
        query.project_id = projectId;
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error getting reports by date range:', error);
      throw error;
    }
  }

  // ========== REPORT VALIDATION ==========
  async validateReport(reportData) {
    try {
      const errors = [];

      // Check required fields
      if (!reportData.project_id) {
        errors.push('Project ID is required');
      }
      if (!reportData.reported_by) {
        errors.push('Reported by is required');
      }
      if (!reportData.report_type) {
        errors.push('Report type is required');
      }
      if (!reportData.report_date) {
        errors.push('Report date is required');
      }
      if (!reportData.status) {
        errors.push('Status is required');
      }

      // Check if report type is valid
      const validReportTypes = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'MILESTONE', 'AD_HOC'];
      if (reportData.report_type && !validReportTypes.includes(reportData.report_type)) {
        errors.push('Invalid report type');
      }

      // Check if status is valid
      const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
      if (reportData.status && !validStatuses.includes(reportData.status)) {
        errors.push('Invalid status');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating report:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== REPORT ANALYTICS ==========
  async getReportAnalytics(projectId) {
    try {
      const reports = await ProjectStatusReport.find({ project_id: projectId });
      
      const analytics = {
        total_reports: reports.length,
        draft_reports: reports.filter(r => r.status === 'DRAFT').length,
        submitted_reports: reports.filter(r => r.status === 'SUBMITTED').length,
        approved_reports: reports.filter(r => r.status === 'APPROVED').length,
        rejected_reports: reports.filter(r => r.status === 'REJECTED').length,
        reports_by_type: reports.reduce((acc, report) => {
          acc[report.report_type] = (acc[report.report_type] || 0) + 1;
          return acc;
        }, {}),
        reports_by_status: reports.reduce((acc, report) => {
          acc[report.status] = (acc[report.status] || 0) + 1;
          return acc;
        }, {}),
        reports_by_month: reports.reduce((acc, report) => {
          const month = new Date(report.report_date).toISOString().substring(0, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {}),
        approval_rate: reports.length > 0 ? 
          (reports.filter(r => r.status === 'APPROVED').length / reports.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting report analytics:', error);
      throw error;
    }
  }

  async getReportStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const reports = await ProjectStatusReport.find(query);
      
      const stats = {
        total_reports: reports.length,
        reports_by_type: reports.reduce((acc, report) => {
          acc[report.report_type] = (acc[report.report_type] || 0) + 1;
          return acc;
        }, {}),
        reports_by_status: reports.reduce((acc, report) => {
          acc[report.status] = (acc[report.status] || 0) + 1;
          return acc;
        }, {}),
        reports_by_project: reports.reduce((acc, report) => {
          const projectId = report.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        reports_by_user: reports.reduce((acc, report) => {
          const userId = report.reported_by.toString();
          acc[userId] = (acc[userId] || 0) + 1;
          return acc;
        }, {}),
        approved_reports: reports.filter(r => r.status === 'APPROVED').length,
        recent_reports: reports.filter(r => {
          const reportDate = new Date(r.report_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return reportDate >= thirtyDaysAgo;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting report stats:', error);
      throw error;
    }
  }

  // ========== REPORT MANAGEMENT ==========
  async submitReport(id, submittedBy) {
    try {
      const updateData = {
        status: 'SUBMITTED',
        submitted_at: new Date(),
        submitted_by: submittedBy
      };

      return await this.updateReport(id, updateData);
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  async approveReport(id, approvedBy, comments = '') {
    try {
      const updateData = {
        status: 'APPROVED',
        approved_at: new Date(),
        approved_by: approvedBy,
        approval_comments: comments
      };

      return await this.updateReport(id, updateData);
    } catch (error) {
      console.error('Error approving report:', error);
      throw error;
    }
  }

  async rejectReport(id, rejectedBy, reason) {
    try {
      const updateData = {
        status: 'REJECTED',
        rejected_at: new Date(),
        rejected_by: rejectedBy,
        rejection_reason: reason
      };

      return await this.updateReport(id, updateData);
    } catch (error) {
      console.error('Error rejecting report:', error);
      throw error;
    }
  }

  // ========== REPORT SEARCH ==========
  async searchReports(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { summary: { $regex: searchTerm, $options: 'i' } },
          { key_achievements: { $regex: searchTerm, $options: 'i' } },
          { challenges: { $regex: searchTerm, $options: 'i' } },
          { next_steps: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.report_type) {
        query.report_type = filters.report_type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.reported_by) {
        query.reported_by = filters.reported_by;
      }

      const reports = await ProjectStatusReport.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('reported_by', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ report_date: -1 });

      return reports;
    } catch (error) {
      console.error('Error searching reports:', error);
      throw error;
    }
  }

  // ========== REPORT REPORTS ==========
  async generateReportSummary(projectId) {
    try {
      const reports = await this.getProjectReports(projectId);
      const analytics = await this.getReportAnalytics(projectId);
      
      const summary = {
        project_id: projectId,
        generated_at: new Date(),
        analytics: analytics,
        recent_reports: reports.slice(0, 5),
        summary: {
          total_reports: analytics.total_reports,
          approved_reports: analytics.approved_reports,
          approval_rate: analytics.approval_rate,
          most_common_type: Object.keys(analytics.reports_by_type).reduce((a, b) => 
            analytics.reports_by_type[a] > analytics.reports_by_type[b] ? a : b, 'N/A'
          )
        }
      };

      return summary;
    } catch (error) {
      console.error('Error generating report summary:', error);
      throw error;
    }
  }
}

module.exports = new ProjectStatusReportRepository();
