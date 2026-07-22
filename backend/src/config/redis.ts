import { Redis, type RedisOptions } from "ioredis";
import logger from "../utils/logger.js";

// TEACHING NOTE — named import instead of default import:
// ioredis is a CommonJS package with no `"exports"` map in its
// package.json. Under TypeScript's `moduleResolution: "NodeNext"`, that
// makes its DEFAULT export unreliable to construct with `new`. ioredis
// happens to also export its `Redis` class as a NAMED export — using that
// (`import { Redis } from "ioredis"`) sidesteps the interop ambiguity
// entirely. This is a known quirk of older CJS packages under ESM/NodeNext,
// not something specific to this project.
//
// TEACHING NOTE — module-level `let` for a singleton:
// TS types this as `Redis | null` automatically from the two possible
// assignments below (`null` initially, a real client after first call).
// That union type is exactly why `getRedisClient()` has to check
// `if (client) return client;` before use elsewhere — TS won't let you
// call `.get()` on something that might still be `null`.
let client: Redis | null = null;

/**
 * Returns a singleton ioredis client.
 * Lazy-initialised on first call — does NOT connect at import time.
 * This prevents app startup from failing if Redis is temporarily unavailable.
 */
export const getRedisClient = (): Redis => {
  if (client) return client;

  const commonOptions: RedisOptions = {
    // ioredis will auto-reconnect; cap at 30s intervals
    retryStrategy: (times) => Math.min(times * 500, 30_000),
    // Don't throw on connection failure — allow graceful degradation
    enableOfflineQueue: true,
    lazyConnect: true,
    // BullMQ (queue + worker, see jobs/) shares this same client and
    // requires maxRetriesPerRequest: null — it manages its own retry/
    // blocking semantics and throws on startup otherwise.
    maxRetriesPerRequest: null,
  };

  // REDIS_URL covers hosted providers like Upstash, which issue a single
  // "rediss://default:<password>@<host>:<port>" connection string (the
  // "rediss" scheme enables TLS). Falls back to discrete host/port/password
  // env vars for local Docker/native Redis, which don't use a URL.
  client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, commonOptions)
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || undefined,
        ...commonOptions,
      });

  client.on("connect", () => logger.info({ action: "redis_connect" }, "Redis connected"));
  client.on("ready", () => logger.info({ action: "redis_ready" }, "Redis ready"));
  client.on("reconnecting", (delay: number) =>
    logger.warn({ action: "redis_reconnecting", delay }, "Redis reconnecting"),
  );
  client.on("error", (err: Error) =>
    logger.error({ action: "redis_error", err: err.message }, "Redis error"),
  );
  client.on("close", () => logger.warn({ action: "redis_close" }, "Redis connection closed"));

  return client;
};

// ─── Reusable helpers ───────────────────────────────────────────────────────

/**
 * Get a parsed JSON value from Redis.
 * Returns null on cache miss OR if Redis is unavailable.
 *
 * TEACHING NOTE — "generic function" <T>:
 * `cacheGet<DashboardMetrics>(key)` lets the CALLER say what shape they
 * expect back, since Redis itself only stores strings — there's no way
 * for this function to know on its own. `T = unknown` is the default if
 * the caller doesn't specify one, which is the safe choice (forces the
 * caller to narrow the type before using the value).
 */
export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
  try {
    const raw = await getRedisClient().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ action: "cache_get_error", key, err: message }, "Cache GET failed");
    return null; // graceful degradation
  }
};

/**
 * Set a JSON-serialised value in Redis with a TTL in seconds.
 * Silently fails if Redis is unavailable (returns false).
 */
export const cacheSet = async (key: string, value: unknown, ttlSeconds = 600): Promise<boolean> => {
  try {
    await getRedisClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ action: "cache_set_error", key, err: message }, "Cache SET failed");
    return false;
  }
};

/**
 * Delete a key from Redis.
 * Used for cache invalidation after session state changes.
 */
export const cacheDel = async (key: string): Promise<boolean> => {
  try {
    await getRedisClient().del(key);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ action: "cache_del_error", key, err: message }, "Cache DEL failed");
    return false;
  }
};

/**
 * Build a namespaced cache key for a user's dashboard.
 */
export const dashboardCacheKey = (userId: string): string => `dashboard:${userId}`;
