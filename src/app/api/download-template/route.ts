import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data PBB Template");

    sheet.columns = [
      { header: "NOP", key: "nop", width: 25 },
      { header: "NAMA WP", key: "namaWp", width: 30 },
      { header: "ALAMAT OBJEK PAJAK", key: "alamatObjek", width: 40 },
      { header: "LUAS BUMI", key: "luasTanah", width: 15 },
      { header: "LUAS BNG", key: "luasBangunan", width: 15 },
      { header: "PAJAK THR", key: "ketetapan", width: 15 },
      { header: "TAGIHAN DENDA", key: "tagihanDenda", width: 15 },
      { header: "PEMBAYARAN", key: "pembayaran", width: 15 },
      { header: "POKOK", key: "pokok", width: 15 },
      { header: "DENDA", key: "denda", width: 15 },
      { header: "LEBIH BAYAR", key: "lebihBayar", width: 15 },
      { header: "TANGGAL BAYAR", key: "tanggalBayar", width: 20 },
      { header: "SISA TAGIHAN", key: "sisaTagihan", width: 15 },
      { header: "TEMPAT PEMBAYARAN", key: "tempatBayar", width: 25 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    // Add example rules/dummy data
    sheet.addRow({
      nop: "35.15.110.013.000-0001.0",
      namaWp: "CONTOH NAMA WP",
      alamatObjek: "DUSUN CONTOH RT 01 RW 02",
      luasTanah: 100,
      luasBangunan: 50,
      ketetapan: 25000,
      tagihanDenda: 0,
      pembayaran: 0,
      pokok: 0,
      denda: 0,
      lebihBayar: 0,
      tanggalBayar: "",
      sisaTagihan: 25000,
      tempatBayar: "",
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Template_DHKP_PBB.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Template Create Error: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
