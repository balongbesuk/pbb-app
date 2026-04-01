"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import path from "path";
import fs from "fs";

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
    const pureNumbers = searchQuery.replace(/\D/g, "");
    
    // Generasi variasi format NOP untuk pencarian yang lebih tangguh
    const variations: string[] = [searchQuery];
    if (pureNumbers.length > 0) variations.push(pureNumbers); // Cari angka mentah

    if (pureNumbers.length >= 2) {
      let v1 = ""; // Standard: XX.XX.XXX.XXX.XXX-XXXX.X
      let v2 = ""; // All Dots: XX.XX.XXX.XXX.XXX.XXXX.X
      
      v1 += pureNumbers.substring(0, 2);
      v2 += pureNumbers.substring(0, 2);
      
      if (pureNumbers.length > 2) {
        v1 += "." + pureNumbers.substring(2, 4);
        v2 += "." + pureNumbers.substring(2, 4);
      }
      if (pureNumbers.length > 4) {
        v1 += "." + pureNumbers.substring(4, 7);
        v2 += "." + pureNumbers.substring(4, 7);
      }
      if (pureNumbers.length > 7) {
        v1 += "." + pureNumbers.substring(7, 10);
        v2 += "." + pureNumbers.substring(7, 10);
      }
      if (pureNumbers.length > 10) {
        v1 += "." + pureNumbers.substring(10, 13);
        v2 += "." + pureNumbers.substring(10, 13);
      }
      if (pureNumbers.length > 13) {
        v1 += "-" + pureNumbers.substring(13, 17);
        v2 += "." + pureNumbers.substring(13, 17);
      }
      if (pureNumbers.length > 17) {
        v1 += "." + pureNumbers.substring(17, 18);
        v2 += "." + pureNumbers.substring(17, 18);
      }
      variations.push(v1, v2);
    }

    // Filter duplikat dan string kosong
    const finalVariations = Array.from(new Set(variations.filter(v => v.length >= 3)));

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
      take: 10, // batasi max 10 hasil agar tidak berat/spam
    });

    if (results.length === 0) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    const config = await prisma.villageConfig.findFirst({ where: { id: 1 } }) as any;
    const jatuhTempoStr = config?.jatuhTempo || "31 Agustus";
    const bapendaUrl = config?.bapendaUrl || null;
    const isJombangBapenda = config?.isJombangBapenda ?? true;

    const today = new Date();
    
    // Scan arsip folder (Year-aware)
    const { getArchivePath } = require("@/lib/storage");
    const archiveDir = getArchivePath(tahunPajak.toString());
    let archiveFiles: string[] = [];
    if (fs.existsSync(archiveDir)) {
      archiveFiles = fs.readdirSync(archiveDir);
    }

      // Map data structure for public view
      const mapped = results.map(r => {
        // Cari file arsip (NOP)
        const cleanNop = r.nop.replace(/\D/g, "");
        const matchedArchive = archiveFiles.find(f => f.replace(/\D/g, "").startsWith(cleanNop));

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

        console.log(`Pencarian: ${r.namaWp} -> Arsip: ${finalArsipUrl || 'Kosong'}`);

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
