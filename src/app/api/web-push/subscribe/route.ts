import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Check if subscription already exists
    const existing = await prisma.webPushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // If user changed, update it
      if (existing.userId !== session.user.id) {
        await prisma.webPushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: { userId: session.user.id },
        });
      }
      return NextResponse.json({ success: true, message: "Subscription updated" });
    }

    // Create new subscription
    await prisma.webPushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: "Subscribed" });
  } catch (error) {
    console.error("Web Push Subscription Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
