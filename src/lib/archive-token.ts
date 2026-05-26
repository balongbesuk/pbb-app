import crypto from "crypto";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getStorageRoot } from "@/lib/storage";

/**
 * Sistem token untuk mengamankan akses arsip PDF.
 *
 * - Token berupa UUID random (tidak bisa ditebak)
 * - Token disimpan di SQLite database sehingga sinkron di semua proses PM2 / VPS
 * - Token valid selama 5 menit reusable (bisa diakses berulang)
 * - Lazy cleanup: token expired dibersihkan saat ada operasi baru
 */

export interface TokenData {
  year: string;
  file: string;
  expiresAt: number;
  ip?: string;
}

let tokenDb: Database.Database | null = null;

function getTokenDb(): Database.Database {
  if (tokenDb) return tokenDb;

  const storageRoot = getStorageRoot();
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }

  const dbPath = path.join(storageRoot, "archive-tokens.db");
  tokenDb = new Database(dbPath);
  tokenDb.pragma("journal_mode = WAL");
  tokenDb.pragma("synchronous = NORMAL");
  tokenDb.exec(`
    CREATE TABLE IF NOT EXISTS archive_tokens (
      token TEXT PRIMARY KEY,
      year TEXT NOT NULL,
      file TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      ip TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_archive_tokens_expires_at
      ON archive_tokens (expires_at);
  `);

  return tokenDb;
}

const CLEANUP_INTERVAL_MS = 60 * 1000; // Bersihkan setiap 1 menit
const DEFAULT_TTL_MS = 5 * 60 * 1000; // Token valid 5 menit

let lastCleanup = Date.now();

/**
 * Bersihkan token yang sudah expired
 */
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  try {
    const db = getTokenDb();
    db.prepare("DELETE FROM archive_tokens WHERE expires_at < ?").run(now);
  } catch (err) {
    console.error("[archive-token-cleanup-error]", err);
  }
}

/**
 * Generate token akses sekali pakai untuk file arsip.
 * @param year - Tahun arsip (misal "2026")
 * @param file - Nama file PDF (misal "351704001900602240.pdf")
 * @param ttlMs - Masa berlaku token dalam milidetik (default 5 menit)
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
  const expiresAt = Date.now() + ttlMs;
  const createdAt = Date.now();

  try {
    const db = getTokenDb();
    db.prepare(`
      INSERT INTO archive_tokens (token, year, file, expires_at, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, year, file, expiresAt, ip || null, createdAt);
  } catch (err) {
    console.error("[archive-token-generate-error]", err);
  }

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

  try {
    const db = getTokenDb();
    const data = db.prepare(`
      SELECT year, file, expires_at as expiresAt, ip
      FROM archive_tokens
      WHERE token = ?
    `).get(token) as { year: string; file: string; expiresAt: number; ip: string | null } | undefined;

    if (!data) return { success: false, error: "NOT_FOUND" };

    const now = Date.now();

    // Cek apakah sudah kedaluwarsa
    if (now > data.expiresAt) {
      db.prepare("DELETE FROM archive_tokens WHERE token = ?").run(token);
      return { success: false, error: "EXPIRED" };
    }

    // Pengamanan IP-Binding: Tolak jika token diakses dari IP berbeda
    // Catatan: Jika IP berupa "unknown" (misal ada kendala proxy), toleransi dilewati demi ketahanan VPS
    const savedIp = data.ip;
    if (
      savedIp && 
      savedIp !== "unknown" && 
      currentIp && 
      currentIp !== "unknown" && 
      savedIp !== currentIp
    ) {
      return { success: false, error: "IP_MISMATCH" };
    }

    return { 
      success: true, 
      data: { 
        year: data.year, 
        file: data.file, 
        expiresAt: data.expiresAt, 
        ip: savedIp || undefined 
      } 
    };
  } catch (err) {
    console.error("[archive-token-consume-error]", err);
    return { success: false, error: "NOT_FOUND" };
  }
}

/**
 * Untuk debugging/monitoring: berapa token aktif saat ini.
 */
export function getActiveTokenCount(): number {
  cleanupExpired();
  try {
    const db = getTokenDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM archive_tokens").get() as { count: number } | undefined;
    return row?.count ?? 0;
  } catch (err) {
    console.error("[archive-token-count-error]", err);
    return 0;
  }
}
