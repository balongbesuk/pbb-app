"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import fs from "fs";
import { getArchivePath } from "@/lib/storage";
import { getNopVariations } from "@/lib/utils";

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

type PublicVillageConfig = {
  jatuhTempo: string | null;
  bapendaUrl: string | null;
  isJombangBapenda: boolean | null;
  enableBapendaSync: boolean | null;
  enableDigitalArchive: boolean | null;
  archiveOnlyLunas: boolean | null;
  alamatKantor: string | null;
  email: string | null;
  kodePos: string | null;
  namaKades: string | null;
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

export async function searchPublicTaxData(query: string, tahunPajak: number, page: number = 1, pageSize: number = 10) {
  try {
    // ─── Rate Limiting ──────────────────────────────────────────────
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isLighthouse = /Lighthouse|Google-Lighthouse/i.test(userAgent);

    const ip = await getClientIp();
    const rateLimitResult = !isLighthouse 
      ? checkRateLimit(ip, PUBLIC_SEARCH_RATE_LIMIT)
      : { allowed: true, remaining: 999 };

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
    const finalVariations = getNopVariations(searchQuery);

    const skip = (page - 1) * pageSize;

    // Cari berdasarkan NOP (exact/partial) atau Nama WP (partial)
    const results = await prisma.taxData.findMany({
      where: {
        tahun: tahunPajak,
        OR: [
          ...finalVariations.map(v => ({ nop: { contains: v } })),
          { namaWp: { contains: searchQuery } },
          { namaWp: { contains: searchQuery.toUpperCase() } }
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
      orderBy: { nop: "asc" },
      skip,
      take: pageSize + 1, // Ambil ekstra 1 untuk cek hasMore
    });

    const hasMore = results.length > pageSize;
    const finalResults = hasMore ? results.slice(0, pageSize) : results;

    if (finalResults.length === 0 && page === 1) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    const config = await prisma.villageConfig.findFirst({
      where: { id: 1 },
      select: {
        jatuhTempo: true,
        bapendaUrl: true,
        isJombangBapenda: true,
        enableBapendaSync: true,
        enableDigitalArchive: true,
        archiveOnlyLunas: true,
        alamatKantor: true,
        email: true,
        kodePos: true,
        namaKades: true,
      },
    }) as PublicVillageConfig | null;
    const jatuhTempoStr = config?.jatuhTempo || "31 Agustus";
    const bapendaUrl = config?.bapendaUrl || null;
    const isJombangBapenda = config?.isJombangBapenda ?? true;

    // Scan arsip folder (Year-aware)
    const archiveDir = getArchivePath(tahunPajak.toString());
    let archiveIndex = new Map<string, string>();
    if (fs.existsSync(archiveDir)) {
      archiveIndex = new Map(
        fs
          .readdirSync(archiveDir)
          .map((filename) => [filename.replace(/\D/g, ""), filename] as const)
          .filter(([digits]) => Boolean(digits))
      );
    }

      // Map data structure for public view
      const mapped = finalResults.map(r => {
        // Cari file arsip (NOP)
        const cleanNop = r.nop.replace(/\D/g, "");
        const matchedArchive =
          Array.from(archiveIndex.entries()).find(([digits]) => digits.startsWith(cleanNop))?.[1] ?? null;

        // Pengaturan hak akses arsip digital
        let finalArsipUrl: string | null = null;
        const canShowArchive = config?.enableDigitalArchive ?? true;
        const onlyLunas = config?.archiveOnlyLunas ?? true;

        if (canShowArchive && matchedArchive) {
           if (onlyLunas) {
              if (r.paymentStatus === "LUNAS") {
                finalArsipUrl = `/arsip-pbb/${tahunPajak}/${matchedArchive}`;
              }
           } else {
              finalArsipUrl = `/arsip-pbb/${tahunPajak}/${matchedArchive}`;
           }
        }

        return {
          id: r.id,
          nop: r.nop,
          namaWp: r.namaWp,
          alamat: r.alamatObjek,
          luasTanah: r.luasTanah,
          luasBangunan: r.luasBangunan,
          tagihan: r.sisaTagihan,
          status: r.paymentStatus,
          updatedAt: r.updatedAt,
          tanggalBayar: r.tanggalBayar,
          arsipUrl: finalArsipUrl,
          tahun: r.tahun,
          dusun: r.dusun,
          rt: r.rt,
          rw: r.rw,
          petugas: r.penarik ? {
            nama: r.penarik.name,
            kontak: r.penarik.phoneNumber || "Tidak ada nomor",
            wilayah: `${r.penarik.dusun || ""} RT ${r.penarik.rt || "-"} RW ${r.penarik.rw || "-"}`,
          } : null
        };
      });

    return { 
      success: true, 
      data: mapped, 
      hasMore,
      jatuhTempo: jatuhTempoStr,
      bapendaUrl,
      isJombangBapenda,
      enableBapendaSync: config?.enableBapendaSync ?? true,
      alamatKantor: config?.alamatKantor || "",
      email: config?.email || "",
      kodePos: config?.kodePos || "",
      namaKades: config?.namaKades || "",
      remaining: rateLimitResult.remaining 
    };
  } catch (error) {
    console.error("Public Search Error:", error);
    return { success: false, message: "Terjadi kesalahan pada sistem pencarian." };
  }
}
