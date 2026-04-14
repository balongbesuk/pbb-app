import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nop = searchParams.get('nop');

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const rawQuery = (nop || '').trim();
    if (!rawQuery) {
      return NextResponse.json({ success: false, error: 'Kata kunci pencarian wajib diisi' }, { status: 400, headers });
    }

    let taxes = [];
    const isNumeric = /^[0-9.\-\s]+$/.test(rawQuery);

    // Jika yang diinputkan adalah angka (atau NOP yang berformat angka, titik, strip)
    if (isNumeric && rawQuery.length > 0) {
      taxes = await prisma.taxData.findMany({
        where: {
          nop: { contains: rawQuery }
        },
        orderBy: { tahun: 'desc' }
      });
    } 
    // Jika mengandung huruf, asumsikan mencari berdasarkan Nama WP
    else {
      taxes = await prisma.taxData.findMany({
        where: {
          namaWp: { contains: rawQuery } // Case-insensitive matching normally depends on DB collation
        },
        orderBy: { tahun: 'desc' }
      });
    }

    if (taxes.length === 0) {
      return NextResponse.json({ success: false, error: 'Data Wajib Pajak atau NOP tidak ditemukan' }, { status: 404, headers });
    }

    // Biasanya ambil data tahun terbaru
    const latestTax = taxes[0];

    return NextResponse.json({
      success: true,
      data: {
        id: latestTax.id,
        nop: latestTax.nop,
        namaWp: latestTax.namaWp,
        alamatObjek: latestTax.alamatObjek,
        tahun: latestTax.tahun,
        tagihanPajak: latestTax.tagihanDenda + latestTax.ketetapan,
        status: latestTax.paymentStatus,
        luasTanah: latestTax.luasTanah,
        luasBangunan: latestTax.luasBangunan,
      }
    }, { headers });
  } catch (error) {
    console.error('API Mobile Tax Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nop } = body;

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (!nop) {
      return NextResponse.json({ success: false, error: 'NOP wajib dikirim' }, { status: 400, headers });
    }

    const today = new Date();

    const updated = await prisma.taxData.updateMany({
      where: { nop: nop },
      data: {
        paymentStatus: 'LUNAS',
        tanggalBayar: today,
        tempatBayar: 'Mobile App Simulator'
      }
    });

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui jadi LUNAS', updated: updated.count }, { headers });
  } catch (error) {
    console.error('API Mobile Tax Update Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
