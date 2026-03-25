"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";
import { TaxRegionUpdateSchema, formatZodError } from "@/lib/validations/schemas";
import { z } from "zod";

const statusSchema = z.object({
  id: z.union([z.string(), z.number()]),
  paymentStatus: z.enum(["LUNAS", "BELUM_LUNAS", "TIDAK_TERBIT", "SUSPEND"]),
});

export async function updatePaymentStatus(
  id: string | number,
  paymentStatus: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT" | "SUSPEND"
) {
  try {
    statusSchema.parse({ id, paymentStatus });
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    const { role, userId } = await requireAuth();

    const data = await prisma.taxData.findUnique({ where: { id: numId } });
    if (!data) throw new Error("Not found");

    // Check permission — PENARIK hanya bisa update miliknya
    if (role === "PENARIK" && data.penarikId !== userId) {
      throw new Error("Anda tidak diperbolehkan mengubah data milik penarik lain.");
    }

    let sisa = data.sisaTagihan;
    let pembayaran = data.pembayaran;
    const now = new Date();

    if (paymentStatus === "LUNAS") {
      pembayaran = data.ketetapan;
      sisa = 0;
    } else {
      pembayaran = 0;
      sisa = data.ketetapan;
    }

    await prisma.taxData.update({
      where: { id: numId },
      data: {
        paymentStatus,
        pembayaran,
        sisaTagihan: sisa,
        tanggalBayar: paymentStatus === "LUNAS" ? now : null,
      },
    });

    await createAuditLog(
      "UPDATE_PAYMENT",
      "TaxData",
      data.namaWp,
      `Ubah status pembayaran menjadi ${paymentStatus} (ID: ${numId})`
    );

    // Kirim notifikasi ke semua Admin jika status berubah ke LUNAS
    if (paymentStatus === "LUNAS" || paymentStatus === "BELUM_LUNAS") {
      const penarikName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "PENGGUNA"] } },
        select: { id: true },
      });

      if (admins.length > 0) {
        const isLunas = paymentStatus === "LUNAS";
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: isLunas ? "✅ Setoran PBB Lunas" : "⚠️ Status Dibatalkan",
            message: isLunas
              ? `${penarikName?.name || "Penarik"} mengkonfirmasi WP ${data.namaWp} (${data.dusun || ""}, RT ${data.rt || "-"}/RW ${data.rw || "-"}) telah membayar.`
              : `${penarikName?.name || "Penarik"} membatalkan pelunasan WP ${data.namaWp} (${data.dusun || ""}, RT ${data.rt || "-"}/RW ${data.rw || "-"}) menjadi Belum Lunas.`,
            type: isLunas ? "ACCEPTED" : "INFO",
          })),
        });
      }
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function bulkUpdatePaymentStatus(
  ids: number[],
  paymentStatus: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT" | "SUSPEND"
) {
  try {
    if (!ids || ids.length === 0) return { success: false, message: "Tidak ada data yang dipilih" };
    const { role, userId } = await requireAuth();

    // Fetch the relevant data
    const taxDataRecords = await prisma.taxData.findMany({
      where: { id: { in: ids } },
    });

    if (role === "PENARIK") {
      const invalid = taxDataRecords.filter(d => d.penarikId !== userId);
      if (invalid.length > 0) {
        throw new Error("Anda tidak diperbolehkan mengubah data milik penarik lain.");
      }
    }

    const now = new Date();

    // Grouping by status action to batch update easily 
    // Wait, updating status individually allows correct `pembayaran` values since `ketetapan` differs per row.
    let updatedCount = 0;
    
    // Using transaction for atomic mass upate
    await prisma.$transaction(
      taxDataRecords.map(data => {
        let sisa = data.sisaTagihan;
        let pembayaran = data.pembayaran;

        if (paymentStatus === "LUNAS") {
          pembayaran = data.ketetapan;
          sisa = 0;
        } else {
          pembayaran = 0;
          sisa = data.ketetapan;
        }

        updatedCount++;
        return prisma.taxData.update({
          where: { id: data.id },
          data: {
            paymentStatus,
            pembayaran,
            sisaTagihan: sisa,
            tanggalBayar: paymentStatus === "LUNAS" ? now : null,
          },
        });
      })
    );

    // Append WP names into the log
    const wpNames = taxDataRecords.map(d => d.namaWp).join(", ");
    const limitedNames = wpNames.length > 60 ? wpNames.substring(0, 57) + "..." : wpNames;

    // Create single audit log for bulk
    await createAuditLog(
      "UPDATE_PAYMENT",
      "TaxData",
      limitedNames,
      `Ubah status pembayaran ${updatedCount} data WP menjadi ${paymentStatus}`
    );

    // Send notification to admins if status changed to LUNAS/BELUM_LUNAS
    if ((paymentStatus === "LUNAS" || paymentStatus === "BELUM_LUNAS") && (role === "PENARIK" || role === "ADMIN")) {
      const penarikName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "PENGGUNA"] } },
        select: { id: true },
      });

      if (admins.length > 0) {
        const isLunas = paymentStatus === "LUNAS";
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: isLunas ? "📦 Setoran Massal WP Lunas" : "⚠️ Pembatalan Massal",
            message: isLunas
              ? `${penarikName?.name || "Penarik"} mengkonfirmasi ${updatedCount} data WP sekaligus telah lunas.`
              : `${penarikName?.name || "Penarik"} membatalkan pelunasan ${updatedCount} data WP sekaligus.`,
            type: isLunas ? "ACCEPTED" : "INFO",
          })),
        });
      }
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true, count: updatedCount };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getWpByRegion(dusun: string | null, rw: string | null, tahun: number) {
  try {
    const data = await prisma.taxData.findMany({
      where: {
        tahun,
        dusun,
        rw,
      },
      select: {
        id: true,
        nop: true,
        namaWp: true,
        alamatObjek: true,
        dusun: true,
        rt: true,
        rw: true,
        ketetapan: true,
      },
      orderBy: {
        nop: "asc",
      },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getWpByPenarik(
  penarikId: string | null,
  tahun: number,
  page: number = 1,
  pageSize: number = 50,
  paymentStatus?: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT" | "SUSPEND"
) {
  try {
    const whereClause: Prisma.TaxDataWhereInput = {
      tahun,
      penarikId,
    };
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    const [data, total] = await Promise.all([
      prisma.taxData.findMany({
        where: whereClause,
        select: {
          id: true,
          nop: true,
          namaWp: true,
          alamatObjek: true,
          dusun: true,
          rt: true,
          rw: true,
          ketetapan: true,
          paymentStatus: true,
        },
        orderBy: {
          nop: "asc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.taxData.count({
        where: whereClause,
      }),
    ]);
    return { success: true, data, total };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function updateWpRegion(
  id: number,
  dusun: string | null,
  rt: string | null,
  rw: string | null
) {
  try {
    TaxRegionUpdateSchema.parse({ taxId: id, dusun, rt, rw });
    const { role, userId } = await requireAuth();

    const data = await prisma.taxData.findUnique({ where: { id } });
    if (!data) throw new Error("Not found");

    if (role === "PENARIK" && data.penarikId !== userId) {
      throw new Error("Anda tidak diperbolehkan mengubah wilayah data milik penarik lain.");
    }

    const updateData: Prisma.TaxDataUpdateInput = {};
    
    if (dusun !== null) {
      updateData.dusun = dusun === "none" ? null : dusun;
    }
    
    if (rt !== null) {
      updateData.rt = rt ? parseInt(rt, 10).toString().padStart(2, "0") : null;
    }
    
    if (rw !== null) {
      updateData.rw = rw ? parseInt(rw, 10).toString().padStart(2, "0") : null;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true }; // No changes needed
    }

    await prisma.taxData.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog(
      "UPDATE_REGION",
      "TaxData",
      data.namaWp,
      `Memperbarui lokasi WP ${data.namaWp} ke wilayah Dusun ${dusun || "-"}, RT ${rt || "-"}/RW ${rw || "-"}`
    );

    revalidatePath("/laporan");
    revalidatePath("/data-pajak");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function updateWpRegionBulk(
  ids: number[],
  dusun: string | null,
  rt: string | null,
  rw: string | null
) {
  try {
    const { role, userId } = await requireAuth();

    if (role === "PENARIK") {
      // Only allow updating if all IDs belong to this penarik
      const count = await prisma.taxData.count({
        where: {
          id: { in: ids },
          penarikId: userId,
        },
      });
      if (count !== ids.length) {
        throw new Error("Ada data pilihan yang bukan milik Anda.");
      }
    }

    const updateData: Prisma.TaxDataUpdateManyMutationInput = {};
    
    if (dusun !== null) {
      updateData.dusun = dusun === "none" ? null : dusun;
    }
    
    if (rt !== null) {
      updateData.rt = rt ? parseInt(rt, 10).toString().padStart(2, "0") : null;
    }
    
    if (rw !== null) {
      updateData.rw = rw ? parseInt(rw, 10).toString().padStart(2, "0") : null;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, count: 0 };
    }

    await prisma.taxData.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await createAuditLog(
      "UPDATE_REGION",
      "TaxData",
      null,
      `Memperbarui lokasi ${ids.length} WP ke wilayah Dusun ${dusun || "-"}, RT ${rt || "-"}/RW ${rw || "-"}`
    );

    revalidatePath("/laporan");
    revalidatePath("/data-pajak");
    return { success: true, count: ids.length };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function updateWpRegionByFilter(
  filters: {
    tahun: number;
    q?: string;
    dusun?: string;
    rw?: string;
    rt?: string;
    penarik?: string;
    regionStatus?: string;
  },
  dusun: string | null,
  rt: string | null,
  rw: string | null
) {
  try {
    const { role, userId } = await requireAuth();

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

    // Role check for PENARIK
    if (role === "PENARIK") {
      whereClause.penarikId = userId;
    }

    const updateData: Prisma.TaxDataUpdateManyMutationInput = {};
    
    if (dusun !== null) {
      updateData.dusun = dusun === "none" ? null : dusun;
    }
    
    if (rt !== null) {
      updateData.rt = rt ? parseInt(rt, 10).toString().padStart(2, "0") : null;
    }
    
    if (rw !== null) {
      updateData.rw = rw ? parseInt(rw, 10).toString().padStart(2, "0") : null;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, count: 0 };
    }

    const res = await prisma.taxData.updateMany({
      where: whereClause,
      data: updateData,
    });

    await createAuditLog(
      "UPDATE_REGION",
      "TaxData",
      null,
      `Update wilayah filter (${res.count} data) ke Dusun ${dusun || "-"}, RT ${rt || "-"}/RW ${rw || "-"}`
    );

    revalidatePath("/laporan");
    revalidatePath("/data-pajak");
    return { success: true, count: res.count };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}
export async function syncBapendaByFilter(filters: {
  tahun: number;
  q?: string;
  dusun?: string;
  rw?: string;
  rt?: string;
  penarik?: string;
  regionStatus?: string;
  paymentStatus?: string;
}) {
  try {
    const { role, userId } = await requireAuth();
    
    // Build where clause
    const whereClause: Prisma.TaxDataWhereInput = {
      tahun: filters.tahun,
    };

    const andFilters: Prisma.TaxDataWhereInput[] = [];
    if (filters.q) {
      andFilters.push({
        OR: [
          { nop: { contains: filters.q } },
          { namaWp: { contains: filters.q } },
        ],
      });
    }

    if (filters.dusun && filters.dusun !== "all") whereClause.dusun = filters.dusun;
    if (filters.rw && filters.rw !== "all") whereClause.rw = filters.rw;
    if (filters.rt && filters.rt !== "all") whereClause.rt = filters.rt;
    if (filters.penarik && filters.penarik !== "all") {
      if (filters.penarik === "none") whereClause.penarikId = null;
      else whereClause.penarikId = filters.penarik;
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      whereClause.paymentStatus = filters.paymentStatus as any;
    }

    if (andFilters.length > 0) whereClause.AND = andFilters;
    if (role === "PENARIK") whereClause.penarikId = userId;

    const allData = await prisma.taxData.findMany({
      where: whereClause,
      select: { id: true, nop: true, tahun: true }
    });

    if (allData.length === 0) return { success: true, count: 0 };

    // This is still a loop but on server, it can be optimized with better background jobs
    // For now, let's process in batches or just return IDs for client to handle but with better logic
    return { success: true, data: allData, count: allData.length };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data filter" };
  }
}
