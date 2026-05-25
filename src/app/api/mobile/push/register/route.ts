import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, userId, nop } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Upsert the push subscription
    // Since our schema uses standard ID, we can check if token and (userId or nop) already exist
    
    // We want to avoid duplicate subscriptions. If user sends token + nop, see if it exists.
    let existing;
    if (nop) {
      existing = await prisma.pushSubscription.findFirst({
        where: { token, nop }
      });
    } else if (userId) {
      existing = await prisma.pushSubscription.findFirst({
        where: { token, userId }
      });
    } else {
      existing = await prisma.pushSubscription.findFirst({
        where: { token }
      });
    }

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          token,
          userId: userId || null,
          nop: nop || null
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push register error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
