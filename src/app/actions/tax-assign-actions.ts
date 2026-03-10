"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";

export async function assignPenarik(taxId: string, penarikId: string | null) {
  try {
    await requireAdmin();
    const data = await prisma.taxData.findUnique({ where: { id: parseInt(taxId) } });
    if (!data) throw new Error("Not found");

    await prisma.taxData.update({
      where: { id: parseInt(taxId) },
      data: {
        penarikId,
      },
    });

    const penarik = penarikId
      ? await prisma.user.findUnique({ where: { id: penarikId }, select: { name: true } })
      : null;
    await createAuditLog(
      "ASSIGN_TAX",
      "TaxMapping",
      data.namaWp,
      `Ubah penugasan objek WP ${data.namaWp} ke petugas: ${penarik?.name || "Dikosongkan"}`
    );

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function assignPenarikBulk(taxIds: number[], penarikId: string | null) {
  try {
    await requireAdmin();
    await prisma.taxData.updateMany({
      where: { id: { in: taxIds } },
      data: {
        penarikId,
      },
    });

    const penarik = penarikId
      ? await prisma.user.findUnique({ where: { id: penarikId }, select: { name: true } })
      : null;
    await createAuditLog(
      "ASSIGN_TAX",
      "TaxMapping",
      null,
      `Alokasi masal ${taxIds.length} WP ke petugas: ${penarik?.name || "Dikosongkan"}`
    );

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: taxIds.length };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
