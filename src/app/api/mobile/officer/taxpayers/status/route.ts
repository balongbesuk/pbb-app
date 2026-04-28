import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/app/actions/log-actions";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";
import type { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let auth;
    try {
      auth = await requireMobileAuth(req);
    } catch {
      return unauthorizedMobileResponse(headers);
    }

    const { taxId, status } = await req.json();

    if (!taxId || !status) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400, headers });
    }

    // Validate status against Prisma Enum (though we'll use string here for flexibility if needed, but best to match)
    const validStatuses = ["LUNAS", "BELUM_LUNAS", "TIDAK_TERBIT", "SUSPEND"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400, headers });
    }

    const numericTaxId = parseInt(String(taxId), 10);
    if (!Number.isFinite(numericTaxId)) {
      return NextResponse.json({ success: false, error: "ID pajak tidak valid" }, { status: 400, headers });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current taxpayer data
      const taxData = await tx.taxData.findUnique({
        where: { id: numericTaxId },
        include: { penarik: true }
      });

      if (!taxData) {
        throw new Error("Data Wajib Pajak tidak ditemukan");
      }

      if (auth.role === "PENARIK" && taxData.penarikId !== auth.userId) {
        throw new Error("Anda tidak diperbolehkan mengubah data milik penarik lain.");
      }

      const paymentStatus = status as PaymentStatus;
      const pembayaran = paymentStatus === "LUNAS" ? taxData.ketetapan : 0;
      const sisaTagihan = paymentStatus === "LUNAS" ? 0 : taxData.ketetapan;

      // 2. Update status
      const updatedTax = await tx.taxData.update({
        where: { id: numericTaxId },
        data: { 
          paymentStatus,
          pembayaran,
          sisaTagihan,
          tanggalBayar: paymentStatus === "LUNAS" ? new Date() : null,
        }
      });

      return { taxData, updatedTax };
    });

    // 3. Log the activity
    const statusLabels: Record<string, string> = {
      "LUNAS": "LUNAS",
      "BELUM_LUNAS": "BELUM LUNAS (DIBATALKAN)",
      "SUSPEND": "SENGKETA",
      "TIDAK_TERBIT": "TIDAK TERBIT"
    };

    await createAuditLog(
      "UPDATE_STATUS_MOBILE",
      "TaxData",
      result.taxData.namaWp,
      `Petugas mengubah status pembayaran WP ${result.taxData.namaWp} menjadi ${statusLabels[status] || status}`,
      auth.userId
    );

    return NextResponse.json({ 
      success: true, 
      message: `Status berhasil diubah menjadi ${statusLabels[status] || status}`,
      data: result.updatedTax
    }, { headers });

  } catch (error) {
    console.error("Taxpayer Status API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
