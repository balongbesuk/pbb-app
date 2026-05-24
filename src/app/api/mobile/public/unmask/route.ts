import { NextRequest, NextResponse } from "next/server";
import { getUnmaskedTaxData } from "@/app/actions/public-actions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(req: NextRequest) {
  try {
    const { id, pin, tahun } = await req.json();

    if (!id || !pin || !tahun) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap. Harap masukkan PIN." },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await getUnmaskedTaxData(Number(id), pin, Number(tahun));

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Mobile Public Unmask API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
