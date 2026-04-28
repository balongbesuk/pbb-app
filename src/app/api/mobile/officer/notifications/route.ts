import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let auth;
    try {
      auth = await requireMobileAuth(req);
    } catch {
      return unauthorizedMobileResponse(headers);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: notifications
    }, { headers });

  } catch (error) {
    console.error("Officer Notifications API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers });
  }
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let auth;
    try {
      auth = await requireMobileAuth(req);
    } catch {
      return unauthorizedMobileResponse(headers);
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { 
          userId: auth.userId,
          isRead: false,
          NOT: { type: 'REQUEST' } // Don't auto-read requests
        },
        data: { isRead: true }
      });
    } else if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: auth.userId },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true }, { headers });

  } catch (error) {
    console.error("Officer Notifications Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
