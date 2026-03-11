"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/server-auth";

export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string | null = null,
  details: string | null = null,
  manualUserId: string | null = null
) {
  try {
    let userId = manualUserId;
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id || null;
    }

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
    await requireAdmin();

    const where: any = {};
    if (searchQuery) {
      where.OR = [
        { action: { contains: searchQuery } },
        { entity: { contains: searchQuery } },
        { entityId: { contains: searchQuery } },
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
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error("Gagal memuat log aktivitas:", error);
    return { logs: [], total: 0 };
  }
}

export async function getWpPaymentHistory(namaWp: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    return await prisma.auditLog.findMany({
      where: {
        entityId: namaWp,
        action: { in: ["UPDATE_PAYMENT", "UPDATE_REGION"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, role: true } },
      },
    });
  } catch {
    return [];
  }
}
