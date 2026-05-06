import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getArchiveList } from "@/app/actions/archive-actions";
import type { AppUser } from "@/types/app";
import { buildTaxOrderBy, buildTaxWhereInput } from "@/lib/tax-query";

const INTERNAL_ROLES: AppUser["role"][] = ["ADMIN", "PENARIK"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as AppUser | undefined;
  
  // Perketat akses: Hanya ADMIN dan PENARIK yang bisa lihat daftar tabel pajak (Internal Data)
  // PENGGUNA (Warga) hanya boleh pakai Pencarian Publik (public-actions)
  if (!currentUser || !INTERNAL_ROLES.includes(currentUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
  const filterDusun = searchParams.get("dusun") || "";
  const filterRw = searchParams.get("rw") || "";
  const filterRt = searchParams.get("rt") || "";
  const filterBlok = searchParams.get("blok") || "";
  const filterPenarik = searchParams.get("penarik") || "";
  const regionStatus = searchParams.get("regionStatus") || "all";
  const paymentStatus = searchParams.get("paymentStatus") || "all";
  const archiveStatus = searchParams.get("archiveStatus") || "all";
  const sortBy = searchParams.get("sortBy") || "nop";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const pageSize = 50;

  const whereClause = buildTaxWhereInput({
    tahun,
    q: query,
    dusun: filterDusun,
    rw: filterRw,
    rt: filterRt,
    blok: filterBlok,
    penarik: filterPenarik,
    regionStatus,
    paymentStatus,
  });
  
  if (archiveStatus === "missing") {
    // Get all files currently in the archive directory for this year
    const archiveFiles = await getArchiveList(tahun);
    const archiveNopDigits = new Set(archiveFiles.map(f => f.name.replace(/\D/g, "")));
    
    // To efficiently filter, we get all NOPs for the year and filter them in memory
    // (Acceptable for village-scale data: ~3k-10k records)
    const allTaxes = await prisma.taxData.findMany({
      where: { tahun },
      select: { id: true, nop: true }
    });
    
    const missingArchiveIds = allTaxes
      .filter(t => {
        const cleanNop = t.nop.replace(/\D/g, "");
        return !archiveNopDigits.has(cleanNop);
      })
      .map(t => t.id);
      
    const existingAnd = whereClause.AND;
    const archiveFilter = { id: { in: missingArchiveIds } };
    whereClause.AND = Array.isArray(existingAnd)
      ? [...existingAnd, archiveFilter]
      : existingAnd
        ? [existingAnd, archiveFilter]
        : [archiveFilter];
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
      orderBy: buildTaxOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.taxData.count({
      where: whereClause,
    }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}
