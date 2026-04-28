import { NextRequest, NextResponse } from "next/server";
import { syncBapendaStatus } from "@/lib/bapenda-sync";
import { getClientIp } from "@/lib/request-ip";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(req: NextRequest) {
  try {
    const { nop, tahun } = await req.json();
    const result = await syncBapendaStatus({
      nop: String(nop || ""),
      tahun: parseInt(String(tahun || ""), 10),
      clientIp: getClientIp(req),
    });

    return NextResponse.json(result.body, { status: result.status, headers: corsHeaders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terdapat kesalahan koneksi ke server pusat.";

    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
