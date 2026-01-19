class IncidentUtils {
  /**
   * Tạo incident ID tự động
   */
  static generateIncidentId() {
    const timestamp = Date.now();
    return `INC${timestamp}`;
  }

  /**
   * Validate dữ liệu incident
   */
  static validateIncidentData(data) {
    const errors = [];

    // Required fields
    if (!data.title || data.title.trim() === '') {
      errors.push('Tiêu đề không được để trống');
    }

    if (!data.description || data.description.trim() === '') {
      errors.push('Mô tả không được để trống');
    }

    if (!data.location || data.location.trim() === '') {
      errors.push('Địa điểm không được để trống');
    }

    // Validate severity
    const validSeverities = ['nhẹ', 'nặng', 'rất nghiêm trọng'];
    if (data.severity && !validSeverities.includes(data.severity)) {
      errors.push('Mức độ nghiêm trọng không hợp lệ');
    }

    // Validate status
    const validStatuses = ['Mới ghi nhận', 'Đang xử lý', 'Đã đóng'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Trạng thái không hợp lệ');
    }

    // Validate images
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((image, index) => {
        if (typeof image !== 'string') {
          errors.push(`Ảnh ${index + 1} không hợp lệ`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join(', ') : 'Dữ liệu hợp lệ'
    };
  }

  /**
   * Validate investigation data
   */
  static validateInvestigationData(data) {
    const errors = [];

    if (!data.investigation || data.investigation.trim() === '') {
      errors.push('Kết quả điều tra không được để trống');
    }

    if (!data.solution || data.solution.trim() === '') {
      errors.push('Khuyến nghị không được để trống');
    }

    // Validate images
    if (data.findingsImages && Array.isArray(data.findingsImages)) {
      data.findingsImages.forEach((image, index) => {
        if (typeof image !== 'string') {
          errors.push(`Ảnh minh chứng ${index + 1} không hợp lệ`);
        }
      });
    }

    if (data.rootCauseImages && Array.isArray(data.rootCauseImages)) {
      data.rootCauseImages.forEach((image, index) => {
        if (typeof image !== 'string') {
          errors.push(`Ảnh nguyên nhân ${index + 1} không hợp lệ`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join(', ') : 'Dữ liệu điều tra hợp lệ'
    };
  }

  /**
   * Format incident data cho response
   */
  static formatIncidentResponse(incident) {
    if (!incident) return null;

    return {
      _id: incident._id,
      title: incident.title,
      description: incident.description,
      images: incident.images || [],
      location: incident.location,
      severity: incident.severity,
      status: incident.status,
      incidentId: incident.incidentId,
      project_id: incident.project_id,
      assignedTo: incident.assignedTo,
      createdBy: incident.createdBy,
      notified: incident.notified,
      histories: incident.histories || [],
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt
    };
  }

  /**
   * Format incidents list cho response
   */
  static formatIncidentsListResponse(incidents) {
    if (!Array.isArray(incidents)) return [];

    return incidents.map(incident => IncidentUtils.formatIncidentResponse(incident));
  }

  /**
   * Format incident stats
   */
  static formatIncidentStats(stats) {
    return {
      total: stats.total || 0,
      byStatus: {
        new: stats.new || 0,
        processing: stats.processing || 0,
        closed: stats.closed || 0
      },
      bySeverity: {
        light: stats.light || 0,
        heavy: stats.heavy || 0,
        critical: stats.critical || 0
      }
    };
  }

  /**
   * Lấy màu sắc cho severity
   */
  static getSeverityColor(severity) {
    const colorMap = {
      'nhẹ': 'green',
      'nặng': 'orange',
      'rất nghiêm trọng': 'red'
    };
    return colorMap[severity] || 'default';
  }

  /**
   * Lấy màu sắc cho status
   */
  static getStatusColor(status) {
    const colorMap = {
      'Mới ghi nhận': 'blue',
      'Đang xử lý': 'orange',
      'Đã đóng': 'green'
    };
    return colorMap[status] || 'default';
  }

  /**
   * Lấy icon cho action
   */
  static getActionIcon(action) {
    const iconMap = {
      'Ghi nhận': 'file-text',
      'Phân loại': 'tag',
      'Phân công': 'user-add',
      'Điều tra': 'search',
      'Khắc phục': 'tool',
      'Cập nhật tiến độ': 'clock-circle',
      'Đóng': 'check-circle'
    };
    return iconMap[action] || 'question-circle';
  }

  /**
   * Lấy màu sắc cho action
   */
  static getActionColor(action) {
    const colorMap = {
      'Ghi nhận': '#1890ff',
      'Phân loại': '#722ed1',
      'Phân công': '#13c2c2',
      'Điều tra': '#fa8c16',
      'Khắc phục': '#52c41a',
      'Cập nhật tiến độ': '#eb2f96',
      'Đóng': '#f5222d'
    };
    return colorMap[action] || '#666';
  }

  /**
   * Tính toán thời gian xử lý incident
   */
  static calculateProcessingTime(incident) {
    if (!incident || !incident.histories) return null;

    const createdEntry = incident.histories.find(h => h.action === 'Ghi nhận');
    const closedEntry = incident.histories.find(h => h.action === 'Đóng');

    if (!createdEntry) return null;

    const startTime = new Date(createdEntry.timestamp);
    const endTime = closedEntry ? new Date(closedEntry.timestamp) : new Date();
    
    const diffMs = endTime - startTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
      totalMs: diffMs,
      formatted: `${diffDays}d ${diffHours}h ${diffMinutes}m`
    };
  }

  /**
   * Kiểm tra incident có thể đóng không
   */
  static canCloseIncident(incident) {
    if (!incident || !incident.histories) return false;

    const hasInvestigation = incident.histories.some(h => h.action === 'Điều tra');
    const hasSolution = incident.histories.some(h => h.action === 'Khắc phục');
    const isAlreadyClosed = incident.status === 'Đã đóng';

    return hasInvestigation && hasSolution && !isAlreadyClosed;
  }

  /**
   * Kiểm tra incident có thể phân công không
   */
  static canAssignIncident(incident) {
    if (!incident) return false;

    const isNew = incident.status === 'Mới ghi nhận';
    const isNotAssigned = !incident.assignedTo;

    return isNew && isNotAssigned;
  }

  /**
   * Validate evidence (minh chứng) data
   */
  static validateEvidence(evidenceImages) {
    if (!Array.isArray(evidenceImages)) {
      return {
        isValid: false,
        message: 'Minh chứng phải là mảng'
      };
    }

    if (evidenceImages.length === 0) {
      return {
        isValid: true,
        message: 'Minh chứng không bắt buộc'
      };
    }

    // Validate từng ảnh
    const errors = [];
    evidenceImages.forEach((image, index) => {
      if (typeof image !== 'string') {
        errors.push(`Minh chứng ${index + 1} không hợp lệ`);
      }
      // Kiểm tra format: URL hoặc base64 data URI
      if (typeof image === 'string' && !/^https?:\/\//i.test(image) && !image.startsWith('data:image/')) {
        errors.push(`Minh chứng ${index + 1} phải là URL hoặc base64 data URI`);
      }
    });

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join(', ') : 'Minh chứng hợp lệ'
    };
  }

  /**
   * Lấy next action có thể thực hiện
   */
  static getNextAvailableActions(incident) {
    const actions = [];

    if (IncidentUtils.canAssignIncident(incident)) {
      actions.push('assign');
    }

    if (incident.status === 'Đang xử lý' && !incident.histories.some(h => h.action === 'Điều tra')) {
      actions.push('investigate');
    }

    if (incident.status === 'Đang xử lý' && incident.histories.some(h => h.action === 'Điều tra')) {
      actions.push('update_progress');
    }

    if (IncidentUtils.canCloseIncident(incident)) {
      actions.push('close');
    }

    return actions;
  }

  /**
   * Tạo summary cho incident
   */
  static createIncidentSummary(incident) {
    if (!incident) return null;

    const processingTime = IncidentUtils.calculateProcessingTime(incident);
    const nextActions = IncidentUtils.getNextAvailableActions(incident);

    return {
      id: incident._id,
      incidentId: incident.incidentId,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      location: incident.location,
      createdAt: incident.createdAt,
      processingTime,
      nextActions,
      canClose: IncidentUtils.canCloseIncident(incident),
      canAssign: IncidentUtils.canAssignIncident(incident)
    };
  }
}

module.exports = IncidentUtils;
