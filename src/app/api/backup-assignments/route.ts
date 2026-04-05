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

    // Fetch all users with role PENARIK and their assigned tax data for the year
    const penariks = await prisma.user.findMany({
      where: { role: "PENARIK" },
      include: {
        taxData: {
          where: { tahun },
          select: {
            nop: true,
            dusun: true,
            rt: true,
            rw: true,
          },
          orderBy: [{ dusun: "asc" }, { rw: "asc" }, { rt: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Backup Penarik ${tahun}`);

    sheet.columns = [
      { header: "Nama Penarik", key: "penarikName", width: 25 },
      { header: "Username", key: "username", width: 20 },
      { header: "Area Tugas", key: "area", width: 30 },
      { header: "NOP (Wajib Ada)", key: "nop", width: 25 },
      { header: "Dusun", key: "dusun", width: 15 },
      { header: "RT", key: "rt", width: 5 },
      { header: "RW", key: "rw", width: 5 },
    ];

    // Style Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    penariks.forEach((p) => {
      const areaInfo = `${p.dusun || "Semua"} / RT ${p.rt || "Semua"} / RW ${p.rw || "Semua"}`;

      if (p.taxData.length === 0) {
        sheet.addRow({
          penarikName: p.name,
          username: p.username,
          area: areaInfo,
          nop: "-",
        });
      } else {
        p.taxData.forEach((tax, idx) => {
          sheet.addRow({
            penarikName: idx === 0 ? p.name : "",
            username: idx === 0 ? p.username : "",
            area: idx === 0 ? areaInfo : "",
            nop: tax.nop,
            dusun: tax.dusun,
            rt: tax.rt,
            rw: tax.rw,
          });
        });
      }
      // Add empty row between penariks
      sheet.addRow({});
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
