import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

  // Baca NOP dari wp.json
  const wpJsonPath = path.join(process.cwd(), "public/maps/wp.json");
  let gisNops = new Set<string>();
  if (fs.existsSync(wpJsonPath)) {
    try {
      const wpData = JSON.parse(fs.readFileSync(wpJsonPath, "utf-8"));
      gisNops = new Set<string>(
        (wpData.features || []).map((f: any) => (f.properties?.fullNop || "").replace(/\D/g, ""))
      );
    } catch {}
  }

  // Ambil semua NOP dari database
  const dbWps = await prisma.taxData.findMany({
    where: { tahun },
    select: {
      nop: true,
      namaWp: true,
      alamatObjek: true,
      dusun: true,
      rt: true,
      rw: true,
      paymentStatus: true,
    },
    orderBy: { nop: "asc" },
  });

  // NOP ada di database tapi tidak ada di peta
  const missingFromGis = dbWps
    .filter((w) => !gisNops.has(w.nop.replace(/\D/g, "")))
    .map((w) => ({
      nop: w.nop,
      namaWp: w.namaWp,
      alamatObjek: w.alamatObjek,
      dusun: w.dusun || "-",
      rt: w.rt || "-",
      rw: w.rw || "-",
      paymentStatus: w.paymentStatus,
    }));

  // Hitung NOP ada di peta tapi tidak di database
  const dbNopSet = new Set(dbWps.map((w) => w.nop.replace(/\D/g, "")));
  const gisOnlyCount = [...gisNops].filter((n) => !dbNopSet.has(n)).length;

  return NextResponse.json({
    summary: {
      totalDb: dbWps.length,
      totalGis: gisNops.size,
      missingFromGis: missingFromGis.length,
      gisOnlyCount,
    },
    missingFromGis,
  });
}
