"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./log-actions";
import { TaxRegionUpdateSchema, formatZodError } from "@/lib/validations/schemas";
import { z } from "zod";

const statusSchema = z.object({
  id: z.union([z.string(), z.number()]),
  paymentStatus: z.enum(["LUNAS", "BELUM_LUNAS", "TIDAK_TERBIT"]),
});

export async function updatePaymentStatus(
  id: string | number,
  paymentStatus: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT"
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
    } else if (paymentStatus === "BELUM_LUNAS") {
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
    if (paymentStatus === "LUNAS") {
      const penarikName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Ambil semua user Admin & Pengguna untuk dikirim notif
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "PENGGUNA"] } },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "✅ Setoran PBB Lunas",
            message: `${penarikName?.name || "Penarik"} mengkonfirmasi WP ${data.namaWp} (${data.dusun || ""}, RT ${data.rt || "-"}/RW ${data.rw || "-"}) telah membayar.`,
            type: "ACCEPTED",
          })),
        });
      }
    }

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
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
        namaWp: "asc",
      },
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getWpByPenarik(
  penarikId: string | null,
  tahun: number,
  page: number = 1,
  pageSize: number = 50,
  paymentStatus?: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT"
) {
  try {
    const whereClause: any = {
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
          namaWp: "asc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.taxData.count({
        where: whereClause,
      }),
    ]);
    return { success: true, data, total };
  } catch (error: any) {
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

    await prisma.taxData.update({
      where: { id },
      data: {
        dusun,
        rt,
        rw,
      },
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
  } catch (error: any) {
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

    await prisma.taxData.updateMany({
      where: { id: { in: ids } },
      data: {
        dusun,
        rt,
        rw,
      },
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
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}
