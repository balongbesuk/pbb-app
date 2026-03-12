"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Keep this as it's used by createAuditLog
import { formatZodError } from "@/lib/validations/schemas"; // Add this import
import { requireAdmin } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

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
    // For internal audit log creation, just logging the error is often sufficient,
    // as it shouldn't prevent the main operation from completing.
    console.error("Gagal membuat audit log:", error);
  }
}

export async function getAuditLogs(limit: number = 100, page: number = 1, searchQuery?: string) {
  try {
    await requireAdmin();

    const where: Prisma.AuditLogWhereInput = {}; // Use proper Prisma type
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

    return { logs, total, success: true }; // Added success: true for consistency
  } catch (error) { // Removed : any as formatZodError now handles unknown
    console.error("Gagal memuat log aktivitas:", error);
    // Return a consistent error structure for client-side handling
    return { logs: [], total: 0, success: false, message: formatZodError(error) };
  }
}
