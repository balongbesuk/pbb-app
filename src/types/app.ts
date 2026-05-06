/**
 * types/app.ts — Tipe data terpusat untuk seluruh aplikasi PBB.
 *
 * Menggantikan penggunaan `any` di komponen-komponen utama.
 * Tipe-tipe ini merupakan subset dari Prisma generated types,
 * disesuaikan untuk kebutuhan UI (include relasi, exclude sensitive fields).
 */

import type { PaymentStatus, Role } from "@prisma/client";

// ─── User & Auth ────────────────────────────────────────────────

/** Informasi user yang tersedia dari session (safe to expose to client) */
export interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

/** Data penarik pajak (untuk dropdown assign, filter, dll) */
export interface PenarikInfo {
  id: string;
  name: string | null;
  dusun?: string | null;
  rt?: string | null;
  rw?: string | null;
  phoneNumber?: string | null;
}

// ─── Tax Data ───────────────────────────────────────────────────

/** Data pajak individual sebagaimana ditampilkan di tabel */
export interface TaxDataItem {
  id: number;
  nop: string;
  namaWp: string;
  alamatObjek: string;
  luasTanah: number;
  luasBangunan: number;
  ketetapan: number;
  tagihanDenda: number;
  pembayaran: number;
  pokok: number;
  denda: number;
  lebihBayar: number;
  tanggalBayar: string | null;
  sisaTagihan: number;
  tempatBayar: string | null;
  tahun: number;
  dusun: string | null;
  rt: string | null;
  rw: string | null;
  blok: string | null;
  status: string;
  paymentStatus: PaymentStatus;
  penarikId: string | null;
  penarik: PenarikInfo | null;
}

// ─── Filters ────────────────────────────────────────────────────

/** Filter options yang tersedia (dihitung dari data, dikirim ke client) */
export interface AvailableFilters {
  dusun: string[];
  rw: string[];
  rt: string[];
  blok: string[];
  penarik: { id: string; name: string }[];
  dusunRefs?: string[];
}

// ─── Dashboard Charts ───────────────────────────────────────────

/** Data untuk bar chart RW */
export interface RWBarChartItem {
  rw: string;
  lunas: number;
  belum: number;
}

/** Data untuk pie chart status */
export interface StatusPieChartItem {
  name: string;
  value: number;
  color: string;
}

/** Data untuk line trend chart */
export interface LineTrendChartItem {
  year: string;
  nilai: number;
}

// ─── Laporan ────────────────────────────────────────────────────

/** Stats gabungan per penarik (dipakai di halaman laporan) */
export interface PenarikCombinedStat {
  penarikId: string | null;
  penarikName: string;
  penarikDusun: string;
  _count: { nop: number };
  _sum: { ketetapan: number; pembayaran: number; sisaTagihan: number };
  lunasCount: number;
  belumLunasCount: number;
}

// ─── User Management ────────────────────────────────────────────

/** Data user untuk halaman manajemen pengguna */
export interface UserListItem {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  role: Role;
  dusun: string | null;
  rt: string | null;
  rw: string | null;
  avatarUrl: string | null;
  _count?: { taxData: number };
}
