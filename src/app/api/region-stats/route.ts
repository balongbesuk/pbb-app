import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AggregateRow = {
  rt?: string | null;
  rw?: string | null;
  dusun?: string | null;
  total: number | bigint;
  lunas: number | bigint | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    const stats: Record<string, { total: number; lunas: number; percentage: number }> = {};

    const [rtRows, rwRows, dusunRows, desaRows] = await Promise.all([
      prisma.$queryRaw<AggregateRow[]>`
        SELECT
          rt,
          rw,
          COUNT(*) AS total,
          SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS lunas
        FROM TaxData
        WHERE tahun = ${tahun}
          AND rt IS NOT NULL
          AND rt != ''
          AND rw IS NOT NULL
          AND rw != ''
        GROUP BY rt, rw
      `,
      prisma.$queryRaw<AggregateRow[]>`
        SELECT
          rw,
          COUNT(*) AS total,
          SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS lunas
        FROM TaxData
        WHERE tahun = ${tahun}
          AND rw IS NOT NULL
          AND rw != ''
        GROUP BY rw
      `,
      prisma.$queryRaw<AggregateRow[]>`
        SELECT
          dusun,
          COUNT(*) AS total,
          SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS lunas
        FROM TaxData
        WHERE tahun = ${tahun}
          AND dusun IS NOT NULL
          AND dusun != ''
        GROUP BY dusun
      `,
      prisma.$queryRaw<AggregateRow[]>`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS lunas
        FROM TaxData
        WHERE tahun = ${tahun}
      `,
    ]);

    for (const row of rtRows) {
      const rt = parseInt(String(row.rt), 10);
      const rw = parseInt(String(row.rw), 10);
      if (Number.isNaN(rt) || Number.isNaN(rw)) {
        continue;
      }

      const total = Number(row.total);
      const lunas = Number(row.lunas ?? 0);
      stats[`RT_${rt}RW_${rw}`] = { total, lunas, percentage: 0 };
    }

    for (const row of rwRows) {
      const rw = parseInt(String(row.rw), 10);
      if (Number.isNaN(rw)) {
        continue;
      }

      const total = Number(row.total);
      const lunas = Number(row.lunas ?? 0);
      stats[`RW_${rw}`] = { total, lunas, percentage: 0 };
    }

    for (const row of dusunRows) {
      const dusun = String(row.dusun ?? "").trim().toUpperCase();
      if (!dusun) {
        continue;
      }

      const total = Number(row.total);
      const lunas = Number(row.lunas ?? 0);
      stats[`DUSUN_${dusun}`] = { total, lunas, percentage: 0 };
    }

    const desaRow = desaRows[0];
    const totalAll = Number(desaRow?.total ?? 0);
    const lunasAll = Number(desaRow?.lunas ?? 0);
    stats["DESA_TOTAL"] = {
      total: totalAll,
      lunas: lunasAll,
      percentage: totalAll > 0 ? (lunasAll / totalAll) * 100 : 0,
    };

    // Hitung persentase untuk semua level
    for (const key of Object.keys(stats)) {
      const s = stats[key];
      s.percentage = s.total > 0 ? (s.lunas / s.total) * 100 : 0;
    }

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Gagal menghitung statistik wilayah:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
