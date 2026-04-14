import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // 2. Cek apakah yang akses adalah ADMIN
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as AppUser | undefined;
    const isAdmin = currentUser?.role === "ADMIN";

    if (isAdmin) {
      // Admin bebas buka semua file
      const fileBuffer = fs.readFileSync(storagePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="${file}"`,
        },
      });
    }

    // 3. Jika BUKAN ADMIN, cek database
    // Ambil NOP dari nama file (misal 3517...pdf -> 3517...)
    const cleanNop = file.replace(/\.pdf$/i, "").replace(/\D/g, "");
    
    // Format ulang ke standar NOP dengan titik (XX.XX.XXX.XXX.XXX-XXXX.X) untuk pencarian di DB
    let dottedNop = cleanNop;
    if (cleanNop.length === 18) {
      dottedNop = `${cleanNop.substring(0,2)}.${cleanNop.substring(2,4)}.${cleanNop.substring(4,7)}.${cleanNop.substring(7,10)}.${cleanNop.substring(10,13)}-${cleanNop.substring(13,17)}.${cleanNop.substring(17,18)}`;
    }

    const tahunPajak = parseInt(year);

    const [taxData, config] = await Promise.all([
       prisma.taxData.findFirst({
         where: { 
            OR: [
              { nop: cleanNop },
              { nop: dottedNop }
            ],
            tahun: tahunPajak 
         },
         select: { paymentStatus: true }
       }),
       prisma.villageConfig.findFirst({ where: { id: 1 } })
    ]);

    const isArchiveEnabled = config?.enableDigitalArchive ?? true;
    const onlyLunas = config?.archiveOnlyLunas ?? true;

    if (!isArchiveEnabled) {
      return new NextResponse(
        createErrorPage("Layanan Nonaktif", "Akses arsip digital sedang ditangguhkan oleh Admin Desa untuk sementara waktu."), 
        { headers: { "Content-Type": "text/html" }, status: 403 }
      );
    }

    if (!taxData) {
      return new NextResponse(
        createErrorPage("Akses Terbatas", "Hanya arsip yang terdaftar secara resmi di database dan berstatus LUNAS yang dapat diakses oleh publik."), 
        { headers: { "Content-Type": "text/html" }, status: 403 }
      );
    }

    // Perketat pengecekan pembayaran
    const statusPajak = String(taxData.paymentStatus || "").toUpperCase().trim();
    
    // Jika archiveOnlyLunas diaktifkan, maka WAJIB "LUNAS"
    // Pengecekan ini di-skip khusus untuk ADMIN
    if (onlyLunas && statusPajak !== "LUNAS") {
       return new NextResponse(
        createErrorPage("Belum Lunas", "E-SPPT Digital hanya tersedia bagi Wajib Pajak yang sudah melakukan pelunasan dan telah terverifikasi sinkron dengan Bapenda.", "amber"), 
        { headers: { "Content-Type": "text/html" }, status: 403 }
      );
    }

    // OK, Kirim Filenya!
    const fileBuffer = fs.readFileSync(storagePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${file}"`,
      },
    });

  } catch (error) {
    console.error("[arsip-pbb-api-error]", error);
    return new NextResponse("Kesalahan Server", { status: 500 });
  }
}
