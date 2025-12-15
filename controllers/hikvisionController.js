const hikvisionService = require('../services/hikvisionService');
const { createResponse } = require('../utils/response');
const UserRepository = require('../repository/UserRepository');
const ProjectAssignmentRepository = require('../repository/projectAssignmentRepository');
const ProjectRepository = require('../repository/projectRepository');

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

/**
 * Get Access Control Events filtered by Project
 * GET /api/hikvision/events/project/:projectId
 */
exports.getAccessControlEventsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      searchID,
      searchResultPosition,
      maxResults,
      major,
      minor,
      startTime,
      endTime,
      getAll = false
    } = req.query;

    console.log('📥 Hikvision Project Events Request:', {
      projectId,
      query: req.query,
      method: req.method,
      url: req.originalUrl
    });

    // Get project user IDs (Mongo) và user_id (employee number) (từ assignments và leader)
    const projectUserIds = new Set(); // Mongo _id
    const projectEmployeeNos = new Set(); // user.user_id (number/string)
    let projectAssignments = [];
    
    try {
      // Get project assignments (đã populate user_id với user_id số)
      const assignments = await ProjectAssignmentRepository.getProjectAssignments(projectId);
      projectAssignments = assignments;
      
      assignments.forEach(assignment => {
        if (assignment.user_id) {
          const userObj = assignment.user_id;
          const userId = typeof userObj === 'object'
            ? (userObj._id || userObj.id)
            : userObj;
          if (userId) {
            projectUserIds.add(String(userId));
          }
          const empNo = typeof userObj === 'object'
            ? userObj.user_id
            : undefined;
          if (empNo !== undefined && empNo !== null && empNo !== '') {
            projectEmployeeNos.add(String(empNo));
          }
        }
      });

      // Get project leader
      const project = await ProjectRepository.getProjectById(projectId);
      if (project && project.leader_id) {
        const leaderId = typeof project.leader_id === 'object'
          ? (project.leader_id._id || project.leader_id.id)
          : project.leader_id;
        if (leaderId) {
          projectUserIds.add(String(leaderId));
        }
        const leaderEmpNo = typeof project.leader_id === 'object'
          ? project.leader_id.user_id
          : undefined;
        if (leaderEmpNo !== undefined && leaderEmpNo !== null && leaderEmpNo !== '') {
          projectEmployeeNos.add(String(leaderEmpNo));
        }
      }

      console.log('👥 Project user IDs:', Array.from(projectUserIds));
      console.log('👤 Project employeeNos:', Array.from(projectEmployeeNos));
      console.log('📦 Assignments count:', assignments.length);

      // Fallback: nếu chưa có employeeNo nhưng có danh sách userIds, tra cứu user để lấy user_id
      if (projectEmployeeNos.size === 0 && projectUserIds.size > 0) {
        try {
          const usersById = await UserRepository.findByIds(Array.from(projectUserIds));
          usersById.forEach(u => {
            if (u && u.user_id !== undefined && u.user_id !== null && u.user_id !== '') {
              projectEmployeeNos.add(String(u.user_id));
            }
          });
          console.log('🔄 Fallback employeeNos from user lookup:', Array.from(projectEmployeeNos));
        } catch (fallbackErr) {
          console.warn('⚠️ Fallback lookup user_id by _id failed:', fallbackErr.message);
        }
      }
    } catch (projectError) {
      console.error('⚠️ Error getting project users:', projectError);
      // Continue even if we can't get project users - will return empty result
    }

    // If no project users, return empty result
    if (projectUserIds.size === 0 && projectEmployeeNos.size === 0) {
      return res.status(200).json(
        createResponse(200, 'Dự án chưa có nhân viên được phân công', {
          events: [],
          total: 0,
          projectUserIds: []
        })
      );
    }

    // Employee numbers để lọc (dùng trực tiếp từ assignments/leader)
    const employeeNos = Array.from(projectEmployeeNos).map(String);

    console.log('🔍 Employee numbers for project (from assignments/leader):', employeeNos);

    // Limit maxResults to 100
    const parsedMaxResults = maxResults !== undefined ? parseInt(maxResults) : 100;
    const limitedMaxResults = parsedMaxResults > 100 ? 100 : parsedMaxResults;

    const searchParams = {
      ...(searchID && { searchID }),
      ...(searchResultPosition !== undefined && { searchResultPosition: parseInt(searchResultPosition) }),
      maxResults: limitedMaxResults,
      ...(major !== undefined && { major: parseInt(major) }),
      ...(minor !== undefined && minor !== null && minor !== '0' && minor !== 0 && { minor: parseInt(minor) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime })
    };

    // Get events from Hikvision
    let result;
    const shouldGetAll = getAll === 'true' || getAll === true || getAll === '1' || getAll === 1;
    
    if (shouldGetAll) {
      result = await hikvisionService.getAllAccessControlEvents(searchParams);
    } else {
      result = await hikvisionService.getAccessControlEvents(searchParams);
    }

    if (!result.success) {
      const statusCode = result.status || 500;
      return res.status(statusCode).json(
        createResponse(statusCode, result.error || 'Lỗi khi lấy dữ liệu từ Hikvision', null, result.error)
      );
    }

    // Extract events
    const allEvents = result.data?.events || result.data?.AcsEvent?.InfoList || [];
    
    // Filter events by project employee numbers
    const filteredEvents = allEvents.filter(event => {
      if (!event.employeeNoString) return false;
      return employeeNos.includes(String(event.employeeNoString));
    });

    console.log(`✅ Filtered ${filteredEvents.length} events from ${allEvents.length} total events for project ${projectId}`);

    // Enrich filtered events với thông tin user từ assignments/leader
    let enrichedEvents = filteredEvents;
    try {
      const userMap = new Map();

      // Từ assignments
      projectAssignments.forEach((assignment) => {
        const u = assignment.user_id;
        if (u && u.user_id !== undefined && u.user_id !== null) {
          userMap.set(String(u.user_id), {
            id: u._id || u.id,
            user_id: u.user_id,
            username: u.username,
            full_name: u.full_name,
            email: u.email
          });
        }
      });

      // Từ leader (nếu chưa có trong map)
      try {
        const project = await ProjectRepository.getProjectById(projectId);
        if (project && project.leader_id && project.leader_id.user_id !== undefined && project.leader_id.user_id !== null) {
          const lid = project.leader_id;
          userMap.set(String(lid.user_id), {
            id: lid._id || lid.id,
            user_id: lid.user_id,
            username: lid.username,
            full_name: lid.full_name,
            email: lid.email
          });
        }
      } catch (errLeader) {
        console.warn('⚠️ Cannot enrich leader info:', errLeader.message);
      }

      enrichedEvents = filteredEvents.map(event => {
        if (event.employeeNoString && userMap.has(String(event.employeeNoString))) {
          return {
            ...event,
            user: userMap.get(String(event.employeeNoString))
          };
        }
        return event;
      });
    } catch (enrichError) {
      console.error('⚠️ Error enriching events with user info:', enrichError);
    }

    return res.status(200).json(
      createResponse(200, 'Lấy dữ liệu sự kiện kiểm soát truy cập theo dự án thành công', {
        events: enrichedEvents,
        total: enrichedEvents.length,
        projectUserIds: Array.from(projectUserIds),
        employeeNos: employeeNos
      })
    );

  } catch (error) {
    console.error('❌ Error in getAccessControlEventsByProject:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json(
      createResponse(500, 'Lỗi server khi lấy dữ liệu sự kiện theo dự án', null, error.message)
    );
  }
};

