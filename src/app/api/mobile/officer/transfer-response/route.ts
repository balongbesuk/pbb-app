import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPbbMobileEnabled } from "@/lib/mobile-access";
import { createAuditLog } from "@/app/actions/log-actions";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let auth;
    try {
      auth = await requireMobileAuth(req);
    } catch {
      return unauthorizedMobileResponse(headers);
    }

    const mobileEnabled = await isPbbMobileEnabled();
    if (!mobileEnabled) {
      return NextResponse.json(
        { success: false, error: 'Akses PBB Mobile dinonaktifkan.' },
        { status: 403, headers }
      );
    }

    const { requestId, status } = await req.json();
    const userId = auth.userId;

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400, headers });
    }

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400, headers });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the request
      const request = await tx.transferRequest.findUnique({
        where: { id: requestId },
        include: { taxData: true, sender: true, receiver: true },
      });

      if (!request || request.receiverId !== userId || request.status !== "PENDING") {
        throw new Error("Permintaan tidak valid atau sudah diproses.");
      }

      if (status === "ACCEPTED") {
        // 2. Validate current owner
        const currentTax = await tx.taxData.findUnique({
          where: { id: request.taxId },
        });

        if (!currentTax) throw new Error("Data pajak tidak ditemukan.");

        // GIVE: Sender gives to Receiver. Current owner must be Sender.
        if (request.type === "GIVE" && currentTax.penarikId !== request.senderId) {
           throw new Error("Permintaan kadaluarsa karena penugasan data telah berubah.");
        }
        // TAKE: Sender takes from Receiver. Current owner must be Receiver.
        if (request.type === "TAKE" && currentTax.penarikId !== request.receiverId) {
           throw new Error("Permintaan kadaluarsa karena penugasan data telah berubah.");
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
            message: `${request.receiver.name} telah menyetujui ${request.type === "GIVE" ? "penyerahan" : "pengambilan"} data WP ${request.taxData.namaWp}.`,
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
            message: `${request.receiver.name} menolak ${request.type === "GIVE" ? "penyerahan" : "pengambilan"} data WP ${request.taxData.namaWp}.`,
            type: "REJECTED",
          },
        });
      }

      return request;
    });

    const actionLabel = status === "ACCEPTED" ? "menyetujui" : "menolak";
    await createAuditLog(
      "TRANSFER_RESPONSE",
      "TaxData",
      result.taxData.namaWp,
      `Petugas ${result.receiver.name} ${actionLabel} permintaan pemindahan data WP ${result.taxData.namaWp} dari ${result.sender.name}`,
      userId // Pass mobile userId explicitly
    );

    return NextResponse.json({ success: true, message: `Permintaan berhasil ${status === 'ACCEPTED' ? 'disetujui' : 'ditolak'}.` }, { headers });

  } catch (error) {
    console.error("Transfer Response API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
