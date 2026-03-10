"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string | null = null,
  details: string | null = null
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId: userId || undefined,
      },
    });
  } catch (error) {
    console.error("Gagal membuat audit log:", error);
  }
}

export async function getAuditLogs(limit: number = 100, page: number = 1, searchQuery?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const where: any = {};
    if (searchQuery) {
      where.OR = [
        { action: { contains: searchQuery } },
        { entity: { contains: searchQuery } },
        { details: { contains: searchQuery } },
        { user: { name: { contains: searchQuery } } },
        { user: { username: { contains: searchQuery } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, role: true, username: true },
          },
        },
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  } catch (error) {
    console.error("Gagal memuat log aktivitas:", error);
    return { logs: [], total: 0 };
  }
}
