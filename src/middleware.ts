import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * middleware.ts — Rate limiting untuk endpoint auth (login).
 *
 * Aturan:
 *  - Max 10 percobaan login per 15 menit per IP
 *  - Request lain diteruskan tanpa batasan
 */

// In-memory store untuk rate limiting (token bucket per IP)
// CATATAN: Untuk production multi-instance gunakan Redis/Upstash.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const LOGIN_LIMIT = 10;      // max percobaan login
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

function getClientIp(req: NextRequest): string {
  // Header dari proxy/load balancer seperti Vercel, Cloudflare, Nginx
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya terapkan rate limit pada POST ke endpoint login
  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const ip = getClientIp(req);
    const now = Date.now();

    let record = loginAttempts.get(ip);

    // Reset jika window sudah lewat
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + WINDOW_MS };
    }

    record.count += 1;
    loginAttempts.set(ip, record);

    if (record.count > LOGIN_LIMIT) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return new NextResponse(
        JSON.stringify({
          error: "Terlalu banyak percobaan login. Coba lagi nanti.",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(LOGIN_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          },
        }
      );
    }

    // Tambahkan header info sisa percobaan
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(LOGIN_LIMIT));
    response.headers.set("X-RateLimit-Remaining", String(LOGIN_LIMIT - record.count));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
