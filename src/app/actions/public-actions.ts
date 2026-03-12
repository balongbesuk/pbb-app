"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Konfigurasi Rate Limit untuk pencarian publik.
 * - 15 request per 60 detik per IP
 * - Cukup longgar untuk pemakaian normal (warga cek tagihan)
 * - Cukup ketat untuk mencegah data scraping massal
 */
const PUBLIC_SEARCH_RATE_LIMIT = {
  limit: 15,
  windowMs: 60 * 1000, // 1 menit
};

/**
 * Ambil IP address dari request headers.
 * Mendukung x-forwarded-for (reverse proxy/Nginx) dan x-real-ip.
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for bisa berisi banyak IP (client, proxy1, proxy2...)
    // IP klien asli selalu yang pertama
    return forwarded.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || "unknown";
}

export async function searchPublicTaxData(query: string, tahunPajak: number) {
  try {
    // ─── Rate Limiting ──────────────────────────────────────────────
    const ip = await getClientIp();
    const rateLimitResult = checkRateLimit(ip, PUBLIC_SEARCH_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Terlalu banyak pencarian. Silakan coba lagi dalam ${rateLimitResult.retryAfter} detik.`,
        rateLimited: true,
      };
    }

    // ─── Validasi Input ─────────────────────────────────────────────
    if (!query || query.trim().length < 3) {
      return { success: false, message: "Ketik minimal 3 karakter untuk mencari." };
    }

    const searchQuery = query.trim();
    
    // Cari berdasarkan NOP (exact/partial) atau Nama WP (partial)
    const results = await prisma.taxData.findMany({
      where: {
        tahun: tahunPajak,
        OR: [
          { nop: { contains: searchQuery } },
          { namaWp: { contains: searchQuery } }
        ]
      },
      include: {
        penarik: {
          select: {
            name: true,
            phoneNumber: true,
            dusun: true,
            rt: true,
            rw: true,
          }
        }
      },
      take: 10, // batasi max 10 hasil agar tidak berat/spam
    });

    if (results.length === 0) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    // Map data to hide sensitive info if any, and structure for public view
    const mapped = results.map(r => ({
      id: r.id,
      nop: r.nop,
      namaWp: r.namaWp,
      alamat: r.alamatObjek,
      tagihan: r.sisaTagihan,
      status: r.paymentStatus,
      petugas: r.penarik ? {
        nama: r.penarik.name,
        kontak: r.penarik.phoneNumber || "Tidak ada nomor",
        wilayah: `${r.penarik.dusun || ""} RT ${r.penarik.rt || "-"} RW ${r.penarik.rw || "-"}`,
      } : null
    }));

    return { success: true, data: mapped, remaining: rateLimitResult.remaining };
  } catch (error) {
    console.error("Public Search Error:", error);
    return { success: false, message: "Terjadi kesalahan pada sistem pencarian." };
  }
}
