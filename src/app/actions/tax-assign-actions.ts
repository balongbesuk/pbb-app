"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";
import { formatZodError } from "@/lib/validations/schemas";

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

  await prisma.$transaction(
    mappingPayload.map((mapping) =>
      prisma.taxMapping.upsert({
        where: { nop: mapping.nop },
        update: mapping,
        create: mapping,
      })
    )
  );
}

export async function assignPenarikByFilter(
  filters: {
    tahun: number;
    q?: string;
    dusun?: string;
    rw?: string;
    rt?: string;
    penarik?: string;
    regionStatus?: string;
  },
  penarikId: string | null
) {
  try {
    await requireAdmin();

    const whereClause: Prisma.TaxDataWhereInput = {
      tahun: filters.tahun,
    };

    const andFilters: Prisma.TaxDataWhereInput[] = [];

    if (filters.q) {
      andFilters.push({
        OR: [
          { nop: { contains: filters.q } },
          { namaWp: { contains: filters.q } },
          { alamatObjek: { contains: filters.q } },
        ],
      });
    }

    if (filters.regionStatus === "incomplete") {
      andFilters.push({
        OR: [{ dusun: null }, { rw: null }, { rt: null }, { dusun: "" }, { rw: "" }, { rt: "" }],
      });
    }

    if (filters.dusun && filters.dusun !== "all") whereClause.dusun = filters.dusun;
    if (filters.rw && filters.rw !== "all") whereClause.rw = filters.rw;
    if (filters.rt && filters.rt !== "all") whereClause.rt = filters.rt;
    
    if (filters.penarik && filters.penarik !== "all") {
      if (filters.penarik === "none") {
        whereClause.penarikId = null;
      } else {
        whereClause.penarikId = filters.penarik;
      }
    }

    if (andFilters.length > 0) {
      whereClause.AND = andFilters;
    }

    const matchingRecords = await prisma.taxData.findMany({
      where: whereClause,
      select: {
        id: true,
        nop: true,
        dusun: true,
        rt: true,
        rw: true,
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

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: taxIds.length };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}
