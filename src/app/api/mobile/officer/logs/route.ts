import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400, headers });
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { 
          userId, 
          action: "UPDATE_PAYMENT",
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip
      }),
      prisma.auditLog.count({
        where: { 
          userId, 
          action: "UPDATE_PAYMENT"
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      hasMore: skip + logs.length < total
    }, { headers });

  } catch (error) {
    console.error("Officer Logs API Error:", error);
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
