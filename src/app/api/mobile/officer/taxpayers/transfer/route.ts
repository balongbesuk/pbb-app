import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPbbMobileEnabled } from "@/lib/mobile-access";
import { createAuditLog } from "@/app/actions/log-actions";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";
import { notifyUser } from "@/lib/push-notification";

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

    const { taxId, receiverId, type, message } = await req.json();
    const senderId = auth.userId;

    if (!taxId || !senderId || !receiverId) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400, headers });
    }

    // 1. Verify users
    const [sender, receiver, taxData] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
      prisma.taxData.findUnique({ where: { id: parseInt(taxId) } })
    ]);

    if (!sender || !receiver || !taxData) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan" }, { status: 404, headers });
    }

    // 2. Logic based on role
    // If sender is ADMIN, update directly
    if (sender.role === 'ADMIN') {
      await prisma.taxData.update({
        where: { id: taxData.id },
        data: { penarikId: receiverId }
      });

      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: "Tugas Penagihan Baru",
          message: `Admin ${sender.name} menugaskan WP ${taxData.namaWp} kepada Anda.`,
          type: "INFO",
        }
      });

      if (taxData.penarikId && taxData.penarikId !== receiverId) {
        await prisma.notification.create({
          data: {
            userId: taxData.penarikId,
            title: "Pembatalan Tugas Penagihan",
            message: `Admin ${sender.name} telah memindahkan WP ${taxData.namaWp} dari daftar tugas Anda.`,
            type: "INFO",
          }
        });
        notifyUser(taxData.penarikId, "Pembatalan Tugas Penagihan", `Admin ${sender.name} telah memindahkan WP ${taxData.namaWp} dari daftar tugas Anda.`);
      }

      await createAuditLog(
        "TRANSFER_DIRECT",
        "TaxData",
        taxData.namaWp,
        `Admin ${sender.name} memindahkan alokasi WP ${taxData.namaWp} kepada petugas: ${receiver.name}`,
        senderId // Pass mobile senderId explicitly
      );

      notifyUser(receiverId, "Tugas Penagihan Baru", `Admin ${sender.name} menugaskan WP ${taxData.namaWp} kepada Anda.`);

      return NextResponse.json({ success: true, message: "Alokasi berhasil dipindahkan" }, { headers });
    }

    // If sender is PENARIK, create TransferRequest
    if (sender.role === 'PENARIK') {
      if (taxData.penarikId !== senderId) {
        return NextResponse.json(
          { success: false, error: "Anda tidak diperbolehkan memindahkan data milik penarik lain." },
          { status: 403, headers }
        );
      }

      // Check if already pending
      const existing = await prisma.transferRequest.findFirst({
        where: { taxId: taxData.id, status: "PENDING" },
      });

      if (existing) {
        return NextResponse.json({ success: false, error: "Sudah ada permintaan yang tertunda" }, { status: 400, headers });
      }

      await prisma.$transaction(async (tx) => {
        const tr = await tx.transferRequest.create({
          data: {
            taxId: taxData.id,
            senderId,
            receiverId,
            type: type || "GIVE",
            message,
            status: "PENDING",
          },
        });

        // Notify receiver with link to the request
        await tx.notification.create({
          data: {
            userId: receiverId,
            title: "Permintaan Pemindahan Alokasi",
            message: `${sender.name} ingin mengirimkan data WP ${taxData.namaWp} kepada Anda.`,
            type: "REQUEST",
            link: tr.id, // Store TR ID for mobile actions
          },
        });

        await createAuditLog(
          "TRANSFER_REQUEST",
          "TaxData",
          taxData.namaWp,
          `Petugas ${sender.name} mengajukan pemindahan WP ${taxData.namaWp} kepada petugas: ${receiver.name}`,
          senderId // Pass mobile senderId explicitly
        );
      });
      
      notifyUser(receiverId, "Permintaan Pelimpahan", `${sender.name} ingin mengirimkan data WP ${taxData.namaWp} kepada Anda.`);

      return NextResponse.json({ success: true, message: "Permintaan pemindahan telah dikirim" }, { headers });
    }

    return NextResponse.json({ success: false, error: "Role tidak diizinkan" }, { status: 403, headers });

  } catch (error) {
    console.error("Transfer API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500, headers });
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
