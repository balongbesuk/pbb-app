/**
 * role-config.ts — Konfigurasi warna badge per role.
 *
 * Sumber tunggal (single source of truth) untuk semua tampilan badge role
 * di seluruh aplikasi. Import dari sini agar mudah diperbarui.
 *
 * Penggunaan:
 *   import { ROLE_BADGE } from "@/lib/role-config";
 *   const cfg = ROLE_BADGE[user.role] ?? ROLE_BADGE.PENGGUNA;
 */

export type UserRoleKey = "ADMIN" | "PENARIK" | "PENGGUNA";

export interface RoleBadgeConfig {
  /** Kelas Tailwind untuk dot indicator */
  dot: string;
  /** Kelas Tailwind untuk Badge (border, bg, text, shadow — light & dark) */
  badge: string;
  /** Label yang ditampilkan di badge */
  label: string;
  /** Deskripsi singkat untuk preview di form */
  desc: string;
}

export const ROLE_BADGE: Record<UserRoleKey, RoleBadgeConfig> = {
  ADMIN: {
    dot: "bg-rose-500",
    badge:
      "border-rose-200/80 bg-rose-50 text-rose-700 shadow-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 dark:shadow-rose-950/30",
    label: "Admin",
    desc: "Akses penuh ke semua fitur sistem.",
  },
  PENARIK: {
    dot: "bg-amber-500",
    badge:
      "border-amber-200/80 bg-amber-50 text-amber-700 shadow-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:shadow-amber-950/30",
    label: "Penarik",
    desc: "Petugas lapangan pengumpulan PBB.",
  },
  PENGGUNA: {
    dot: "bg-indigo-500",
    badge:
      "border-indigo-200/80 bg-indigo-50 text-indigo-700 shadow-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:shadow-indigo-950/30",
    label: "Pengguna",
    desc: "Hak akses baca / view only.",
  },
};
