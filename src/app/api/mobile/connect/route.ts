import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Enable CORS to allow the Expo app to fetch this API from localhost or LAN
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const config = await prisma.villageConfig.findFirst();
    const totalSppt = await prisma.taxData.count();
    const lunasSppt = await prisma.taxData.count({
      where: { paymentStatus: 'LUNAS' }
    });

    return NextResponse.json({
      success: true,
      village: config || {
        namaDesa: "Nama Desa Belum Diatur",
        kabupaten: "Belum Diatur"
      },
      stats: {
        totalSppt,
        lunasSppt,
        belumLunas: totalSppt - lunasSppt
      }
    }, { headers });
  } catch (error) {
    console.error('API Mobile Connect Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses data dari Server' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
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
