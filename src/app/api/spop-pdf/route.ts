import { NextRequest, NextResponse } from "next/server";
import { generateSpopPdf } from "@/lib/spop-pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pdfBytes = await generateSpopPdf(body);
    const filename = `spop-lspop-${Date.now()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat PDF SPOP/LSPOP:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat PDF SPOP/LSPOP." },
      { status: 500 },
    );
  }
}
