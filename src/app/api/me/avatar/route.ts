import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppUser } from "@/types/app";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ avatarUrl: null }, { status: 401 });
    }

    const currentUser = session.user as AppUser | undefined;
    const userId = currentUser?.id;
    if (!userId) {
      return NextResponse.json({ avatarUrl: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: user?.avatarUrl ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ avatarUrl: null });
  }
}
