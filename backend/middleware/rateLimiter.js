import redisClient from "../config/redis.js";

// In-memory fallback when Redis is unavailable. Keeps simple counters per key.
const memoryStore = new Map();

/**
 * Create a rate limiter middleware.
 * Uses Redis INCR+EXPIRE for atomic distributed counters. Falls back to an
 * in-memory Map if Redis is not configured or a Redis command fails.
 *
 * Options:
 * - windowMs: time window in milliseconds
 * - max: maximum number of requests allowed in the window
 * - prefix: key prefix in Redis (helps separate limits)
 * - keyGenerator: function(req) => string (optional) to build a more specific key
 */
export function createRateLimiter({
  windowMs,
  max,
  prefix = "rl",
  keyGenerator,
} = {}) {
  const windowSecs = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    // Derive a key for rate-limiting. Default to client IP.
    const id = keyGenerator
      ? keyGenerator(req)
      : req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "anonymous";
    const key = `${prefix}:${id}`;

    try {
      if (!redisClient) throw new Error("Redis client not configured");

      // Atomically increment the counter stored at `key`.
      const count = await redisClient.incr(key);

      // If this is the first increment, set the expiry to enforce the window.
      if (Number(count) === 1) {
        await redisClient.expire(key, windowSecs);
      }

      // If the limit is exceeded, respond with 429.
      if (Number(count) > max) {
        // Try to fetch remaining TTL to include Retry-After header.
        let ttl = -1;
        try {
          ttl = await redisClient.ttl(key);
        } catch (err) {
          // ignore ttl errors
        }
        if (ttl > 0) {
          res.setHeader("Retry-After", String(ttl));
        }
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }

      // All good
      return next();
    } catch (err) {
      // Redis failure: fall back to simple in-memory limiter.
      // This is best-effort and not suitable for multi-instance deployments,
      // but ensures availability when Redis is unreachable.
      const now = Date.now();
      const record = memoryStore.get(key);

      if (!record || record.expiresAt <= now) {
        memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
        return next();
      }

      record.count += 1;
      if (record.count > max) {
        const retryAfterSecs = Math.ceil((record.expiresAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSecs));
        console.warn(`Rate limiter fallback triggered for key=${key}`);
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }

      memoryStore.set(key, record);
      return next();
    }
  };
}

// Pre-configured limiters used across the application. Exported for convenience.
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: "login",
});
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  prefix: "register",
});
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  prefix: "forgot_pwd",
});
export const eventCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  prefix: "event_create",
});
export const eventRegistrationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  prefix: "event_register",
});

export default createRateLimiter;
