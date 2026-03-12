import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { TaxDataTable } from "@/components/tax/tax-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DataPajakPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tahun?: string;
    dusun?: string;
    rw?: string;
    rt?: string;
    penarik?: string;
    regionStatus?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const tahun = parseInt(params.tahun || new Date().getFullYear().toString());
  const filterDusun = params.dusun || "";
  const filterRw = params.rw || "";
  const filterRt = params.rt || "";
  const filterPenarik = params.penarik || "";
  const regionStatus = params.regionStatus || "all";
  const pageSize = 50;

  const whereClause: Prisma.TaxDataWhereInput = {
    tahun,
  };

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

  if (filterDusun) whereClause.dusun = filterDusun;
  if (filterRw) whereClause.rw = filterRw;
  if (filterRt) whereClause.rt = filterRt;
  if (filterPenarik) {
    if (filterPenarik === "none") {
      whereClause.penarikId = null;
    } else {
      whereClause.penarikId = filterPenarik;
    }
  }

  if (andFilters.length > 0) {
    whereClause.AND = andFilters;
  }

  const [data, total, penariks, filterOptions, dusunRefsRaw] = await Promise.all([
    prisma.taxData.findMany({
      where: whereClause,
      include: {
        penarik: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.taxData.count({
      where: whereClause,
    }),
    prisma.user.findMany({
      where: { role: "PENARIK" },
      select: { id: true, name: true, dusun: true, rt: true, rw: true },
    }),
    prisma.taxData.findMany({
      where: { tahun },
      select: { dusun: true, rw: true, rt: true },
      distinct: ["dusun", "rw", "rt"],
    }),
    prisma.dusunReference.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Extract unique regions for filter dropdowns
  const uniqueDusuns = Array.from(
    new Set(filterOptions.map((o: any) => o.dusun).filter(Boolean))
  ) as string[];
  const uniqueRws = Array.from(
    new Set(filterOptions.map((o: any) => o.rw).filter(Boolean))
  ).sort() as string[];
  const uniqueRts = Array.from(
    new Set(filterOptions.map((o: any) => o.rt).filter(Boolean))
  ).sort() as string[];

  const availableFilters = {
    dusun: uniqueDusuns,
    rw: uniqueRws,
    rt: uniqueRts,
    penarik: penariks.map((p: any) => ({ id: p.id, name: p.name })),
    dusunRefs: dusunRefsRaw.map((d: any) => d.name),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Pajak PBB</h1>
          <p className="text-muted-foreground">Kelola dan pantau seluruh data pajak terdaftar</p>
        </div>
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader className="pb-0">
          <CardTitle>Daftar Wajib Pajak {tahun}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxDataTable
            initialData={JSON.parse(JSON.stringify(data))}
            total={total}
            pageSize={pageSize}
            penariks={JSON.parse(JSON.stringify(penariks))}
            availableFilters={availableFilters}
            currentUser={session?.user as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
