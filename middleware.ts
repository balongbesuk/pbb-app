import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * middleware.ts — Proteksi route global untuk PBB Manager.
 *
 * Layer keamanan pertama yang berjalan di EDGE sebelum request
 * sampai ke server component / API route. Ini mencegah akses
 * tidak sah bahkan sebelum kode halaman dieksekusi.
 *
 * Alur:
 * 1. Cek apakah route publik → izinkan langsung
 * 2. Cek apakah user sudah login (JWT token valid)
 * 3. Cek apakah route memerlukan role ADMIN
 * 4. Redirect ke /login jika tidak memenuhi syarat
 */

// ──────────────────────────────────────────────────────────────
// Route Definitions
// ──────────────────────────────────────────────────────────────

/** Route yang bisa diakses tanpa login */
const PUBLIC_ROUTES = [
  "/",
  "/login",
];

/** Prefix API yang bisa diakses tanpa login */
const PUBLIC_API_PREFIXES = [
  "/api/auth",           // NextAuth handler (login/logout/session)
  "/api/village-config", // Info publik desa (nama, logo)
  "/api/download-template", // Template Excel format
];

/** Route dashboard yang hanya boleh diakses oleh ADMIN */
const ADMIN_ONLY_ROUTES = [
  "/upload-pbb",
  "/pengguna",
  "/settings",
  "/log-aktivitas",
];

/** API routes yang hanya boleh diakses oleh ADMIN */
const ADMIN_ONLY_API_PREFIXES = [
  "/api/backup",
  "/api/restore",
  "/api/upload-avatar",
  "/api/upload-logo",
  "/api/export-tax",
  "/api/export-laporan-excel",
  "/api/backup-assignments",
];

// ──────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────

function isPublicRoute(pathname: string): boolean {
  // Exact match for public pages
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // Prefix match for public APIs
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  return false;
}

function isAdminOnlyRoute(pathname: string): boolean {
  // Check dashboard routes (admin only)
  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) return true;

  // Check API routes (admin only)
  if (ADMIN_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  return false;
}

// ──────────────────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. KHUSUS LOGIN: Jika sudah login, lempar ke dashboard
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 1. SKIP: Static files & Next.js internals
  //    (handled by matcher, but this is a safety net)
  if (pathname.includes(".")) return NextResponse.next();

  // 2. ALLOW: Public routes — tidak perlu autentikasi
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. CHECK: Apakah user sudah login?
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Belum login → redirect ke halaman login
    // Untuk API routes, return 401 JSON response
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // Untuk halaman, redirect ke /login dengan callback URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. CHECK: Apakah user wajib ganti password?
  //    Jika ya, paksa redirect ke /ganti-password
  //    KECUALI mereka sudah di halaman ganti password atau sedang logout
  const mustChangePassword = token.mustChangePassword as boolean;
  if (mustChangePassword) {
    const allowedWhileForced = [
      "/ganti-password",
      "/api/auth",
    ];
    const isAllowed = allowedWhileForced.some((route) => pathname.startsWith(route));

    if (!isAllowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Anda harus mengganti password terlebih dahulu." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/ganti-password", request.url));
    }
  }

  // 5. CHECK: Apakah route ini hanya untuk ADMIN?
  if (isAdminOnlyRoute(pathname)) {
    const userRole = token.role as string;

    if (userRole !== "ADMIN") {
      // Bukan admin → redirect ke dashboard dengan pesan
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Anda tidak memiliki akses ke resource ini." },
          { status: 403 }
        );
      }

      // Redirect non-admin ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 6. ALLOW: User sudah login dan punya akses
  return NextResponse.next();
}

// ──────────────────────────────────────────────────────────────
// Matcher Configuration
// ──────────────────────────────────────────────────────────────
// Hanya jalankan middleware pada route yang relevan.
// Skip: static files, images, fonts, favicon, dll.
export const config = {
  matcher: [
    /*
     * Match semua route KECUALI:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - File uploads di /uploads/
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|uploads/).*)",
  ],
};
