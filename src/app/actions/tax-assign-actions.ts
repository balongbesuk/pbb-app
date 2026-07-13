"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";
import { formatZodError } from "@/lib/validations/schemas";
import { buildTaxWhereInput } from "@/lib/tax-query";
import { notifyUser } from "@/lib/push-notification";

async function syncTaxMappingsForRecords(
  records: Array<{
    nop: string;
    dusun: string | null;
    rt: string | null;
    rw: string | null;
  }>,
  penarikId: string | null
) {
  const mappingPayload = records
    .filter((record) => record.dusun && record.rt && record.rw)
    .map((record) => ({
      nop: record.nop,
      dusun: record.dusun!,
      rt: record.rt!,
      rw: record.rw!,
      penarikId,
    }));

  if (mappingPayload.length === 0) {
    return;
  }

  const nops = mappingPayload.map((m) => m.nop);

  try {
    const CHUNK_SIZE = 500;
    const deletePromises = [];
    for (let j = 0; j < nops.length; j += CHUNK_SIZE) {
      const chunk = nops.slice(j, j + CHUNK_SIZE);
      deletePromises.push(
        prisma.taxMapping.deleteMany({
          where: { nop: { in: chunk } },
        })
      );
    }

    const createPromises = [];
    for (let j = 0; j < mappingPayload.length; j += CHUNK_SIZE) {
      const chunk = mappingPayload.slice(j, j + CHUNK_SIZE);
      createPromises.push(
        prisma.taxMapping.createMany({
          data: chunk,
        })
      );
    }

    await prisma.$transaction([
      ...deletePromises,
      ...createPromises,
    ]);
  } catch (txError) {
    console.error("Mapping sync failed, falling back to individual upserts:", txError);
    // Fallback to individual upserts if bulk transaction fails
    for (const mapping of mappingPayload) {
      try {
        await prisma.taxMapping.upsert({
          where: { nop: mapping.nop },
          update: mapping,
          create: mapping,
        });
      } catch (err) {
        console.warn(`Failed to upsert tax mapping for NOP ${mapping.nop}:`, err);
      }
    }
  }
}


export async function assignPenarikByFilter(
  filters: {
    tahun: number;
    q?: string;
    dusun?: string;
    rw?: string;
    rt?: string;
    blok?: string;
    penarik?: string;
    regionStatus?: string;
  },
  penarikId: string | null
) {
  try {
    await requireAdmin();

    const whereClause = buildTaxWhereInput(filters, {
      includePaymentStatus: false,
    });

    const matchingRecords = await prisma.taxData.findMany({
      where: whereClause,
      select: {
        id: true,
        nop: true,
        dusun: true,
        rt: true,
        rw: true,
        penarikId: true,
      },
    });

    if (penarikId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: penarikId },
        select: { role: true }
      });
      if (!targetUser || targetUser.role !== "PENARIK") {
        throw new Error("Target alokasi harus merupakan petugas lapangan (PENARIK) yang aktif.");
      }
    }

    const res = await prisma.taxData.updateMany({
      where: { id: { in: matchingRecords.map((record) => record.id) } },
      data: {
        penarikId,
      },
    });

    await syncTaxMappingsForRecords(matchingRecords, penarikId);

    const penarik = penarikId
      ? await prisma.user.findUnique({ where: { id: penarikId }, select: { name: true } })
      : null;
    
    await createAuditLog(
      "ASSIGN_TAX",
      "TaxMapping",
      null,
      `Alokasi filter (${res.count} data) ke petugas: ${penarik?.name || "Dikosongkan"}`
    );

    if (penarikId) {
      await prisma.notification.create({
        data: {
          userId: penarikId,
          title: "Tugas Penagihan Baru",
          message: `Admin telah mengalokasikan ${res.count} data WP kepada Anda berdasarkan filter wilayah.`,
          type: "INFO",
        }
      });
      notifyUser(penarikId, "Tugas Penagihan Baru", `Admin telah mengalokasikan ${res.count} data WP kepada Anda berdasarkan filter wilayah.`);
    }

    // Notify old penariks
    const oldPenarikMap = new Map<string, number>();
    matchingRecords.forEach((record) => {
      if (record.penarikId && record.penarikId !== penarikId) {
        oldPenarikMap.set(record.penarikId, (oldPenarikMap.get(record.penarikId) || 0) + 1);
      }
    });

    for (const [oldPenarikId, count] of Array.from(oldPenarikMap.entries())) {
      await prisma.notification.create({
        data: {
          userId: oldPenarikId,
          title: "Pembatalan Tugas Penagihan",
          message: `Admin telah memindahkan ${count} data WP dari daftar tugas Anda berdasarkan filter wilayah.`,
          type: "INFO",
        }
      });
      notifyUser(oldPenarikId, "Pembatalan Tugas Penagihan", `Admin telah memindahkan ${count} data WP dari daftar tugas Anda berdasarkan filter wilayah.`);
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: res.count };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function assignPenarik(taxId: string, penarikId: string | null) {
  try {
    await requireAdmin();
    const data = await prisma.taxData.findUnique({
      where: { id: parseInt(taxId) },
      select: {
        id: true,
        nop: true,
        namaWp: true,
        dusun: true,
        rt: true,
        rw: true,
        penarikId: true,
      },
    });
    if (!data) throw new Error("Not found");

    if (penarikId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: penarikId },
        select: { role: true }
      });
      if (!targetUser || targetUser.role !== "PENARIK") {
        throw new Error("Target alokasi harus merupakan petugas lapangan (PENARIK) yang aktif.");
      }
    }

    await prisma.taxData.update({
      where: { id: parseInt(taxId) },
      data: {
        penarikId,
      },
    });

    await syncTaxMappingsForRecords([data], penarikId);

    const penarik = penarikId
      ? await prisma.user.findUnique({ where: { id: penarikId }, select: { name: true } })
      : null;
    await createAuditLog(
      "ASSIGN_TAX",
      "TaxMapping",
      data.namaWp,
      `Ubah penugasan objek WP ${data.namaWp} ke petugas: ${penarik?.name || "Dikosongkan"}`
    );

    if (penarikId) {
      await prisma.notification.create({
        data: {
          userId: penarikId,
          title: "Tugas Penagihan Baru",
          message: `Admin menugaskan WP ${data.namaWp} kepada Anda.`,
          type: "INFO",
        }
      });
      notifyUser(penarikId, "Tugas Penagihan Baru", `Admin menugaskan WP ${data.namaWp} kepada Anda.`);
    }

    if (data.penarikId && data.penarikId !== penarikId) {
      await prisma.notification.create({
        data: {
          userId: data.penarikId,
          title: "Pembatalan Tugas Penagihan",
          message: `Admin telah memindahkan WP ${data.namaWp} dari daftar tugas Anda.`,
          type: "INFO",
        }
      });
      notifyUser(data.penarikId, "Pembatalan Tugas Penagihan", `Admin telah memindahkan WP ${data.namaWp} dari daftar tugas Anda.`);
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function assignPenarikBulk(taxIds: number[], penarikId: string | null) {
  try {
    await requireAdmin();
    const records = await prisma.taxData.findMany({
      where: { id: { in: taxIds } },
      select: {
        nop: true,
        dusun: true,
        rt: true,
        rw: true,
        penarikId: true,
      },
    });

    if (penarikId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: penarikId },
        select: { role: true }
      });
      if (!targetUser || targetUser.role !== "PENARIK") {
        throw new Error("Target alokasi harus merupakan petugas lapangan (PENARIK) yang aktif.");
      }
    }

    await prisma.taxData.updateMany({
      where: { id: { in: taxIds } },
      data: {
        penarikId,
      },
    });

    await syncTaxMappingsForRecords(records, penarikId);

    const penarik = penarikId
      ? await prisma.user.findUnique({ where: { id: penarikId }, select: { name: true } })
      : null;
    await createAuditLog(
      "ASSIGN_TAX",
      "TaxMapping",
      null,
      `Alokasi masal ${taxIds.length} WP ke petugas: ${penarik?.name || "Dikosongkan"}`
    );

    if (penarikId) {
      await prisma.notification.create({
        data: {
          userId: penarikId,
          title: "Tugas Penagihan Baru",
          message: `Admin telah mengalokasikan ${taxIds.length} data WP kepada Anda secara masal.`,
          type: "INFO",
        }
      });
      notifyUser(penarikId, "Tugas Penagihan Baru", `Admin telah mengalokasikan ${taxIds.length} data WP kepada Anda secara masal.`);
    }

    // Notify old penariks
    const oldPenarikMapBulk = new Map<string, number>();
    records.forEach((record) => {
      if (record.penarikId && record.penarikId !== penarikId) {
        oldPenarikMapBulk.set(record.penarikId, (oldPenarikMapBulk.get(record.penarikId) || 0) + 1);
      }
    });

    for (const [oldPenarikId, count] of Array.from(oldPenarikMapBulk.entries())) {
      await prisma.notification.create({
        data: {
          userId: oldPenarikId,
          title: "Pembatalan Tugas Penagihan",
          message: `Admin telah memindahkan ${count} data WP dari daftar tugas Anda secara masal.`,
          type: "INFO",
        }
      });
      notifyUser(oldPenarikId, "Pembatalan Tugas Penagihan", `Admin telah memindahkan ${count} data WP dari daftar tugas Anda secara masal.`);
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: taxIds.length };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}
