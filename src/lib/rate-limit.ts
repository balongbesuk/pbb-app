/**
 * rate-limit.ts — In-memory rate limiter untuk API routes.
 *
 * Tidak butuh Redis/Upstash. Aman untuk deployment single-instance (dev & small prod).
 * Untuk multi-instance production, ganti dengan @upstash/ratelimit.
 *
 * Algoritma: Token Bucket per IP address.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

interface RateLimitOptions {
  /** Jumlah request yang diijinkan per window */
  limit: number;
  /** Durasi window dalam milidetik */
  windowMs: number;
}

/**
 * Cek apakah IP ini masih dalam batas rate limit.
 * @returns `{ allowed: true }` jika boleh lanjut, `{ allowed: false, retryAfter }` jika terlalu banyak.
 */
export function checkRateLimit(
  ip: string,
  options: RateLimitOptions
): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now();
  const { limit, windowMs } = options;

  // Cleanup: hapus bucket lama yang expired (simple GC)
  if (buckets.size > 10000) {
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > windowMs * 5) {
        buckets.delete(key);
      }
    }
  }

  let bucket = buckets.get(ip);

  if (!bucket || now - bucket.lastRefill >= windowMs) {
    // Refill bucket
    bucket = { tokens: limit, lastRefill: now };
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((bucket.lastRefill + windowMs - now) / 1000);
    buckets.set(ip, bucket);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return { allowed: true, remaining: bucket.tokens };
}
