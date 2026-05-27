import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import { getArchivePath } from "@/lib/storage";
import type { AppUser } from "@/types/app";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; file: string }> }
) {
  try {
    const { year, file } = await params;
    
    // --- SECURITY: Path Traversal Sanitization ---
    // Pastikan year dan file tidak mengandung '..' atau karakter berbahaya
    const safeYear = year.replace(/[^0-9]/g, "");
    const safeFile = path.basename(file); // Mengambil nama file murni, membuang path apa pun sebelumnya

    if (!safeYear || !safeFile || safeFile !== file) {
       return new NextResponse(
        createErrorPage("Akses Ditolak", "Request tidak valid atau mengandung karakter berbahaya."), 
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }
    
    // 1. Dapatkan file path yang asli (di folder privat /storage)
    const storagePath = getArchivePath(safeYear, safeFile);

    if (!fs.existsSync(storagePath)) {
      return new NextResponse(
        createErrorPage("File Tidak Ada", "Maaf, file arsip digital yang Anda cari tidak ditemukan di server pusat kami."), 
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    // --- DOWNLOAD PARAMETER ---
    const searchParams = req.nextUrl.searchParams;
    const isDownload = searchParams.get("dl") === "1" || searchParams.get("download") === "1";
    const disposition = isDownload ? "attachment" : "inline";

    // 2. Cek apakah yang akses adalah user terautentikasi (ADMIN/PENARIK/PENGGUNA)
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as AppUser | undefined;

    if (currentUser) {
      // User yang login bebas buka semua file
      const fileBuffer = fs.readFileSync(storagePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="${file}"`,
        },
      });
    }

    // 3. BUKAN ADMIN → Tolak akses langsung.
    // Pengguna publik WAJIB menggunakan route /arsip-pbb/download?token=xxx
    // yang token-nya di-generate oleh server (one-time, expired 5 menit).
    return new NextResponse(
      createErrorPage(
        "Akses Ditolak",
        "Dokumen arsip digital hanya dapat diakses melalui portal resmi PBB Digital. Silakan gunakan fitur pencarian di halaman utama, masukkan PIN Anda, lalu buka dokumen dari sana.",
        "rose"
      ),
      { headers: { "Content-Type": "text/html" }, status: 403 }
    );

  } catch (error) {
    console.error("[arsip-pbb-api-error]", error);
    return new NextResponse("Kesalahan Server", { status: 500 });
  }
}
