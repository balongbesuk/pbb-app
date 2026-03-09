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

export async function getAuditLogs(limit: number = 100) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, role: true, username: true },
        },
      },
    });
    
    return logs;
  } catch (error) {
    console.error("Gagal memuat log aktivitas:", error);
    return [];
  }
}
