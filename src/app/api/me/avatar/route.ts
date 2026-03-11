import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ avatarUrl: null }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    if (!userId) {
      return NextResponse.json({ avatarUrl: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: user?.avatarUrl ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ avatarUrl: null });
  }
}
