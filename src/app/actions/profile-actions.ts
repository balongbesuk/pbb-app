"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { createAuditLog } from "./log-actions";

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

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
      },
    });

    await createAuditLog(
      "UPDATE_PROFILE",
      "USER",
      userId,
      `Memperbarui profil: Nama=${data.name}, Email=${data.email}, Kontak=${data.phoneNumber}`
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
