import { NextRequest, NextResponse } from "next/server";
import { consumeArchiveToken } from "@/lib/archive-token";
import { getArchivePath } from "@/lib/storage";
import { getClientIp } from "@/lib/request-ip";
import fs from "fs";

/**
 * Route untuk mengunduh arsip PDF menggunakan one-time token.
 *
 * URL: /arsip-pbb/download?token=<uuid>&dl=1
 *
 * - Token bersifat reusable selama masa aktifnya (1 menit)
 * - Token terikat dengan IP Address peramban yang melakukan verifikasi PIN
 * - Tidak perlu tahu NOP atau nama file — semua tersembunyi di balik token
 * - Admin tidak memakai route ini (mereka pakai /arsip-pbb/[year]/[file] langsung)
 */

const createErrorPage = (title: string, message: string, color: string = "rose") => {
  const accent = color === "amber" ? "#f59e0b" : "#f43f5e";
  const accentBg = color === "amber" ? "rgba(245,158,11,0.12)" : "rgba(244,63,94,0.12)";
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif}
        .card{max-width:28rem;width:100%;background:#18181b;border:1px solid #27272a;border-radius:2.5rem;padding:2rem;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,.6)}
        .icon{margin:0 auto 1.5rem;width:6rem;height:6rem;border-radius:9999px;background:${accentBg};color:${accent};display:flex;align-items:center;justify-content:center}
        h1{font-size:1.5rem;font-weight:900;text-transform:uppercase;letter-spacing:-.03em;margin-bottom:1rem;color:#fff}
        p.msg{color:#a1a1aa;line-height:1.6;font-weight:500;margin-bottom:2rem}
        a.btn{display:block;width:100%;padding:.875rem;background:#27272a;color:#fff;text-decoration:none;border-radius:1rem;font-weight:700}
        a.btn:hover{background:#3f3f46}
        p.foot{font-size:10px;color:#71717a;text-transform:uppercase;font-weight:700;letter-spacing:.1em;padding-top:.75rem}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        </div>
        <h1>${title}</h1>
        <p class="msg">${message}</p>
        <div>
          <a href="/" class="btn">Kembali ke Beranda</a>
          <p class="foot">Sistem Keamanan Pusat PBB Digital</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse(
        createErrorPage(
          "Token Tidak Valid",
          "Akses ditolak. Anda memerlukan tautan resmi dari portal PBB Digital untuk melihat dokumen ini. Tautan langsung tidak diizinkan."
        ),
        { headers: { "Content-Type": "text/html" }, status: 403 }
      );
    }

    // Konsumsi token (terikat IP)
    const clientIp = getClientIp(req);
    const result = consumeArchiveToken(token, clientIp);

    if (!result.success) {
      if (result.error === "IP_MISMATCH") {
        return new NextResponse(
          createErrorPage(
            "Perangkat Berbeda Ditolak",
            "Sistem Keamanan mendeteksi bahwa tautan ini diakses dari perangkat atau jaringan internet (IP) yang berbeda dari yang melakukan verifikasi PIN awal. Akses langsung di luar sesi yang sah diblokir secara otomatis.",
            "rose"
          ),
          { headers: { "Content-Type": "text/html" }, status: 403 }
        );
      }

      return new NextResponse(
        createErrorPage(
          "Tautan Kedaluwarsa",
          "Tautan ini sudah tidak berlaku. Tautan arsip digital hanya berlaku selama 5 menit dan hanya bisa digunakan di perangkat yang sama. Silakan kembali ke portal dan buka ulang dokumen Anda.",
          "amber"
        ),
        { headers: { "Content-Type": "text/html" }, status: 403 }
      );
    }

    const tokenData = result.data;

    // Dapatkan path file yang aman
    const storagePath = getArchivePath(tokenData.year, tokenData.file);

    if (!fs.existsSync(storagePath)) {
      return new NextResponse(
        createErrorPage(
          "File Tidak Ditemukan",
          "File arsip digital yang diminta tidak ditemukan di server."
        ),
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    // Cek parameter download
    const isDownload =
      req.nextUrl.searchParams.get("dl") === "1" ||
      req.nextUrl.searchParams.get("download") === "1";
    const disposition = isDownload ? "attachment" : "inline";

    const fileBuffer = fs.readFileSync(storagePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${tokenData.file}"`,
        // Cegah browser meng-cache file
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[arsip-download-token-error]", error);
    return new NextResponse("Kesalahan Server", { status: 500 });
  }
}
