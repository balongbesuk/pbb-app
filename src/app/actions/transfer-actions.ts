"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "./log-actions";
import { TransferRequestSchema, formatZodError } from "@/lib/validations/schemas";

/**
 * Send a request to another penarik to take over or request a tax data
 */
export async function sendTransferRequest(
  taxId: number,
  receiverId: string,
  type: "GIVE" | "TAKE" = "GIVE",
  message?: string
) {
  try {
    TransferRequestSchema.parse({ taxId, receiverId, type, message });
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PENARIK") {
      throw new Error("Hanya petugas lapangan (PENARIK) yang dapat melakukan pemindahan data.");
    }
    const senderId = (session.user as any).id;

    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { name: true, role: true },
    });

    if (!receiverUser || receiverUser.role !== "PENARIK") {
      throw new Error("Target pemindahan harus merupakan petugas lapangan (PENARIK) yang aktif.");
    }

    // 1. Verify tax data
    const taxData = await prisma.taxData.findUnique({
      where: { id: taxId },
      include: { penarik: true },
    });

    if (!taxData) {
      throw new Error("Data pajak tidak ditemukan.");
    }

    if (type === "GIVE") {
      if (taxData.penarikId !== senderId) {
        throw new Error("Anda hanya bisa mengirim data yang dialokasikan kepada Anda.");
      }
      if (receiverId === senderId) {
        throw new Error("Anda tidak bisa mengirim data ke diri sendiri.");
      }
    } else if (type === "TAKE") {
      if (!taxData.penarikId) {
        throw new Error("Data ini belum memiliki penarik. Silakan hubungi Admin.");
      }
      if (taxData.penarikId !== receiverId) {
        throw new Error("Data ini bukan milik penarik yang Anda tuju.");
      }
      if (receiverId === senderId) {
        throw new Error("Anda tidak bisa meminta data dari diri sendiri.");
      }
    }

    // 2. Check if there's already a pending request for this tax item
    const existing = await prisma.transferRequest.findFirst({
      where: { taxId, status: "PENDING" },
    });

    if (existing) {
      throw new Error("Sudah ada permintaan pemindahan yang tertunda untuk data ini.");
    }

    // 3. Create request
    const request = await prisma.transferRequest.create({
      data: {
        taxId,
        senderId,
        receiverId,
        type,
        message,
        status: "PENDING",
      },
    });

    const typeLabel = type === "GIVE" ? "penyerahan" : "pengambilan";
    await createAuditLog(
      "TRANSFER_REQUEST",
      "TaxData",
      taxData.namaWp,
      `Mengajukan ${typeLabel} data WP ${taxData.namaWp} kepada petugas: ${receiverUser?.name || receiverId}`
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

/**
 * Accept or reject a transfer request
 */
export async function handleTransferResponse(requestId: string, status: "ACCEPTED" | "REJECTED") {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PENARIK") {
      throw new Error("Hanya petugas lapangan (PENARIK) yang dapat memproses permintaan ini.");
    }
    const userId = (session.user as any).id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data request terbaru di dalam transaction
      const request = await tx.transferRequest.findUnique({
        where: { id: requestId },
        include: { taxData: true, sender: true, receiver: true },
      });

      if (!request || request.receiverId !== userId || request.status !== "PENDING") {
        throw new Error("Permintaan tidak valid atau sudah diproses.");
      }

      if (status === "ACCEPTED") {
        // 2. Validasi Stale Data (Cek apakah owner masih sama seperti saat request dibuat)
        const currentTax = await tx.taxData.findUnique({
          where: { id: request.taxId },
        });

        if (!currentTax) throw new Error("Data pajak tidak ditemukan.");

        // GIVE: Pengirim memberi ke Penerima. Owner saat ini harus Pengirim.
        if (request.type === "GIVE" && currentTax.penarikId !== request.senderId) {
           throw new Error("Permintaan sudah tidak valid karena penugasan data telah berubah.");
        }
        // TAKE: Pengirim mengambil dari Penerima. Owner saat ini harus Penerima.
        if (request.type === "TAKE" && currentTax.penarikId !== request.receiverId) {
           throw new Error("Permintaan sudah tidak valid karena penugasan data telah berubah.");
        }

        const newPenarikId = request.type === "GIVE" ? request.receiverId : request.senderId;

        // 3. Update Penarik
        await tx.taxData.update({
          where: { id: request.taxId },
          data: { penarikId: newPenarikId },
        });

        // 4. Update request status
        await tx.transferRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        });

        // 5. Notify sender
        await tx.notification.create({
          data: {
            userId: request.senderId,
            title: "Permintaan Disetujui",
            message: `${session.user?.name} telah menyetujui ${request.type === "GIVE" ? "penyerahan" : "pengambilan"} data WP ${request.taxData.namaWp}.`,
            type: "ACCEPTED",
          },
        });
      } else {
        // REJECTED flow
        await tx.transferRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        });

        await tx.notification.create({
          data: {
            userId: request.senderId,
            title: "Permintaan Ditolak",
            message: `${session.user?.name} menolak ${request.type === "GIVE" ? "penyerahan" : "pengambilan"} data WP ${request.taxData.namaWp}.`,
            type: "REJECTED",
          },
        });
      }
      
      return request;
    });

    revalidatePath("/data-pajak");

    const statusLabel = status === "ACCEPTED" ? "Menyetujui" : "Menolak";
    const typeLabel = result.type === "GIVE" ? "penyerahan" : "pengambilan";
    await createAuditLog(
      "TRANSFER_RESPONSE",
      "TaxData",
      result.taxData.namaWp,
      `${statusLabel} permintaan ${typeLabel} data WP ${result.taxData.namaWp} dari petugas: ${result.sender.name || result.senderId}`
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

/**
 * Get notifications for the current user
 */
export async function getNotifications() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    // Hapus notifikasi yang lebih dari 7 hari (cleanup otomatis)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await prisma.notification.deleteMany({
      where: {
        userId: (session.user as any).id,
        createdAt: { lt: sevenDaysAgo },
      },
    });

    return await prisma.notification.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    // Gunakan updateMany untuk memfilter owner secara aman tanpa error not found, dsb. (Celah IDOR ditutup)
    await prisma.notification.updateMany({
      where: { 
        id, 
        userId: (session.user as any).id 
      },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function markAllNotificationsRead() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    await prisma.notification.updateMany({
      where: { userId: (session.user as any).id, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteAllNotifications() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    await prisma.notification.deleteMany({
      where: { userId: (session.user as any).id },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Get pending requests for the current user (receiver)
 */
export async function getPendingRequests() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    return await prisma.transferRequest.findMany({
      where: {
        receiverId: (session.user as any).id,
        status: "PENDING",
      },
      include: {
        taxData: true,
        sender: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    return [];
  }
}
