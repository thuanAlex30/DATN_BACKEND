const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class IncidentUtils {
  // Tạo ID sự cố tự động
  static generateIncidentId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INC${timestamp}${random}`;
  }

  // Validate dữ liệu sự cố
  static validateIncidentData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Tiêu đề sự cố là bắt buộc');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Mô tả sự cố là bắt buộc');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Địa điểm sự cố là bắt buộc');
    }

    if (data.severity && !['nhẹ', 'nặng', 'rất nghiêm trọng'].includes(data.severity)) {
      errors.push('Mức độ nghiêm trọng không hợp lệ');
    }

    if (data.status && !['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'].includes(data.status)) {
      errors.push('Trạng thái sự cố không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format dữ liệu sự cố cho hiển thị
  static formatIncidentForDisplay(incident) {
    return {
      id: incident._id,
      incidentId: incident.incidentId,
      title: incident.title,
      description: incident.description,
      location: incident.location,
      severity: incident.severity,
      status: incident.status,
      createdBy: incident.createdBy ? {
        id: incident.createdBy._id,
        name: incident.createdBy.name,
        email: incident.createdBy.email
      } : null,
      assignedTo: incident.assignedTo ? {
        id: incident.assignedTo._id,
        name: incident.assignedTo.name,
        email: incident.assignedTo.email
      } : null,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      histories: incident.histories.map(history => ({
        action: history.action,
        performedBy: history.performedBy ? {
          id: history.performedBy._id,
          name: history.performedBy.name
        } : null,
        note: history.note,
        timestamp: history.timestamp
      }))
    };
  }

  // Tính toán thời gian xử lý sự cố
  static calculateProcessingTime(incident) {
    if (!incident.createdAt) return null;

    const endTime = incident.status === 'Đã đóng' && incident.resolution?.closedAt 
      ? new Date(incident.resolution.closedAt)
      : new Date();

    const processingTime = endTime - new Date(incident.createdAt);
    
    return {
      totalHours: Math.floor(processingTime / (1000 * 60 * 60)),
      totalDays: Math.floor(processingTime / (1000 * 60 * 60 * 24)),
      formatted: this.formatDuration(processingTime)
    };
  }

  // Format thời gian
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ngày ${hours % 24} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes % 60} phút`;
    } else if (minutes > 0) {
      return `${minutes} phút ${seconds % 60} giây`;
    } else {
      return `${seconds} giây`;
    }
  }

  // Xuất sự cố ra Excel
  static async exportToExcel(incidents) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách sự cố');

      // Định nghĩa cột
      worksheet.columns = [
        { header: 'ID Sự cố', key: 'incidentId', width: 15 },
        { header: 'Tiêu đề', key: 'title', width: 30 },
        { header: 'Mô tả', key: 'description', width: 40 },
        { header: 'Địa điểm', key: 'location', width: 20 },
        { header: 'Mức độ', key: 'severity', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Người tạo', key: 'createdBy', width: 20 },
        { header: 'Người phụ trách', key: 'assignedTo', width: 20 },
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
        { header: 'Thời gian xử lý', key: 'processingTime', width: 20 }
      ];

      // Thêm dữ liệu
      incidents.forEach(incident => {
        const processingTime = this.calculateProcessingTime(incident);
        worksheet.addRow({
          incidentId: incident.incidentId,
          title: incident.title,
          description: incident.description,
          location: incident.location,
          severity: incident.severity,
          status: incident.status,
          createdBy: incident.createdBy?.name || 'N/A',
          assignedTo: incident.assignedTo?.name || 'Chưa phân công',
          createdAt: new Date(incident.createdAt).toLocaleString('vi-VN'),
          processingTime: processingTime?.formatted || 'Đang xử lý'
        });
      });

      // Style cho header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = Math.max(column.width, 10);
      });

      // Tạo buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      throw new Error(`Lỗi xuất Excel: ${error.message}`);
    }
  }

  // Xuất sự cố ra PDF
  static async exportToPDF(incidents) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('BÁO CÁO SỰ CỐ', { align: 'center' });
        doc.fontSize(12).text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
        doc.moveDown(2);

        // Thông tin tổng quan
        doc.fontSize(14).text('TỔNG QUAN', { underline: true });
        doc.fontSize(12).text(`Tổng số sự cố: ${incidents.length}`);
        
        const statusCount = incidents.reduce((acc, incident) => {
          acc[incident.status] = (acc[incident.status] || 0) + 1;
          return acc;
        }, {});
        
        doc.text(`- Mới ghi nhận: ${statusCount['Mới ghi nhận'] || 0}`);
        doc.text(`- Đang xử lý: ${statusCount['Đang xử lý'] || 0}`);
        doc.text(`- Đã đóng: ${statusCount['Đã đóng'] || 0}`);
        doc.moveDown(1);

        // Chi tiết từng sự cố
        doc.fontSize(14).text('CHI TIẾT SỰ CỐ', { underline: true });
        doc.moveDown(1);

        incidents.forEach((incident, index) => {
          if (index > 0) {
            doc.addPage();
          }

          doc.fontSize(12).text(`Sự cố ${index + 1}: ${incident.incidentId}`, { underline: true });
          doc.text(`Tiêu đề: ${incident.title}`);
          doc.text(`Mô tả: ${incident.description}`);
          doc.text(`Địa điểm: ${incident.location}`);
          doc.text(`Mức độ: ${incident.severity}`);
          doc.text(`Trạng thái: ${incident.status}`);
          doc.text(`Người tạo: ${incident.createdBy?.name || 'N/A'}`);
          doc.text(`Người phụ trách: ${incident.assignedTo?.name || 'Chưa phân công'}`);
          doc.text(`Ngày tạo: ${new Date(incident.createdAt).toLocaleString('vi-VN')}`);
          
          const processingTime = this.calculateProcessingTime(incident);
          if (processingTime) {
            doc.text(`Thời gian xử lý: ${processingTime.formatted}`);
          }

          doc.moveDown(1);
        });

        doc.end();
      });
    } catch (error) {
      throw new Error(`Lỗi xuất PDF: ${error.message}`);
    }
  }

  // Tạo báo cáo thống kê
  static generateStatisticsReport(statistics) {
    const report = {
      summary: {
        total: statistics.total,
        byStatus: statistics.statusBreakdown,
        bySeverity: statistics.severityBreakdown
      },
      insights: []
    };

    // Phân tích insights
    if (statistics.statusBreakdown['Đã đóng'] > 0) {
      const resolutionRate = (statistics.statusBreakdown['Đã đóng'] / statistics.total) * 100;
      report.insights.push(`Tỷ lệ giải quyết: ${resolutionRate.toFixed(1)}%`);
    }

    if (statistics.severityBreakdown['rất nghiêm trọng'] > 0) {
      report.insights.push(`Có ${statistics.severityBreakdown['rất nghiêm trọng']} sự cố rất nghiêm trọng cần chú ý`);
    }

    if (statistics.statusBreakdown['Đang xử lý'] > 5) {
      report.insights.push(`Có ${statistics.statusBreakdown['Đang xử lý']} sự cố đang xử lý, cần tăng cường nhân lực`);
    }

    return report;
  }

  // Gửi thông báo tự động
  static async sendAutomaticNotifications(incident) {
    const notifications = [];

    // Thông báo sự cố mới
    if (incident.status === 'Mới ghi nhận') {
      notifications.push({
        type: 'new_incident',
        message: `Sự cố mới: ${incident.incidentId} - ${incident.title}`,
        priority: 'high'
      });
    }

    // Thông báo sự cố quá hạn
    if (incident.dueDate && new Date(incident.dueDate) < new Date() && incident.status !== 'Đã đóng') {
      notifications.push({
        type: 'overdue_incident',
        message: `Sự cố quá hạn: ${incident.incidentId} - ${incident.title}`,
        priority: 'urgent'
      });
    }

    // Thông báo sự cố nghiêm trọng
    if (incident.severity === 'rất nghiêm trọng') {
      notifications.push({
        type: 'critical_incident',
        message: `Sự cố nghiêm trọng: ${incident.incidentId} - ${incident.title}`,
        priority: 'critical'
      });
    }

    return notifications;
  }

  // Tạo dashboard data
  static createDashboardData(incidents, statistics) {
    const dashboard = {
      overview: {
        total: statistics.total,
        open: statistics.statusBreakdown['Mới ghi nhận'] + statistics.statusBreakdown['Đang xử lý'],
        closed: statistics.statusBreakdown['Đã đóng'],
        critical: statistics.severityBreakdown['rất nghiêm trọng'] || 0
      },
      recentIncidents: incidents.slice(0, 5).map(incident => ({
        id: incident._id,
        incidentId: incident.incidentId,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt
      })),
      trends: {
        daily: this.calculateDailyTrends(incidents),
        weekly: this.calculateWeeklyTrends(incidents),
        monthly: this.calculateMonthlyTrends(incidents)
      }
    };

    return dashboard;
  }

  // Tính xu hướng hàng ngày
  static calculateDailyTrends(incidents) {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayIncidents = incidents.filter(incident => 
        new Date(incident.createdAt).toDateString() === date.toDateString()
      );
      last7Days.push({
        date: date.toISOString().split('T')[0],
        count: dayIncidents.length
      });
    }
    return last7Days;
  }

  // Tính xu hướng hàng tuần
  static calculateWeeklyTrends(incidents) {
    const last4Weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.createdAt);
        return incidentDate >= weekStart && incidentDate <= weekEnd;
      });
      
      last4Weeks.push({
        week: `Tuần ${4 - i}`,
        count: weekIncidents.length
      });
    }
    return last4Weeks;
  }

  // Tính xu hướng hàng tháng
  static calculateMonthlyTrends(incidents) {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      
      const monthIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.createdAt);
        return incidentDate.getMonth() === month.getMonth() && 
               incidentDate.getFullYear() === month.getFullYear();
      });
      
      last6Months.push({
        month: month.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        count: monthIncidents.length
      });
    }
    return last6Months;
  }
}

module.exports = IncidentUtils;
