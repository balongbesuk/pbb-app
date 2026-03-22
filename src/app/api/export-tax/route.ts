import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = session.user as any;
    if (user.role === "PENGGUNA") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const dusun = searchParams.get("dusun") || "all";
    const rw = searchParams.get("rw") || "all";
    const rt = searchParams.get("rt") || "all";
    const penarik = searchParams.get("penarik") || "all";
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    // Build Where Clause
    const whereClause: Prisma.TaxDataWhereInput = { tahun };

    if (search) {
      whereClause.OR = [{ nop: { contains: search } }, { namaWp: { contains: search } }];
    }

    if (dusun !== "all") whereClause.dusun = dusun;
    if (rw !== "all") whereClause.rw = rw;
    if (rt !== "all") whereClause.rt = rt;

    if (penarik === "none") {
      whereClause.penarikId = null;
    } else if (penarik !== "all") {
      whereClause.penarikId = penarik;
    }

    // Role-based access control matching the data-pajak page
    if (user.role === "PENARIK") {
      // PENARIK can only see their own assigned tax data
      whereClause.penarikId = user.id;
    }

    // Fetch all matching data
    const data = await prisma.taxData.findMany({
      where: whereClause,
      include: {
        penarik: { select: { name: true } },
      },
      orderBy: [{ dusun: "asc" }, { rw: "asc" }, { rt: "asc" }, { namaWp: "asc" }],
    });

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data PBB");

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NOP", key: "nop", width: 25 },
      { header: "Nama WP", key: "namaWp", width: 30 },
      { header: "Alamat Objek", key: "alamatObjek", width: 40 },
      { header: "Dusun", key: "dusun", width: 15 },
      { header: "RT", key: "rt", width: 5 },
      { header: "RW", key: "rw", width: 5 },
      { header: "Ketetapan", key: "ketetapan", width: 15 },
      { header: "Pembayaran", key: "pembayaran", width: 15 },
      { header: "Sisa", key: "sisa", width: 15 },
      { header: "Status Pemda", key: "statusPemda", width: 15 },
      { header: "Status Tarik", key: "statusTarik", width: 15 },
      { header: "Penarik", key: "penarik", width: 25 },
    ];

    // Styling Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    data.forEach((item, index) => {
      sheet.addRow({
        no: index + 1,
        nop: item.nop,
        namaWp: item.namaWp,
        alamatObjek: item.alamatObjek,
        dusun: item.dusun,
        rt: item.rt || "-",
        rw: item.rw || "-",
        ketetapan: item.ketetapan,
        pembayaran: item.pembayaran,
        sisa: item.sisaTagihan,
        statusPemda: item.paymentStatus === "LUNAS" ? "LUNAS PEMDA" : "BELUM LUNAS",
        statusTarik: item.sisaTagihan <= 0 ? "LUNAS DITARIK" : "BELUM LUNAS",
        penarik: item.penarik?.name || "Belum Dialokasikan",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // Return the file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Data_Pajak_${tahun}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
