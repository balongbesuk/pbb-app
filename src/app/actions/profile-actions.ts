"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { createAuditLog } from "./log-actions";

// Validasi server-side untuk profil
function validateProfileData(data: { name: string; phoneNumber: string; email: string }) {
  if (!data.name || data.name.trim().length < 3) {
    throw new Error("Nama minimal 3 karakter");
  }

  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    throw new Error("Format alamat email tidak valid");
  }

  if (data.phoneNumber && (data.phoneNumber.length < 10 || data.phoneNumber.length > 15)) {
    throw new Error("Nomor kontak harus antara 10-15 digit");
  }

  if (data.phoneNumber && !/^\d+$/.test(data.phoneNumber)) {
    throw new Error("Nomor kontak hanya boleh berupa angka");
  }
}

export async function updateUserProfile(data: { name: string; phoneNumber: string; email: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Sesi tidak valid");
    }

    const userId = (session.user as any).id as string;
    if (!userId) {
      throw new Error("ID Pengguna tidak valid");
    }

    // Validasi server-side
    validateProfileData(data);

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name.trim(),
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
      },
    });

    await createAuditLog(
      "UPDATE_PROFILE",
      "USER",
      userId,
      `Berhasil memperbarui informasi profil: Nama, Email, dan Nomor Kontak.`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function changeOwnPassword(oldPass: string, newPass: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Sesi tidak valid");
    }

    const userId = (session.user as any).id as string;

    if (!userId) {
      throw new Error("ID Pengguna tidak valid");
    }

    if (!newPass || newPass.length < 6) {
      throw new Error("Password baru minimal 6 karakter");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan");
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) {
      throw new Error("Password lama tidak sesuai");
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
