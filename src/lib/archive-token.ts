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
  ip?: string; // Menyimpan IP pembuat token
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
const DEFAULT_TTL_MS = 5 * 60 * 1000; // Token valid 5 menit (5-minute token TTL)

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
 * @param ip - IP address pembuat token (opsional, untuk IP-binding)
 * @returns Token string (UUID)
 */
export function generateArchiveToken(
  year: string,
  file: string,
  ttlMs: number = DEFAULT_TTL_MS,
  ip?: string
): string {
  cleanupExpired();

  const token = crypto.randomUUID();
  tokenStore.set(token, {
    year,
    file,
    expiresAt: Date.now() + ttlMs,
    ip,
  });

  return token;
}

export type ConsumeTokenResult = 
  | { success: true; data: TokenData }
  | { success: false; error: "NOT_FOUND" | "EXPIRED" | "IP_MISMATCH" };

/**
 * Konsumsi token akses dengan pengecekan IP pengakses.
 *
 * @param token - Token string yang akan divalidasi
 * @param currentIp - IP address pengakses saat ini
 * @returns Struktur hasil validasi asinkron
 */
export function consumeArchiveToken(token: string, currentIp?: string): ConsumeTokenResult {
  cleanupExpired();

  const data = tokenStore.get(token);
  if (!data) return { success: false, error: "NOT_FOUND" };

  const now = Date.now();

  // Cek apakah sudah kedaluwarsa
  if (now > data.expiresAt) {
    tokenStore.delete(token);
    return { success: false, error: "EXPIRED" };
  }

  // Pengamanan IP-Binding: Tolak jika token diakses dari IP berbeda
  if (data.ip && currentIp && data.ip !== currentIp) {
    return { success: false, error: "IP_MISMATCH" };
  }

  return { success: true, data };
}

/**
 * Untuk debugging/monitoring: berapa token aktif saat ini.
 */
export function getActiveTokenCount(): number {
  cleanupExpired();
  return tokenStore.size;
}
