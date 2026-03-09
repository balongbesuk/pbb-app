"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "./log-actions";

export async function updatePaymentStatus(id: string | number, paymentStatus: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT") {
  try {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const data = await prisma.taxData.findUnique({ where: { id: numId } });
    if (!data) throw new Error("Not found");

    // Check permission
    if (userRole === "PENARIK" && data.penarikId !== userId) {
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
        tanggalBayar: paymentStatus === "LUNAS" ? now : null
      }
    });

    await createAuditLog("UPDATE_PAYMENT", "TaxData", numId.toString(), `Ubah status pembayaran menjadi ${paymentStatus}`);

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getWpByRegion(dusun: string | null, rw: string | null, tahun: number) {
  try {
    const data = await prisma.taxData.findMany({
      where: {
        tahun,
        dusun,
        rw
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
        namaWp: 'asc'
      }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
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
      penarikId
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
          namaWp: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.taxData.count({
        where: whereClause
      })
    ]);
    return { success: true, data, total };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateWpRegion(id: number, dusun: string | null, rt: string | null, rw: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const data = await prisma.taxData.findUnique({ where: { id } });
    if (!data) throw new Error("Not found");

    if (userRole === "PENARIK" && data.penarikId !== userId) {
      throw new Error("Anda tidak diperbolehkan mengubah wilayah data milik penarik lain.");
    }

    await prisma.taxData.update({
      where: { id },
      data: {
        dusun,
        rt,
        rw
      }
    });

    await createAuditLog("UPDATE_REGION", "TaxData", id.toString(), `Dusun: ${dusun}, RT: ${rt}, RW: ${rw}`);

    revalidatePath("/laporan");
    revalidatePath("/data-pajak");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateWpRegionBulk(ids: number[], dusun: string | null, rt: string | null, rw: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole === "PENARIK") {
      // Only allow updating if all IDs belong to this penarik
      const count = await prisma.taxData.count({
        where: {
          id: { in: ids },
          penarikId: userId
        }
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
        rw
      }
    });

    revalidatePath("/laporan");
    revalidatePath("/data-pajak");
    return { success: true, count: ids.length };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
