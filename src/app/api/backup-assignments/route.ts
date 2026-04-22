import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AppUser } from "@/types/app";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as AppUser | undefined;
    if (!currentUser || currentUser.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    // Fetch all tax data for the year, including their assigned penarik
    const allTaxData = await prisma.taxData.findMany({
      where: { tahun },
      include: {
        penarik: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: [
        { dusun: "asc" },
        { rw: "asc" },
        { rt: "asc" },
        { nop: "asc" },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Penugasan PBB ${tahun}`);

    sheet.columns = [
      { header: "NOP", key: "nop", width: 25 },
      { header: "Nama WP", key: "namaWp", width: 30 },
      { header: "Dusun", key: "dusun", width: 15 },
      { header: "RT", key: "rt", width: 5 },
      { header: "RW", key: "rw", width: 5 },
      { header: "Nama Penarik (Edit di Sini)", key: "penarikName", width: 25 },
      { header: "Username Penarik", key: "username", width: 20 },
    ];

    // Style Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    allTaxData.forEach((tax) => {
      sheet.addRow({
        nop: tax.nop,
        namaWp: tax.namaWp,
        dusun: tax.dusun || "-",
        rt: tax.rt || "00",
        rw: tax.rw || "00",
        penarikName: tax.penarik?.name || "",
        username: tax.penarik?.username || "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Backup_Penugasan_${tahun}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Backup Error: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
