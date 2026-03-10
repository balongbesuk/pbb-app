"use server";

/**
 * server-auth.ts — Helper untuk memvalidasi sesi dan peran di Server Actions.
 *
 * Penggunaan:
 *   import { requireAuth, requireAdmin } from "@/lib/server-auth";
 *   const session = await requireAuth();        // wajib login
 *   const session = await requireAdmin();       // wajib ADMIN
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type UserRole = "ADMIN" | "PENARIK" | "PENGGUNA";

export interface AuthSession {
  userId: string;
  name: string;
  role: UserRole;
}

/**
 * Pastikan pengguna sudah login.
 * Melempar Error jika belum login.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized: Sesi tidak ditemukan. Silakan login kembali.");
  }

  const userId = session.user.id;
  const role = session.user.role;

  if (!userId) {
    throw new Error("Unauthorized: ID pengguna tidak valid.");
  }

  return { userId, name: session.user.name ?? "", role };
}

/**
 * Pastikan pengguna sudah login DAN memiliki role ADMIN.
 * Melempar Error jika bukan ADMIN.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const auth = await requireAuth();

  if (auth.role !== "ADMIN") {
    throw new Error(
      `Forbidden: Aksi ini hanya boleh dilakukan oleh ADMIN. Peran Anda: ${auth.role}`
    );
  }

  return auth;
}

/**
 * Pastikan pengguna sudah login DAN memiliki salah satu role yang diizinkan.
 */
export async function requireRole(...roles: UserRole[]): Promise<AuthSession> {
  const auth = await requireAuth();

  if (!roles.includes(auth.role)) {
    throw new Error(
      `Forbidden: Aksi ini memerlukan peran ${roles.join(" atau ")}. Peran Anda: ${auth.role}`
    );
  }

  return auth;
}
