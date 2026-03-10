import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const filterDusun = searchParams.get("dusun") || "";
    const filterRw = searchParams.get("rw") || "";
    const filterRt = searchParams.get("rt") || "";
    const filterPenarik = searchParams.get("penarik") || "";
    const pageSize = 50;

    const whereClause: any = {
        tahun,
        OR: [
            { nop: { contains: query } },
            { namaWp: { contains: query } },
            { alamatObjek: { contains: query } },
        ]
    };

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

    const [data, total] = await Promise.all([
        prisma.taxData.findMany({
            where: whereClause,
            include: {
                penarik: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.taxData.count({
            where: whereClause
        }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
}
