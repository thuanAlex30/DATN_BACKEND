/**
 * Middleware to prevent duplicate requests within a short time window
 * This helps prevent rate limiting issues (429 errors) from duplicate API calls
 */

const requestCache = new Map();
const DUPLICATE_WINDOW_MS = 2000; // 2 seconds window

/**
 * Generate a unique key for a request
 */
function generateRequestKey(req) {
  const method = req.method;
  const path = req.path || req.url.split('?')[0];
  const query = JSON.stringify(req.query || {});
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  return `${method}:${path}:${query}:${ip}`;
}

/**
 * Middleware to detect and block duplicate requests
 */
function preventDuplicateRequests(req, res, next) {
  // Skip for non-GET requests (POST, PUT, DELETE should be allowed)
  if (req.method !== 'GET') {
    return next();
  }

  const requestKey = generateRequestKey(req);
  const now = Date.now();
  
  // Check if this exact request was made recently
  const cachedRequest = requestCache.get(requestKey);
  
  if (cachedRequest && (now - cachedRequest.timestamp) < DUPLICATE_WINDOW_MS) {
    // Duplicate request detected - return cached response or skip
    console.warn(`⚠️ Duplicate request detected and blocked: ${req.method} ${req.path}`, {
      requestKey,
      timeSinceLastRequest: now - cachedRequest.timestamp,
      ip: req.ip
    });
    
    // Return 429 Too Many Requests
    return res.status(429).json({
      success: false,
      message: 'Duplicate request detected. Please wait a moment before retrying.',
      retryAfter: Math.ceil((DUPLICATE_WINDOW_MS - (now - cachedRequest.timestamp)) / 1000)
    });
  }
  
  // Store this request
  requestCache.set(requestKey, {
    timestamp: now,
    requestId: `${now}-${Math.random().toString(36).substr(2, 9)}`
  });
  
  // Clean up old entries periodically (every 10 seconds)
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

