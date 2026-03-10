"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "./log-actions";

/**
 * Send a request to another penarik to take over or request a tax data
 */
export async function sendTransferRequest(taxId: number, receiverId: string, type: "GIVE" | "TAKE" = "GIVE", message?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    const senderId = (session.user as any).id;

    // 1. Verify tax data
    const taxData = await prisma.taxData.findUnique({
      where: { id: taxId },
      include: { penarik: true }
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
      where: { taxId, status: "PENDING" }
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
        status: "PENDING"
      }
    });

    // 4. Create notification for receiver
    const notificationTitle = type === "GIVE" ? "Permintaan Penyerahan Pajak" : "Permintaan Pengambilan Pajak";
    const notificationMsg = type === "GIVE"
      ? `${session.user?.name} ingin menyerahkan data WP ${taxData.namaWp} kepada Anda.`
      : `${session.user?.name} meminta data WP ${taxData.namaWp} yang sedang Anda kelola.`;

    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: notificationTitle,
        message: notificationMsg,
        type: "REQUEST",
        link: "/data-pajak"
      }
    });

    // 5. Audit Log
    const receiverUser = await prisma.user.findUnique({ where: { id: receiverId }, select: { name: true } });
    const typeLabel = type === "GIVE" ? "penyerahan" : "pengambilan";
    await createAuditLog(
      "TRANSFER_REQUEST",
      "TaxData",
      taxData.namaWp,
      `Mengajukan ${typeLabel} data WP ${taxData.namaWp} kepada petugas: ${receiverUser?.name || receiverId}`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Accept or reject a transfer request
 */
export async function handleTransferResponse(requestId: string, status: "ACCEPTED" | "REJECTED") {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const request = await prisma.transferRequest.findUnique({
      where: { id: requestId },
      include: { taxData: true, sender: true, receiver: true }
    });

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
      throw new Error("Permintaan tidak valid.");
    }

    if (status === "ACCEPTED") {
      // 1. Determine who gets the data
      // If GIVE: Receiver gets data. If TAKE: Sender gets data.
      const newPenarikId = request.type === "GIVE" ? request.receiverId : request.senderId;

      // 2. Perform the transfer
      await prisma.taxData.update({
        where: { id: request.taxId },
        data: { penarikId: newPenarikId }
      });

      // 3. Update request status
      await prisma.transferRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" }
      });

      // 4. Notify sender
      await prisma.notification.create({
        data: {
          userId: request.senderId,
          title: "Permintaan Disetujui",
          message: `${session.user?.name} telah menyetujui ${request.type === 'GIVE' ? 'penyerahan' : 'pengambilan'} data WP ${request.taxData.namaWp}.`,
          type: "ACCEPTED",
        }
      });
    } else {
      // 1. Update request status
      await prisma.transferRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      // 2. Notify sender
      await prisma.notification.create({
        data: {
          userId: request.senderId,
          title: "Permintaan Ditolak",
          message: `${session.user?.name} menolak ${request.type === 'GIVE' ? 'penyerahan' : 'pengambilan'} data WP ${request.taxData.namaWp}.`,
          type: "REJECTED",
        }
      });
    }

    revalidatePath("/data-pajak");

    const statusLabel = status === "ACCEPTED" ? "Menyetujui" : "Menolak";
    const typeLabel = request.type === "GIVE" ? "penyerahan" : "pengambilan";
    await createAuditLog(
      "TRANSFER_RESPONSE",
      "TaxData",
      request.taxData.namaWp,
      `${statusLabel} permintaan ${typeLabel} data WP ${request.taxData.namaWp} dari petugas: ${request.sender.name || request.senderId}`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}


/**
 * Get notifications for the current user
 */
export async function getNotifications() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    return await prisma.notification.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: "desc" },
      take: 10
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
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
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
        status: "PENDING"
      },
      include: {
        taxData: true,
        sender: true
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    return [];
  }
}
