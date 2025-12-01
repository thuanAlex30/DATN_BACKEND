const hikvisionService = require('../services/hikvisionService');
const { createResponse } = require('../utils/response');

/**
 * Get Access Control Events
 * GET /api/hikvision/events
 */
exports.getAccessControlEvents = async (req, res) => {
  try {
    console.log('📥 Hikvision API Request:', {
      query: req.query,
      method: req.method,
      url: req.originalUrl
    });

    const {
      searchID,
      searchResultPosition,
      maxResults,
      major,
      minor,
      startTime,
      endTime,
      getAll = false // If true, fetch all events with pagination
    } = req.query;

    // Limit maxResults to 100 (like Python code) to avoid "Invalid Content" errors
    const parsedMaxResults = maxResults !== undefined ? parseInt(maxResults) : 100;
    const limitedMaxResults = parsedMaxResults > 100 ? 100 : parsedMaxResults;

    const searchParams = {
      ...(searchID && { searchID }),
      ...(searchResultPosition !== undefined && { searchResultPosition: parseInt(searchResultPosition) }),
      maxResults: limitedMaxResults, // Always limit to 100 max
      ...(major !== undefined && { major: parseInt(major) }),
      ...(minor !== undefined && { minor: parseInt(minor) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime })
    };

    console.log('🔍 Search params:', searchParams);

    let result;
    if (getAll === 'true' || getAll === true) {
      result = await hikvisionService.getAllAccessControlEvents(searchParams);
    } else {
      result = await hikvisionService.getAccessControlEvents(searchParams);
    }

    console.log('📤 Hikvision Service Result:', {
      success: result.success,
      status: result.status,
      hasData: !!result.data,
      error: result.error
    });

    if (!result.success) {
      const statusCode = result.status || 500;
      console.error('❌ Hikvision service error:', {
        status: statusCode,
        error: result.error,
        data: result.data
      });
      return res.status(statusCode).json(
        createResponse(statusCode, result.error || 'Lỗi khi lấy dữ liệu từ Hikvision', null, result.error)
      );
    }

    return res.status(200).json(
      createResponse(200, 'Lấy dữ liệu sự kiện kiểm soát truy cập thành công', result.data)
    );

  } catch (error) {
    console.error('❌ Error in getAccessControlEvents:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json(
      createResponse(500, 'Lỗi server khi lấy dữ liệu từ Hikvision', null, error.message)
    );
  }
};

/**
 * Get Access Control Events with custom search
 * POST /api/hikvision/events/search
 */
exports.searchAccessControlEvents = async (req, res) => {
  try {
    const searchParams = req.body;

    const result = await hikvisionService.getAccessControlEvents(searchParams);

    if (!result.success) {
      return res.status(result.status || 500).json(
        createResponse(result.status || 500, result.error || 'Lỗi khi tìm kiếm dữ liệu từ Hikvision', null, result.error)
      );
    }

    return res.status(200).json(
      createResponse(200, 'Tìm kiếm sự kiện kiểm soát truy cập thành công', result.data)
    );

  } catch (error) {
    console.error('Error in searchAccessControlEvents:', error);
    return res.status(500).json(
      createResponse(500, 'Lỗi server khi tìm kiếm dữ liệu từ Hikvision', null, error.message)
    );
  }
};

