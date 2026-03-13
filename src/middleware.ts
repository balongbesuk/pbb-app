import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * middleware.ts — Gabungan Proteksi Route & Rate Limiting (Next.js 16)
 */

// ──────────────────────────────────────────────────────────────
// Rate Limiting Logic (from former proxy.ts)
// ──────────────────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LIMIT = 10; 
const WINDOW_MS = 15 * 60 * 1000; 

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ──────────────────────────────────────────────────────────────
// Route Definitions & Helpers
// ──────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/login"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/village-config", "/api/download-template"];

const ADMIN_ONLY_ROUTES = ["/upload-pbb", "/pengguna", "/settings", "/log-aktivitas"];
const ADMIN_ONLY_API_PREFIXES = [
  "/api/backup", "/api/restore", "/api/upload-avatar", 
  "/api/upload-logo", "/api/export-tax", "/api/export-laporan-excel", "/api/backup-assignments"
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

function isAdminOnlyRoute(pathname: string): boolean {
  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) return true;
  if (ADMIN_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

// ──────────────────────────────────────────────────────────────
// Main Middleware
// ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // LOG VERIFIKASI (Hanya untuk debug di VPS)
  console.log(`>>> [SYSTEM LOG] Path: ${pathname} | AuthURL: ${process.env.NEXTAUTH_URL}`);

  // A. RATE LIMITING (Hanya untuk login)
  if (pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const ip = getClientIp(request);
    const now = Date.now();
    let record = loginAttempts.get(ip);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + WINDOW_MS };
    }

    record.count += 1;
    loginAttempts.set(ip, record);

    if (record.count > LOGIN_LIMIT) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return new NextResponse(
        JSON.stringify({ error: "Terlalu banyak percobaan login.", retryAfter }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // B. PROTEKSI LOGIN REDIRECT
  if (pathname === "/login") {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token) return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // C. SKIP STATIC
  if (pathname.includes(".")) return NextResponse.next();

  // D. DAPATKAN TOKEN
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // E. PROTEKSI: WAJIB GANTI PASSWORD (MANDATORY)
  if (token && token.mustChangePassword) {
    const isAllowed = ["/ganti-password", "/api/auth"].some(r => pathname.startsWith(r));
    if (!isAllowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Anda harus mengganti password." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/ganti-password", request.url));
    }
  }

  // F. PUBLIC ROUTES
  if (isPublicRoute(pathname)) return NextResponse.next();

  // G. AUTH REQUIREMENT
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // H. ADMIN ONLY
  if (isAdminOnlyRoute(pathname)) {
    if (token.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|uploads/).*)",
  ],
};
