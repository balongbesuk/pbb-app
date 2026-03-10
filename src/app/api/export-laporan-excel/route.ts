import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    // Aggregate Data by Penarik and PaymentStatus
    const penarikStatsRaw = await prisma.taxData.groupBy({
      by: ["penarikId", "paymentStatus"],
      where: { tahun },
      _count: { nop: true },
      _sum: { ketetapan: true, pembayaran: true, sisaTagihan: true },
    });

    const penarikMapReduce = new Map<string, any>();

    penarikStatsRaw.forEach((stat) => {
      const pId = stat.penarikId || "unassigned";
      if (!penarikMapReduce.has(pId)) {
        penarikMapReduce.set(pId, {
          penarikId: stat.penarikId,
          _count: { nop: 0 },
          _sum: { ketetapan: 0, pembayaran: 0, sisaTagihan: 0 },
          lunasCount: 0,
          belumLunasCount: 0,
        });
      }

      const curr = penarikMapReduce.get(pId);
      curr._count.nop += stat._count.nop;
      curr._sum.ketetapan += stat._sum.ketetapan || 0;
      curr._sum.pembayaran += stat._sum.pembayaran || 0;
      curr._sum.sisaTagihan += stat._sum.sisaTagihan || 0;

      if (stat.paymentStatus === "LUNAS") {
        curr.lunasCount += stat._count.nop;
      } else {
        curr.belumLunasCount += stat._count.nop;
      }
    });

    const penarikStatsFlat = Array.from(penarikMapReduce.values());

    const penarikUsers = await prisma.user.findMany({
      where: { role: "PENARIK" },
      select: { id: true, name: true, dusun: true },
    });

    const penarikMap = new Map<string, { name: string | null; dusun: string | null }>(
      penarikUsers.map((u: { id: string; name: string | null; dusun: string | null }) => [u.id, u])
    );

    const combinedStats = penarikStatsFlat
      .map((stat: any) => ({
        ...stat,
        penarikName: stat.penarikId
          ? penarikMap.get(stat.penarikId as string)?.name || "Penarik Tidak Ditemukan"
          : "Belum Dialokasikan",
        penarikDusun: stat.penarikId ? penarikMap.get(stat.penarikId as string)?.dusun || "" : "",
      }))
      .sort((a: any, b: any) => a.penarikName.localeCompare(b.penarikName));

    // Calculate overall totals
    const totalWp = penarikStatsFlat.reduce((acc: number, curr: any) => acc + curr._count.nop, 0);
    const totalWpLunas = penarikStatsFlat.reduce(
      (acc: number, curr: any) => acc + curr.lunasCount,
      0
    );
    const totalWpBelumLunas = penarikStatsFlat.reduce(
      (acc: number, curr: any) => acc + curr.belumLunasCount,
      0
    );
    const totalTarget = penarikStatsFlat.reduce(
      (acc: number, curr: any) => acc + (curr._sum.ketetapan || 0),
      0
    );
    const totalRealisasi = penarikStatsFlat.reduce(
      (acc: number, curr: any) => acc + (curr._sum.pembayaran || 0),
      0
    );
    const totalSisa = penarikStatsFlat.reduce(
      (acc: number, curr: any) => acc + (curr._sum.sisaTagihan || 0),
      0
    );
    const overallPercent = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Laporan Rekapitulasi ${tahun}`);

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Penarik / Kolektor", key: "penarikName", width: 30 },
      { header: "Wilayah", key: "wilayah", width: 15 },
      { header: "Total WP", key: "totalWp", width: 10 },
      { header: "Lunas", key: "lunas", width: 10 },
      { header: "Belum", key: "belum", width: 10 },
      { header: "Ketetapan (Target)", key: "target", width: 20 },
      { header: "Realisasi (Terbayar)", key: "realisasi", width: 20 },
      { header: "Sisa Pagu", key: "sisa", width: 20 },
      { header: "Persentase (%)", key: "persentase", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    let rowIndex = 2;
    combinedStats.forEach((stat, index) => {
      const target = stat._sum.ketetapan || 0;
      const realisasi = stat._sum.pembayaran || 0;
      const sisa = stat._sum.sisaTagihan || 0;
      const percent = target > 0 ? (realisasi / target) * 100 : 0;

      sheet.addRow({
        no: index + 1,
        penarikName: stat.penarikName,
        wilayah: stat.penarikDusun || "-",
        totalWp: stat._count.nop,
        lunas: stat.lunasCount,
        belum: stat.belumLunasCount,
        target: target,
        realisasi: realisasi,
        sisa: sisa,
        persentase: parseFloat(percent.toFixed(2)),
      });
      rowIndex++;
    });

    // Formatting currency and numbers
    const currencyFormat = '"Rp"#,##0;[Red]\-"Rp"#,##0';
    for (let current = 2; current <= rowIndex; current++) {
      sheet.getCell(`G${current}`).numFmt = currencyFormat;
      sheet.getCell(`H${current}`).numFmt = currencyFormat;
      sheet.getCell(`I${current}`).numFmt = currencyFormat;
    }

    // Add Total Row
    const totalRow = sheet.addRow({
      no: "",
      penarikName: "TOTAL KESELURUHAN",
      wilayah: "-",
      totalWp: totalWp,
      lunas: totalWpLunas,
      belum: totalWpBelumLunas,
      target: totalTarget,
      realisasi: totalRealisasi,
      sisa: totalSisa,
      persentase: parseFloat(overallPercent.toFixed(2)),
    });

    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } }; // Yellowish for total
    sheet.getCell(`G${rowIndex}`).numFmt = currencyFormat;
    sheet.getCell(`H${rowIndex}`).numFmt = currencyFormat;
    sheet.getCell(`I${rowIndex}`).numFmt = currencyFormat;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Rekapitulasi_PBB_${tahun}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
