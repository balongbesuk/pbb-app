// Utility module untuk verifikasi PIN wajib pajak

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

/**
 * Konfigurasi rate limit untuk percobaan PIN.
 * Maksimal 5 percobaan dalam 15 menit per IP + ID.
 */
const PIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

export type PinVerificationSuccess = {
  success: true;
  taxData: {
    id: number;
    nop: string;
    tahun: number;
  };
  cleanNop: string;
};

export type PinVerificationFailure = {
  success: false;
  message: string;
  rateLimited?: boolean;
};

export type PinVerificationResult = PinVerificationSuccess | PinVerificationFailure;

/**
 * Verifikasi PIN 4-digit wajib pajak (4 digit nomor urut NOP).
 * Melindungi dari tebakan berulang menggunakan brute-force rate-limiting.
 *
 * PIN yang diterima:
 * - standardPin: 4 digit nomor urut NOP (index 13-17)
 * - absolutePin: 4 digit absolut terakhir NOP (index 14-18)
 */
export async function verifyTaxPin(
  id: number,
  pin: string,
  tahun: number
): Promise<PinVerificationResult> {
  const headersList = await headers();
  const ip = getClientIp({ headers: headersList });

  // Rate limiting per IP + tax ID
  const rateLimitKey = `pin-attempt:${ip}:${id}`;
  const pinRateLimit = await checkRateLimit(rateLimitKey, PIN_RATE_LIMIT);

  if (!pinRateLimit.allowed) {
    return {
      success: false,
      message: `Terlalu banyak percobaan salah PIN. Sesi Anda dikunci selama ${pinRateLimit.retryAfter} detik.`,
      rateLimited: true,
    };
  }

  const taxData = await prisma.taxData.findFirst({
    where: { id: Number(id), tahun: Number(tahun) },
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
      message: `PIN yang dimasukkan salah. Sisa kesempatan mencoba: ${remainingAttempts} kali.`,
    };
  }

  return {
    success: true,
    taxData: {
      id: taxData.id,
      nop: taxData.nop,
      tahun: taxData.tahun,
    },
    cleanNop,
  };
}

/**
 * Mask NOP untuk tampilan publik.
 * Contoh: 35.17.060.008.017-0032.0 → 35.17.060.008.017-XXXX.X
 */
export function maskNop(nop: string): string {
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
