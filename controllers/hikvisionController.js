const hikvisionService = require('../services/hikvisionService');
const { createResponse } = require('../utils/response');
const UserRepository = require('../repository/UserRepository');

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

    console.log('📥 Request query params:', {
      getAll,
      getAllType: typeof getAll,
      getAllValue: getAll,
      startTime,
      endTime,
      major,
      minor
    });

    // Limit maxResults to 100 (like Python code) to avoid "Invalid Content" errors
    const parsedMaxResults = maxResults !== undefined ? parseInt(maxResults) : 100;
    const limitedMaxResults = parsedMaxResults > 100 ? 100 : parsedMaxResults;

    const searchParams = {
      ...(searchID && { searchID }),
      ...(searchResultPosition !== undefined && { searchResultPosition: parseInt(searchResultPosition) }),
      maxResults: limitedMaxResults, // Always limit to 100 max
      ...(major !== undefined && { major: parseInt(major) }),
      // Chỉ truyền minor nếu có giá trị cụ thể (không phải 0 hoặc undefined)
      // minor: 0 có thể không trả về dữ liệu, nên không truyền để lấy tất cả
      ...(minor !== undefined && minor !== null && minor !== '0' && minor !== 0 && { minor: parseInt(minor) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime })
    };

    console.log('🔍 Search params:', searchParams);

    let result;
    const shouldGetAll = getAll === 'true' || getAll === true || getAll === '1' || getAll === 1;
    console.log('🔄 Should get all events?', shouldGetAll);
    
    if (shouldGetAll) {
      console.log('📡 Calling getAllAccessControlEvents (with pagination)');
      result = await hikvisionService.getAllAccessControlEvents(searchParams);
    } else {
      console.log('📡 Calling getAccessControlEvents (single request)');
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

    // Enrich events with user information
    let enrichedData = result.data;
    try {
      // Extract employeeNoString from events
      const events = result.data?.events || result.data?.AcsEvent?.InfoList || [];
      if (events.length > 0) {
        const employeeNos = events
          .map(e => e.employeeNoString)
          .filter(no => no && no !== '' && no !== 'undefined');
        
        if (employeeNos.length > 0) {
          console.log('🔍 Enriching events with user info for employeeNos:', employeeNos);
          const users = await UserRepository.findByUserIds(employeeNos);
          
          // Create a map for quick lookup
          const userMap = new Map();
          users.forEach(user => {
            if (user.user_id) {
              userMap.set(String(user.user_id), {
                id: user._id,
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email
              });
            }
          });

          console.log('👥 Found users:', userMap.size, 'out of', employeeNos.length);

          // Enrich events with user info
          const enrichedEvents = events.map(event => {
            if (event.employeeNoString && userMap.has(event.employeeNoString)) {
              return {
                ...event,
                user: userMap.get(event.employeeNoString)
              };
            }
            return event;
          });

          // Update data structure
          if (result.data?.events) {
            enrichedData = {
              ...result.data,
              events: enrichedEvents
            };
          } else if (result.data?.AcsEvent?.InfoList) {
            enrichedData = {
              ...result.data,
              AcsEvent: {
                ...result.data.AcsEvent,
                InfoList: enrichedEvents
              }
            };
          }
        }
      }
    } catch (enrichError) {
      console.error('⚠️ Error enriching events with user info:', enrichError);
      // Continue with original data if enrichment fails
    }

    return res.status(200).json(
      createResponse(200, 'Lấy dữ liệu sự kiện kiểm soát truy cập thành công', enrichedData)
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

    // Enrich events with user information
    let enrichedData = result.data;
    try {
      const events = result.data?.AcsEvent?.InfoList || [];
      if (events.length > 0) {
        const employeeNos = events
          .map(e => e.employeeNoString)
          .filter(no => no && no !== '' && no !== 'undefined');
        
        if (employeeNos.length > 0) {
          const users = await UserRepository.findByUserIds(employeeNos);
          const userMap = new Map();
          users.forEach(user => {
            if (user.user_id) {
              userMap.set(String(user.user_id), {
                id: user._id,
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email
              });
            }
          });

          const enrichedEvents = events.map(event => {
            if (event.employeeNoString && userMap.has(event.employeeNoString)) {
              return {
                ...event,
                user: userMap.get(event.employeeNoString)
              };
            }
            return event;
          });

          if (result.data?.AcsEvent?.InfoList) {
            enrichedData = {
              ...result.data,
              AcsEvent: {
                ...result.data.AcsEvent,
                InfoList: enrichedEvents
              }
            };
          }
        }
      }
    } catch (enrichError) {
      console.error('⚠️ Error enriching events with user info:', enrichError);
    }

    return res.status(200).json(
      createResponse(200, 'Tìm kiếm sự kiện kiểm soát truy cập thành công', enrichedData)
    );

  } catch (error) {
    console.error('Error in searchAccessControlEvents:', error);
    return res.status(500).json(
      createResponse(500, 'Lỗi server khi tìm kiếm dữ liệu từ Hikvision', null, error.message)
    );
  }
};

