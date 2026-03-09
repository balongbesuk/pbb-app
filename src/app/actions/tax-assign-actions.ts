"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "./log-actions";

export async function assignPenarik(taxId: string, penarikId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      throw new Error("Hanya Admin yang diperbolehkan mengubah alokasi penarik.");
    }
    const data = await prisma.taxData.findUnique({ where: { id: parseInt(taxId) } });
    if (!data) throw new Error("Not found");

    await prisma.taxData.update({
      where: { id: parseInt(taxId) },
      data: {
        penarikId,
      }
    });

    await createAuditLog("ASSIGN_TAX", "TaxMapping", data.namaWp, `Ubah penugasan satu objek ke petugas UUID: ${penarikId || 'Dikosongkan'} (ID: ${taxId})`);

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function assignPenarikBulk(taxIds: number[], penarikId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      throw new Error("Hanya Admin yang diperbolehkan mengubah alokasi penarik secara masal.");
    }
    await prisma.taxData.updateMany({
      where: { id: { in: taxIds } },
      data: {
        penarikId,
      }
    });

    await createAuditLog("ASSIGN_TAX", "TaxMapping", null, `Alokasi masal ${taxIds.length} WP ke petugas UUID: ${penarikId || 'Dikosongkan'}`);

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: taxIds.length };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
