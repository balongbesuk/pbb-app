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
  const isAmber = color === "amber";
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-zinc-950 text-zinc-100 flex items-center justify-center min-h-screen p-6 font-sans">
      <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-center shadow-2xl">
        <div class="mb-6 flex justify-center">
            <div class="p-6 bg-${color}-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-${color}-500 ${isAmber ? "animate-pulse" : ""}">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                </svg>
            </div>
        </div>
        <h1 class="text-2xl font-black uppercase tracking-tighter mb-4 text-white">${title}</h1>
        <p class="text-zinc-400 leading-relaxed font-medium mb-8">
          ${message}
        </p>
        <div class="space-y-3">
            <a href="/" class="block w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all active:scale-[0.98]">
              Kembali ke Beranda
            </a>
            <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pt-2">Sistem Keamanan Pusat PBB Digital</p>
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
