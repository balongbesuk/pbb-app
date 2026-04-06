import { NextRequest, NextResponse } from "next/server";
import { syncBapendaStatus } from "@/lib/bapenda-sync";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const { nop, tahun } = await req.json();
    const result = await syncBapendaStatus({
      nop: String(nop || ""),
      tahun: parseInt(String(tahun || ""), 10),
      clientIp: getClientIp(req),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terdapat kesalahan koneksi ke server pusat.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
