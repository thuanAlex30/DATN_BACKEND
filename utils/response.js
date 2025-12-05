// Helper function for creating response objects
function createResponse(statusCode, message, data = null) {
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, pagination = null) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Add pagination if provided
    if (pagination) {
      response.pagination = pagination;
    }
    
    return res.status(statusCode).json(response);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res, errors, message = 'Validation Error') {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Incident specific responses
  static incidentCreated(res, data, message = 'Sự cố đã được tạo thành công') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentUpdated(res, data, message = 'Sự cố đã được cập nhật thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentClassified(res, data, message = 'Sự cố đã được phân loại thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentAssigned(res, data, message = 'Sự cố đã được phân công thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentInvestigated(res, data, message = 'Sự cố đã được điều tra thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentProgressUpdated(res, data, message = 'Tiến độ sự cố đã được cập nhật thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentClosed(res, data, message = 'Sự cố đã được đóng thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentsList(res, data, pagination = null, message = 'Lấy danh sách sự cố thành công') {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (pagination) {
      response.pagination = pagination;
    }
    
    return res.status(200).json(response);
  }

  static incidentStatistics(res, data, message = 'Lấy thống kê sự cố thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static incidentExported(res, data, filename, message = 'Xuất báo cáo sự cố thành công') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.status(200).send(data);
  }

  static incidentSearch(res, data, pagination = null, message = 'Tìm kiếm sự cố thành công') {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (pagination) {
      response.pagination = pagination;
    }
    
    return res.status(200).json(response);
  }

  static incidentNotFound(res, message = 'Không tìm thấy sự cố') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static incidentAccessDenied(res, message = 'Không có quyền truy cập sự cố này') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static incidentAlreadyClosed(res, message = 'Sự cố đã được đóng') {
    return res.status(400).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static incidentCannotBeModified(res, message = 'Sự cố không thể được chỉnh sửa') {
    return res.status(400).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { ApiResponse, createResponse };