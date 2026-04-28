import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPbbMobileEnabled } from "@/lib/mobile-access";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    try {
      await requireMobileAuth(req);
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

    const officers = await prisma.user.findMany({
      where: {
        role: "PENARIK",
      },
      select: {
        id: true,
        name: true,
        username: true,
        dusun: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: officers
    }, { headers });

  } catch (error) {
    console.error("Fetch Officers API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
