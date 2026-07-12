import redisClient from "../config/redis.js";

const CACHE_TTL_SECONDS = 300;

const getCacheKey = (prefix, id) => (id ? `${prefix}:${id}` : prefix);
const isRedisAvailable = () => Boolean(redisClient);

// Reusable middleware for reading and writing cached JSON responses.
export const cacheResponse = async (
  req,
  res,
  next,
  key,
  ttl = CACHE_TTL_SECONDS
) => {
  if (!isRedisAvailable()) {
    return next();
  }

  try {
    const cachedValue = await redisClient.get(key);

    if (cachedValue !== null) {
      return res.status(200).json(cachedValue);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redisClient.set(key, body, { ex: ttl }).catch((error) => {
        console.error(`Redis cache set failed for ${key}:`, error.message);
      });
      return originalJson(body);
    };

    return next();
  } catch (error) {
    console.error(`Redis read failed for ${key}:`, error.message);
    return next();
  }
};

export const cacheEventsList = (req, res, next) => {
  const hasQueryParams = Object.keys(req.query || {}).length > 0;

  // Only cache the simple, unfiltered event list. Filtered, paged, or searched
  // requests should bypass the cache to avoid returning stale or incorrect results.
  if (hasQueryParams) {
    return next();
  }

  return cacheResponse(req, res, next, "events:all");
};

export const cacheEventDetails = (req, res, next) => {
  return cacheResponse(req, res, next, getCacheKey("event", req.params.id));
};

export const getCachedValue = async (key) => {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error(`Redis get failed for ${key}:`, error.message);
    return null;
  }
};

export const setCachedValue = async (key, value, ttl = CACHE_TTL_SECONDS) => {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redisClient.set(key, value, { ex: ttl });
  } catch (error) {
    console.error(`Redis set failed for ${key}:`, error.message);
  }
};

export const deleteCachedValue = async (key) => {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis delete failed for ${key}:`, error.message);
  }
};

export const deleteCachedValueByPattern = async (pattern) => {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error(`Redis pattern delete failed for ${pattern}:`, error.message);
  }
};

export { getCacheKey, CACHE_TTL_SECONDS };
