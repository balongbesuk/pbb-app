import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { prisma } from '@/lib/prisma';
import { isPbbMobileEnabled } from '@/lib/mobile-access';

async function ensureMobileEnabled(headers: Record<string, string>) {
  const mobileEnabled = await isPbbMobileEnabled();
  if (!mobileEnabled) {
    return NextResponse.json(
      { success: false, error: 'Akses data PBB Mobile sedang dinonaktifkan oleh admin desa.' },
      { status: 403, headers }
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nop = searchParams.get('nop');

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const blockedResponse = await ensureMobileEnabled(headers);
    if (blockedResponse) return blockedResponse;

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

    const bapendaConfig = {
      bapendaUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaUrl,
      bapendaPaymentUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaPaymentUrl,
      enableBapendaPayment: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaPayment ?? true,
      bapendaRegionName: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaRegionName || "Bapenda",
      isJombangBapenda: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.isJombangBapenda ?? false,
      enableBapendaSync: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaSync ?? false,
    };

    if (taxes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Data Wajib Pajak atau NOP tidak ditemukan',
        villageConfig: bapendaConfig
      }, { status: 404, headers });
    }

    return NextResponse.json({
      success: true,
      data: taxes.map(tax => ({
        id: tax.id,
        nop: tax.nop,
        namaWp: tax.namaWp,
        alamatObjek: tax.alamatObjek,
        tahun: tax.tahun,
        tagihanPajak: tax.tagihanDenda + tax.ketetapan,
        status: tax.paymentStatus,
        luasTanah: tax.luasTanah,
        luasBangunan: tax.luasBangunan,
      })),
      villageConfig: bapendaConfig
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

    const blockedResponse = await ensureMobileEnabled(headers);
    if (blockedResponse) return blockedResponse;

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
