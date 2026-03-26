import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Perketat akses: Hanya ADMIN dan PENARIK yang bisa lihat daftar tabel pajak (Internal Data)
  // PENGGUNA (Warga) hanya boleh pakai Pencarian Publik (public-actions)
  if (!session?.user || !["ADMIN", "PENARIK"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
  const filterDusun = searchParams.get("dusun") || "";
  const filterRw = searchParams.get("rw") || "";
  const filterRt = searchParams.get("rt") || "";
  const filterPenarik = searchParams.get("penarik") || "";
  const regionStatus = searchParams.get("regionStatus") || "all";
  const paymentStatus = searchParams.get("paymentStatus") || "all";
   const pageSize = 50;
 
  const whereClause: Prisma.TaxDataWhereInput = {
    tahun,
  };

  if (paymentStatus !== "all") {
    whereClause.paymentStatus = paymentStatus as any;
  }

  const andFilters: Prisma.TaxDataWhereInput[] = [];

  if (query) {
    andFilters.push({
      OR: [
        { nop: { contains: query } },
        { namaWp: { contains: query } },
        { alamatObjek: { contains: query } },
      ],
    });
  }

  if (regionStatus === "incomplete") {
    andFilters.push({
      OR: [{ dusun: null }, { rw: null }, { rt: null }, { dusun: "" }, { rw: "" }, { rt: "" }],
    });
  }

  if (filterDusun && filterDusun !== "all") whereClause.dusun = filterDusun;
  if (filterRw && filterRw !== "all") whereClause.rw = filterRw;
  if (filterRt && filterRt !== "all") whereClause.rt = filterRt;
  if (filterPenarik && filterPenarik !== "all") {
    if (filterPenarik === "none") {
      whereClause.penarikId = null;
    } else {
      whereClause.penarikId = filterPenarik;
    }
  }

  if (andFilters.length > 0) {
    whereClause.AND = andFilters;
  }

  const [data, total] = await Promise.all([
    prisma.taxData.findMany({
      where: whereClause,
      include: {
        penarik: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            dusun: true,
            rt: true,
            rw: true,
          },
        },
      },
      orderBy: { nop: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.taxData.count({
      where: whereClause,
    }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}
