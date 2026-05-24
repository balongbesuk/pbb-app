import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, userId, nop } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    if (nop) {
      await prisma.pushSubscription.deleteMany({
        where: { token, nop }
      });
    } else if (userId) {
      await prisma.pushSubscription.deleteMany({
        where: { token, userId }
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { token }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unregister error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
