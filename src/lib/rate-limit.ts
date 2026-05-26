import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getStorageRoot } from "@/lib/storage";
import Redis from "ioredis";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const memoryBuckets = new Map<string, TokenBucket>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
}

let rateLimitDb: Database.Database | null = null;
let redisClient: Redis | null = null;
let redisFailed = false;

function getRedisClient(): Redis | null {
  if (redisFailed) return null;
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    console.log("[rate-limit] Menginisialisasi klien Redis...");
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Fail fast to not block actions
      connectTimeout: 2000,   // Connection timeout 2s
      reconnectOnError: () => false,
    });

    redisClient.on("error", (err) => {
      console.error("[rate-limit] Redis error, fallback SQLite/Memory diaktifkan:", err);
      redisFailed = true;
      redisClient = null;
    });

    return redisClient;
  } catch (err) {
    console.error("[rate-limit] Gagal membuat klien Redis:", err);
    redisFailed = true;
    return null;
  }
}

function getRateLimitDb() {
  if (rateLimitDb) {
    return rateLimitDb;
  }

  const storageRoot = getStorageRoot();
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }

  const dbPath = path.join(storageRoot, "rate-limit.db");
  rateLimitDb = new Database(dbPath);
  rateLimitDb.pragma("journal_mode = WAL");
  rateLimitDb.pragma("synchronous = NORMAL");
  rateLimitDb.exec(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      key TEXT PRIMARY KEY,
      tokens INTEGER NOT NULL,
      last_refill INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limit_last_refill
      ON rate_limit_buckets (last_refill);
  `);

  return rateLimitDb;
}

function cleanupMemoryBuckets(now: number, windowMs: number) {
  if (memoryBuckets.size <= 10000) {
    return;
  }

  for (const [key, bucket] of memoryBuckets.entries()) {
    if (now - bucket.lastRefill > windowMs * 5) {
      memoryBuckets.delete(key);
    }
  }
}

function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  cleanupMemoryBuckets(now, windowMs);

  let bucket = memoryBuckets.get(key);
  if (!bucket || now - bucket.lastRefill >= windowMs) {
    bucket = { tokens: limit, lastRefill: now };
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((bucket.lastRefill + windowMs - now) / 1000);
    memoryBuckets.set(key, bucket);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  bucket.tokens -= 1;
  memoryBuckets.set(key, bucket);
  return { allowed: true, remaining: bucket.tokens };
}

function cleanupSqliteBuckets(db: Database.Database, now: number, windowMs: number) {
  db.prepare("DELETE FROM rate_limit_buckets WHERE last_refill < ?").run(now - windowMs * 5);
}

function checkSqliteRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const db = getRateLimitDb();
  const now = Date.now();
  const { limit, windowMs } = options;

  cleanupSqliteBuckets(db, now, windowMs);

  const selectStmt = db.prepare(
    "SELECT tokens, last_refill FROM rate_limit_buckets WHERE key = ?"
  );
  const upsertStmt = db.prepare(
    `
      INSERT INTO rate_limit_buckets (key, tokens, last_refill)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        tokens = excluded.tokens,
        last_refill = excluded.last_refill
    `
  );

  const selectedBucket = selectStmt.get(key) as { tokens: number; last_refill: number } | undefined;
  let bucket = selectedBucket;
  if (!bucket || now - bucket.last_refill >= windowMs) {
    bucket = { tokens: limit, last_refill: now };
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((bucket.last_refill + windowMs - now) / 1000);
    upsertStmt.run(key, bucket.tokens, bucket.last_refill);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  const nextTokens = bucket.tokens - 1;
  upsertStmt.run(key, nextTokens, bucket.last_refill);
  return { allowed: true, remaining: nextTokens };
}

async function checkRedisRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult | null> {
  const client = getRedisClient();
  if (!client) return null;

  const now = Date.now();
  const { limit, windowMs } = options;
  const redisKey = `rate_limit_bucket:${key}`;

  try {
    const bucket = await client.hgetall(redisKey);
    let tokens = limit;
    let lastRefill = now;

    if (bucket && bucket.tokens !== undefined && bucket.lastRefill !== undefined) {
      tokens = parseInt(bucket.tokens, 10);
      lastRefill = parseInt(bucket.lastRefill, 10);
    }

    if (now - lastRefill >= windowMs) {
      tokens = limit;
      lastRefill = now;
    }

    if (tokens <= 0) {
      const retryAfter = Math.ceil((lastRefill + windowMs - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    const nextTokens = tokens - 1;

    const pipeline = client.pipeline();
    pipeline.hset(redisKey, {
      tokens: String(nextTokens),
      lastRefill: String(lastRefill),
    });
    pipeline.pexpire(redisKey, windowMs * 2);
    await pipeline.exec();

    return { allowed: true, remaining: nextTokens };
  } catch (err) {
    console.error("[rate-limit] Gagal melakukan pengecekan Redis rate-limit, memicu fallback:", err);
    redisFailed = true;
    redisClient = null;
    return null;
  }
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  // 1. Redis dinonaktifkan untuk edisi STB HG680p (Hemat RAM)
  
  // 2. Fallback SQLite
  try {
    return checkSqliteRateLimit(key, options);
  } catch (error) {
    console.error("[rate-limit] SQLite rate-limit gagal, fallback ke Memory:", error);
    // 3. Fallback Memory
    return checkMemoryRateLimit(key, options);
  }
}
