"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { findArchiveFilenameByNop, getArchiveDir, getCachedArchiveIndex } from "@/lib/archive-utils";
import { generateArchiveToken } from "@/lib/archive-token";
import { getNopVariations } from "@/lib/utils";
import { getClientIp } from "@/lib/request-ip";

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
  bapendaPaymentUrl: string | null;
  bapendaRegionName: string | null;
  isJombangBapenda: boolean | null;
  enableBapendaSync: boolean | null;
  enableBapendaPayment: boolean | null;
  enableDigitalArchive: boolean | null;
  archiveOnlyLunas: boolean | null;
  alamatKantor: string | null;
  email: string | null;
  kodePos: string | null;
  namaKades: string | null;
  showReceiptPublic: boolean | null;
  adminFee: number | null;
  showNominalPajak: boolean | null;
};

function maskNop(nop: string): string {
  const cleanNop = nop.replace(/\D/g, "");
  if (cleanNop.length === 18) {
    const p1 = cleanNop.substring(0, 2);
    const p2 = cleanNop.substring(2, 4);
    const p3 = cleanNop.substring(4, 7);
    const p4 = cleanNop.substring(7, 10);
    const p5 = cleanNop.substring(10, 13);
    return `${p1}.${p2}.${p3}.${p4}.${p5}-XXXX.X`;
  }
  if (nop.includes("-")) {
    const parts = nop.split("-");
    return `${parts[0]}-XXXX.X`;
  }
  return nop.substring(0, Math.max(0, nop.length - 5)) + "XXXXX";
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  let secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // Graceful bypass if not configured

  // Hapus kutipan jika Next.js/Turbopack membacanya secara literal
  secretKey = secretKey.replace(/['"]/g, "").trim();
  console.log("[Turnstile Request SecretKey]:", `"${secretKey}"`, "Length:", secretKey.length);

  try {
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await res.json();
    console.log("[Turnstile API Response]:", data);
    return !!data.success;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}

export async function searchPublicTaxData(
  query: string, 
  tahunPajak: number, 
  page: number = 1, 
  pageSize: number = 10,
  turnstileToken?: string,
  skipTurnstile: boolean = false
) {
  try {
    // ─── Rate Limiting ──────────────────────────────────────────────
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isLighthouse = /Lighthouse|Google-Lighthouse/i.test(userAgent);

    const ip = getClientIp({ headers: headersList });
    const rateLimitResult = !isLighthouse 
      ? await checkRateLimit(ip, PUBLIC_SEARCH_RATE_LIMIT)
      : { allowed: true, remaining: 999 };

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Terlalu banyak pencarian. Silakan coba lagi dalam ${rateLimitResult.retryAfter} detik.`,
        rateLimited: true,
      };
    }

    // ─── Turnstile Anti-Bot Verification ────────────────────────────
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (secretKey && !skipTurnstile) {
      if (!turnstileToken) {
        return { success: false, message: "Verifikasi Turnstile diperlukan untuk melakukan pencarian." };
      }
      const isHuman = await verifyTurnstileToken(turnstileToken);
      if (!isHuman) {
        return { success: false, message: "Verifikasi Turnstile gagal. Anda terdeteksi sebagai bot." };
      }
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
        bapendaPaymentUrl: true,
        enableBapendaPayment: true,
        bapendaRegionName: true,
        isJombangBapenda: true,
        enableBapendaSync: true,
        enableDigitalArchive: true,
        archiveOnlyLunas: true,
        alamatKantor: true,
        email: true,
        kodePos: true,
        namaKades: true,
        showReceiptPublic: true,
        adminFee: true,
        showNominalPajak: true,
      },
    }) as PublicVillageConfig | null;

    const jatuhTempoStr = config?.jatuhTempo || "31 Agustus";
    const bapendaUrl = config?.bapendaUrl || null;
    const isJombangBapenda = config?.isJombangBapenda ?? true;

    // Scan arsip folder (Year-aware)
    const archiveDir = getArchiveDir(tahunPajak);
    const archiveIndex = getCachedArchiveIndex(archiveDir);

    // Map data structure for public view - Masking NOP and hiding arsipUrl by default
    const mapped = finalResults.map(r => {
      const cleanNop = r.nop.replace(/\D/g, "");
      const matchedArchive = findArchiveFilenameByNop(archiveIndex, cleanNop);

      return {
        id: r.id,
        nop: maskNop(r.nop), // MASKED NOP FOR PUBLIC DISPLAY
        namaWp: r.namaWp, // Nama tidak disensor sesuai keinginan user (SEC-04)
        alamat: r.alamatObjek, // Alamat tidak disensor (SEC-04)
        luasTanah: r.luasTanah,
        luasBangunan: r.luasBangunan,
        tagihan: r.sisaTagihan,
        ketetapan: r.ketetapan,
        status: r.paymentStatus,
        updatedAt: r.updatedAt,
        tanggalBayar: r.tanggalBayar,
        arsipUrl: null, // HIDDEN BY DEFAULT FOR SCRAPING PROTECTION (SEC-05)
        hasArsip: !!matchedArchive, // Tanda apakah berkas PDF ada
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
      bapendaPaymentUrl: config?.bapendaPaymentUrl || null,
      enableBapendaPayment: config?.enableBapendaPayment ?? true,
      bapendaRegionName: config?.bapendaRegionName || "Bapenda",
      isJombangBapenda,
      enableBapendaSync: config?.enableBapendaSync ?? false,
      alamatKantor: config?.alamatKantor || "",
      email: config?.email || "",
      kodePos: config?.kodePos || "",
      namaKades: config?.namaKades || "",
      showReceiptPublic: config?.showReceiptPublic ?? true,
      adminFee: config?.adminFee ?? 2000,
      showNominalPajak: config?.showNominalPajak ?? false,
      remaining: rateLimitResult.remaining 
    };
  } catch (error) {
    console.error("Public Search Error:", error);
    return { success: false, message: "Terjadi kesalahan pada sistem pencarian." };
  }
}

/**
 * Memverifikasi PIN 4-digit wajib pajak dan mengembalikan tautan unduhan PDF aman.
 * Melindungi dari tebakan berulang menggunakan brute-force rate-limiting.
 */
export async function getSecureArsipUrl(id: number, pin: string, tahun: number) {
  try {
    const headersList = await headers();
    const ip = getClientIp({ headers: headersList });

    // Pembatasan total percobaan PIN: maksimal 5 kali dalam 15 menit per IP + ID
    const rateLimitKey = `pin-attempt:${ip}:${id}`;
    const pinRateLimit = await checkRateLimit(rateLimitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!pinRateLimit.allowed) {
      return {
        success: false,
        message: `Terlalu banyak percobaan salah PIN. Sesi Anda dikunci selama ${pinRateLimit.retryAfter} detik.`,
        rateLimited: true,
      };
    }

    const taxData = await prisma.taxData.findFirst({
      where: { id: Number(id), tahun: Number(tahun) }
    });

    if (!taxData) {
      return { success: false, message: "Data pajak tidak ditemukan." };
    }

    const cleanNop = taxData.nop.replace(/\D/g, "");
    if (cleanNop.length < 18) {
      return { success: false, message: "Data NOP pada database tidak valid." };
    }

    // 4 digit nomor urut NOP (karakter index 13 s.d 17)
    const standardPin = cleanNop.substring(13, 17);
    // 4 digit absolut terakhir NOP (karakter index 14 s.d 18)
    const absolutePin = cleanNop.substring(14, 18);

    const cleanPin = pin.trim();
    if (cleanPin !== standardPin && cleanPin !== absolutePin) {
      const remainingAttempts = pinRateLimit.remaining;
      return { 
        success: false, 
        message: `PIN yang dimasukkan salah. Sisa kesempatan mencoba: ${remainingAttempts} kali.` 
      };
    }

    // PIN Benar, dapatkan nama berkas arsip PDF
    const archiveDir = getArchiveDir(tahun);
    const archiveIndex = getCachedArchiveIndex(archiveDir);
    const matchedArchive = findArchiveFilenameByNop(archiveIndex, cleanNop);

    if (!matchedArchive) {
      return { success: false, message: "Berkas PDF E-SPPT untuk NOP ini tidak ditemukan di server pusat." };
    }

    // Generate one-time token (sekali pakai, expired 5 menit)
    const token = generateArchiveToken(String(tahun), matchedArchive);
    const secureUrl = `/arsip-pbb/download?token=${token}`;

    return {
      success: true,
      arsipUrl: secureUrl
    };
  } catch (error) {
    console.error("getSecureArsipUrl Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat mengambil berkas." };
  }
}

/**
 * Memverifikasi PIN 4-digit wajib pajak dan mengembalikan data asli tanpa sensor.
 * Dibutuhkan untuk menampilkan NOP penuh saat warga menyalin NOP atau membayar online.
 */
export async function getUnmaskedTaxData(id: number, pin: string, tahun: number) {
  try {
    const headersList = await headers();
    const ip = getClientIp({ headers: headersList });

    // Pembatasan total percobaan PIN serupa
    const rateLimitKey = `pin-attempt:${ip}:${id}`;
    const pinRateLimit = await checkRateLimit(rateLimitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!pinRateLimit.allowed) {
      return {
        success: false,
        message: `Terlalu banyak percobaan salah PIN. Sesi Anda dikunci selama ${pinRateLimit.retryAfter} detik.`,
        rateLimited: true,
      };
    }

    const taxData = await prisma.taxData.findFirst({
      where: { id: Number(id), tahun: Number(tahun) }
    });

    if (!taxData) {
      return { success: false, message: "Data pajak tidak ditemukan." };
    }

    const cleanNop = taxData.nop.replace(/\D/g, "");
    if (cleanNop.length < 18) {
      return { success: false, message: "Data NOP pada database tidak valid." };
    }

    const standardPin = cleanNop.substring(13, 17);
    const absolutePin = cleanNop.substring(14, 18);

    const cleanPin = pin.trim();
    if (cleanPin !== standardPin && cleanPin !== absolutePin) {
      const remainingAttempts = pinRateLimit.remaining;
      return { 
        success: false, 
        message: `PIN yang dimasukkan salah. Sisa kesempatan mencoba: ${remainingAttempts} kali.` 
      };
    }

    // Kembalikan NOP asli
    return {
      success: true,
      nop: taxData.nop
    };
  } catch (error) {
    console.error("getUnmaskedTaxData Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}
