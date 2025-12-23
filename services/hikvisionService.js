const axios = require('axios');
const crypto = require('crypto');

/**
 * Hikvision Access Control Service
 * Handles communication with Hikvision ISAPI endpoints
 * Implements Digest Auth similar to Python's requests with HTTPDigestAuth
 * 
 * Environment Variables (optional, defaults shown):
 * - HIKVISION_BASE_URL: Base URL of Hikvision device (default: http://192.168.1.19:80)
 * - HIKVISION_USERNAME: Username for Digest Auth (default: admin)
 * - HIKVISION_PASSWORD: Password for Digest Auth (default: 12345678A)
 */
class HikvisionService {
  constructor(config = {}) {
    // Default Hikvision configuration
    // Can be overridden via constructor config or environment variables
    // Hardcode base URL as requested (do not rely on environment variable)
    this.baseURL = config.baseURL || 'http://172.20.10.13';
    this.username = config.username || process.env.HIKVISION_USERNAME || 'admin';
    this.password = config.password || process.env.HIKVISION_PASSWORD || '12345678A';
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Format timestamp to Hikvision format (without milliseconds)
   * Python format: "2025-11-29T00:00:00+08:00"
   * @param {Date|string} date - Date object or ISO string
   * @param {string} timezone - Timezone offset (default: +08:00)
   * @returns {string} Formatted timestamp
   */
  formatHikvisionTimestamp(date, timezone = '+08:00') {
    let dateObj;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Format: YYYY-MM-DDTHH:mm:ss+08:00 (no milliseconds)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
  }

  /**
   * Generate Digest Auth header (RFC 2617)
   * Similar to Python's requests HTTPDigestAuth
   */
  generateDigestAuth(method, uri, realm, nonce, qop = null, cnonce = null, nc = null) {
    // HA1 = MD5(username:realm:password)
    const ha1 = crypto.createHash('md5')
      .update(`${this.username}:${realm}:${this.password}`)
      .digest('hex');

    // HA2 = MD5(method:uri)
    const ha2 = crypto.createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');

    let response;
    if (qop) {
      // Ensure nc is zero-padded to 8 digits (RFC 2617)
      const ncPadded = String(nc).padStart(8, '0');
      
      // response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
      response = crypto.createHash('md5')
        .update(`${ha1}:${nonce}:${ncPadded}:${cnonce}:${qop}:${ha2}`)
        .digest('hex');
      
      // Some implementations require qop to be quoted
      const authHeader = `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop="${qop}", nc=${ncPadded}, cnonce="${cnonce}", response="${response}"`;
      
      console.log('🔐 Generated Digest Auth header:', {
        ha1: ha1.substring(0, 10) + '...',
        ha2: ha2.substring(0, 10) + '...',
        response: response.substring(0, 10) + '...',
        nc: ncPadded,
        uri,
        headerPreview: authHeader.substring(0, 100) + '...'
      });
      
      return authHeader;
    } else {
      // response = MD5(HA1:nonce:HA2)
      response = crypto.createHash('md5')
        .update(`${ha1}:${nonce}:${ha2}`)
        .digest('hex');
      
      const authHeader = `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
      
      console.log('🔐 Generated Digest Auth header (no qop):', {
        ha1: ha1.substring(0, 10) + '...',
        ha2: ha2.substring(0, 10) + '...',
        response: response.substring(0, 10) + '...',
        uri,
        headerPreview: authHeader.substring(0, 100) + '...'
      });
      
      return authHeader;
    }
  }

  /**
   * Parse WWW-Authenticate header
   */
  parseAuthHeader(authHeader) {
    const params = {};
    // Match key="value" or key=value patterns
    const regex = /(\w+)=["']?([^"',\s]+)["']?/g;
    let match;
    
    while ((match = regex.exec(authHeader)) !== null) {
      params[match[1]] = match[2];
    }
    
    return params;
  }

  /**
   * Make authenticated request to Hikvision API
   * Implements Digest Auth similar to Python's requests.post(auth=HTTPDigestAuth(...))
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let cnonce = crypto.randomBytes(8).toString('hex');
    let nc = '00000001';

    const maxRetries = 3;
    let attempt = 0;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (attempt <= maxRetries) {
      try {
        console.log('🔐 Making Hikvision request:', { method, url, hasData: !!data, attempt });

        // Step 1: First request without auth to get challenge (like Python's HTTPDigestAuth)
        const firstResponse = await axios({
          method,
          url,
          data, // Axios will automatically stringify JSON
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          timeout: this.timeout,
          validateStatus: (status) => status === 401 || status === 200
        });

        // If already authenticated (unlikely on first request)
        if (firstResponse.status === 200) {
          console.log('✅ Already authenticated');
          return {
            success: true,
            data: firstResponse.data,
            status: firstResponse.status
          };
        }

        // Step 2: Parse WWW-Authenticate header
        const wwwAuth = firstResponse.headers['www-authenticate'] ||
                        firstResponse.headers['WWW-Authenticate'] ||
                        firstResponse.headers['Www-Authenticate'];

        if (!wwwAuth) {
          console.error('❌ No WWW-Authenticate header in 401 response');
          return {
            success: false,
            error: 'Authentication required but no WWW-Authenticate header received',
            status: 401,
            data: firstResponse.data
          };
        }

        const authParams = this.parseAuthHeader(wwwAuth);
        const realm = authParams.realm || 'IP Camera';
        const nonce = authParams.nonce || '';
        const qop = authParams.qop || null;

        // Step 3: Generate Digest Auth header
        const urlObj = new URL(endpoint, 'http://dummy');
        const uriForAuth = urlObj.pathname;
        const authHeader = this.generateDigestAuth(method, uriForAuth, realm, nonce, qop, cnonce, nc);

        // Step 4: Second request with Digest Auth header
        const response = await axios({
          method,
          url,
          data,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            ...headers
          },
          timeout: this.timeout,
          validateStatus: (status) => status === 200 || status === 400
        });

        // Handle successful responses as before
        // Parse response.data if it's a string (defensive)
        let responseData = response.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (e) {
            console.error('❌ Failed to parse response data as JSON:', e.message);
          }
        }

        const hasAcsEvent = responseData &&
                            'AcsEvent' in responseData &&
                            responseData.AcsEvent !== null &&
                            typeof responseData.AcsEvent === 'object';

        const hasInfoList = hasAcsEvent &&
                           responseData.AcsEvent.InfoList !== undefined &&
                           Array.isArray(responseData.AcsEvent.InfoList);

        if (hasAcsEvent) {
          if (!hasInfoList) {
            responseData.AcsEvent.InfoList = [];
          }
          return {
            success: true,
            data: responseData,
            status: 200
          };
        }

        // Pure error or bad request handling (preserve original behavior)
        const isPureErrorResponse = responseData &&
                                    !hasAcsEvent &&
                                    (responseData.statusCode !== undefined ||
                                     responseData.statusString !== undefined ||
                                     responseData.errorCode !== undefined ||
                                     responseData.errorMsg !== undefined);

        if (isPureErrorResponse) {
          const errorMsg = responseData.statusString || responseData.errorMsg || 'Unknown error from Hikvision';
          return {
            success: false,
            error: `Hikvision API error: ${errorMsg} (Code: ${responseData.errorCode || responseData.statusCode})`,
            status: response.status,
            data: responseData
          };
        }

        return {
          success: false,
          error: `Bad request to Hikvision API: ${JSON.stringify(responseData)}`,
          status: 400,
          data: responseData
        };
      } catch (error) {
        // If we received 429 (Too Many Requests), perform exponential backoff and retry
        const status = error.response?.status;
        console.error('❌ Hikvision API Error:', {
          method,
          endpoint,
          url,
          error: error.message,
          code: error.code,
          status
        });

        if (status === 429 && attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s...
          console.warn(`⏳ Received 429, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(delay);
          attempt += 1;
          continue;
        }

        // Handle network errors and timeouts
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
          return {
            success: false,
            error: `Cannot connect to Hikvision device at ${this.baseURL}. Please check if the device is online and the URL is correct.`,
            status: 503,
            data: null
          };
        }

        if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'Request to Hikvision device timed out',
            status: 504,
            data: null
          };
        }

        return {
          success: false,
          error: error.message || 'Unknown error occurred',
          status: error.response?.status || 500,
          data: error.response?.data || null
        };
      }
    } // end while
  }

  /**
   * Get Access Control Events
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.searchID - Search ID
   * @param {number} searchParams.searchResultPosition - Starting position
   * @param {number} searchParams.maxResults - Maximum results to return
   * @param {number} searchParams.major - Major event type (5 for access control)
   * @param {number} searchParams.minor - Minor event type (0 for all)
   * @param {string} searchParams.startTime - Start time (ISO 8601 format)
   * @param {string} searchParams.endTime - End time (ISO 8601 format)
   * @returns {Promise<Object>} Access control events
   */
  async getAccessControlEvents(searchParams = {}) {
    const {
      searchID = '1',
      searchResultPosition = 0,
      maxResults = 100, // Default to 100 like Python code
      major = 5,
      minor = 38, // Default to 38 (vân tay) thay vì 0
      startTime,
      endTime
    } = searchParams;

    // Default to today if not provided
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    // Format timestamps without milliseconds (like Python code: "2025-11-29T00:00:00+08:00")
    // Python format doesn't include milliseconds, so we remove them if present
    let formattedStartTime;
    let formattedEndTime;

    if (startTime) {
      // Remove milliseconds if present (e.g., "2025-11-29T17:00:00.000+08:00" -> "2025-11-29T17:00:00+08:00")
      // Also remove timezone if present to match Hikvision format: "2025-12-13T00:00:00"
      formattedStartTime = startTime.replace(/\.\d{3}/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    } else {
      // Format without timezone to match Hikvision API format
      formattedStartTime = this.formatHikvisionTimestamp(todayStart).replace(/[+-]\d{2}:\d{2}$/, '');
    }

    if (endTime) {
      // Remove milliseconds and timezone if present
      formattedEndTime = endTime.replace(/\.\d{3}/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    } else {
      todayEnd.setHours(23, 59, 59, 0); // Set to 23:59:59 (no milliseconds)
      // Format without timezone to match Hikvision API format
      formattedEndTime = this.formatHikvisionTimestamp(todayEnd).replace(/[+-]\d{2}:\d{2}$/, '');
    }

    // Build request body exactly as Python code
    // Build request body exactly as Python code
    const requestBody = {
      AcsEventCond: {
        searchID: String(searchID || '1'),
        searchResultPosition: Number(searchResultPosition || 0),
        maxResults: Number(maxResults || 100), // Default to 100 like Python
        major: Number(major || 5),
        minor: Number(minor !== undefined && minor !== null ? minor : 38), // Default to 38 (vân tay)
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }
    };

    console.log('📤 Request body to Hikvision:', JSON.stringify(requestBody, null, 2));
    console.log('📤 Request body (compact):', JSON.stringify(requestBody));

    const result = await this.makeRequest(
      'POST',
      '/ISAPI/AccessControl/AcsEvent?format=json',
      requestBody
    );

    return result;
  }

  /**
   * Get all access control events (handles pagination)
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array>} All access control events
   */
  async getAllAccessControlEvents(searchParams = {}) {
    // Force maxResults to 100 (like Python code) to avoid "Invalid Content" errors
    const searchParamsWithLimit = {
      ...searchParams,
      maxResults: 100 // Always use 100 for pagination
    };

    const allEvents = [];
    let searchResultPosition = searchParams.searchResultPosition || 0;
    let hasMore = true;
    let callCount = 0;
    let totalMatches = null; // Will be set from the last response

    while (hasMore) {
      callCount++;
      console.log(`\n📡 Lần gọi API thứ ${callCount}, vị trí: ${searchResultPosition}`);
      console.log(`📋 Search params:`, JSON.stringify({
        ...searchParamsWithLimit,
        searchResultPosition
      }, null, 2));

      const result = await this.getAccessControlEvents({
        ...searchParamsWithLimit,
        searchResultPosition
      });

      if (!result.success) {
        console.error(`❌ Lỗi ở lần gọi thứ ${callCount}:`, result.error);
        return {
          success: false,
          error: result.error || 'Failed to fetch access control events',
          status: result.status,
          data: {
            events: allEvents,
            total: allEvents.length
          }
        };
      }

      const acsEvent = result.data?.AcsEvent;
      if (!acsEvent) {
        console.log(`⚠️ Không có AcsEvent ở lần gọi thứ ${callCount}`);
        console.log(`📥 Response data:`, JSON.stringify(result.data, null, 2));
        break;
      }

      // InfoList might be undefined or empty array (for "NO MATCH" responses)
      const events = acsEvent.InfoList || [];
      
      // Save totalMatches from response (should be the same in all responses)
      if (acsEvent.totalMatches !== undefined && acsEvent.totalMatches !== null) {
        totalMatches = acsEvent.totalMatches;
      }
      
      console.log(`📊 Response info:`, {
        responseStatusStrg: acsEvent.responseStatusStrg,
        numOfMatches: acsEvent.numOfMatches,
        totalMatches: acsEvent.totalMatches,
        eventsCount: events.length
      });
      
      if (events.length === 0) {
        console.log(`⚠️ Không có dữ liệu ở lần gọi thứ ${callCount} (responseStatusStrg: ${acsEvent.responseStatusStrg || 'UNKNOWN'})`);
        break;
      }

      allEvents.push(...events);

      console.log(`  ✅ Lấy được ${events.length} bản ghi`);
      console.log(`  📊 Tổng hiện tại: ${allEvents.length}/${acsEvent.totalMatches || 'unknown'}`);
      console.log(`  📋 responseStatusStrg: ${acsEvent.responseStatusStrg || 'UNKNOWN'}`);

      // Check if there are more results (like Python code)
      // responseStatusStrg can be: "MORE", "OK", "NO MATCH"
      hasMore = acsEvent.responseStatusStrg === 'MORE';
      
      // Update position using numOfMatches (like Python code: position += data['AcsEvent']['numOfMatches'])
      if (hasMore && acsEvent.numOfMatches) {
        const oldPosition = searchResultPosition;
        searchResultPosition += acsEvent.numOfMatches;
        console.log(`  ➡️ Cập nhật position: ${oldPosition} -> ${searchResultPosition} (numOfMatches: ${acsEvent.numOfMatches})`);
        
        // Kiểm tra xem đã lấy đủ chưa
        if (totalMatches !== null && allEvents.length >= totalMatches) {
          console.log(`  ✅ Đã lấy đủ ${totalMatches} events, dừng pagination`);
          hasMore = false;
        }
      } else {
        hasMore = false;
        console.log(`  ✅ Đã lấy hết dữ liệu (responseStatusStrg: ${acsEvent.responseStatusStrg || 'UNKNOWN'})`);
      }
    }

    console.log(`\n🎉 HOÀN TẤT! Đã lấy ${allEvents.length} sự kiện trong ${callCount} lần gọi API`);
    if (totalMatches !== null) {
      console.log(`📊 Tổng số sự kiện có sẵn: ${totalMatches}`);
    }

    return {
      success: true,
      data: {
        events: allEvents,
        total: allEvents.length,
        totalMatches: totalMatches !== null ? totalMatches : allEvents.length // Total available from Hikvision
      }
    };
  }
}

// Export a default instance for backward compatibility, and expose the class for per-device instances
const defaultHikvisionService = new HikvisionService();
defaultHikvisionService.HikvisionService = HikvisionService;
module.exports = defaultHikvisionService;

