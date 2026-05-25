"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";
import { TaxRegionUpdateSchema, formatZodError } from "@/lib/validations/schemas";
import { z } from "zod";
import { buildTaxWhereInput } from "@/lib/tax-query";
import { notifyUser, notifyNopSubscribers } from "@/lib/push-notification";

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

    // Notifikasi dan Push Notification
    if (paymentStatus === "LUNAS" || paymentStatus === "BELUM_LUNAS") {
      const isLunas = paymentStatus === "LUNAS";
      const penarikName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Siapkan pesan notifikasi
      const title = isLunas ? "✅ Setoran PBB Lunas" : "⚠️ Status Dibatalkan";
      const message = isLunas
        ? `${penarikName?.name || (role === "ADMIN" ? "Admin" : "Penarik")} mengkonfirmasi WP ${data.namaWp} telah membayar.`
        : `${penarikName?.name || (role === "ADMIN" ? "Admin" : "Penarik")} membatalkan pelunasan WP ${data.namaWp} menjadi Belum Lunas.`;

      // 1. Notifikasi ke Admin
      if (role !== "ADMIN") {
        const admins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "PENGGUNA"] } },
          select: { id: true },
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title,
              message,
              type: isLunas ? "ACCEPTED" : "INFO",
            })),
          });
          
          for (const admin of admins) {
            notifyUser(admin.id, title, message);
          }
        }
      }

      // 2. Notifikasi ke Penarik (jika diubah oleh Admin)
      if (role === "ADMIN" && data.penarikId && data.penarikId !== userId) {
        await prisma.notification.create({
          data: {
            userId: data.penarikId,
            title,
            message,
            type: isLunas ? "ACCEPTED" : "INFO",
          }
        });
        notifyUser(data.penarikId, title, message);
      }
      
      // 3. Notifikasi ke Warga (Push Notification saja, tidak ada tabel User untuk warga)
      const cleanNop = data.nop.replace(/\D/g, "");
      if (cleanNop.length >= 18) {
        const maskedNop = `${cleanNop.substring(0, 5)}...${cleanNop.substring(14)}`;
        const citizenTitle = isLunas ? "Pembayaran Diterima!" : "Pembayaran Dibatalkan";
        const citizenMessage = isLunas
          ? `Tagihan PBB Anda untuk NOP ${maskedNop} telah dinyatakan LUNAS di server pusat.`
          : `Pembayaran PBB untuk NOP ${maskedNop} telah dibatalkan menjadi BELUM LUNAS.`;
        notifyNopSubscribers(cleanNop, citizenTitle, citizenMessage);
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
    let updatedCount = 0;
    
    // Using transaction for atomic mass update
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

    const wpNames = taxDataRecords.map(d => d.namaWp).join(", ");
    const limitedNames = wpNames.length > 60 ? wpNames.substring(0, 57) + "..." : wpNames;

    await createAuditLog(
      "UPDATE_PAYMENT",
      "TaxData",
      limitedNames,
      `Ubah status pembayaran ${updatedCount} data WP menjadi ${paymentStatus}`
    );

    if ((paymentStatus === "LUNAS" || paymentStatus === "BELUM_LUNAS")) {
      const isLunas = paymentStatus === "LUNAS";
      const penarikName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      
      const title = isLunas ? "📦 Setoran Massal WP Lunas" : "⚠️ Pembatalan Massal";
      const message = isLunas
        ? `${penarikName?.name || (role === "ADMIN" ? "Admin" : "Penarik")} mengkonfirmasi ${updatedCount} data WP sekaligus telah lunas.`
        : `${penarikName?.name || (role === "ADMIN" ? "Admin" : "Penarik")} membatalkan pelunasan ${updatedCount} data WP sekaligus.`;

      // 1. Notifikasi ke Admin
      if (role !== "ADMIN") {
        const admins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "PENGGUNA"] } },
          select: { id: true },
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title,
              message,
              type: isLunas ? "ACCEPTED" : "INFO",
            })),
          });
          
          for (const admin of admins) {
            notifyUser(admin.id, title, message);
          }
        }
      }

      // 2. Notifikasi ke masing-masing Penarik (jika diubah oleh Admin)
      if (role === "ADMIN") {
        const penarikIdsToNotify = new Set<string>();
        taxDataRecords.forEach(d => {
          if (d.penarikId && d.penarikId !== userId) {
            penarikIdsToNotify.add(d.penarikId);
          }
        });

        if (penarikIdsToNotify.size > 0) {
          await prisma.notification.createMany({
            data: Array.from(penarikIdsToNotify).map(pid => ({
              userId: pid,
              title,
              message,
              type: isLunas ? "ACCEPTED" : "INFO",
            }))
          });
          
          for (const pid of Array.from(penarikIdsToNotify)) {
            notifyUser(pid, title, message);
          }
        }
      }
      
      // 3. Notifikasi ke Warga yang berlangganan masing-masing NOP
      const citizenTitle = isLunas ? "Pembayaran Diterima!" : "Pembayaran Dibatalkan";
      for (const d of taxDataRecords) {
        const cleanNop = d.nop.replace(/\D/g, "");
        if (cleanNop.length >= 18) {
          const maskedNop = `${cleanNop.substring(0, 5)}...${cleanNop.substring(14)}`;
          const citizenMessage = isLunas
            ? `Tagihan PBB Anda untuk NOP ${maskedNop} telah dinyatakan LUNAS di server pusat.`
            : `Pembayaran PBB untuk NOP ${maskedNop} telah dibatalkan menjadi BELUM LUNAS.`;
          notifyNopSubscribers(cleanNop, citizenTitle, citizenMessage);
        }
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
    blok?: string;
    penarik?: string;
    regionStatus?: string;
  },
  dusun: string | null,
  rt: string | null,
  rw: string | null
) {
  try {
    const { role, userId } = await requireAuth();

    const whereClause = buildTaxWhereInput(filters, {
      includePaymentStatus: false,
      roleScope: { role, userId, restrictPenarikToOwn: true },
    });

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
  blok?: string;
  penarik?: string;
  regionStatus?: string;
  paymentStatus?: string;
}) {
  try {
    const { role, userId } = await requireAuth();

    const whereClause = buildTaxWhereInput(filters, {
      includeAddressSearch: false,
      roleScope: { role, userId, restrictPenarikToOwn: true },
    });

    const allData = await prisma.taxData.findMany({
      where: whereClause,
      select: { id: true, nop: true, tahun: true }
    });

    if (allData.length === 0) return { success: true, count: 0 };

    return { success: true, data: allData, count: allData.length };
  } catch {
    return { success: false, message: "Gagal mengambil data filter" };
  }
}
