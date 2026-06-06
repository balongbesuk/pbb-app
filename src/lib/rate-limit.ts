import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getStorageRoot } from "@/lib/storage";

// ─── NOTE ──────────────────────────────────────────────────────────────────────
// Redis rate limiter telah dihapus karena tidak digunakan (edisi STB HG680p).
// Jika di masa depan perlu Redis, tambahkan kembali `ioredis` ke dependencies
// dan implementasikan fungsi `checkRedisRateLimit()` di sini.
// ────────────────────────────────────────────────────────────────────────────────

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

let lastCleanupTime = 0;

function cleanupSqliteBuckets(db: Database.Database, now: number, windowMs: number) {
  db.prepare("DELETE FROM rate_limit_buckets WHERE last_refill < ?").run(now - windowMs * 5);
}

let cachedSelectStmt: Database.Statement<[string]> | null = null;
let cachedUpsertStmt: Database.Statement<[string, number, number]> | null = null;

function checkSqliteRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const db = getRateLimitDb();
  const now = Date.now();
  const { limit, windowMs } = options;

  if (now - lastCleanupTime > 5 * 60 * 1000) {
    cleanupSqliteBuckets(db, now, windowMs);
    lastCleanupTime = now;
  }

  if (!cachedSelectStmt) {
    cachedSelectStmt = db.prepare(
      "SELECT tokens, last_refill FROM rate_limit_buckets WHERE key = ?"
    );
  }
  if (!cachedUpsertStmt) {
    cachedUpsertStmt = db.prepare(
      `
      INSERT INTO rate_limit_buckets (key, tokens, last_refill)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        tokens = excluded.tokens,
        last_refill = excluded.last_refill
    `
    );
  }

  const selectedBucket = cachedSelectStmt.get(key) as { tokens: number; last_refill: number } | undefined;
  let bucket = selectedBucket;
  if (!bucket || now - bucket.last_refill >= windowMs) {
    bucket = { tokens: limit, last_refill: now };
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((bucket.last_refill + windowMs - now) / 1000);
    cachedUpsertStmt.run(key, bucket.tokens, bucket.last_refill);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  const nextTokens = bucket.tokens - 1;
  cachedUpsertStmt.run(key, nextTokens, bucket.last_refill);
  return { allowed: true, remaining: nextTokens };
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  // 1. SQLite (primary)
  try {
    return checkSqliteRateLimit(key, options);
  } catch (error) {
    console.error("[rate-limit] SQLite rate-limit gagal, fallback ke Memory:", error);
    // 2. Fallback Memory
    return checkMemoryRateLimit(key, options);
  }
}
