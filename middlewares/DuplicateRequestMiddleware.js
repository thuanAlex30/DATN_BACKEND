/**
 * Middleware to prevent duplicate requests within a short time window
 * This helps prevent rate limiting issues (429 errors) from duplicate API calls
 */

const requestCache = new Map();
const responseCache = new Map(); // Cache responses for duplicate requests
const DUPLICATE_WINDOW_MS = 1000; // 1 second window (reduced from 2s)
const CACHE_TTL_MS = 5000; // Cache responses for 5 seconds

/**
 * Generate a unique key for a request
 */
function generateRequestKey(req) {
  const method = req.method;
  const path = req.path || req.url.split('?')[0];
  const query = JSON.stringify(req.query || {});
  // Don't include IP for stats endpoints - allow same request from different components
  const includeIp = !path.includes('/stats/');
  const ip = includeIp ? (req.ip || req.connection.remoteAddress || 'unknown') : 'shared';
  
  return `${method}:${path}:${query}:${ip}`;
}

/**
 * Middleware to detect and handle duplicate requests (cache response instead of blocking)
 */
function preventDuplicateRequests(req, res, next) {
  // Skip for non-GET requests (POST, PUT, DELETE should be allowed)
  if (req.method !== 'GET') {
    return next();
  }

  const requestKey = generateRequestKey(req);
  const now = Date.now();
  
  // Check if we have a cached response
  const cachedResponse = responseCache.get(requestKey);
  if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_TTL_MS) {
    // Return cached response immediately
    console.log(`✅ Returning cached response for: ${req.method} ${req.path}`);
    return res.status(cachedResponse.status || 200).json(cachedResponse.data);
  }
  
  // Check if this exact request is currently being processed
  const cachedRequest = requestCache.get(requestKey);
  
  if (cachedRequest && (now - cachedRequest.timestamp) < DUPLICATE_WINDOW_MS) {
    // Duplicate request detected - but don't block, just log
    // The response will be cached when the first request completes
    console.log(`ℹ️ Duplicate request detected (within ${DUPLICATE_WINDOW_MS}ms): ${req.method} ${req.path}`, {
      timeSinceLastRequest: now - cachedRequest.timestamp,
    });
    // Allow the request to proceed - response will be cached
  }
  
  // Store this request timestamp
  requestCache.set(requestKey, {
    timestamp: now,
    requestId: `${now}-${Math.random().toString(36).substr(2, 9)}`
  });
  
  // Intercept response to cache it
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Cache successful responses for stats endpoints
    if (req.path.includes('/stats/') && res.statusCode >= 200 && res.statusCode < 300) {
      responseCache.set(requestKey, {
        timestamp: now,
        status: res.statusCode,
        data: data
      });
      // Clean up old cache entries
      if (responseCache.size > 500) {
        const cutoff = now - CACHE_TTL_MS * 2;
        for (const [key, value] of responseCache.entries()) {
          if (value.timestamp < cutoff) {
            responseCache.delete(key);
          }
        }
      }
    }
    return originalJson(data);
  };
  
  // Clean up old request entries periodically
  if (requestCache.size > 1000) {
    const cutoff = now - DUPLICATE_WINDOW_MS * 2;
    for (const [key, value] of requestCache.entries()) {
      if (value.timestamp < cutoff) {
        requestCache.delete(key);
      }
    }
  }
  
  next();
}

module.exports = {
  preventDuplicateRequests
};

