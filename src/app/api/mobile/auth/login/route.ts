import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';

const MOBILE_LOGIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const MOBILE_ALLOWED_ROLES = new Set(["ADMIN", "PENARIK"]);

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const villageConfig = await prisma.villageConfig.findUnique({
      where: { id: 1 },
      select: {
        enablePbbMobile: true,
        bapendaUrl: true,
        bapendaPaymentUrl: true,
        enableBapendaPayment: true,
        bapendaRegionName: true,
        isJombangBapenda: true,
        enableBapendaSync: true,
      },
    });

    if (villageConfig?.enablePbbMobile === false) {
      return NextResponse.json(
        { success: false, error: 'Login PBB Mobile sedang dinonaktifkan oleh admin desa.' },
        { status: 403, headers }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan Password wajib diisi' }, { status: 400, headers });
    }

    const normalizedUsername = username.trim();
    const clientIp = getClientIp({ headers: request.headers });
    const rateLimit = checkRateLimit(
      `mobile-login:${clientIp}:${normalizedUsername.toLowerCase()}`,
      MOBILE_LOGIN_RATE_LIMIT
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.retryAfter} detik.`,
        },
        { status: 429, headers }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Kredensial tidak valid' }, { status: 401, headers });
    }

    if (!MOBILE_ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json({ success: false, error: 'Akun ini tidak memiliki akses PBB Mobile.' }, { status: 403, headers });
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

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("Mobile Auth Error: NEXTAUTH_SECRET belum dikonfigurasi.");
      return NextResponse.json(
        { success: false, error: 'Konfigurasi autentikasi server belum lengkap.' },
        { status: 500, headers }
      );
    }

    const magicToken = await encode({
      token: {
        id: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      secret,
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
        bapendaUrl: villageConfig?.bapendaUrl,
        bapendaPaymentUrl: villageConfig?.bapendaPaymentUrl,
        enableBapendaPayment: villageConfig?.enableBapendaPayment ?? true,
        bapendaRegionName: villageConfig?.bapendaRegionName || "Bapenda",
        isJombangBapenda: villageConfig?.isJombangBapenda ?? false,
        enableBapendaSync: villageConfig?.enableBapendaSync ?? false,
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
