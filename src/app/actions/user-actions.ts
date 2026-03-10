"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./log-actions";
import { UserSchema, formatZodError } from "@/lib/validations/schemas";

export async function createUser(raw: any) {
  try {
    const data = UserSchema.parse(raw);
    const passwordToHash = data.password || "pbb12345";
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        dusun: data.dusun || null,
        rt: data.rt || null,
        rw: data.rw || null,
        role: data.role || "PENARIK"
      }
    });

    await createAuditLog("CREATE_USER", "User", data.username, `Menambah pengguna baru: ${data.name} (${data.username}) dengan peran ${data.role || "PENARIK"}`);
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function updateUser(id: string, raw: any) {
  try {
    const data = UserSchema.partial().parse(raw);
    const updateData: any = {
      name: data.name,
      email: data.email || null,
      username: data.username,
      dusun: data.dusun || null,
      rt: data.rt || null,
      rw: data.rw || null,
      role: data.role
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    await createAuditLog("UPDATE_USER", "User", id, `Memperbarui data pengguna: ${data.name} (${data.username})`);
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("Pengguna tidak ditemukan");

    await prisma.user.delete({ where: { id } });
    await createAuditLog("DELETE_USER", "User", id, `Menghapus pengguna: ${user.name} (${user.username})`);
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function resetPassword(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("Pengguna tidak ditemukan");

    const hashedPassword = await bcrypt.hash("pbb12345", 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    await createAuditLog("RESET_PASSWORD", "User", id, `Mereset password pengguna: ${user.name} (${user.username})`);
    return { success: true, message: "Password direset ke: pbb12345" };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}
