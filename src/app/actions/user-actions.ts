"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function createUser(data: any) {
  try {
    const passwordToHash = data.password || "pbb12345";
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    
    await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        dusun: data.dusun,
        rt: data.rt,
        rw: data.rw,
        role: data.role || "PENARIK"
      }
    });

    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, message: error.message };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
      username: data.username,
      dusun: data.dusun,
      rt: data.rt,
      rw: data.rw,
      role: data.role
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function resetPassword(id: string) {
  try {
    const hashedPassword = await bcrypt.hash("pbb12345", 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    return { success: true, message: "Password direset ke: pbb12345" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
