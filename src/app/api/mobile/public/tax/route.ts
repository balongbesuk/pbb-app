import { NextRequest, NextResponse } from "next/server";
import { searchPublicTaxData } from "@/app/actions/public-actions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("nop") || "";
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const page = parseInt(searchParams.get("page") || "1");
    
    // We don't require Turnstile for mobile app API
    const result = await searchPublicTaxData(query, tahun, page, 20, undefined, true);

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Mobile Public Tax API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
