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
    const searchQuery = query.trim();
    const pureNumbers = searchQuery.replace(/\D/g, "");
    
    // Generasi variasi format NOP untuk pencarian yang lebih tangguh
    const variations: string[] = [searchQuery];
    if (pureNumbers.length > 0) variations.push(pureNumbers); // Cari angka mentah

    if (pureNumbers.length >= 2) {
      let v1 = ""; // Standard: XX.XX.XXX.XXX.XXX-XXXX.X
      let v2 = ""; // All Dots: XX.XX.XXX.XXX.XXX.XXXX.X
      
      v1 += pureNumbers.substring(0, 2);
      v2 += pureNumbers.substring(0, 2);
      
      if (pureNumbers.length > 2) {
        v1 += "." + pureNumbers.substring(2, 4);
        v2 += "." + pureNumbers.substring(2, 4);
      }
      if (pureNumbers.length > 4) {
        v1 += "." + pureNumbers.substring(4, 7);
        v2 += "." + pureNumbers.substring(4, 7);
      }
      if (pureNumbers.length > 7) {
        v1 += "." + pureNumbers.substring(7, 10);
        v2 += "." + pureNumbers.substring(7, 10);
      }
      if (pureNumbers.length > 10) {
        v1 += "." + pureNumbers.substring(10, 13);
        v2 += "." + pureNumbers.substring(10, 13);
      }
      if (pureNumbers.length > 13) {
        v1 += "-" + pureNumbers.substring(13, 17);
        v2 += "." + pureNumbers.substring(13, 17);
      }
      if (pureNumbers.length > 17) {
        v1 += "." + pureNumbers.substring(17, 18);
        v2 += "." + pureNumbers.substring(17, 18);
      }
      variations.push(v1, v2);
    }

    // Filter duplikat dan string kosong
    const finalVariations = Array.from(new Set(variations.filter(v => v.length >= 3)));

    const orConditions: Prisma.TaxDataWhereInput[] = [
      ...finalVariations.map(v => ({ nop: { contains: v } })),
      { namaWp: { contains: searchQuery } },
      { namaWp: { contains: searchQuery.toUpperCase() } },
      { alamatObjek: { contains: searchQuery } },
      { alamatObjek: { contains: searchQuery.toUpperCase() } },
    ];
    
    andFilters.push({ OR: orConditions });
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
