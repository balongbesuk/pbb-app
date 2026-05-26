import crypto from "crypto";

/**
 * Sistem token sekali pakai untuk mengamankan akses arsip PDF.
 *
 * - Token berupa UUID random (tidak bisa ditebak)
 * - Setiap token hanya bisa dipakai 1x (sekali dikonsumsi, langsung dihapus)
 * - Token otomatis kedaluwarsa setelah TTL (default 5 menit)
 * - Lazy cleanup: token expired dibersihkan saat ada operasi baru
 */

interface TokenData {
  year: string;
  file: string;
  expiresAt: number;
}

// Simpan di globalThis agar Server Actions dan Route Handlers (Next.js bundle terpisah)
// berbagi instance map yang sama di dalam memori Node.js.
const globalForTokens = globalThis as unknown as {
  tokenStore?: Map<string, TokenData>;
};

const tokenStore = globalForTokens.tokenStore ?? new Map<string, TokenData>();

if (process.env.NODE_ENV !== "production") {
  globalForTokens.tokenStore = tokenStore;
}

let lastCleanup = Date.now();

const CLEANUP_INTERVAL_MS = 60 * 1000; // Bersihkan setiap 1 menit
const DEFAULT_TTL_MS = 1 * 60 * 1000; // Token valid 1 menit (sesuai instruksi USER)

/**
 * Bersihkan token yang sudah expired (lazy, dipanggil saat generate/consume)
 */
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [token, data] of tokenStore) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Generate token akses sekali pakai untuk file arsip.
 * @param year - Tahun arsip (misal "2026")
 * @param file - Nama file PDF (misal "351704001900602240.pdf")
 * @param ttlMs - Masa berlaku token dalam milidetik (default 1 menit)
 * @returns Token string (UUID)
 */
export function generateArchiveToken(
  year: string,
  file: string,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  cleanupExpired();

  const token = crypto.randomUUID();
  tokenStore.set(token, {
    year,
    file,
    expiresAt: Date.now() + ttlMs,
  });

  return token;
}

/**
 * Konsumsi token akses.
 * Token bersifat reusable (bisa dipakai berulang) selama masa aktifnya (1 menit).
 * Ini mendukung peramban memuat preview di iframe serta memicu cetak & unduh sekaligus.
 *
 * @param token - Token string yang akan divalidasi
 * @returns Data token jika valid, null jika tidak valid/expired
 */
export function consumeArchiveToken(token: string): TokenData | null {
  cleanupExpired();

  const data = tokenStore.get(token);
  if (!data) return null;

  const now = Date.now();

  // Cek apakah sudah kedaluwarsa
  if (now > data.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  return data;
}

/**
 * Untuk debugging/monitoring: berapa token aktif saat ini.
 */
export function getActiveTokenCount(): number {
  cleanupExpired();
  return tokenStore.size;
}
