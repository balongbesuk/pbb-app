import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs'; // Often bcryptjs is used in Nextjs, let's assume bcryptjs or try to import it.

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
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
      // Fallback if bcryptjs vs bcrypt issues
      // To strictly follow the project's setup, we can import from standard bcrypt if preferred, 
      // but nextjs edge typically uses bcryptjs.
      const bcryptNode = require('bcryptjs');
      isPasswordValid = await bcryptNode.compare(password, user.password);
    }

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Kredensial tidak valid' }, { status: 401, headers });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        dusun: user.dusun,
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
