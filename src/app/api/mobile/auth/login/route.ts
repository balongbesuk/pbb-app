import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { isPbbMobileEnabled } from '@/lib/mobile-access';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const mobileEnabled = await isPbbMobileEnabled();
    if (!mobileEnabled) {
      return NextResponse.json(
        { success: false, error: 'Login PBB Mobile sedang dinonaktifkan oleh admin desa.' },
        { status: 403, headers }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan Password wajib diisi' }, { status: 400, headers });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Kredensial tidak valid' }, { status: 401, headers });
    }

    // Verify password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch(e) {
      console.error("Bcrypt compare error:", e);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Kredensial tidak valid' }, { status: 401, headers });
    }

    const magicToken = await encode({
      token: {
        id: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      secret: process.env.NEXTAUTH_SECRET || 'pbb-desa-rahasia-sekali-123',
    });

    return NextResponse.json({
      success: true,
      magicToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        dusun: user.dusun,
      },
      villageConfig: {
        bapendaUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaUrl,
        bapendaPaymentUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaPaymentUrl,
        enableBapendaPayment: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaPayment ?? true,
        bapendaRegionName: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaRegionName || "Bapenda",
        isJombangBapenda: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.isJombangBapenda ?? false,
        enableBapendaSync: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaSync ?? false,
      }
    }, { headers });

  } catch (error) {
    console.error('Mobile Auth Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem' },
      { status: 500, headers }
    );
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
