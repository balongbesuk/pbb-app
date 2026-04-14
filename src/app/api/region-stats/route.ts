import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    // Ambil semua data pajak untuk tahun ini
    const allTax = await prisma.taxData.findMany({
      where: { tahun },
      select: {
        rt: true,
        rw: true,
        dusun: true,
        paymentStatus: true,
      },
    });

    const stats: Record<string, { total: number; lunas: number; percentage: number }> = {};

    // Helper untuk menambah stats
    const addStat = (key: string, isLunas: boolean) => {
      if (!stats[key]) stats[key] = { total: 0, lunas: 0, percentage: 0 };
      stats[key].total += 1;
      if (isLunas) stats[key].lunas += 1;
    };

    let totalAll = 0;
    let lunasAll = 0;

    for (const tax of allTax) {
      const isLunas = tax.paymentStatus === "LUNAS";
      totalAll++;
      if (isLunas) lunasAll++;

      // Level RT
      if (tax.rt && tax.rw) {
        const rtKey = `RT_${parseInt(tax.rt)}RW_${parseInt(tax.rw)}`;
        addStat(rtKey, isLunas);
      }

      // Level RW
      if (tax.rw) {
        const rwKey = `RW_${parseInt(tax.rw)}`;
        addStat(rwKey, isLunas);
      }

      // Level Dusun
      if (tax.dusun) {
        const dusunKey = `DUSUN_${tax.dusun.toUpperCase()}`;
        addStat(dusunKey, isLunas);
      }
    }

    // Level Desa (total keseluruhan)
    stats["DESA_TOTAL"] = {
      total: totalAll,
      lunas: lunasAll,
      percentage: totalAll > 0 ? (lunasAll / totalAll) * 100 : 0,
    };

    // Hitung persentase untuk semua level
    for (const key of Object.keys(stats)) {
      const s = stats[key];
      s.percentage = s.total > 0 ? (s.lunas / s.total) * 100 : 0;
    }

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Gagal menghitung statistik wilayah:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
