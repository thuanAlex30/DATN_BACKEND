// Simple in-memory TTL cache for quick read-heavy endpoint caching.
// Not distributed — suitable for single-node development. Use Redis for multi-node.
const cacheStore = new Map();

function get(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSeconds = 30) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  cacheStore.set(key, { value, expiresAt });
  if (ttlSeconds) {
    // Schedule cleanup
    setTimeout(() => {
      const e = cacheStore.get(key);
      if (e && e.expiresAt && Date.now() > e.expiresAt) {
        cacheStore.delete(key);
      }
    }, ttlSeconds * 1000 + 250);
  }
}

function del(keyOrPrefix) {
  // If exact key exists, delete it. Otherwise delete keys that start with prefix.
  if (cacheStore.has(keyOrPrefix)) {
    cacheStore.delete(keyOrPrefix);
    return;
  }
  for (const key of Array.from(cacheStore.keys())) {
    if (key.startsWith(keyOrPrefix)) {
      cacheStore.delete(key);
    }
  }
}

async function wrap(key, fn, ttlSeconds = 30) {
  const cached = get(key);
  if (cached !== null && cached !== undefined) return cached;
  const value = await fn();
  set(key, value, ttlSeconds);
  return value;
}

module.exports = {
  get,
  set,
  del,
  wrap
};


