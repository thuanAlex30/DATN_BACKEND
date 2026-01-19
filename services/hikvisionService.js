const axios = require('axios');
const crypto = require('crypto');

class HikvisionService {
  constructor(config = {}) {
    this.baseURL = config.HIKVISION_BASE_URL || 'https://aws.huynhthuan30.id.vn';
    this.username = config.username || process.env.HIKVISION_USERNAME || 'admin';
    this.password = config.password || process.env.HIKVISION_PASSWORD || '12345678A';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Format timestamp for Hikvision API
   * CRITICAL FIX: Add timezone offset to match device timezone
   */
  formatHikvisionTimestamp(date, useDeviceTimezone = true) {
    let dateObj = typeof date === 'string' ? new Date(date) : date;

    // FIX: If useDeviceTimezone, convert to device timezone (Vietnam = UTC+7)
    if (useDeviceTimezone) {
      // Get Vietnam time (UTC+7)
      const vietnamOffset = 7 * 60; // minutes
      const localOffset = dateObj.getTimezoneOffset(); // minutes (negative for UTC+)
      const diff = vietnamOffset + localOffset;
      dateObj = new Date(dateObj.getTime() + diff * 60000);
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    // Return format without timezone: "2026-01-18T00:00:00"
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  generateDigestAuth(method, uri, realm, nonce, qop = null, cnonce = null, nc = null) {
    const ha1 = crypto.createHash('md5')
      .update(`${this.username}:${realm}:${this.password}`)
      .digest('hex');

    const ha2 = crypto.createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');

    let response;
    if (qop) {
      const ncPadded = String(nc).padStart(8, '0');
      response = crypto.createHash('md5')
        .update(`${ha1}:${nonce}:${ncPadded}:${cnonce}:${qop}:${ha2}`)
        .digest('hex');
      return `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop="${qop}", nc=${ncPadded}, cnonce="${cnonce}", response="${response}"`;
    } else {
      response = crypto.createHash('md5')
        .update(`${ha1}:${nonce}:${ha2}`)
        .digest('hex');
      return `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
    }
  }

  parseAuthHeader(authHeader) {
    const params = {};
    const regex = /(\w+)=["']?([^"',\s]+)["']?/g;
    let match;
    while ((match = regex.exec(authHeader)) !== null) {
      params[match[1]] = match[2];
    }
    return params;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let cnonce = crypto.randomBytes(8).toString('hex');
    let nc = '00000001';

    console.log('🔐 Making request:', { method, url, data: JSON.stringify(data) });

    try {
      // First request to get auth challenge
      const firstResponse = await axios({
        method,
        url,
        data,
        headers: { 'Content-Type': 'application/json', ...headers },
        timeout: this.timeout,
        validateStatus: (status) => status === 401 || status === 200
      });

      if (firstResponse.status === 200) {
        return { success: true, data: firstResponse.data, status: 200 };
      }

      // Parse auth header
      const wwwAuth = firstResponse.headers['www-authenticate'] || 
                      firstResponse.headers['WWW-Authenticate'];
      
      if (!wwwAuth) {
        return {
          success: false,
          error: 'No WWW-Authenticate header',
          status: 401
        };
      }

      const authParams = this.parseAuthHeader(wwwAuth);
      const authHeader = this.generateDigestAuth(
        method,
        new URL(endpoint, 'http://dummy').pathname,
        authParams.realm || 'IP Camera',
        authParams.nonce || '',
        authParams.qop,
        cnonce,
        nc
      );

      // Second request with auth
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

      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          console.error('Failed to parse response');
        }
      }

      const hasAcsEvent = responseData?.AcsEvent;
      if (hasAcsEvent) {
        if (!responseData.AcsEvent.InfoList) {
          responseData.AcsEvent.InfoList = [];
        }
        return { success: true, data: responseData, status: 200 };
      }

      return {
        success: false,
        error: 'Invalid response format',
        status: response.status,
        data: responseData
      };

    } catch (error) {
      console.error('❌ Request error:', error.message);
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Get Access Control Events
   * CRITICAL FIX: Remove hardcoded minor=38, allow flexible event types
   */
  async getAccessControlEvents(searchParams = {}) {
    const {
      searchID = '1',
      searchResultPosition = 0,
      maxResults = 100,
      major = 5,
      minor, // FIX: Don't default to 38, let it be undefined for "all types"
      startTime,
      endTime
    } = searchParams;

    // Get Vietnam current time (UTC+7)
    const now = new Date();
    const vietnamNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    console.log('🕐 Current time:', {
      utc: now.toISOString(),
      vietnam: vietnamNow.toISOString(),
      local: now.toString()
    });

    // FIX: Set time range for today in Vietnam timezone
    const todayStart = new Date(vietnamNow);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(vietnamNow);
    todayEnd.setHours(23, 59, 59, 999);

    let formattedStartTime, formattedEndTime;

    if (startTime) {
      formattedStartTime = startTime.replace(/\.\d{3}/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    } else {
      formattedStartTime = this.formatHikvisionTimestamp(todayStart, false);
    }

    if (endTime) {
      formattedEndTime = endTime.replace(/\.\d{3}/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    } else {
      formattedEndTime = this.formatHikvisionTimestamp(todayEnd, false);
    }

    // Build request body
    const requestBody = {
      AcsEventCond: {
        searchID: String(searchID),
        searchResultPosition: Number(searchResultPosition),
        maxResults: Number(maxResults),
        major: Number(major),
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }
    };

    // FIX: Only add minor if explicitly provided
    if (minor !== undefined && minor !== null) {
      requestBody.AcsEventCond.minor = Number(minor);
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    return await this.makeRequest(
      'POST',
      '/ISAPI/AccessControl/AcsEvent?format=json',
      requestBody
    );
  }

  /**
   * Get all events with pagination
   */
  async getAllAccessControlEvents(searchParams = {}) {
    const allEvents = [];
    let searchResultPosition = searchParams.searchResultPosition || 0;
    let hasMore = true;
    let callCount = 0;

    while (hasMore) {
      callCount++;
      console.log(`\n📡 API call #${callCount}, position: ${searchResultPosition}`);

      const result = await this.getAccessControlEvents({
        ...searchParams,
        maxResults: 100,
        searchResultPosition
      });

      if (!result.success) {
        console.error(`❌ Error at call #${callCount}:`, result.error);
        break;
      }

      const acsEvent = result.data?.AcsEvent;
      if (!acsEvent) {
        console.log('⚠️ No AcsEvent in response');
        break;
      }

      const events = acsEvent.InfoList || [];
      console.log(`📊 Response:`, {
        status: acsEvent.responseStatusStrg,
        numOfMatches: acsEvent.numOfMatches,
        totalMatches: acsEvent.totalMatches,
        eventsCount: events.length
      });

      if (events.length === 0) {
        console.log('⚠️ No more events');
        break;
      }

      allEvents.push(...events);
      console.log(`  ✅ Got ${events.length} records`);
      console.log(`  📊 Total: ${allEvents.length}/${acsEvent.totalMatches || 'unknown'}`);

      hasMore = acsEvent.responseStatusStrg === 'MORE';
      
      if (hasMore && acsEvent.numOfMatches) {
        searchResultPosition += acsEvent.numOfMatches;
      } else {
        hasMore = false;
      }
    }

    console.log(`\n🎉 COMPLETED! Got ${allEvents.length} events in ${callCount} API calls`);

    return {
      success: true,
      data: {
        events: allEvents,
        total: allEvents.length
      }
    };
  }
}

const defaultHikvisionService = new HikvisionService();
defaultHikvisionService.HikvisionService = HikvisionService;
module.exports = defaultHikvisionService;