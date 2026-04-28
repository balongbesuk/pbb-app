import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { restoreDatabaseFromZip } from "@/lib/restore";

type SessionUserWithRole = { role?: string | null };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUserWithRole | undefined;

  if (!session || sessionUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File backup tidak ditemukan dalam request." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await restoreDatabaseFromZip(buffer);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses restore." }, { status: 500 });
  }
}
