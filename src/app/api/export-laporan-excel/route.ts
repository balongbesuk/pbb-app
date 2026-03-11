import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    // Fetch village config for header
    const configRows = (await prisma.$queryRawUnsafe(
      `SELECT namaDesa, kecamatan, kabupaten, logoUrl FROM "VillageConfig" LIMIT 1`
    )) as any[];
    const villageConfig = configRows[0] || {
      namaDesa: "",
      kecamatan: "",
      kabupaten: "",
      logoUrl: null,
    };

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
        penarikDusun: stat.penarikId
          ? penarikMap.get(stat.penarikId as string)?.dusun || ""
          : "",
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
    workbook.creator = "PBB Manager";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Laporan Rekapitulasi ${tahun}`);

    // ─── KOP SURAT (Header Area) rows 1–5 ────────────────────────────────
    const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    // Rows 1-4: header text (merged B1:J4, logo goes in A1:A4)
    sheet.mergeCells("B1:J4");
    const kopCell = sheet.getCell("B1");
    const kopLines: string[] = [];
    if (villageConfig.namaDesa) {
      kopLines.push(`PEMERINTAH DESA ${String(villageConfig.namaDesa).toUpperCase()}`);
    } else {
      kopLines.push("PEMERINTAH DESA");
    }
    if (villageConfig.kecamatan && villageConfig.kabupaten) {
      kopLines.push(
        `KECAMATAN ${String(villageConfig.kecamatan).toUpperCase()}, KABUPATEN ${String(villageConfig.kabupaten).toUpperCase()}`
      );
    }
    kopLines.push("");
    kopLines.push("LAPORAN REKAPITULASI PAJAK BUMI DAN BANGUNAN");
    kopLines.push(`TAHUN PAJAK ${tahun}`);

    kopCell.value = kopLines.join("\n");
    kopCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    kopCell.font = { bold: true, size: 12, name: "Arial" };
    for (let r = 1; r <= 4; r++) sheet.getRow(r).height = 18;

    // Insert logo image if available
    if (villageConfig.logoUrl) {
      try {
        const logoPath = path.join(
          process.cwd(),
          "public",
          String(villageConfig.logoUrl).replace(/^\//, "")
        );
        const logoBuffer = await readFile(logoPath);
        const ext = (String(villageConfig.logoUrl).split(".").pop() || "png").toLowerCase();
        const imageType: "png" | "jpeg" | "gif" = ext === "jpg" || ext === "jpeg" ? "jpeg" : ext === "gif" ? "gif" : "png";

        const imageId = workbook.addImage({
          buffer: logoBuffer as any,
          extension: imageType,
        });

        sheet.addImage(imageId, {
          tl: { col: 0, row: 0 } as any,
          br: { col: 1, row: 4 } as any,
          editAs: "oneCell",
        });
      } catch (imgErr) {
        console.warn("Could not insert logo into Excel:", imgErr);
      }
    }

    // Row 5: blue separator strip
    sheet.mergeCells("A5:J5");
    sheet.getCell("A5").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A56DB" },
    };
    sheet.getRow(5).height = 4;

    // Row 6: empty spacer
    sheet.getRow(6).height = 8;

    // ─── COLUMN DEFINITIONS ───────────────────────────────────────────────
    sheet.columns = [
      { key: "no", width: 5 },
      { key: "penarikName", width: 30 },
      { key: "wilayah", width: 15 },
      { key: "totalWp", width: 10 },
      { key: "lunas", width: 10 },
      { key: "belum", width: 10 },
      { key: "target", width: 22 },
      { key: "realisasi", width: 22 },
      { key: "sisa", width: 22 },
      { key: "persentase", width: 15 },
    ];

    // Header row at row 7
    const headerRowNum = 7;
    const headerRow = sheet.getRow(headerRowNum);
    headerRow.values = [
      "No",
      "Penarik / Kolektor",
      "Wilayah",
      "Total WP",
      "Lunas",
      "Belum",
      "Ketetapan (Target)",
      "Realisasi (Terbayar)",
      "Sisa Pagu",
      "Persentase (%)",
    ];
    headerRow.font = { bold: true, name: "Arial", size: 10, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A56DB" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 30;
    COL_LETTERS.forEach((col) => {
      sheet.getCell(`${col}${headerRowNum}`).border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin", color: { argb: "FFAAAAAA" } },
        right: { style: "thin", color: { argb: "FFAAAAAA" } },
      };
    });

    const currencyFormat = '"Rp"#,##0;[Red]\\-"Rp"#,##0';

    // ─── DATA ROWS ────────────────────────────────────────────────────────
    let rowIndex = headerRowNum + 1;
    combinedStats.forEach((stat, index) => {
      const target = stat._sum.ketetapan || 0;
      const realisasi = stat._sum.pembayaran || 0;
      const sisa = stat._sum.sisaTagihan || 0;
      const percent = target > 0 ? (realisasi / target) * 100 : 0;

      const row = sheet.addRow({
        no: index + 1,
        penarikName: stat.penarikName,
        wilayah: stat.penarikDusun || "-",
        totalWp: stat._count.nop,
        lunas: stat.lunasCount,
        belum: stat.belumLunasCount,
        target,
        realisasi,
        sisa,
        persentase: parseFloat(percent.toFixed(2)),
      });

      row.font = { name: "Arial", size: 10 };
      // Zebra striping
      if (index % 2 === 1) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
      }
      row.alignment = { vertical: "middle" };
      COL_LETTERS.forEach((col) => {
        row.getCell(col).border = {
          top: { style: "hair", color: { argb: "FFDDDDDD" } },
          bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
          left: { style: "hair", color: { argb: "FFDDDDDD" } },
          right: { style: "hair", color: { argb: "FFDDDDDD" } },
        };
      });

      rowIndex++;
    });

    // Currency formatting for data rows
    for (let current = headerRowNum + 1; current < rowIndex; current++) {
      sheet.getCell(`G${current}`).numFmt = currencyFormat;
      sheet.getCell(`H${current}`).numFmt = currencyFormat;
      sheet.getCell(`I${current}`).numFmt = currencyFormat;
    }

    // ─── TOTAL ROW ────────────────────────────────────────────────────────
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

    totalRow.font = { bold: true, name: "Arial", size: 10 };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF176" } };
    COL_LETTERS.forEach((col) => {
      totalRow.getCell(col).border = {
        top: { style: "medium", color: { argb: "FFAAAAAA" } },
        bottom: { style: "medium", color: { argb: "FFAAAAAA" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
    sheet.getCell(`G${rowIndex}`).numFmt = currencyFormat;
    sheet.getCell(`H${rowIndex}`).numFmt = currencyFormat;
    sheet.getCell(`I${rowIndex}`).numFmt = currencyFormat;

    // ─── FOOTER ───────────────────────────────────────────────────────────
    sheet.addRow([]);
    const footerRow = sheet.addRow([
      `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
    ]);
    footerRow.font = { italic: true, size: 9, color: { argb: "FF888888" }, name: "Arial" };

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
